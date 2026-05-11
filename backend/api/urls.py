from django.urls import path
from .views import (
    AnalyzeURLView,
    ReportURLView,
    URLReputationView,
    CommunityFeedView,
    DashboardStatsView,
    ThreatTrendsView,
    RecentThreatsView,
)

urlpatterns = [
    path('analyze-url',       AnalyzeURLView.as_view(),       name='analyze_url'),
    path('report-url',        ReportURLView.as_view(),        name='report_url'),
    path('url-reputation',    URLReputationView.as_view(),    name='url_reputation'),
    path('community-feed',    CommunityFeedView.as_view(),    name='community_feed'),

    path('dashboard-stats',   DashboardStatsView.as_view(),   name='dashboard_stats'),
    path('threat-trends',     ThreatTrendsView.as_view(),     name='threat_trends'),
    path('recent-threats',    RecentThreatsView.as_view(),    name='recent_threats'),
]

