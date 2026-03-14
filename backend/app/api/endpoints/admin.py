from fastapi import APIRouter
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
            "amcat_score": s.get('amcat_score', '')
        })
    return formatted_students
