from rest_framework import serializers
from .models import URLReport, URLReputation

class URLAnalysisSerializer(serializers.Serializer):
    url = serializers.CharField(
        required=True,
        max_length=2000,
        help_text="URL or domain to be analyzed for phishing threats."
    )

class URLReportSerializer(serializers.Serializer):
    url         = serializers.CharField(required=True, max_length=2000)
    report_type = serializers.ChoiceField(choices=['phishing', 'safe'])

class URLReputationSerializer(serializers.ModelSerializer):
    total_reports = serializers.SerializerMethodField()

    class Meta:
        model  = URLReputation
        fields = ['url', 'phishing_count', 'safe_count',
                  'community_verdict', 'last_reported', 'total_reports']

    def get_total_reports(self, obj):
        return obj.phishing_count + obj.safe_count

class URLReportReadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = URLReport
        fields = ['url', 'report_type', 'timestamp', 'is_verified']
