from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from bson import ObjectId
from app.db.mongodb import get_database

router = APIRouter()

@router.get("/admin/students")
async def get_all_students():
    db = get_database()
    students = await db['students'].find({}, {'password': 0, '_id': 0}).sort('created_at', -1).to_list(None)

    formatted_students = []
    for i, s in enumerate(students):
        formatted_students.append({
            "id": i + 1,
            "name": s.get('full_name'),
            "email": s.get('email'),
            "dept": s.get('department'),
            "idNumber": s.get('id_number'),
            "joined": s.get('created_at', '').split('T')[0] if 'T' in s.get('created_at', '') else s.get('created_at'),
            "tenth_percentage": s.get('tenth_percentage', ''),
            "twelfth_percentage": s.get('twelfth_percentage', ''),
            "college_cgpa": s.get('college_cgpa', ''),
            "amcat_score": s.get('amcat_score', ''),
            # Professional links & skills — included for modal
            "skills": s.get('skills', []),
            "leetcode_url": s.get('leetcode_url'),
            "codechef_url": s.get('codechef_url'),
            "codeforces_url": s.get('codeforces_url'),
            "linkedin_url": s.get('linkedin_url'),
            "resume_url": s.get('resume_url'),
        })
    return formatted_students

@router.get("/admin/student-detail")
async def get_student_detail(email: str = Query(...)):
    """Fetch full student profile on-demand when admin opens the detail modal."""
    db = get_database()
    s = await db['students'].find_one({'email': email}, {'password': 0, '_id': 0})
    if not s:
        return {}
    return {
        "name": s.get('full_name'),
        "email": s.get('email'),
        "dept": s.get('department'),
        "idNumber": s.get('id_number'),
        "joined": s.get('created_at', '').split('T')[0] if 'T' in s.get('created_at', '') else s.get('created_at'),
        "tenth_percentage": s.get('tenth_percentage', ''),
        "twelfth_percentage": s.get('twelfth_percentage', ''),
        "college_cgpa": s.get('college_cgpa', ''),
        "amcat_score": s.get('amcat_score', ''),
        "skills": s.get('skills', []),
        "leetcode_url": s.get('leetcode_url'),
        "codechef_url": s.get('codechef_url'),
        "codeforces_url": s.get('codeforces_url'),
        "linkedin_url": s.get('linkedin_url'),
        "resume_url": s.get('resume_url'),
        "resume_summary": s.get('resume_summary', ''),
        "ats_score": s.get('ats_score', 0),
    }

class PlacementRecordCreate(BaseModel):
    academic_year: str
    company_name: str
    category: str
    salary_lpa: float
    visit_date: str
    total_salary_lpa: Optional[float] = 0.0
    criteria: Optional[Dict[str, Any]] = {}
    selections: Optional[Dict[str, Any]] = {}
    gender_distribution: Optional[Dict[str, Any]] = {}

@router.post("/admin/placement")
async def create_placement_record(record: PlacementRecordCreate):
    db = get_database()
    record_dict = record.dict()
    # Add timestamps if needed, but simple insert for now
    result = await db['placement_records'].insert_one(record_dict)
    if result.inserted_id:
        return {"message": "Placement record created successfully", "id": str(result.inserted_id)}
    raise HTTPException(status_code=500, detail="Failed to create placement record")

@router.get("/admin/placements")
async def get_all_placements():
    """Fetch all placement records for the admin management table."""
    db = get_database()
    # Sort descending by visit_date implicitly, or academic_year
    records_cursor = db['placement_records'].find({}).sort([("academic_year", -1), ("company_name", 1)])
    records = await records_cursor.to_list(None)
    
    formatted = []
    for r in records:
        r_dict = dict(r)
        r_dict['_id'] = str(r_dict['_id'])
        formatted.append(r_dict)
    return formatted

@router.delete("/admin/placement/{record_id}")
async def delete_placement_record(record_id: str):
    db = get_database()
    try:
        obj_id = ObjectId(record_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid record ID format")
        
    result = await db['placement_records'].delete_one({"_id": obj_id})
    if result.deleted_count == 1:
        return {"message": "Placement record deleted successfully"}
    raise HTTPException(status_code=404, detail="Placement record not found")
