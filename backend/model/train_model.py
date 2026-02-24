import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

# Create dummy data for placement prediction
def create_dummy_data(n_samples=5000):
    np.random.seed(42)
    
    # Generate realistic student profiles
    data = {
        'cgpa': np.random.normal(7.5, 1.2, n_samples).clip(5.0, 10.0),
        'tenth_score': np.random.normal(80, 10, n_samples).clip(50, 99),
        'twelfth_score': np.random.normal(78, 10, n_samples).clip(50, 99),
        'amcat_score': np.random.normal(70, 15, n_samples).clip(30, 99),
        'internships': np.random.choice([0, 1, 2, 3], p=[0.4, 0.3, 0.2, 0.1], size=n_samples),
        'backlogs': np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1], size=n_samples),
        'projects': np.random.randint(0, 5, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Define Placement Rules based on PDF Reports
    # Report Analysis:
    # - Mass Recruiters (TCS, Accenture): ~6.0-6.5 CGPA, allow 1 backlog
    # - Niche/Dream (Barclays, Deutsche Bank): ~7.0-8.0 CGPA, No backlogs, Good 10th/12th
    # - Super Dream (PhonePe, Goldman Sachs): ~8.5+ CGPA, Internships important
    
    def determine_placement(row):
        # Base probability
        prob = 0.1
        
        # 1. Eligibility Gates (The "Cutoffs")
        if row['backlogs'] > 1:
            return 0 # Most companies reject > 1 active backlog
            
        # 2. Company Tier Logic
        
        # Super Dream Criteria (>12 LPA)
        # Companies: PhonePe (8.5), Goldman Sachs (7.5+), Deutsche Bank (8.0)
        if row['cgpa'] >= 8.5 and row['tenth_score'] >= 80 and row['internships'] >= 1:
            prob += 0.8
            
        # Dream Criteria (6-12 LPA)
        # Companies: Barclays (7.0), Oracle (7.0), Veritas (6.82)
        elif row['cgpa'] >= 7.0 and row['tenth_score'] >= 70:
            prob += 0.6
            
        # Mass Recruiter Criteria (<6 LPA)
        # Companies: TCS (6.0), Accenture (6.5), Capgemini (6.8)
        elif row['cgpa'] >= 6.0 and row['amcat_score'] >= 60:
            prob += 0.4
            
        # 3. skills boost (Proxied by projects/internships)
        prob += (row['projects'] * 0.05)
        prob += (row['amcat_score'] * 0.002)
        
        # Cap at 0.95 (uncertainty always exists)
        return 1 if np.random.random() < min(prob, 0.95) else 0

    df['placed'] = df.apply(determine_placement, axis=1)
    
    return df

def train_model():
    print("Generaring synthetic training data...")
    df = create_dummy_data()
    
    X = df.drop('placed', axis=1)
    y = df['placed']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy:.2f}")
    
    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), 'placement_model.pkl')
    joblib.dump(clf, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
