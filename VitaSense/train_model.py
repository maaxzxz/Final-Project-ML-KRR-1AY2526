import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)

dataset_path = "data/Lifestyle_and_Health_Risk_Prediction_Synthetic_Dataset.csv"

if os.path.exists(dataset_path):
    df = pd.read_csv(dataset_path)
    print("Dataset loaded from data/ folder")
else:
    print("Dataset not found, generating synthetic data...")
    np.random.seed(42)
    N_SAMPLES = 5000

    age = np.random.randint(18, 70, N_SAMPLES)
    weight = np.random.randint(45, 120, N_SAMPLES)
    height = np.random.randint(145, 200, N_SAMPLES)
    sleep = np.round(np.random.uniform(4, 9, N_SAMPLES), 1)

    exercise = np.random.choice(["low", "medium", "high"], N_SAMPLES)
    sugar = np.random.choice(["low", "medium", "high"], N_SAMPLES)
    smoking = np.random.choice(["yes", "no"], N_SAMPLES)
    alcohol = np.random.choice(["yes", "no"], N_SAMPLES)
    married = np.random.choice(["yes", "no"], N_SAMPLES)
    profession = np.random.choice(
        ["office_worker", "teacher", "artist", "engineer", "healthcare"], N_SAMPLES
    )  # Restored

    height_m = height / 100
    bmi = np.round(weight / (height_m ** 2), 1)

    risk = []
    for b, s, ex, sl in zip(bmi, smoking, exercise, sleep):
        score = 0
        if b < 18.5 or b >= 30: score += 2
        if s == "yes": score += 2
        if ex == "low": score += 1
        if sl < 6: score += 1
        risk.append("high" if score >= 4 else "medium" if score >= 2 else "low")

    df = pd.DataFrame({
        "age": age,
        "weight": weight,
        "height": height,
        "exercise": exercise,
        "sleep": sleep,
        "sugar_intake": sugar,
        "smoking": smoking,
        "alcohol": alcohol,
        "married": married,
        "profession": profession,  # Restored
        "bmi": bmi,
        "health_risk": risk
    })

    df.to_csv(dataset_path, index=False)
    print("Synthetic dataset saved to data/health_data.csv")

# -------------------------------
# Train ML model
# -------------------------------
df = pd.read_csv(dataset_path)

encoders = {}
for col in ["exercise","sugar_intake","smoking","alcohol","married","profession"]:  # Restored
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

target_encoder = LabelEncoder()
df["health_risk"] = target_encoder.fit_transform(df["health_risk"])

X = df.drop("health_risk", axis=1)
y = df["health_risk"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

print("Accuracy:", accuracy_score(y_test, model.predict(X_test)))

# Save models
joblib.dump(model, "models/rf_model1.pkl")
joblib.dump(scaler, "models/scaler.pkl")
joblib.dump(encoders, "models/encoders.pkl")
joblib.dump(target_encoder, "models/target_encoder.pkl")

print("All model files saved in models/ folder!")
