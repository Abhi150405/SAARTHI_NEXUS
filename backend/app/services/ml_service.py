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

    def calculate_skill_match(self, student_skills, required_skills):
        """
        Advanced NLP-based skill matching using Character N-Grams and Jaccard Similarity.
        This provides much higher accuracy for short skill keywords than traditional TF-IDF.
        """
        if not required_skills:
            return 100
        if not student_skills:
            return 0
            
        import numpy as np
        from sklearn.feature_extraction.text import CountVectorizer
        
        try:
            # --- HYBRID SCORER ---
            # 1. Direct/Synonym Overlap Ratio (The "Intuitive" Score)
            skillSynonyms = {
                'dsa': ['data structures', 'algorithms', 'data structures and algorithms', 'dsa'],
                'cpp': ['c++', 'c plus plus', 'cpp'],
                'js': ['javascript', 'js', 'vanilla js'],
                'react': ['react.js', 'reactjs', 'react js', 'frontend'],
                'ml': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
                'sql': ['dbms', 'databases', 'mysql', 'postgresql', 'oracle', 'sql', 'sql server'],
                'networking': ['cn', 'computer networks', 'networking'],
                'os': ['operating systems', 'os', 'operating system'],
                'oop': ['object oriented programming', 'oop', 'oops']
            }

            student_text = " ".join(student_skills).lower()
            required_text = " ".join(required_skills).lower()

            satisfied_count = 0
            for req in required_skills:
                req_low = req.lower().strip()
                match_found = False
                for student_skill in student_skills:
                    std_low = student_skill.lower().strip()
                    
                    if std_low == req_low:
                        match_found = True
                        break
                        
                    if len(std_low) > 2 and len(req_low) > 2:
                        if std_low in req_low or req_low in std_low:
                            match_found = True
                            break
                            
                    for key, group in skillSynonyms.items():
                        if std_low in group and req_low in group:
                            match_found = True
                            break
                            
                    if match_found:
                        break
                
                if match_found:
                    satisfied_count += 1

            
            base_ratio = (satisfied_count / len(required_skills))
            
            # 2. Character N-Gram Fuzzy Ratio (The "AI" Score)
            try:
                vectorizer = CountVectorizer(analyzer='char_wb', ngram_range=(2, 3))
                combined_vocab = vectorizer.fit_transform([student_text, required_text]).toarray()
                intersection = np.sum(np.min(combined_vocab, axis=0))
                union = np.sum(np.max(combined_vocab, axis=0))
                fuzzy_similarity = intersection / union if union > 0 else 0
            except Exception:
                fuzzy_similarity = 0
                
            final_score = max(base_ratio, fuzzy_similarity)
            return int(round(final_score * 100))
        except Exception as e:
            logging.error(f"Skill match error: {e}")
            return 0


ml_service = MLService()
