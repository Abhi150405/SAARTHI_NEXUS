from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import os
import json

from app.services.skill_analysis_service import (
    StudentData,
    TargetData,
    AnalysisRequest,
    MatchPercentageRequest,
    run_skill_gap_pipeline
)
from app.services.skill_queue_service import skill_queue_service
from app.services.pathway_service import pathway_service
from app.services.ml_service import ml_service
from app.services.coursera_service import coursera_service
from pydantic import BaseModel


class ToggleStepRequest(BaseModel):
    email: str
    target_name: str
    target_type: str = "company"
    skill: str
    step_index: int
    completed: bool

router = APIRouter()


def load_skill_data():
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path1 = os.path.abspath(os.path.join(base_dir, '..', '..', '..', '..', 'src', 'data', 'skillData.json'))
        if os.path.exists(path1):
            with open(path1, 'r', encoding='utf-8') as f:
                return json.load(f)
                
        path2 = os.path.join(os.getcwd(), '..', 'src', 'data', 'skillData.json')
        if os.path.exists(path2):
            with open(path2, 'r', encoding='utf-8') as f:
                return json.load(f)
                
        print(f"Skill Data Load Error: Could not locate skillData.json. Checked: {path1} and {path2}")
        return []
    except Exception as e:
        print(f"Skill Data Load Error: {e}")
        return []


# ── Synchronous Analysis (Legacy / Direct) ───────────────────────────────────
@router.post("/")
async def analyze_skill_gap(request: AnalysisRequest):
    """
    Synchronous skill gap analysis endpoint.
    Maintained for backward compatibility and immediate direct execution.
    """
    try:
        result = await run_skill_gap_pipeline(request)
        if request.student.email and request.student.email.lower().strip() != "guest":
            try:
                await pathway_service.save_or_update_progress_from_analysis(
                    user_email=request.student.email,
                    target_name=request.target.name,
                    target_type=request.target.type,
                    result=result
                )
            except Exception as pe:
                print(f"[PATHWAY] Progress sync warning on direct run: {pe}")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Asynchronous Queue Endpoints ─────────────────────────────────────────────
@router.post("/queue")
async def queue_skill_gap_analysis(
    request: AnalysisRequest,
    email: Optional[str] = Query(None, description="Optional student email override")
):
    """
    Enqueue skill gap analysis task in the asynchronous message queue.
    Returns 202-like response with task_id immediately so the user can continue
    browsing other platform features while analysis generates in the background.
    """
    try:
        user_email = email or request.student.email or "guest"
        task_info = await skill_queue_service.enqueue_analysis(request, user_email=user_email)
        return task_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enqueue skill analysis: {str(e)}")


@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Poll the status of an asynchronous skill analysis task.
    Returns status ('queued', 'processing', 'completed', 'failed'), progress step, and result.
    """
    task = await skill_queue_service.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/tasks/latest")
async def get_latest_task(
    email: str = Query(..., description="Student email"),
    target_name: Optional[str] = Query(None, description="Target company or role name"),
    target_type: Optional[str] = Query(None, description="Target type ('company' or 'role')")
):
    """
    Fetch the most recent skill analysis task for a student (and optionally target).
    Allows students returning to the Skill Gap page to immediately view past/in-progress analysis.
    """
    task = await skill_queue_service.get_latest_task(
        user_email=email,
        target_name=target_name,
        target_type=target_type
    )
    if not task:
        return {"found": False, "task": None}
    return {"found": True, "task": task}


@router.get("/tasks/active")
async def get_active_tasks(email: str = Query(..., description="Student email")):
    """
    Returns all tasks currently queued or processing for this student.
    Enables global background status indicators across the platform.
    """
    tasks = await skill_queue_service.get_active_tasks(user_email=email)
    return {"active_tasks": tasks}


# ── Interactive Student Pathway Progress Endpoints ───────────────────────────
@router.get("/progress")
async def get_pathway_progress(
    email: str = Query(..., description="Student email"),
    target_name: str = Query(..., description="Target company or role name"),
    target_type: str = Query("company", description="Target type ('company' or 'role')")
):
    """
    Retrieves the interactive learning pathway and completed steps for a student and target.
    """
    pathway = await pathway_service.get_student_pathway(
        user_email=email,
        target_name=target_name,
        target_type=target_type
    )
    if not pathway:
        return {"found": False, "pathway": None}
    return {"found": True, "pathway": pathway}


@router.get("/progress/all")
async def get_all_student_pathways(
    email: str = Query(..., description="Student email")
):
    """
    Retrieves all learning pathways the student is actively tracking.
    """
    pathways = await pathway_service.get_all_student_pathways(user_email=email)
    return {"pathways": pathways}


@router.post("/progress/toggle-step")
async def toggle_roadmap_step(payload: ToggleStepRequest):
    """
    Toggles completion of a roadmap step for a specific skill gap.
    Dynamically recalculates the student's current match percentage.
    """
    updated_pathway = await pathway_service.toggle_roadmap_step(
        user_email=payload.email,
        target_name=payload.target_name,
        target_type=payload.target_type,
        skill_name=payload.skill,
        step_index=payload.step_index,
        completed=payload.completed
    )
    if not updated_pathway:
        raise HTTPException(status_code=404, detail="Pathway or skill not found for user")
    return {"success": True, "pathway": updated_pathway}


# ── Supplementary Endpoints ──────────────────────────────────────────────────
@router.get("/courses")
async def get_courses_for_skill(skill: str = Query(..., description="Skill name to search courses for"), limit: int = Query(3, ge=1, le=10)):
    """Search verified Coursera courses from the indexed 1,600+ course dataset."""
    results = coursera_service.search_courses(skill, limit=limit)
    return {"skill": skill, "courses": results}


@router.post("/calculate_match")
async def calculate_match(request: MatchPercentageRequest):
    percentage = ml_service.calculate_skill_match(request.student_skills, request.required_skills)
    return {"match_percentage": percentage}


@router.post("/top_matches")
async def get_top_matches(request: MatchPercentageRequest):
    data = load_skill_data()
    matches = []
    
    for company in data:
        all_req_skills = []
        for role in company.get('roles_offered', []):
            all_req_skills.extend(role.get('must_have_skills', []))
            all_req_skills.extend(role.get('good_to_have_skills', []))
        
        all_req_skills = list(set(all_req_skills))
        if not all_req_skills:
            continue
            
        percentage = ml_service.calculate_skill_match(request.student_skills, all_req_skills)
        matches.append({
            "company_name": company['display_name'],
            "company_slug": company['company_name'],
            "match_percentage": percentage,
            "sector": company.get('sector', 'Tech'),
            "ctc_lpa": company.get('roles_offered', [{}])[0].get('ctc_lpa', 'N/A')
        })
    
    top_6 = sorted(matches, key=lambda x: x['match_percentage'], reverse=True)[:6]
    return top_6
