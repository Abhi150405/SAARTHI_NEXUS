from fastapi import APIRouter, HTTPException, Request, Query
from app.db.mongodb import get_database
from bson.objectid import ObjectId
import pandas as pd
from pymongo import ReturnDocument
from app.core.security import get_current_user, require_admin
from fastapi import Depends

router = APIRouter()

@router.post("/interview-experience", status_code=201)
async def add_interview_experience(request: Request, current_user: dict = Depends(get_current_user)):
    data = await request.json()
    db = get_database()
    experience_record = {
        "student_name": data.get('student_name', 'Anonymous'),
        "company_name": data['company_name'],
        "role": data.get('role', 'N/A'),
        "year": data.get('year', '2024-25'),
        "branch": data.get('branch', 'CE'),
        "graduation_year": data.get('graduation_year', ''),
        "rounds": data.get('rounds', ''),
        "experience": data['experience'],
        "suggestions": data.get('suggestions', ''),
        "status": data.get('status', 'N/A'),
        "created_at": data.get('created_at', pd.Timestamp.now().isoformat()),
        "formatted_date": data.get('formatted_date', ''),
        "date": pd.Timestamp.now().isoformat(),
        "reads": 0
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

@router.get("/interview-experience/{exp_id}")
async def get_interview_experience_by_id(exp_id: str, increment: bool = False):
    db = get_database()
    try:
        if increment:
            exp = await db['interview_experience'].find_one_and_update(
                {"_id": ObjectId(exp_id)},
                {"$inc": {"reads": 1}},
                return_document=ReturnDocument.AFTER
            )
        else:
            exp = await db['interview_experience'].find_one({"_id": ObjectId(exp_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    exp['_id'] = str(exp['_id'])
    return exp

@router.post("/company-feedback", status_code=201)
async def add_company_feedback(request: Request, current_user: dict = Depends(require_admin)):
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
