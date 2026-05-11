import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Define the absolute path to the dataset
DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets', 'phishing_urls.csv')

def load_dataset(filepath):
    """
    Load the dataset from a CSV file.
    
    Why datasets are separated from prediction APIs:
    - APIs are designed to be fast, lightweight, and stateless.
    - Datasets are bulky, memory-intensive, and slow to parse.
    - Keeping data offline ensures the API backend remains highly performant and secure.
    
    Why retraining should not happen repeatedly:
    - Model training is computationally expensive and time-consuming.
    - If a model retrains on every server restart or API request, the server will crash or lag.
    - The backend will ONLY load pre-trained, compressed mathematical models (.pkl) during prediction.
    """
    print(f"Loading dataset from: {filepath}")
    
    if not os.path.exists(filepath):
        print("Error: Dataset file missing! Please ensure 'phishing_urls.csv' is placed inside the 'datasets' folder.")
        return None
        
    try:
        df = pd.read_csv(filepath)
        print("Dataset loaded successfully.")
        return df
    except Exception as e:
        print(f"Error loading dataset: {str(e)}")
        return None

def validate_dataset(df):
    """
    Validate the dataset to ensure it contains required columns and proper labels.
    """
    print("Validating dataset structure...")
    
    # Check for required columns
    required_columns = ['url', 'label']
    for col in required_columns:
        if col not in df.columns:
            print(f"Validation Error: Missing required column '{col}'.")
            return False
            
    # Verify labels contain only 0 and 1
    # Drop NAs first to avoid failing on nulls in this step
    unique_labels = df['label'].dropna().unique()
    valid_labels = {0, 1}
    for label in unique_labels:
        if label not in valid_labels:
            print(f"Validation Error: Invalid label found '{label}'. Labels must be 0 or 1.")
            return False
            
    print("Dataset validation passed.")
    return True

def clean_dataset(df):
    """
    Preprocess the dataset by cleaning URLs and removing invalid data.
    
    Why preprocessing is important:
    - Raw data contains duplicates, missing values, and formatting inconsistencies.
    - If dirty data is fed to a machine learning model, it will learn incorrect patterns (Garbage In, Garbage Out).
    - Normalizing text (lowercasing, trimming) ensures that identical URLs are recognized properly.
    """
    print("\nStarting dataset preprocessing...")
    initial_count = len(df)
    
    # 1. Remove null rows in essential columns
    df = df.dropna(subset=['url', 'label']).copy()
    
    # Ensure URL is treated as string before string operations
    df['url'] = df['url'].astype(str)
    
    # 2. Trim spaces from the URLs
    df['url'] = df['url'].str.strip()
    
    # 3. Lowercase URL normalization
    df['url'] = df['url'].str.lower()
    
    # 4. Remove duplicate URLs
    df = df.drop_duplicates(subset=['url'], keep='first')
    
    final_count = len(df)
    duplicates_removed = initial_count - final_count
    
    print("Preprocessing completed.")
    print(f"Dataset shape after cleaning: {df.shape}")
    
    return df, initial_count, duplicates_removed

def display_statistics(df, initial_count, duplicates_removed):
    """
    Print the statistics of the clean dataset.
    """
    phishing_count = len(df[df['label'] == 1])
    legit_count = len(df[df['label'] == 0])
    
    print("\n--- Clean Dataset Statistics ---")
    print(f"Total URLs loaded:       {initial_count}")
    print(f"Duplicate rows removed:  {duplicates_removed}")
    print(f"Final dataset size:      {len(df)}")
    print(f"Phishing URL count:      {phishing_count}")
    print(f"Legitimate URL count:    {legit_count}")
    print("--------------------------------\n")

def process_features(df):
    """
    Apply feature extraction logic across all URLs to build the Feature Matrix.
    """
    print("Extracting features from URLs...")
    
    # Import locally to avoid circular dependencies if later split
    from feature_extraction import extract_url_features
    
    # Apply the imported feature extraction function to every URL
    extracted_features_list = df['url'].apply(extract_url_features).tolist()
    
    # Convert the list of dictionaries into a Pandas DataFrame
    X_df = pd.DataFrame(extracted_features_list)
    y_series = df['label'].copy()
    
    print("Feature extraction completed successfully.")
    
    # Print sample extracted features (first item)
    if not X_df.empty:
        import json
        sample_dict = X_df.iloc[0].to_dict()
        print("\n--- Sample Extracted Features ---")
        print(f"URL: {df['url'].iloc[0]}")
        print(json.dumps(sample_dict, indent=2))
        print("---------------------------------\n")
        
    return X_df, y_series

def train_model(X, y):
    """
    Train a Random Forest model on the feature matrix.
    
    Why Random Forest is used:
    - Random Forest builds multiple decision trees and merges them together.
    - It is highly resistant to overfitting, making it excellent for classification tasks.
    - It provides built-in feature importance, helping us understand exactly which 
      characteristics (like length or IP addresses) strongly indicate phishing.
    """
    print("\n--- Training Model ---")
    print("Splitting dataset into 80% training and 20% testing sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier (this may take a moment)...")
    # Using the requested initial parameters
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print("Training completed successfully.")
    return model, X_test, y_test

def evaluate_model(model, X_test, y_test, feature_names):
    """
    Evaluate the model on the testing set and display feature importance.
    """
    print("\n--- Model Evaluation ---")
    y_pred = model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print("Confusion Matrix:")
    print(cm)
    
    print("\n--- Feature Importance ---")
    importances = model.feature_importances_
    # Pair feature names with their importance and sort
    feature_importance_list = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    for name, imp in feature_importance_list:
        print(f"* {name} -> {imp:.4f}")

def save_model(model):
    """
    Persist the trained model to disk.
    
    Why model persistence (.pkl) is important:
    - Training takes significant compute and time.
    - By saving the model as a .pkl file, we serialize the exact mathematical 
      state of the trained Random Forest.
    - The Django API can instantly load this file to serve predictions in 
      milliseconds without needing the dataset or retraining.
    """
    print("\n--- Saving Model ---")
    model_path = os.path.join(os.path.dirname(__file__), 'url_model.pkl')
    
    joblib.dump(model, model_path)
    print("Model saved successfully!")
    print(f"Model path: {model_path}")

def main():
    """
    Main entry point for Phase 4: Model Training and Persistence.
    This script is designed to run manually and is NOT executed automatically
    by the Django backend.
    """
    print("=== ScamShield AI: Model Training Phase ===\n")
    
    # 1. Load Dataset
    df = load_dataset(DATASET_PATH)
    if df is None:
        return
        
    # 2. Validate Dataset
    if not validate_dataset(df):
        print("Aborting due to validation errors.")
        return
        
    # 3. Preprocess and Clean Dataset
    clean_df, initial_count, duplicates_removed = clean_dataset(df)
    
    # 4. Display Statistics
    display_statistics(clean_df, initial_count, duplicates_removed)
    
    # 5. Extract Features
    X, y = process_features(clean_df)
    
    # 6. Feature Matrix Statistics
    print("--- Feature Matrix Ready ---")
    print(f"Shape of X (Features DataFrame): {X.shape}")
    print(f"Shape of y (Labels Series):      {y.shape}")
    
    # 7. Model Training
    # Get the feature names directly from the DataFrame columns
    feature_names = X.columns.tolist()
    model, X_test, y_test = train_model(X, y)
    
    # 8. Model Evaluation
    evaluate_model(model, X_test, y_test, feature_names)
    
    # 9. Save Model
    save_model(model)
    
    print("\nPhase 4 Complete. (The model is now ready for Django API Integration)")

if __name__ == "__main__":
    main()
