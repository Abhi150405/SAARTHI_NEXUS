from fastapi import APIRouter, HTTPException, Query, Depends
from app.schemas.auth import ProfileUpdate
from app.db.mongodb import get_database
from app.core.security import get_current_user

router = APIRouter()


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated student's profile.
    The email is taken from the JWT, not from a query param, to prevent
    a user from fetching another user's profile by editing the request.
    """
    db = get_database()
    email = current_user["email"]
    student = await db["students"].find_one(
        {"email": email},
        {
            "_id": 0,
            "full_name": 1,
            "department": 1,
            "tenth_percentage": 1,
            "twelfth_percentage": 1,
            "college_cgpa": 1,
            "amcat_score": 1,
            "skills": 1,
            "resume_summary": 1,
            "resume_education": 1,
            "experience_years": 1,
            "key_achievements": 1,
            "projects": 1,
            "ats_score": 1,
            "profile_picture": 1,
            "leetcode_url": 1,
            "codechef_url": 1,
            "codeforces_url": 1,
            "linkedin_url": 1,
            "resume_url": 1,
        },
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/profile")
async def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Updates the authenticated student's profile.
    The email field in the request body is ignored — the JWT identity
    is used, so a student cannot update another student's profile.
    """
    db = get_database()
    email = current_user["email"]  # authoritative email from token
    update_fields = {k: v for k, v in data.dict(exclude={"email"}).items() if v is not None}

    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    result = await db["students"].update_one({"email": email}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Profile updated successfully"}
