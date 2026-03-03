import sys
import json
import numpy as np
import tensorflow as tf
from PIL import Image
import os

# =========================
# CONFIG
# =========================
IMG_SIZE = 128
CLASSES = ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil", "Basophil"]

# =========================
# LOAD MODEL ONCE (CRITICAL)
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "wbc_classification_model.keras")

try:
    model = tf.keras.models.load_model(MODEL_PATH)
except Exception as e:
    print(json.dumps({"error": f"Model load failed: {str(e)}"}))
    sys.exit(1)

# =========================
# PREDICT FUNCTION
# =========================
def predict(image_path):
    img = Image.open(image_path).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))

    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    preds = model.predict(img_array, verbose=0)[0]
    idx = int(np.argmax(preds))

    return {
        "class": CLASSES[idx],
        "confidence": round(float(preds[idx]) * 100, 2)
    }

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
