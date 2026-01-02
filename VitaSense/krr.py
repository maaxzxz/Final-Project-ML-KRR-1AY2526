def krr_refinement(ml_risk, bmi, smoking, exercise, sleep):
    explanation = []

    if bmi >= 30 and smoking == "yes":
        explanation.append("High BMI and smoking detected")
        return "high", explanation

    if exercise == "high" and sleep >= 8 and ml_risk == "high":
        explanation.append("Good lifestyle reduced risk")
        return "medium", explanation

    explanation.append("No rule triggered")
    return ml_risk, explanation