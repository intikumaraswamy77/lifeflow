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
IMG_SIZE = 64  # Smaller size for simpler processing
CLASSES = ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil", "Basophil"]

# =========================
# LOAD OR CREATE MODEL
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "wbc_simple_model.pkl")

# Create a simple model if it doesn't exist
if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": "Simple WBC model not found. Please train the model first."}))
    sys.exit(1)

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(MODEL_PATH.replace('.pkl', '_scaler.pkl'))
except Exception as e:
    print(json.dumps({"error": f"Model load failed: {str(e)}", "traceback": traceback.format_exc()}))
    sys.exit(1)

# =========================
# PREDICT FUNCTION
# =========================
def predict(image_path):
    try:
        # Load and preprocess image
        img = Image.open(image_path).convert("RGB")
        img = img.resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(img)
        
        # Extract simple features (color statistics only)
        features = []
        
        # Color statistics for each channel
        for channel in range(3):
            channel_data = img_array[:, :, channel].flatten()
            features.extend([
                np.mean(channel_data),
                np.std(channel_data),
                np.min(channel_data),
                np.max(channel_data)
            ])
        
        # Overall image statistics
        gray = np.mean(img_array, axis=2)
        features.extend([
            np.mean(gray),
            np.std(gray),
            np.min(gray),
            np.max(gray)
        ])
        
        features = np.array(features).reshape(1, -1)
        features_scaled = scaler.transform(features)
        
        # Predict
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = probabilities[np.argmax(probabilities)] * 100
        
        return {
            "class": CLASSES[prediction] if prediction < len(CLASSES) else "Unknown",
            "confidence": round(float(confidence), 2)
        }
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}", "traceback": traceback.format_exc()}))
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
        print(json.dumps({"error": f"Prediction failed: {str(e)}", "traceback": traceback.format_exc()}))
        sys.exit(1)
