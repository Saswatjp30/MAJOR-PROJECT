from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
from collections import Counter
import re

from .serializers import (
    URLAnalysisSerializer, URLReportSerializer,
    URLReputationSerializer, URLReportReadSerializer
)
from .models import URLReport, URLReputation, AnalysisLog
from ml.predictor import URLPredictor

# ── Predictor singleton — loaded once at startup ─────────────────────────────
predictor = URLPredictor()


def normalize_url(raw_url):
    """Prepend http:// to bare domains so feature extraction works correctly."""
    raw_url = raw_url.strip()
    if not raw_url.startswith(('http://', 'https://')):
        return 'http://' + raw_url
    return raw_url


def get_community_data(url):
    """
    Fetch the community reputation for a URL and return a compact dict.
    Returns None if no community data exists yet.
    """
    try:
        rep = URLReputation.objects.get(url=url)
        return {
            "community_verdict":  rep.community_verdict,
            "phishing_reports":   rep.phishing_count,
            "safe_reports":       rep.safe_count,
            "total_reports":      rep.phishing_count + rep.safe_count,
        }
    except URLReputation.DoesNotExist:
        return None


# ── POST /analyze-url ─────────────────────────────────────────────────────────
class AnalyzeURLView(APIView):
    """Analyze a URL with the Random Forest model and enrich with community data."""

    def post(self, request, *args, **kwargs):
        serializer = URLAnalysisSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        raw_url = serializer.validated_data.get('url', '').strip()
        if not raw_url:
            return Response({"error": "URL cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        url_to_analyze = normalize_url(raw_url)

        try:
            result = predictor.predict_url(url_to_analyze)
            if "error" in result:
                return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # Log this analysis for dashboard analytics
            AnalysisLog.objects.create(
                url=url_to_analyze,
                risk_level=result['risk_level'],
                risk_score=result['risk_score'],
                is_phishing=result['is_phishing'],
            )

            # Enrich response with community intelligence
            community = get_community_data(url_to_analyze)
            result['community'] = community

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Prediction error: {e}")
            return Response(
                {"error": "Internal server error during prediction."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ── POST /report-url ──────────────────────────────────────────────────────────
class ReportURLView(APIView):
    """Submit a community phishing/safe report for a URL."""

    COOLDOWN_MINUTES = 60  # same session cannot re-report same URL within this window

    def post(self, request, *args, **kwargs):
        serializer = URLReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        raw_url     = serializer.validated_data['url'].strip()
        report_type = serializer.validated_data['report_type']
        url         = normalize_url(raw_url)

        # Identify session (anonymous users get an X-Session-ID header or fallback)
        session_id = request.headers.get('X-Session-ID', '') or request.META.get('REMOTE_ADDR', '')
        ip_address = request.META.get('REMOTE_ADDR')

        # ── Spam/duplicate protection ──────────────────────────────────────────
        cutoff = timezone.now() - timedelta(minutes=self.COOLDOWN_MINUTES)
        already_reported = URLReport.objects.filter(
            url=url,
            session_id=session_id,
            timestamp__gte=cutoff
        ).exists()

        if already_reported:
            return Response(
                {"message": "You have already submitted a report for this URL recently. Thank you!"},
                status=status.HTTP_200_OK
            )

        # ── Save the individual report ─────────────────────────────────────────
        URLReport.objects.create(
            url=url,
            report_type=report_type,
            session_id=session_id,
            ip_address=ip_address,
        )
        print(f"[Report] {report_type.upper()} report submitted for: {url}")

        # ── Update aggregated reputation ───────────────────────────────────────
        rep, _ = URLReputation.objects.get_or_create(url=url)
        if report_type == 'phishing':
            rep.phishing_count += 1
        else:
            rep.safe_count += 1
        rep.recalculate_verdict()
        print(f"[Reputation] Updated for {url}: {rep.community_verdict} "
              f"(phishing={rep.phishing_count}, safe={rep.safe_count})")

        return Response(
            {
                "message":            "Report submitted successfully. Thank you for keeping the community safe!",
                "url":                url,
                "community_risk":     rep.community_verdict,
                "scam_reports":       rep.phishing_count,
                "safe_votes":         rep.safe_count,
                "total_interactions": rep.phishing_count + rep.safe_count,
            },
            status=status.HTTP_201_CREATED
        )


# ── GET /url-reputation?url=... ───────────────────────────────────────────────
class URLReputationView(APIView):
    """Retrieve community reputation for a specific URL."""

    def get(self, request, *args, **kwargs):
        raw_url = request.query_params.get('url', '').strip()
        if not raw_url:
            return Response({"error": "url parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        url = normalize_url(raw_url)
        try:
            rep = URLReputation.objects.get(url=url)
            return Response({
                "url":                rep.url,
                "community_risk":     rep.community_verdict,
                "scam_reports":       rep.phishing_count,
                "safe_votes":         rep.safe_count,
                "total_interactions": rep.phishing_count + rep.safe_count,
            }, status=status.HTTP_200_OK)
        except URLReputation.DoesNotExist:
            return Response(
                {
                    "url":                url,
                    "community_risk":     "UNKNOWN",
                    "scam_reports":       0,
                    "safe_votes":         0,
                    "total_interactions": 0
                },
                status=status.HTTP_200_OK
            )


# ── GET /community-feed ───────────────────────────────────────────────────────
class CommunityFeedView(APIView):
    """
    Returns:
    - top 10 most-reported phishing URLs
    - last 10 recent individual reports
    - overall stats
    """

    def get(self, request, *args, **kwargs):
        top_threats = URLReputation.objects.filter(
            community_verdict__in=['HIGH', 'MODERATE']
        ).order_by('-phishing_count')[:10]

        recent_reports = URLReport.objects.all().order_by('-timestamp')[:15]

        total_phishing_reports = URLReport.objects.filter(report_type='phishing').count()
        total_safe_reports     = URLReport.objects.filter(report_type='safe').count()
        unique_urls_flagged    = URLReputation.objects.filter(
            community_verdict__in=['HIGH', 'MODERATE']
        ).count()

        # Format recent reports for the feed
        feed_data = []
        for r in recent_reports:
            feed_data.append({
                "url": r.url,
                "report_type": r.report_type,
                "timestamp_human": "Just now" if (timezone.now() - r.timestamp).seconds < 60 else f"{(timezone.now() - r.timestamp).seconds // 60}m ago",
            })

        print("[Community] Feed requested")

        return Response(
            {
                "stats": {
                    "total_phishing_reports": total_phishing_reports,
                    "total_safe_reports":     total_safe_reports,
                    "unique_urls_flagged":    unique_urls_flagged,
                },
                "top_threats": URLReputationSerializer(top_threats, many=True).data,
                "recent_reports": feed_data,
            },
            status=status.HTTP_200_OK
        )



# ── GET /dashboard-stats ──────────────────────────────────────────────────────
class DashboardStatsView(APIView):
    """Aggregate statistics for the analytics dashboard hero cards."""

    def get(self, request, *args, **kwargs):
        total_analyzed   = AnalysisLog.objects.count()
        phishing_detected = AnalysisLog.objects.filter(is_phishing=True).count()
        safe_detected    = AnalysisLog.objects.filter(is_phishing=False).count()
        high_risk_flagged = AnalysisLog.objects.filter(risk_level='HIGH').count()
        community_reports = URLReport.objects.count()
        urls_in_db        = URLReputation.objects.count()

        print("[Dashboard] Stats requested")
        return Response({
            "total_analyzed":    total_analyzed,
            "phishing_detected": phishing_detected,
            "safe_detected":     safe_detected,
            "high_risk_flagged": high_risk_flagged,
            "community_reports": community_reports,
            "urls_in_db":        urls_in_db,
        }, status=status.HTTP_200_OK)


# ── GET /threat-trends ────────────────────────────────────────────────────────
class ThreatTrendsView(APIView):
    """
    Returns chart data:
    - 7-day daily analysis trend
    - Phishing vs safe split
    - Most targeted brands
    - Suspicious TLD distribution
    """

    def get(self, request, *args, **kwargs):
        # 7-day trend
        today = timezone.now().date()
        trend_days = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = timezone.datetime.combine(day, timezone.datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end   = day_start + timedelta(days=1)
            phishing  = AnalysisLog.objects.filter(is_phishing=True,  timestamp__range=(day_start, day_end)).count()
            safe      = AnalysisLog.objects.filter(is_phishing=False, timestamp__range=(day_start, day_end)).count()
            trend_days.append({
                "date":     day.strftime("%b %d"),
                "phishing": phishing,
                "safe":     safe,
            })

        # Phishing vs safe overall split
        total     = AnalysisLog.objects.count()
        p_count   = AnalysisLog.objects.filter(is_phishing=True).count()
        s_count   = total - p_count
        split = {"phishing": p_count, "safe": s_count, "total": total}

        # Most targeted brands — scan URLReport URLs for brand keywords
        brand_keywords = ['paypal', 'google', 'amazon', 'sbi', 'hdfc', 'icici', 'microsoft', 'apple']
        brand_counts = {}
        all_report_urls = URLReport.objects.filter(report_type='phishing').values_list('url', flat=True)
        for url in all_report_urls:
            url_lower = url.lower()
            for brand in brand_keywords:
                if brand in url_lower:
                    brand_counts[brand] = brand_counts.get(brand, 0) + 1
        brand_data = sorted(
            [{"brand": b.capitalize(), "count": c} for b, c in brand_counts.items()],
            key=lambda x: x["count"], reverse=True
        )[:6]

        # TLD distribution from URLReputation
        tld_counts = {}
        tld_pattern = re.compile(r'\.(xyz|top|tk|ru|info|com|org|net|io|co)(?:/|$)')
        for url in URLReputation.objects.values_list('url', flat=True):
            m = tld_pattern.search(url.lower())
            if m:
                tld = '.' + m.group(1)
                tld_counts[tld] = tld_counts.get(tld, 0) + 1
        tld_data = sorted(
            [{"tld": t, "count": c} for t, c in tld_counts.items()],
            key=lambda x: x["count"], reverse=True
        )[:7]

        print("[Dashboard] Threat trends generated")
        return Response({
            "daily_trend": trend_days,
            "split":       split,
            "brands":      brand_data,
            "tlds":        tld_data,
        }, status=status.HTTP_200_OK)


# ── GET /recent-threats ───────────────────────────────────────────────────────
class RecentThreatsView(APIView):
    """Returns the 20 most recent phishing detections for the live feed panel."""

    def get(self, request, *args, **kwargs):
        recent = AnalysisLog.objects.filter(is_phishing=True).order_by('-timestamp')[:20]
        data = [
            {
                "url":        log.url,
                "risk_level": log.risk_level,
                "risk_score": log.risk_score,
                "timestamp":  log.timestamp.strftime("%H:%M:%S"),
            }
            for log in recent
        ]
        print("[Dashboard] Recent threats feed updated")
        return Response({"recent_threats": data}, status=status.HTTP_200_OK)

