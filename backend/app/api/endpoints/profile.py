from fastapi import APIRouter, HTTPException, Query
from app.schemas.auth import ProfileUpdate
from app.db.mongodb import get_database

router = APIRouter()

@router.get("/profile")
async def get_profile(email: str = Query(...)):
    db = get_database()
    student = await db['students'].find_one(
        {'email': email},
        {
            '_id': 0, 
            'full_name': 1, 
            'department': 1, 
            'tenth_percentage': 1, 
            'twelfth_percentage': 1, 
            'college_cgpa': 1, 
            'amcat_score': 1,
            'skills': 1,
            'resume_summary': 1,
            'resume_education': 1,
            'experience_years': 1,
            'key_achievements': 1,
            'ats_score': 1,
            'profile_picture': 1
        }
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/profile")
async def update_profile(data: ProfileUpdate):
    db = get_database()
    update_fields = {k: v for k, v in data.dict(exclude={'email'}).items() if v is not None}
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")
        
    result = await db['students'].update_one({'email': data.email}, {'$set': update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Profile updated successfully"}
