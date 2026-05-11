# ScamShield AI - Backend

This is the backend service for the ScamShield AI phishing URL detection system.

## Setup Instructions

1. **Activate the Virtual Environment**
   ```bash
   .\venv\Scripts\Activate.ps1
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start the Development Server**
   ```bash
   python manage.py runserver
   ```

## API Endpoints

- `POST /analyze-url`
  Analyzes a provided URL and returns the threat status.
  - **Payload**: `{"url": "http://example.com"}`

## Machine Learning
- The ML logic resides in the `ml/` folder.
- **Training**: Run `python ml/train_model.py` to train and save the model to `.pkl` files.
- **Inference**: The backend will automatically load the `.pkl` files from `ml/` during runtime (server startup does NOT trigger training).
