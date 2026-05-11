import urllib.request, json

def test(url, label):
    req = urllib.request.Request(
        'http://localhost:8000/analyze-url',
        data=json.dumps({'url': url}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    res = json.loads(urllib.request.urlopen(req).read().decode())
    print("\n=== " + label + " ===")
    print("  URL:        " + url)
    print("  Risk Level: " + str(res.get("risk_level")))
    print("  Risk Score: " + str(res.get("risk_score")) + "%")
    print("  Phishing:   " + str(res.get("is_phishing")))
    print("  Reasons:    " + str(res.get("reasons")))

test('paypal-login-security.xyz', 'PHISHING URL (bare domain)')
test('http://verify.signin.sbi-login-88505.tk/kyc/update', 'PHISHING URL (with scheme)')
test('https://github.com', 'SAFE URL')
