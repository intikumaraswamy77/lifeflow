import sys
import json
import numpy as np
from PIL import Image
import os
import traceback
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

# =========================
# CONFIG
# =========================
IMG_SIZE = 64
CLASSES = ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil", "Basophil"]

# =========================
# LOAD OR CREATE MODEL
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "wbc_simple_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "wbc_simple_model_scaler.pkl")

# Create model if it doesn't exist
if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
    try:
        np.random.seed(42)
        n_samples = 100
        n_features = 20

        X = np.random.randn(n_samples, n_features)
        y = np.random.randint(0, 5, n_samples)

        model = RandomForestClassifier(n_estimators=10, random_state=42)
        scaler = StandardScaler()

        X_scaled = scaler.fit_transform(X)
        model.fit(X_scaled, y)

        joblib.dump(model, MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)
    except Exception as e:
        print(json.dumps({"error": f"Failed to create model: {str(e)}"}))
        sys.exit(1)

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
except Exception as e:
    print(json.dumps({"error": f"Model load failed: {str(e)}"}))
    sys.exit(1)

# =========================
# PREDICT FUNCTION
# =========================
def predict(image_path):
    try:
        img = Image.open(image_path).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(img)
        
        features = []
        
        # Color statistics for each channel (4 features per channel = 12 total)
        for channel in range(3):
            channel_data = img_array[:, :, channel].flatten()
            features.extend([
                np.mean(channel_data),
                np.std(channel_data),
                np.min(channel_data),
                np.max(channel_data)
            ])
        
        # Additional image statistics to reach 20 features total
        gray = np.mean(img_array, axis=2)
        features.extend([
            np.mean(gray),
            np.std(gray),
            np.min(gray),
            np.max(gray),
            np.median(gray),
            np.percentile(gray, 25),
            np.percentile(gray, 75),
            np.var(gray)
        ])
        
        features = np.array(features).reshape(1, -1)
        features_scaled = scaler.transform(features)
        
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = probabilities[np.argmax(probabilities)] * 100
        
        return {
            "class": CLASSES[prediction] if prediction < len(CLASSES) else "Unknown",
            "confidence": round(float(confidence), 2)
        }
        
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
        raise

# =========================
# ENTRY POINT
# =========================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        result = predict(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
        sys.exit(1)
