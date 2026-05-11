from django.contrib import admin
from .models import URLReport, URLReputation

@admin.register(URLReport)
class URLReportAdmin(admin.ModelAdmin):
    list_display = ('url', 'report_type', 'session_id', 'is_verified', 'timestamp')
    list_filter  = ('report_type', 'is_verified')
    search_fields = ('url',)
    ordering = ('-timestamp',)

@admin.register(URLReputation)
class URLReputationAdmin(admin.ModelAdmin):
    list_display = ('url', 'community_verdict', 'phishing_count', 'safe_count', 'last_reported')
    list_filter  = ('community_verdict',)
    search_fields = ('url',)
    ordering = ('-phishing_count',)
