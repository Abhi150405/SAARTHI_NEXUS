import joblib
import pandas as pd
import os
import logging
from app.core.config import settings

class MLService:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Adjust path to where the model actually is
        # Flask app used backend/model/placement_model.pkl
        MODEL_PATH = os.path.join(os.path.dirname(BASE_DIR), 'model', 'placement_model.pkl')
        
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                logging.info(f"Model loaded from {MODEL_PATH}")
            else:
                logging.warning(f"Model not found at {MODEL_PATH}")
        except Exception as e:
            logging.error(f"Error loading model: {e}")

    def predict(self, data: dict):
        if not self.model:
            return None
        
        feature_names = ['cgpa', 'tenth_score', 'twelfth_score', 'amcat_score', 'internships', 'backlogs', 'projects']
        input_df = pd.DataFrame([[
            float(data.get('cgpa', 0)),
            float(data.get('tenth_score', 0)),
            float(data.get('twelfth_score', 0)),
            float(data.get('amcat_score', 0)),
            int(data.get('internships', 0)),
            int(data.get('backlogs', 0)),
            int(data.get('projects', 0))
        ]], columns=feature_names)
        
        prediction = self.model.predict(input_df)[0]
        probability = self.model.predict_proba(input_df)[0][1]
        
        return {
            'placement_prediction': int(prediction),
            'placement_probability': float(probability)
        }

ml_service = MLService()
