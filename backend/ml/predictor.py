import os
import joblib
import pandas as pd
from .feature_extraction import extract_url_features
from .explainer import AIExplainer

class URLPredictor:
    """
    Lightweight prediction engine that loads the trained Random Forest model
    into memory exactly once during server startup and serves rapid predictions.
    """
    
    _instance = None
    
    # Define feature order strictly to match training
    FEATURE_NAMES = [
        'url_length', 'dot_count', 'hyphen_count', 'has_https', 
        'digit_count', 'special_char_count', 'suspicious_tld', 
        'has_ip_address', 'brand_impersonation'
    ]
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(URLPredictor, cls).__new__(cls)
            cls._instance.model = None
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        """
        Load the trained Random Forest model (.pkl) into memory.
        """
        model_path = os.path.join(os.path.dirname(__file__), 'url_model.pkl')
        
        try:
            if os.path.exists(model_path):
                print(f"Loading trained model from {model_path}...")
                self.model = joblib.load(model_path)
                print("Model loaded successfully into memory.")
            else:
                print("Warning: url_model.pkl not found! Please run train_model.py first.")
        except Exception as e:
            print(f"Critical error loading model: {str(e)}")

    def predict_url(self, url):
        """
        Core prediction flow enhanced with Explainable AI (XAI).
        """
        print(f"Processing prediction for: {url}")

        if not self.model:
            return {"error": "Model not loaded. Please run train_model.py first."}

        # 1. Feature Extraction
        features_dict = extract_url_features(url)

        # 2. DataFrame conversion (Strict feature order)
        features_df = pd.DataFrame([features_dict])[self.FEATURE_NAMES]

        # 3. Model Prediction
        probabilities = self.model.predict_proba(features_df)[0]
        phishing_prob = float(probabilities[1])
        risk_score = int(phishing_prob * 100)

        # 4. Threshold classification
        is_phishing = risk_score >= 50

        if risk_score >= 75:
            risk_level = "HIGH"
        elif risk_score >= 40:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # 5. XAI: Advanced Reasoning and Confidence
        explainer = AIExplainer()
        reasons = explainer.generate_detailed_reasons(features_dict, is_phishing)
        confidence = explainer.calculate_confidence(risk_score, phishing_prob)
        
        # 6. XAI: Feature Importance
        # Map raw feature names to importance scores for this model
        importances = self.model.feature_importances_
        feature_importance = {name: round(float(imp), 4) for name, imp in zip(self.FEATURE_NAMES, importances)}
        # Sort and take top 5
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:5])

        print(f"[XAI] Prediction complete | Risk: {risk_level} | Score: {risk_score}% | Confidence: {confidence}%")

        return {
            "risk_level":  risk_level,
            "risk_score":  risk_score,
            "is_phishing": is_phishing,
            "confidence":  confidence,
            "feature_importance": feature_importance,
            "reasons":     reasons,
        }


