import re

def extract_url_features(url):
    """
    Extract relevant numerical features from a raw URL string 
    for machine learning based phishing detection.
    
    Why feature engineering improves ML performance:
    - Raw strings cannot be directly processed by algorithms like Random Forest.
    - Feature engineering translates raw text into distinct mathematical signals (features).
    - By isolating known phishing behaviors (like hidden IPs or excessive hyphens), 
      the model can learn clear, actionable rules to distinguish threats from safe sites.
    """
    # Ensure URL is a lowercase string for uniform matching
    url = str(url).lower()
    
    features = {}

    # A. URL Length
    # Why it helps: Phishing URLs are often very long to hide the true domain from the user's view.
    features['url_length'] = len(url)

    # B. Dot Count
    # Why it helps: Multiple dots are frequently used in subdomains to trick users (e.g., login.paypal.com.scam.xyz).
    features['dot_count'] = url.count('.')

    # C. Hyphen Count
    # Why it helps: Scammers heavily use hyphens to imitate real brands when the original domain is taken (e.g., secure-update-apple.com).
    features['hyphen_count'] = url.count('-')

    # D. HTTPS Presence
    # Why it helps: While many phishing sites now use HTTPS, its absence in modern banking or login pages is a massive red flag.
    features['has_https'] = 1 if url.startswith('https') else 0

    # E. Digit Count
    # Why it helps: Phishing URLs often contain excessive numbers, either as part of a raw IP address or randomized tracking strings.
    features['digit_count'] = sum(c.isdigit() for c in url)

    # F. Special Character Count
    # Why it helps: Phishers use special characters to obfuscate the URL, pass tracking parameters, or inject fake paths.
    special_chars = ['@', '?', '=', '%', '&', '_']
    features['special_char_count'] = sum(url.count(c) for c in special_chars)

    # G. Suspicious TLD Detection
    # Why it helps: Certain Top Level Domains (TLDs) are extremely cheap or entirely free, making them heavily abused by temporary scam networks.
    suspicious_tlds = ['.xyz', '.top', '.tk', '.ru', '.info']
    features['suspicious_tld'] = 1 if any(tld in url for tld in suspicious_tlds) else 0

    # H. IP Address Detection
    # Why it helps: Legitimate production sites use domain names. If an IP address is visible in the URL, it is almost certainly a malicious or compromised server.
    ip_pattern = re.compile(r'(?:[0-9]{1,3}\.){3}[0-9]{1,3}')
    features['has_ip_address'] = 1 if ip_pattern.search(url) else 0

    # I. Brand Impersonation Detection
    # Why it helps: Scammers rely on trust. They frequently wedge popular trusted brand names into the URL path or subdomain to fool victims.
    popular_brands = ['paypal', 'google', 'amazon', 'sbi', 'hdfc', 'icici', 'microsoft', 'apple']
    features['brand_impersonation'] = 1 if any(brand in url for brand in popular_brands) else 0

    return features
