import sys
import json
import numpy as np
import tensorflow as tf
from PIL import Image
import os
import traceback
import gc

# Suppress TensorFlow logging
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

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

# Global model variable
model = None

def load_model():
    global model
    try:
        # Clear any existing model
        if model is not None:
            tf.keras.backend.clear_session()
            gc.collect()
        
        if not os.path.exists(MODEL_PATH):
            print(json.dumps({"error": f"Model file not found at: {MODEL_PATH}"}))
            return None
        
        # Load model with memory optimization
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        # Compile model after loading
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        return model
    except Exception as e:
        print(json.dumps({"error": f"Error loading model: {e}"}))
        return None

def preprocess_image(image_path):
    try:
        # Check if image exists and is readable
        if not os.path.exists(image_path):
            return None
            
        img = Image.open(image_path).convert('RGB')
        img = img.resize((IMG_SIZE, IMG_SIZE))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        return None

def predict_wbc(image_path):
    global model
    try:
        # Validate input
        if not image_path or not os.path.exists(image_path):
            return {
                "error": f"Invalid image path: {image_path}",
                "fallback": True,
                "class": "Neutrophil",
                "confidence": 75.0
            }
        
        # Reload model if needed
        if model is None:
            model = load_model()
        
        if model is None:
            return {
                "error": "Model not available",
                "fallback": True,
                "class": "Neutrophil",
                "confidence": 75.0
            }
        
        # Preprocess image
        processed_img = preprocess_image(image_path)
        if processed_img is None:
            return {
                "error": "Failed to preprocess image",
                "fallback": True,
                "class": "Neutrophil",
                "confidence": 70.0
            }
        
        # Make prediction with memory management
        try:
            with tf.device('/CPU:0'):
                predictions = model.predict(processed_img, verbose=0, batch_size=1)
                predicted_class_idx = np.argmax(predictions[0])
                confidence = float(np.max(predictions[0]) * 100)
                predicted_class = CLASSES[predicted_class_idx]
            
            # Clear memory
            gc.collect()
            
            return {
                "class": predicted_class,
                "confidence": round(confidence, 2)
            }
        except Exception as pred_err:
            gc.collect()
            return {
                "error": f"Prediction failed: {str(pred_err)}",
                "fallback": True,
                "class": "Neutrophil",
                "confidence": 75.0
            }
        
    except Exception as e:
        # Clear memory on error
        gc.collect()
        return {
            "error": f"System error: {str(e)}",
            "fallback": True,
            "class": "Neutrophil",
            "confidence": 75.0
        }

if __name__ == "__main__":
    try:
        # Get path from environment variable first
        image_path = os.environ.get('IMAGE_PATH')
        
        # If not in environment, try command line arguments
        if not image_path:
            if len(sys.argv) == 2:
                # Direct path argument
                image_path = sys.argv[1]
            elif len(sys.argv) == 3 and sys.argv[1] == '--path-file':
                # Read path from file
                try:
                    with open(sys.argv[2], 'r') as f:
                        image_path = f.read().strip()
                except Exception as e:
                    print(json.dumps({"error": f"Could not read path file: {str(e)}"}))
                    sys.exit(1)
            else:
                print(json.dumps({"error": "Usage: python predict_wbc.py <image_path> OR python predict_wbc.py --path-file <path_file>"}))
                sys.exit(1)
        
        # Handle Windows paths properly
        image_path = os.path.normpath(image_path)
        
        if not os.path.exists(image_path):
            print(json.dumps({"error": f"Image not found: {image_path}"}))
            sys.exit(1)
        
        result = predict_wbc(image_path)
        print(json.dumps(result))
        
        # Clean up memory after prediction
        gc.collect()
        
    except Exception as e:
        print(json.dumps({"error": f"Fatal error: {str(e)}", "fallback": True, "class": "Neutrophil", "confidence": 75.0}))
        sys.exit(1)
