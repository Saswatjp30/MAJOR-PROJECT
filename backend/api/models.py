from django.db import models

class URLReport(models.Model):
    """
    Stores each individual user-submitted report for a URL.
    One row = one report from one session.
    """
    REPORT_TYPES = [
        ('phishing', 'Phishing / Scam'),
        ('safe', 'Safe / Legitimate'),
    ]

    url           = models.CharField(max_length=2000)
    report_type   = models.CharField(max_length=20, choices=REPORT_TYPES)
    session_id    = models.CharField(max_length=200, blank=True, default='')
    ip_address    = models.GenericIPAddressField(null=True, blank=True)
    timestamp     = models.DateTimeField(auto_now_add=True)
    is_verified   = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.report_type.upper()}] {self.url[:60]}"


class URLReputation(models.Model):
    """
    Aggregated reputation record per unique URL.
    Updated each time a new URLReport is submitted.
    """
    VERDICT_CHOICES = [
        ('UNKNOWN',  'Unknown'),
        ('SAFE',     'Safe'),
        ('MODERATE', 'Moderate Risk'),
        ('HIGH',     'High Risk'),
    ]

    url               = models.CharField(max_length=2000, unique=True)
    phishing_count    = models.PositiveIntegerField(default=0)
    safe_count        = models.PositiveIntegerField(default=0)
    community_verdict = models.CharField(max_length=20, choices=VERDICT_CHOICES, default='UNKNOWN')
    last_reported     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-phishing_count', '-last_reported']

    def __str__(self):
        return f"{self.url[:60]} | {self.community_verdict} | phishing={self.phishing_count}"

    def recalculate_verdict(self):
        """
        Recalculate the community verdict based on report ratio.
        """
        total = self.phishing_count + self.safe_count
        if total == 0:
            self.community_verdict = 'UNKNOWN'
        else:
            ratio = self.phishing_count / total
            if ratio >= 0.6:
                self.community_verdict = 'HIGH'
            elif ratio >= 0.3:
                self.community_verdict = 'MODERATE'
            else:
                self.community_verdict = 'SAFE'
        self.save()


class AnalysisLog(models.Model):
    """
    Lightweight log of every /analyze-url call.
    Powers the analytics dashboard stats and trend charts.
    """
    url         = models.CharField(max_length=2000)
    risk_level  = models.CharField(max_length=20)
    risk_score  = models.PositiveIntegerField(default=0)
    is_phishing = models.BooleanField(default=False)
    timestamp   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.risk_level}] {self.url[:60]} — {self.timestamp:%Y-%m-%d %H:%M}"

