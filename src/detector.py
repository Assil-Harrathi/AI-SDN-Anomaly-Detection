import joblib
import pandas as pd


class AnomalyDetector:

    def __init__(self, model_path):
        self.model = joblib.load(model_path)

    def predict(self, data):

        X = pd.DataFrame([data])

        prediction = self.model.predict(X)[0]
        score = self.model.decision_function(X)[0]

        return {
            "anomaly": bool(prediction == -1),
            "prediction": int(prediction),
            "score": float(score)
        }