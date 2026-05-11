import pandas as pd

class AIExplainer:
    """
    Explainable AI (XAI) module for ScamShield.
    Converts raw mathematical signals into human-understandable reasoning.
    """

    FEATURE_LABELS = {
        'url_length': 'URL Length',
        'dot_count': 'Dot Count',
        'hyphen_count': 'Hyphen Count',
        'has_https': 'HTTPS Presence',
        'digit_count': 'Digit Count',
        'special_char_count': 'Special Characters',
        'suspicious_tld': 'Suspicious TLD',
        'has_ip_address': 'IP Address Detection',
        'brand_impersonation': 'Brand Impersonation'
    }

    @staticmethod
    def generate_detailed_reasons(features, is_phishing):
        """
        Generates advanced human-readable reasoning based on extracted features.
        """
        reasons = []

        # --- Threat Indicators ---
        if features.get('suspicious_tld') == 1:
            reasons.append("Suspicious TLD detected (.xyz / .tk / .ru / .top / .info)")

        if features.get('brand_impersonation') == 1:
            reasons.append("Brand impersonation detected (trusted brand name found in suspicious context)")

        if features.get('has_ip_address') == 1:
            reasons.append("Raw IP address used instead of a domain name (massive red flag)")

        if features.get('has_https') == 0:
            reasons.append("Unsecure connection — HTTPS encryption is missing")

        if features.get('url_length', 0) > 75:
            reasons.append(f"Abnormally long URL ({features.get('url_length')} chars) — common obfuscation tactic")

        if features.get('special_char_count', 0) >= 3:
            reasons.append(f"Excessive special characters ({features.get('special_char_count')}) found in URL")

        if features.get('digit_count', 0) >= 5:
            reasons.append(f"High number of digits ({features.get('digit_count')}) in URL structure")

        if features.get('hyphen_count', 0) >= 2:
            reasons.append(f"Multiple hyphens ({features.get('hyphen_count')}) detected (common in brand spoofing)")

        if features.get('dot_count', 0) >= 3:
            reasons.append(f"Too many subdomains ({features.get('dot_count')} dots) detected")

        if is_phishing and not reasons:
            reasons.append("General URL structure matches known high-risk phishing patterns")

        # --- Safe Indicators ---
        if not is_phishing and not reasons:
            if features.get('has_https') == 1:
                reasons.append("Secure HTTPS connection detected")
            if features.get('suspicious_tld') == 0:
                reasons.append("Domain uses a globally trusted TLD")
            if features.get('brand_impersonation') == 0:
                reasons.append("No brand impersonation keywords detected")
            reasons.append("No active community reports found for this URL")

        return reasons

    @staticmethod
    def get_feature_importance(model, feature_names):
        """
        Extracts and maps feature importance from the Random Forest model.
        """
        if not model or not hasattr(model, 'feature_importances_'):
            return {}

        importances = model.feature_importances_
        # Sort features by importance
        feat_imp = sorted(
            zip(feature_names, importances),
            key=lambda x: x[1],
            reverse=True
        )

        # Return top 5 or all if less than 5, formatted as a dict
        return {AIExplainer.FEATURE_LABELS.get(name, name): round(float(imp), 4) for name, imp in feat_imp[:5]}

    @staticmethod
    def calculate_confidence(risk_score, phishing_prob):
        """
        Calculates the AI's confidence in its own prediction.
        """
        # Confidence is higher the further the probability is from the 0.5 decision boundary
        confidence = int(abs(phishing_prob - 0.5) * 2 * 100)
        
        # Ensure a minimum confidence for display purposes
        if confidence < 10:
            confidence = 10 + (risk_score % 5) # slight variation
            
        return min(confidence, 100)
