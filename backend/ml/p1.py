import os, sys, json
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

BASE_DIR = os.path.dirname(__file__)
DATA_FILE = os.path.join(BASE_DIR, "Book1.xlsx")
MODEL_FILE = os.path.join(BASE_DIR, "model.pkl")

def load_data(file_path):
    df = pd.read_excel(file_path, sheet_name="Sheet1")
    return df

def preprocess_data(df):
    df = df.copy()
    df["Class"] = [str(x).lower() for x in df["Class"]]
    df["Gender"] = [str(x).lower() for x in df["Gender"]]
    if "ID" in df.columns:
        df.drop("ID", axis=1, inplace=True)

    X = df.iloc[:, :-1].values
    y = df.iloc[:, -1].values

    ct = ColumnTransformer(transformers=[('encoder', OneHotEncoder(), [0])], remainder='passthrough')
    X = np.array(ct.fit_transform(X))

    le = LabelEncoder()
    y = le.fit_transform(y)

    return X, y, le, ct

def train_and_save():
    df = load_data(DATA_FILE)
    X, y, le, ct = preprocess_data(df)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    sc = StandardScaler()
    X_train = sc.fit_transform(X_train)
    X_test = sc.transform(X_test)

    clf = RandomForestClassifier(n_estimators=200, criterion="entropy", random_state=0)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))

    joblib.dump({"classifier": clf, "scaler": sc, "label_encoder": le, "column_transformer": ct}, MODEL_FILE)
    return acc

def ensure_model():
    if not os.path.exists(MODEL_FILE):
        acc = train_and_save()
        return acc
    return None

def load_model():
    bundle = joblib.load(MODEL_FILE)
    return bundle["classifier"], bundle["scaler"], bundle["label_encoder"], bundle["column_transformer"]

def predict(gender, age, haemoglobin, platelets, wbc):
    clf, sc, le, ct = load_model()

    gender_map = {
        "child":  [1.0, 0.0, 0.0],
        "female": [0.0, 1.0, 0.0],
        "male":   [0.0, 0.0, 1.0],
    }
    g = gender_map.get(gender.lower())
    if g is None:
        return {"success": False, "error": "Invalid gender. Use child|female|male."}

    x = np.array([[g[0], g[1], g[2], float(age), float(haemoglobin), float(platelets), float(wbc)]])
    xs = sc.transform(x)
    pred_idx = int(clf.predict(xs)[0])
    pred_name = le.inverse_transform([pred_idx])[0]

    conf = None
    if hasattr(clf, "predict_proba"):
        probs = clf.predict_proba(xs)[0]
        conf = float(np.max(probs))

    return {
        "success": True,
        "prediction": pred_name,
        "confidence": conf if conf is not None else None
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "usage: p1.py train | p1.py predict <gender> <age> <haemoglobin> <platelets> <wbc>"}))
        return

    mode = sys.argv[1].lower()

    if mode == "train":
        try:
            acc = train_and_save()
            print(json.dumps({"success": True, "mode": "train", "accuracy": acc}))
        except Exception as e:
            print(json.dumps({"success": False, "mode": "train", "error": str(e)}))
        return

    if mode == "predict":
        if len(sys.argv) != 7:  # FIXED: was 8 before
            print(json.dumps({"success": False, "error": "predict expects 5 args: gender age haemoglobin platelets wbc"}))
            return
        ensure_model()
        try:
            gender = sys.argv[2]
            age = float(sys.argv[3])
            hb = float(sys.argv[4])
            pl = float(sys.argv[5])
            wbc = float(sys.argv[6])
            result = predict(gender, age, hb, pl, wbc)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
        return

    print(json.dumps({"success": False, "error": f"unknown mode: {mode}"}))

if __name__ == "__main__":
    main()
