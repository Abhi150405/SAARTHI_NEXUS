from fastapi import APIRouter, Query
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
