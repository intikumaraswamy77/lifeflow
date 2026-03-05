import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# Create a simple dummy model for demonstration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "wbc_simple_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "wbc_simple_model_scaler.pkl")

# Create dummy training data
np.random.seed(42)
n_samples = 100
n_features = 20  # 4 stats * 3 channels + 4 grayscale stats = 16 + 4 = 20

X = np.random.randn(n_samples, n_features)
y = np.random.randint(0, 5, n_samples)  # 5 classes

# Train simple model
model = RandomForestClassifier(n_estimators=10, random_state=42)
scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)
model.fit(X_scaled, y)

# Save model and scaler
joblib.dump(model, MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)

print("Simple WBC model created successfully!")
