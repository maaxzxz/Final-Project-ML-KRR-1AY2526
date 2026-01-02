from flask import Flask, request, jsonify, render_template
import joblib
import numpy as np
from krr import krr_refinement

app = Flask(__name__)

# Load models
model = joblib.load("models/rf_model1.pkl")
scaler = joblib.load("models/scaler.pkl")
encoders = joblib.load("models/encoders.pkl")
target_encoder = joblib.load("models/target_encoder.pkl")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    required = [
        "age", "weight", "height", "exercise", "sleep",
        "sugar_intake", "smoking", "alcohol", "married", "profession"  # Restored
    ]
    for key in required:
        if key not in data:
            return jsonify({"error": f"Missing field: {key}"}), 400

    height_m = data["height"] / 100
    bmi = data["weight"] / (height_m ** 2)

    encoded = data.copy()
    for col in encoders:
        try:
            encoded[col] = encoders[col].transform([encoded[col]])[0]
        except Exception:
            return jsonify({"error": f"Invalid value for {col}"}), 400

    features = np.array([[encoded["age"], encoded["weight"], encoded["height"],
        encoded["exercise"], encoded["sleep"], encoded["sugar_intake"],
        encoded["smoking"], encoded["alcohol"], encoded["married"],
        encoded["profession"], round(bmi, 1)]])

    features = scaler.transform(features)
    pred = model.predict(features)[0]
    ml_risk = target_encoder.inverse_transform([pred])[0]

    # Calculate confidence level based on prediction probabilities
    pred_proba = model.predict_proba(features)[0]
    confidence = round(max(pred_proba) * 100, 2)  # Confidence as percentage

    final_risk, explanation = krr_refinement(
        ml_risk,
        bmi,
        data["smoking"],
        data["exercise"],
        data["sleep"]
    )

    return jsonify({
        "ml_prediction": ml_risk,
        "final_risk": final_risk,
        "confidence": confidence,
        "explanation": explanation
    })

if __name__ == "__main__":
    app.run(debug=True)