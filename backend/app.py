from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import joblib
import pandas as pd
import numpy as np
import os
import re
import datetime
import google.generativeai as genai
from dotenv import load_dotenv

import logging

# Setup logging
logging.basicConfig(
    filename='backend_log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_print(msg):
    print(msg)
    logging.info(msg)

# Load environment variables
# Check current directory and backend directory for .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_paths = [
    os.path.join(os.getcwd(), '.env'),
    os.path.join(BASE_DIR, '.env'),
    os.path.join(os.path.dirname(BASE_DIR), '.env')
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

app = Flask(__name__)
CORS(app)

# Gemini Setup
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
model_gen = None

if GEMINI_API_KEY:
    try:
        log_print(f"Configuring Gemini with key: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-4:]}")
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Check available models
        log_print("Checking available Gemini models...")
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        log_print(f"Found models: {available_models}")
        
        # Priority list
        preferred_models = ['models/gemini-1.5-flash', 'models/gemini-1.5-pro', 'models/gemini-pro', 'models/gemini-flash-latest']
        
        chosen_model = None
        for pm in preferred_models:
            if pm in available_models:
                chosen_model = pm
                break
        
        if not chosen_model and available_models:
            chosen_model = available_models[0]
            
        if chosen_model:
            # Optimize for speed: lower temperature, limit tokens
            model_gen = genai.GenerativeModel(
                model_name=chosen_model.replace('models/', ''),
                generation_config={
                    "temperature": 0.1,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 512,
                }
            )
            log_print(f"Gemini Model successfully initialized with High-Speed config: {chosen_model}")
        else:
            log_print("No suitable Gemini model found in available models.")
    except Exception as e:
        log_print(f"CRITICAL Gemini Initialization Error: {e}")
        import traceback
        traceback.print_exc()
else:
    log_print("WARNING: Gemini API Key not found. Chatbot will run in technical mode.")

# MongoDB Setup
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['saarthi_nexus']
    collection = db['placement_records'] # Updated to granular collection
    notifications_collection = db['notifications']
    # Create a TTL index: expires after 7 days (604800 seconds)
    notifications_collection.create_index("created_at", expireAfterSeconds=604800)
    print("Successfully connected to MongoDB Atlas and initialized TTL index!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    collection = None

# New collections for interview experiences, feedback and separated user roles
interview_collection = db['interview_experience']
feedback_collection = db['company_feedback']
students_collection = db['students']
admins_collection = db['admins']

# --- AUTH ENDPOINTS ---

@app.route('/api/signup', methods=['POST'])
def signup():
    if students_collection is None or admins_collection is None:
        return jsonify({'error': 'Database Connection Error', 'reason': 'The server could not connect to the database. Please try again later.'}), 500
    
    try:
        data = request.json
        full_name = data.get('fullName')
        email = data.get('email')
        id_number = data.get('idNumber')
        department = data.get('department')
        password = data.get('password')
        
        # Comprehensive Validation
        if not all([full_name, email, id_number, department, password]):
            return jsonify({
                'error': 'Missing Information',
                'reason': 'All fields are mandatory. Please fill in your name, email, ID number, and department.'
            }), 400
            
        # Check if email exists in either collection to ensure uniqueness across the system
        if students_collection.find_one({'email': email}) or admins_collection.find_one({'email': email}):
            return jsonify({
                'error': 'Account Conflict',
                'reason': f'An account with the email {email} already exists.'
            }), 400
            
        if students_collection.find_one({'id_number': id_number}):
            return jsonify({
                'error': 'ID Conflict',
                'reason': f'The ID Number {id_number} is already registered to another account.'
            }), 400

        if len(password) < 6:
            return jsonify({
                'error': 'Weak Password',
                'reason': 'For security, your password must be at least 6 characters long.'
            }), 400
            
        hashed_password = generate_password_hash(password)
        user_record = {
            "full_name": full_name,
            "email": email,
            "id_number": id_number,
            "department": department,
            "password": hashed_password,
            "role": "student",
            "created_at": pd.Timestamp.now().isoformat()
        }
        
        students_collection.insert_one(user_record)
        return jsonify({'message': 'Success'}), 201
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'reason': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    if students_collection is None or admins_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'student')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
            
        # Search in the appropriate collection based on role
        if role == 'admin':
            user = admins_collection.find_one({'email': email})
        else:
            user = students_collection.find_one({'email': email})
        
        if not user or not check_password_hash(user['password'], password):
            log_print(f"DEBUG: Login failed for {email} (role: {role}).")
            log_print(f"DEBUG: User exists in DB: {user is not None}")
            if user:
                log_print(f"DEBUG: Input pass length: {len(password)}")
                # DO NOT LOG THE ACTUAL PASSWORD FOR SECURITY
            return jsonify({'error': f'Invalid {role} credentials'}), 401
            
        # In a real app, generate a JWT here
        return jsonify({
            'message': 'Login successful',
            'user': {
                'email': user['email'],
                'fullName': user.get('full_name'),
                'role': user.get('role', role),
                'department': user.get('department')
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/students', methods=['GET'])
def get_all_students():
    if students_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Fetch all students, excluding passwords and MongoDB IDs
        students = list(students_collection.find({}, {'password': 0, '_id': 0}).sort('created_at', -1))
        # Format for frontend expect: { id, name, email, dept, joined }
        formatted_students = []
        for i, s in enumerate(students):
            formatted_students.append({
                "id": i + 1,
                "name": s.get('full_name'),
                "email": s.get('email'),
                "dept": s.get('department'),
                "joined": s.get('created_at', '').split('T')[0] if 'T' in s.get('created_at', '') else s.get('created_at')
            })
        return jsonify(formatted_students)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/broadcast', methods=['POST'])
def broadcast_notification():
    if notifications_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        message = data.get('message')
        admin_name = data.get('adminName', 'TNP Admin')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
            
        notification = {
            "message": message,
            "admin_name": admin_name,
            "created_at": datetime.datetime.utcnow(),
            "type": "broadcast"
        }
        
        notifications_collection.insert_one(notification)
        return jsonify({'message': 'Notification broadcasted successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    if notifications_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Fetch latest 5 notifications
        notifications = list(notifications_collection.find({}, {'_id': 0}).sort('created_at', -1).limit(5))
        return jsonify(notifications)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/all', methods=['GET'])
def get_all_notifications():
    if notifications_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        notifications = list(notifications_collection.find({}, {'_id': 0}).sort('created_at', -1))
        return jsonify(notifications)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- NEW ENDPOINTS FOR COMPANIES SECTION ---

@app.route('/api/companies', methods=['GET'])
def get_companies():
    if collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get all unique company names and some basic stats for each
        pipeline = [
            {
                "$group": {
                    "_id": "$company_name",
                    "totalHires": { "$sum": { "$add": ["$selections.CE", "$selections.IT", "$selections.E&TC"] } },
                    "yearsVisited": { "$addToSet": "$academic_year" },
                    "maxSalary": { "$max": "$salary_lpa" },
                    "minCgpa": { "$min": "$criteria.min_cgpa" }
                }
            },
            { "$sort": { "_id": 1 } }
        ]
        results = list(collection.aggregate(pipeline))
        
        formatted_results = []
        for res in results:
            formatted_results.append({
                "company": res['_id'],
                "totalHires": res['totalHires'],
                "visits": len(res['yearsVisited']),
                "years": sorted(list(res['yearsVisited']), reverse=True),
                "maxSalary": f"{res['maxSalary']} LPA",
                "minCgpa": res['minCgpa']
            })
            
        return jsonify(formatted_results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/company/<name>', methods=['GET'])
def get_company_details(name):
    if collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Find all records for this company
        records = list(collection.find({"company_name": name}).sort("academic_year", -1))
        
        if not records:
            return jsonify({'error': 'Company not found'}), 404
            
        history = []
        total_hires = 0
        for rec in records:
            hires = rec['selections']['CE'] + rec['selections']['IT'] + rec['selections']['E&TC']
            total_hires += hires
            history.append({
                "year": rec['academic_year'],
                "salary": f"{rec['salary_lpa']} LPA",
                "hires": hires,
                "dept_breakdown": rec['selections'],
                "criteria": rec['criteria'],
                "category": rec.get('category', 'N/A')
            })
            
        return jsonify({
            "name": name,
            "total_hires": total_hires,
            "visit_count": len(history),
            "history": history
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- INTERVIEW EXPERIENCE ENDPOINTS ---

@app.route('/api/interview-experience', methods=['POST'])
def add_interview_experience():
    if interview_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        required_fields = ['company_name', 'experience', 'suggestions']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        experience_record = {
            "student_name": data.get('student_name', 'Anonymous'),
            "company_name": data['company_name'],
            "role": data.get('role', 'N/A'),
            "year": data.get('year', '2024-25'),
            "experience": data['experience'],
            "suggestions": data['suggestions'],
            "status": data.get('status', 'N/A'),
            "date": pd.Timestamp.now().isoformat()
        }
        
        result = interview_collection.insert_one(experience_record)
        return jsonify({'message': 'Experience added successfully', 'id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/interview-experience', methods=['GET'])
def get_interview_experiences():
    if interview_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        company = request.args.get('company')
        query = {"company_name": company} if company else {}
        experiences = list(interview_collection.find(query).sort("date", -1))
        
        for exp in experiences:
            exp['_id'] = str(exp['_id'])
            
        return jsonify(experiences)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- COMPANY FEEDBACK ENDPOINTS ---

@app.route('/api/company-feedback', methods=['POST'])
def add_company_feedback():
    if feedback_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        if not data.get('company_name') or not data.get('feedback'):
            return jsonify({'error': 'Missing company_name or feedback'}), 400
            
        feedback_record = {
            "company_name": data['company_name'],
            "feedback": data['feedback'],
            "rating": data.get('rating', 5),
            "date": pd.Timestamp.now().isoformat()
        }
        
        result = feedback_collection.insert_one(feedback_record)
        return jsonify({'message': 'Feedback added successfully', 'id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/company-feedback/<company_name>', methods=['GET'])
def get_company_feedback(company_name):
    if feedback_collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        feedbacks = list(feedback_collection.find({"company_name": company_name}).sort("date", -1))
        for fb in feedbacks:
            fb['_id'] = str(fb['_id'])
            
        return jsonify(feedbacks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- CHATBOT (RAG) ENDPOINT ---

# --- RAG-BASED CHATBOT LOGIC ---

def get_chat_response(query):
    try:
        query_lower = query.lower()
        companies = list(collection.distinct("company_name"))
        
        # 1. RETRIEVAL: Find relevant data in MongoDB
        found_companies = [c for c in companies if c.lower() in query_lower]
        found_years = re.findall(r"20\d{2}", query)
        
        context_parts = []
        
        if found_companies:
            # Get detailed history for mentioned companies
            docs = list(collection.find({"company_name": {"$in": found_companies}}).sort("academic_year", -1))
            for d in docs:
                hires = d['selections']['CE'] + d['selections']['IT'] + d['selections']['E&TC']
                context_parts.append(
                    f"Company: {d['company_name']}, Year: {d['academic_year']}, "
                    f"Salary: {d['salary_lpa']} LPA, Hired: {hires} students (CE: {d['selections']['CE']}, "
                    f"IT: {d['selections']['IT']}, E&TC: {d['selections']['E&TC']}), "
                    f"Criteria: {d['criteria']['min_cgpa']} CGPA."
                )
        elif found_years:
            # Flexible year matching: match 2023 to 2023-24
            year_pattern = re.compile(f"^{found_years[0]}")
            docs = list(collection.find({"academic_year": year_pattern}))
            
            if docs:
                pipeline = [
                    {"$match": {"academic_year": {"$regex": f"^{found_years[0]}"}}},
                    {"$group": {
                        "_id": "$academic_year",
                        "avgSalary": {"$avg": "$salary_lpa"},
                        "maxSalary": {"$max": "$salary_lpa"},
                        "totalPlaced": {"$sum": {"$add": ["$selections.CE", "$selections.IT", "$selections.E&TC"]}}
                    }}
                ]
                res = list(collection.aggregate(pipeline))
                if res:
                    s = res[0]
                    context_parts.append(f"In {s['_id']}, the average package was {s['avgSalary']:.2f} LPA and the highest was {s['maxSalary']} LPA. A total of {s['totalPlaced']} students were placed.")
            else:
                log_print(f"No documents found for year pattern: ^{found_years[0]}")
        else:
            # General overview for context
            context_parts.append("The platform contains placement data from 2021 to 2024. Most top companies like Barclays, Mastercard, and Deutsche Bank visit regularly.")

        context_string = "\n".join(context_parts)

        # 2. FORMAT TECHNICAL FALLBACK
        # Construct a readable version in case Gemini fails
        technical_fallback = "Here is what I found in the records:\n\n"
        if found_companies:
            technical_fallback += f"**{found_companies[0]} History:**\n"
            for d in docs[:3]: # Show last 3 years
                technical_fallback += f"- {d['academic_year']}: {d['salary_lpa']} LPA, hired {d['selections']['CE'] + d['selections']['IT'] + d['selections']['E&TC']} students.\n"
        elif found_years:
            technical_fallback += context_string
        else:
            technical_fallback = "I couldn't find specific records for that query. Try asking about a company like 'Barclays' or a year like '2023'."

        # 3. GENERATION: Use Gemini if API key is available
        if model_gen:
            try:
                if context_parts and not ("The platform contains placement data" in context_string):
                    # We have specific company/year data
                    prompt = (
                        f"You are Saarthi, an AI Placement Assistant for PICT (Pune Institute of Computer Technology). "
                        f"Use the following technical placement data to answer the user's question accurately. "
                        f"Keep the tone professional yet helpful.\n\n"
                        f"Context Data:\n{context_string}\n\n"
                        f"User Question: {query}\n\n"
                        f"Answer:"
                    )
                else:
                    # General query or fallback
                    prompt = (
                        f"You are Saarthi, an AI Placement Assistant for PICT (Pune Institute of Computer Technology). "
                        f"Your goal is to help students with placement queries, career advice, and interview preparation. "
                        f"The user has asked a general question: '{query}'. "
                        f"Provide a helpful, detailed, and encouraging response based on your general knowledge. "
                        f"If the question is completely unrelated to education or careers, you can still answer it politely as a helpful AI assistant."
                        f"\n\nContext: {context_string}\n\n"
                        f"Answer:"
                    )
                log_print(f"DEBUG: Generating response for query: {query}")
                log_print(f"DEBUG: Context length: {len(context_string)}")
                
                response = model_gen.generate_content(prompt)
                log_print("DEBUG: Gemini response received successfully")
                return response.text.strip()
            except Exception as gen_err:
                log_print(f"CRITICAL Gemini generation error: {gen_err}")
                import traceback
                traceback.print_exc()
                return technical_fallback
        else:
            log_print("DEBUG: model_gen not found, using technical fallback")
            return technical_fallback

    except Exception as e:
        print(f"Chat error: {e}")
        return "I encountered an error searching the database. Please try a different query."

from flask import Response

# Optimization: Cache company names in memory
cached_companies = []
def get_cached_companies():
    global cached_companies
    if not cached_companies and collection is not None:
        try:
            cached_companies = list(collection.distinct("company_name"))
        except: pass
    return cached_companies

def get_chat_response_stream(query):
    try:
        query_lower = query.lower()
        companies = get_cached_companies()
        
        # Fast matching
        found_companies = [c for c in companies if c.lower() in query_lower]
        found_years = re.findall(r"20\d{2}", query)
        context_parts = []
        
        if found_companies:
            # Provide more detailed context for better responses
            docs = list(collection.find({"company_name": {"$in": found_companies}}).sort("academic_year", -1).limit(4))
            for d in docs:
                total_hired = d['selections']['CE'] + d['selections']['IT'] + d['selections']['E&TC']
                context_parts.append(
                    f"{d['company_name']} ({d['academic_year']}): Package {d['salary_lpa']} LPA, "
                    f"Total Selected: {total_hired} (CE: {d['selections']['CE']}, IT: {d['selections']['IT']}, E&TC: {d['selections']['E&TC']}), "
                    f"Criteria: {d['criteria']['min_cgpa']} CGPA, "
                    f"Branches: {', '.join(d['criteria']['eligible_branches'])}"
                )
        
        context_string = "\n".join(context_parts) if context_parts else "General PICT placement stats: Average Package ~12.5 LPA, Max Package 1.2 Cr (overseas), Top recruiters: Amazon, Microsoft, Barclays, Deutsche Bank."

        if model_gen:
            prompt = (
                f"You are Saarthi, the Official AI Placement Assistant for PICT. "
                f"Use this Context Data: {context_string}. "
                f"User: {query}. "
                f"RULES:\n"
                f"- Respond in structured PARAGRAPHS.\n"
                f"- BOLD key information like company names, salaries, and eligibility using <b>bold text</b>.\n"
                f"- Use native bullet points (•) ONLY for lists.\n"
                f"- NEVER use stars (*) or hashes (#) for formatting.\n"
                f"- Be ACCURATE and helpful."
            )
            response = model_gen.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text: yield chunk.text
        else:
            yield "Saarthi is briefly offline. Please try again in 10 seconds."
    except Exception as e:
        yield f"Notice: {str(e)}"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query', '')
    if not query: return jsonify({'error': 'No query'}), 400
    
    return Response(get_chat_response_stream(query), mimetype='text/plain')

@app.route('/api/placement-stats', methods=['GET'])
def get_placement_stats():
    if collection is None:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Define the Aggregation Pipeline
        pipeline = [
            {
                "$group": {
                    "_id": "$academic_year",
                    "totalPlaced": { "$sum": { "$add": ["$selections.CE", "$selections.IT", "$selections.E&TC"] } },
                    "highestPackage": { "$max": "$salary_lpa" },
                    "avgPackage": { "$avg": "$salary_lpa" },
                    # Collect salaries for median calculation (in-memory for simplicity unless using $median in MongoDB 7.0+)
                    "allSalaries": { "$push": { "$multiply": ["$salary_lpa", 1] } }, 
                     # Dept Distribution
                    "compCount": { "$sum": "$selections.CE" }, 
                    "itCount": { "$sum": "$selections.IT" },
                    "etcCount": { "$sum": "$selections.E&TC" },
                }
            },
            { "$sort": { "_id": -1 } }
        ]

        # Execute Aggregation
        results = list(collection.aggregate(pipeline))
        
        # Post-process data for frontend format
        yearly_data = {}
        for res in results:
            year = res['_id']
            
            # Sub-pipeline for Top Companies per Year
            top_companies_pipeline = [
                { "$match": { "academic_year": year } },
                { "$project": { 
                    "company_name": 1, 
                    "total_selected": { "$add": ["$selections.CE", "$selections.IT", "$selections.E&TC"] } 
                }},
                { "$sort": { "total_selected": -1 } },
                { "$limit": 5 }
            ]
            top_companies_list = list(collection.aggregate(top_companies_pipeline))
            
            top_labels = [c['company_name'] for c in top_companies_list]
            top_data = [c.get('total_selected', 0) for c in top_companies_list]

            # Calculate Median
            salaries = sorted(res.get('allSalaries', []))
            n = len(salaries)
            if n == 0:
                median = 0
            elif n % 2 == 1:
                median = salaries[n // 2]
            else:
                median = (salaries[n // 2 - 1] + salaries[n // 2]) / 2

            # Format Response
            yearly_data[year] = {
                "avgPackage": f"{res['avgPackage']:.2f} LPA",
                "medianPackage": f"{median:.2f} LPA",
                "highestPackage": f"{res['highestPackage']} LPA",
                "totalPlaced": str(res['totalPlaced']),
                "deptDistribution": [res['compCount'], res['itCount'], res['etcCount']],
                "topCompanies": {
                     "labels": top_labels, 
                     "data": top_data
                }
            }

        return jsonify(yearly_data)

    except Exception as e:
        print(f"Error in aggregation: {e}")
        return jsonify({'error': str(e)}), 500

# Load the trained model
# Assuming app.py is in backend/ and model is in backend/model/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'placement_model.pkl')

try:
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
    else:
        print(f"Model not found at {MODEL_PATH}")
        model = None
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route('/predict_placement', methods=['POST'])
def predict_placement():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.json
        # Expected features: cgpa, tenth_score, twelfth_score, amcat_score, internships, backlogs, projects
        
        # Create a DataFrame for prediction to match training columns
        features = pd.DataFrame([data])
        
        # Ensure column order matches training (though sklearn usually handles this if names are right in pandas 1.0+, 
        # but let's be safe and assume the input JSON keys match the training DF columns)
        # For simplicity, we assume the JSON has the right keys.
        
        # Prepare input features
        input_data = [[
            float(data.get('cgpa', 0)),
            float(data.get('tenth_score', 0)),
            float(data.get('twelfth_score', 0)),
            float(data.get('amcat_score', 0)),
            int(data.get('internships', 0)),
            int(data.get('backlogs', 0)),
            int(data.get('projects', 0))
        ]]
        
        prediction = model.predict(input_data)[0]
        probability = model.predict_proba(input_data)[0][1] # Probability of class 1 (Placed)
        
        return jsonify({
            'placement_prediction': int(prediction),
            'placement_probability': float(probability)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'online',
        'message': 'SAARTHI NEXUS ML API is running. Use /predict_placement for predictions.'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000, use_reloader=False)
