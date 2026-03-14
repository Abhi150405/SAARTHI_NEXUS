from fastapi import APIRouter, HTTPException, Request, Query
from app.db.mongodb import get_database
from bson.objectid import ObjectId
import pandas as pd

router = APIRouter()

@router.post("/interview-experience", status_code=201)
async def add_interview_experience(request: Request):
    data = await request.json()
    db = get_database()
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
    result = await db['interview_experience'].insert_one(experience_record)
    return {"message": "Experience added successfully", "id": str(result.inserted_id)}

@router.get("/interview-experience")
async def get_interview_experiences(company: str = Query(None)):
    db = get_database()
    query = {"company_name": company} if company else {}
    experiences = await db['interview_experience'].find(query).sort("date", -1).to_list(None)
    for exp in experiences:
        exp['_id'] = str(exp['_id'])
    return experiences

@router.post("/company-feedback", status_code=201)
async def add_company_feedback(request: Request):
    data = await request.json()
    db = get_database()
    feedback_record = {
        "company_name": data['company_name'],
        "students_appeared": data.get('students_appeared', {}),
        "overall_observation": data.get('overall_observation', {}),
        "training_suggestions": data.get('training_suggestions', ''),
        "industry_institute_remarks": data.get('industry_institute_remarks', ''),
        "admin_name": data.get('admin_name', 'TNP Admin'),
        "date": data.get('date') or pd.Timestamp.now().isoformat()
    }
    result = await db['company_feedback'].insert_one(feedback_record)
    return {"message": "Feedback published successfully", "id": str(result.inserted_id)}

@router.get("/company-feedback")
async def get_all_company_feedback():
    db = get_database()
    feedbacks = await db['company_feedback'].find().sort("date", -1).to_list(None)
    for fb in feedbacks:
        fb['_id'] = str(fb['_id'])
    return feedbacks
