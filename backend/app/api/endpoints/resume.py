from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.resume_service import resume_service
from app.db.mongodb import get_database
import json
from app.core.security import get_current_user
from fastapi import Depends

router = APIRouter()

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    email: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user["email"] != email:
        raise HTTPException(status_code=403, detail="You may only upload your own resume")
    if not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOCX, and TXT are supported.")

    try:
        content = await file.read()
        text = resume_service.extract_text(content, file.filename)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the file.")
            
        try:
            analysis = await resume_service.analyze_resume(text)
        except Exception as e:
            error_msg = str(e).upper()
            if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
                raise HTTPException(status_code=429, detail="AI service is currently busy (Rate limit reached). Please try again in 30 seconds.")
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
        
        if not analysis:
            raise HTTPException(status_code=500, detail="AI analysis failed to produce results. Please try again.")
            
        # Save to database
        db = get_database()
        
        # We save skills and other features into the student profile
        update_data = {
            "skills": analysis.get("skills", []),
            "resume_summary": analysis.get("summary", ""),
            "resume_education": analysis.get("education", ""),
            "experience_years": analysis.get("experience_years", 0),
            "key_achievements": analysis.get("key_achievements", []),
            "projects": analysis.get("projects", analysis.get("key_projects", [])),
            "key_projects": analysis.get("key_projects", analysis.get("projects", [])),
            "ats_score": analysis.get("ats_score", 0),
            "last_resume_update": True
        }
        
        await db['students'].update_one(
            {"email": email},
            {"$set": update_data}
        )
        
        return {
            "message": "Resume uploaded and analyzed successfully",
            "analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
