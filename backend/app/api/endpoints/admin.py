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
    # Sort descending by visit_date implicitly, or academic_year. EXCLUDE embeddings!
    records_cursor = db['placement_records'].find({}, {"embedding": 0}).sort([("academic_year", -1), ("company_name", 1)])
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


# ── Vector Search Admin Endpoints ─────────────────────────────────────────────

from fastapi import BackgroundTasks

@router.post("/admin/reindex-vectors")
async def reindex_vectors(background_tasks: BackgroundTasks):
    """
    Trigger a full re-embedding of all placement records, interview experiences,
    and yearly stats into MongoDB (stored as `embedding` field on each document).
    Runs as a background task to prevent HTTP timeouts.
    """
    from app.services.vector_store import vector_store
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    background_tasks.add_task(vector_store.index_all, db)
    return {
        "status": "started",
        "message": "Indexing started in the background. Check /admin/vector-status for progress."
    }


@router.get("/admin/vector-status")
async def vector_status():
    """
    Show how many documents currently have embeddings stored in MongoDB.
    Useful to verify the index is populated before testing the RAG chatbot.
    """
    from app.services.embedding_service import embedding_service
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    embedding_available = embedding_service.is_available()

    try:
        placements_total = await db["placement_records"].count_documents({})
        placements_indexed = await db["placement_records"].count_documents(
            {"embedding": {"$exists": True, "$not": {"$size": 0}}}
        )
        experiences_total = await db["interview_experience"].count_documents({})
        experiences_indexed = await db["interview_experience"].count_documents(
            {"embedding": {"$exists": True, "$not": {"$size": 0}}}
        )
        stats_indexed = await db["placement_stats_vectors"].count_documents({})

        return {
            "embedding_api_available": embedding_available,
            "placement_records": {
                "total": placements_total,
                "indexed": placements_indexed,
                "pending": placements_total - placements_indexed,
            },
            "interview_experiences": {
                "total": experiences_total,
                "indexed": experiences_indexed,
                "pending": experiences_total - experiences_indexed,
            },
            "placement_stats_vectors": {
                "indexed": stats_indexed,
            },
            "ready": placements_indexed > 0 or experiences_indexed > 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {e}")


@router.get("/admin/test-embed")
async def test_embed():
    """
    Debug endpoint: lists available embedding models and tests one.
    """
    import os
    key = os.getenv("GOOGLE_API_KEY", "")
    key_preview = key[:8] + "..." if key else "(not set)"

    try:
        import google.generativeai as genai
        genai.configure(api_key=key)

        # List all models that support embedContent
        available_embed_models = []
        for m in genai.list_models():
            if "embedContent" in m.supported_generation_methods:
                available_embed_models.append(m.name)

        # Try each available model until one works
        test_result = None
        working_model = None
        for model_name in available_embed_models[:3]:
            try:
                result = genai.embed_content(
                    model=model_name,
                    content="PICT placement test",
                    task_type="retrieval_document",
                )
                embedding = result.get("embedding", [])
                if embedding:
                    working_model = model_name
                    test_result = {"dims": len(embedding), "sample": embedding[:3]}
                    break
            except Exception:
                continue

        return {
            "key_preview": key_preview,
            "available_embed_models": available_embed_models,
            "working_model": working_model,
            "test_result": test_result,
        }
    except Exception as e:
        return {"status": "error", "key_preview": key_preview, "error": str(e)}



