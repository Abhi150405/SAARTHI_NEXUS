import joblib
import pandas as pd
import os
import logging
from app.core.config import settings

class MLService:
    def __init__(self):
        # We now focus on NLP-based assessment (Skill Matcher)
        pass

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
                'dsa': ['data structures', 'algorithms', 'data structures and algorithms', 'dsa', 'data structure', 'algorithm', 'data structure and algorithm', 'data structures & algorithms'],
                'cpp': ['c++', 'c plus plus', 'cpp'],
                'js': ['javascript', 'js', 'vanilla js'],
                'react': ['react.js', 'reactjs', 'react js', 'frontend'],
                'ml': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
                'sql': ['dbms', 'databases', 'database', 'rdbms', 'mysql', 'postgresql', 'oracle', 'sql', 'sql server', 'database management', 'database management system'],
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
