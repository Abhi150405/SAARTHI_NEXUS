# ML Integration Design for SAARTHI_NEXUS

## 1. Objective
To integrate Machine Learning capabilities into the SAARTHI_NEXUS platform to provide personalized career guidance, accurate placement probability predictions, and data-driven skill recommendations.

## 2. Proposed Models

### Model A: Placement Probability Predictor
**Goal**: Predict the likelihood of a student getting placed in a specific tier of companies.
**Type**: Supervised Classification (Random Forest / XGBoost)
**Inputs (Features)**:
- **Academic Scores**: CGPA, 10th %, 12th %
- **Standardized Tests**: AMCAT/Assessment Scores
- **Demographics**: Department (CSE, ECE, etc.)
- **Skills**: One-hot encoded technical skills (Python, Java, React, etc.)
- **Projects**: Count and complexity score (mocked)
- **Internships**: Count

**Output**:
- Probability Score (0-100%)
- Risk Category (Safe, Moderate, High Risk)

### Model B: Intelligent Skill Recommender
**Goal**: Recommend the high-impact skills that the user is missing for a target role.
**Type**: Content-Based Filtering or Association Rule Mining
**Logic**:
- Identify skills possessed by successful candidates in the target role (e.g., "Full Stack Developer").
- Compare with user's current skill set.
- Rank missing skills by "Impact Factor" (how much they increase placement probability).

## 3. Architecture & Tech Stack

### Backend (New)
Since the current project is a frontend-only React app, we need a lightweight backend to serve the model.
- **Framework**: Python (Flask or FastAPI)
- **ML Libraries**: scikit-learn, pandas, numpy
- **Data Persistence**: Simple CSV/JSON for training data (or SQLite).

### Frontend Integration
- **API Calls**: The React components (`Eligibility.jsx`, `SkillAnalysis.jsx`) will make HTTP POST requests to the Python backend.
- **Real-time Feedback**: Update charts and probabilities dynamically based on user input.

## 4. Implementation Steps

1. **Setup Python Environment**:
   - Create `backend/` directory.
   - Install dependencies (`flask`, `scikit-learn`, `pandas`).
2. **Generate Synthetic Data**:
   - Create a script to generate 1000+ mock student records with realistic correlations (e.g., High CGPA + Python = High Placement Chance).
3. **Train Model**:
   - Train a Random Forest classifier.
   - Save the model using `pickle` or `joblib`.
4. **Create API**:
   - `/predict_placement` endpoint: Accepts student JSON, returns probability.
   - `/recommend_skills` endpoint: Accepts current skills + target, returns recommendations.
5. **Connect Frontend**:
   - Update `Eligibility.jsx` to fetch data from the API.

## 5. Directory Structure
```
SAARTHI_NEXUS/
├── backend/
│   ├── model/
│   │   ├── train_model.py      # Script to train and save model
│   │   └── placement_model.pkl # Serialized model
│   ├── app.py                  # Flask API
│   ├── requirements.txt
│   └── mock_data.csv
├── src/
│   ├── pages/
│   │   ├── Eligibility.jsx     # Updated to call API
│   │   └── ...
└── ...
```
