from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from app.services.ml_service import ml_service
from app.services.coursera_service import coursera_service
from app.core.cache import cache
import httpx
import os
import json
import asyncio
import hashlib
import urllib.parse
from app.db.mongodb import get_database

router = APIRouter()

def load_skill_data():
    try:
        # 1. Try absolute path ascending from this file (backend/app/api/endpoints/...)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path1 = os.path.abspath(os.path.join(base_dir, '..', '..', '..', '..', 'src', 'data', 'skillData.json'))
        if os.path.exists(path1):
            with open(path1, 'r', encoding='utf-8') as f:
                return json.load(f)
                
        # 2. Try assuming CWD is 'backend/'
        path2 = os.path.join(os.getcwd(), '..', 'src', 'data', 'skillData.json')
        if os.path.exists(path2):
            with open(path2, 'r', encoding='utf-8') as f:
                return json.load(f)
                
        print(f"Skill Data Load Error: Could not locate skillData.json. Checked: {path1} and {path2}")
        return []
    except Exception as e:
        print(f"Skill Data Load Error: {e}")
        return []

class StudentData(BaseModel):
    name: str
    branch: str
    cgpa: float
    skills: List[str]

class TargetData(BaseModel):
    type: str
    name: str
    required_skills: List[str]
    good_to_have_skills: List[str] = []

class AnalysisRequest(BaseModel):
    student: StudentData
    target: TargetData

class MatchPercentageRequest(BaseModel):
    student_skills: List[str]
    required_skills: List[str]


# ── Tool Schema ─────────────────────────────────────────────────────────────
# Shared JSON Schema used by both Groq and Gemini function/tool calling.

SKILL_GAP_TOOL_SCHEMA = {
    "type": "object",
    "properties": {
        "match_percentage": {
            "type": "integer",
            "description": (
                "Percentage (0-100) of required skills semantically satisfied by the student. "
                "Formula: (# of required skills satisfied / total required skills) * 100, rounded. "
                "Use semantic reasoning: 'React.js' satisfies 'React', 'MySQL' satisfies 'SQL', etc."
            )
        },
        "matched_skills": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of required skills that the student already has (semantic match)."
        },
        "missing_skills": {
            "type": "array",
            "description": (
                "MAXIMUM 4 missing skills, sorted by severity (critical first, then important, then good_to_have). "
                "Choose the 4 most impactful skills only."
            ),
            "items": {
                "type": "object",
                "properties": {
                    "skill": {
                        "type": "string",
                        "description": "Exact name of the missing skill."
                    },
                    "severity": {
                        "type": "string",
                        "enum": ["critical", "important", "good_to_have"],
                        "description": (
                            "critical = core skill without which student CANNOT clear interview; "
                            "important = expected by most interviewers, strong advantage; "
                            "good_to_have = differentiator, not blocking."
                        )
                    },
                    "why_needed": {
                        "type": "string",
                        "description": "One sentence: why this skill matters specifically for the target role/company."
                    },
                    "estimated_days_to_learn": {
                        "type": "integer",
                        "description": "Realistic days to learn, assuming 1-2 hours/day for a college student."
                    },
                    "roadmap": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "3-5 short, actionable learning steps for this skill."
                    },
                    "resources": {
                        "type": "object",
                        "properties": {
                            "youtube": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title":        {"type": "string"},
                                        "channel":      {"type": "string"},
                                        "search_query": {
                                            "type": "string",
                                            "description": "Exact YouTube search string to find this video/playlist."
                                        },
                                        "type": {
                                            "type": "string",
                                            "enum": ["video", "playlist", "course"]
                                        }
                                    },
                                    "required": ["title", "channel", "search_query", "type"]
                                }
                            },
                            "courses": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title":    {"type": "string"},
                                        "platform": {
                                            "type": "string",
                                            "description": "Platform name, e.g. Coursera, Udemy, freeCodeCamp, GeeksForGeeks, NPTEL."
                                        },
                                        "url":     {"type": "string"},
                                        "is_free": {"type": "boolean"}
                                    },
                                    "required": ["title", "platform", "is_free"]
                                }
                            },
                            "practice": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "platform": {
                                            "type": "string",
                                            "description": "Platform name, e.g. LeetCode, HackerRank, GitHub, Kaggle."
                                        },
                                        "suggestion": {
                                            "type": "string",
                                            "description": "Specific task, e.g. 'Solve 20 medium DP problems on LeetCode'."
                                        },
                                        "url": {"type": "string"}
                                    },
                                    "required": ["platform", "suggestion"]
                                }
                            }
                        },
                        "required": ["youtube", "courses", "practice"]
                    }
                },
                "required": ["skill", "severity", "why_needed", "estimated_days_to_learn", "roadmap", "resources"]
            }
        },
        "overall_summary": {
            "type": "string",
            "description": (
                "2-3 sentences personalized to the student's first name, branch, and target. "
                "Honest, motivating, and specific."
            )
        },
        "priority_skill_to_learn_first": {
            "type": "string",
            "description": "Single skill name that gives the most placement leverage for this target."
        },
        "estimated_total_preparation_days": {
            "type": "integer",
            "description": "Realistic total days to close all skill gaps (1-2 hrs/day)."
        },
        "placement_readiness_message": {
            "type": "string",
            "description": (
                "One sentence. Encouraging and honest. Always in English. "
                "Not overly optimistic or harsh."
            )
        }
    },
    "required": [
        "match_percentage",
        "matched_skills",
        "missing_skills",
        "overall_summary",
        "priority_skill_to_learn_first",
        "estimated_total_preparation_days",
        "placement_readiness_message"
    ]
}

# ── Groq tool definition (OpenAI-compatible format) ──────────────────────────
GROQ_TOOL = {
    "type": "function",
    "function": {
        "name": "generate_skill_gap_analysis",
        "description": (
            "Analyze a PICT student's skill gaps against a job role or company requirement "
            "and generate a structured, actionable placement preparation plan."
        ),
        "parameters": SKILL_GAP_TOOL_SCHEMA
    }
}

GROQ_TOOL_CHOICE = {
    "type": "function",
    "function": {"name": "generate_skill_gap_analysis"}
}

# ── Gemini function declaration ───────────────────────────────────────────────
GEMINI_FUNCTION_DECLARATION = {
    "name": "generate_skill_gap_analysis",
    "description": (
        "Analyze a PICT student's skill gaps against a job role or company requirement "
        "and generate a structured, actionable placement preparation plan."
    ),
    "parameters": SKILL_GAP_TOOL_SCHEMA
}

# ── Analysis instructions injected into the user message ─────────────────────
ANALYSIS_INSTRUCTIONS = """
You are SkillSaarthi — an expert career counselor and placement intelligence engine for PICT (Pune Institute of Computer Technology) students.

=== YOUR TASK ===
Analyze the student's skills vs. the target requirements, then call the `generate_skill_gap_analysis` tool with your findings.

=== STRICT EVALUATION RULES ===
1. Use SEMANTIC matching — "React.js" satisfies "React", "Object-Oriented Programming" satisfies "OOP", "DBMS" satisfies "SQL", "C++" satisfies "OOP concepts in C++".
2. SQL equivalents: SQL, MySQL, PostgreSQL, Oracle, DBMS, RDBMS, Database Management System are all equivalent.
3. ALL skills listed in target required_skills are STRICTLY MANDATORY / SHOULD-HAVE. Do NOT treat any skill as optional.
4. If the student lacks ANY of the target skills, it MUST be flagged as a skill gap in `missing_skills`.
5. For EVERY missing skill, recommend actionable learning resources (Coursera, YouTube, practice) and structured roadmap steps.
6. Severity:
   - critical   = core skill without which student CANNOT clear interview
   - important  = expected by interviewers, strong advantage
   - good_to_have = differentiator / secondary skill
7. Sort missing_skills: critical → important → good_to_have.
8. MAXIMUM 4 missing skills — pick the most impactful ones.
9. estimated_days_to_learn must be realistic for a college student studying 1-2 hours/day.
10. overall_summary must address the student by their first name.
11. match_percentage = (# required_skills semantically satisfied / total required_skills) * 100, rounded.
"""

# ── Groq models with tool-calling support (in preference order) ──────────────
# Live models verified Oct 2026 via GET https://api.groq.com/openai/v1/models
GROQ_TOOL_MODELS = [
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
]

# Live Gemini models verified Oct 2026 via ListModels API
GEMINI_MODELS = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.6-flash"]


def _extract_groq_tool_result(data: dict) -> dict:
    """Extract and parse the tool call arguments from a Groq API response."""
    try:
        tool_calls = data["choices"][0]["message"].get("tool_calls")
        if not tool_calls:
            raise ValueError("No tool_calls found in Groq response.")
        args_str = tool_calls[0]["function"]["arguments"]
        result = json.loads(args_str)
        # Enforce max 4 missing skills (Groq does not enforce JSON Schema maxItems)
        result["missing_skills"] = result.get("missing_skills", [])[:4]
        return result
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raise ValueError(f"Failed to extract Groq tool result: {e}") from e


def _extract_gemini_tool_result(data: dict) -> dict:
    """Extract the function call arguments from a Gemini API response."""
    try:
        parts = data["candidates"][0]["content"]["parts"]
        for part in parts:
            if "functionCall" in part:
                result = part["functionCall"]["args"]
                result["missing_skills"] = result.get("missing_skills", [])[:4]
                return result
        raise ValueError("No functionCall found in Gemini response parts.")
    except (KeyError, IndexError) as e:
        raise ValueError(f"Failed to extract Gemini tool result: {e}") from e


def _safe_log(msg: str):
    try:
        print(msg)
    except Exception:
        try:
            print(msg.encode("ascii", errors="replace").decode("ascii"))
        except Exception:
            pass


@router.post("/")
async def analyze_skill_gap(request: AnalysisRequest):
    # ── 1. Check in-memory / response cache ─────────────────────────────────
    cache_seed = f"{sorted(request.student.skills)}_{request.target.name}_{request.target.type}"
    cache_key = f"skill_gap:{hashlib.md5(cache_seed.encode()).hexdigest()}"
    hit, cached_result = cache.get(cache_key)
    if hit and cached_result:
        _safe_log(f"[CACHE] Skill Analysis: Cache hit for {request.target.name} ({request.student.name})")
        return cached_result

    groq_api_key = os.getenv("GROQ_API_KEY")
    google_api_key = os.getenv("GOOGLE_API_KEY")

    if not groq_api_key and not google_api_key:
        raise HTTPException(
            status_code=500,
            detail="Neither GROQ_API_KEY nor GOOGLE_API_KEY is set in backend environment."
        )

    # ── Fetch interview experience context from MongoDB (RAG) ────────────────
    db = get_database()
    interview_context = ""
    if db is not None:
        try:
            experiences = await db['interview_experience'].find(
                {"company_name": {"$regex": request.target.name, "$options": "i"}}
            ).sort("date", -1).to_list(3)

            if experiences:
                interview_context = "\n\n=== RECENT INTERVIEW EXPERIENCES FOR THIS COMPANY ===\n"
                for exp in experiences:
                    interview_context += f"Role: {exp.get('role', 'N/A')}\n"
                    interview_context += f"Rounds: {exp.get('rounds', 'N/A')}\n"
                    interview_context += f"Experience: {exp.get('experience', '')[:400]}...\n"
                    interview_context += f"Suggestions: {exp.get('suggestions', '')[:200]}\n"
                    interview_context += "-" * 30 + "\n"
                interview_context += (
                    "Use these interview experiences to tailor the skill gap analysis and roadmap "
                    "to reflect the actual interview process of this company where applicable.\n"
                )
        except Exception as e:
            print(f"Failed to fetch interview experience: {e}")

    # ── Merge all skills strictly as required / should-have ──────────────────
    all_target_skills = list(dict.fromkeys(request.target.required_skills + (request.target.good_to_have_skills or [])))
    request.target.required_skills = all_target_skills
    request.target.good_to_have_skills = []

    user_message = (
        f"{ANALYSIS_INSTRUCTIONS}"
        f"{interview_context}"
        f"\n\n=== TARGET REQUIREMENTS (ALL MANDATORY / SHOULD-HAVE) ===\n"
        f"{json.dumps(all_target_skills, indent=2)}"
        f"\n\n=== STUDENT PROFILE ===\n"
        f"{request.model_dump_json(indent=2)}"
    )

    async with httpx.AsyncClient() as client:
        error_details: list[str] = []
        result_json = None

        # ── Groq: Tool Calling with model cascade ────────────────────────────
        if groq_api_key:
            groq_url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            }

            for model_name in GROQ_TOOL_MODELS:
                if result_json is not None:
                    break

                payload = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": user_message}],
                    "tools": [GROQ_TOOL],
                    "tool_choice": GROQ_TOOL_CHOICE,
                    "max_tokens": 4096,
                    "temperature": 0.3,
                }

                for attempt in range(2):
                    try:
                        response = await client.post(
                            groq_url, headers=headers, json=payload, timeout=60.0
                        )
                        if response.status_code == 429:
                            _safe_log(f"[WARN] Groq 429 Rate Limit on '{model_name}'. Waiting 2s...")
                            error_details.append(f"Groq ({model_name}) 429 Rate Limit")
                            await asyncio.sleep(2.0)
                            continue
                        if response.status_code == 503:
                            _safe_log(f"[WARN] Groq 503 Overload on '{model_name}'. Waiting 3s...")
                            error_details.append(f"Groq ({model_name}) 503 Overload")
                            await asyncio.sleep(3.0)
                            continue

                        response.raise_for_status()
                        result_json = _extract_groq_tool_result(response.json())
                        _safe_log(f"[OK] Skill Analysis: Groq tool call ({model_name}) succeeded.")
                        break

                    except Exception as e:
                        err_msg = (
                            f"HTTP {e.response.status_code}: {e.response.text}"
                            if isinstance(e, httpx.HTTPStatusError)
                            else f"Error: {repr(e)}"
                        )
                        _safe_log(f"Groq API Error ({model_name}): {err_msg}")
                        error_details.append(f"Groq ({model_name}): {err_msg}")
                        break

        # ── Gemini: Function Calling with model cascade ──────────────────────
        if result_json is None and google_api_key:
            for g_model in GEMINI_MODELS:
                if result_json is not None:
                    break

                gemini_url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{g_model}:generateContent?key={google_api_key}"
                )
                payload = {
                    "contents": [
                        {"parts": [{"text": user_message}]}
                    ],
                    "tools": [
                        {"function_declarations": [GEMINI_FUNCTION_DECLARATION]}
                    ],
                    "tool_config": {
                        "function_calling_config": {
                            "mode": "ANY",
                            "allowed_function_names": ["generate_skill_gap_analysis"]
                        }
                    },
                    "generationConfig": {
                        "temperature": 0.3,
                        "topP": 0.8,
                    }
                }

                try:
                    response = await client.post(gemini_url, json=payload, timeout=60.0)
                    if response.status_code == 429:
                        _safe_log(f"[WARN] Gemini 429 Rate Limit on '{g_model}'. Waiting 2s...")
                        error_details.append(f"Gemini ({g_model}) 429 Rate Limit")
                        await asyncio.sleep(2.0)
                        continue
                    if response.status_code == 503:
                        _safe_log(f"[WARN] Gemini 503 Overload on '{g_model}'. Waiting 3s and retrying...")
                        error_details.append(f"Gemini ({g_model}) 503 Overload")
                        await asyncio.sleep(3.0)
                        # Retry this same model once on 503
                        try:
                            response = await client.post(gemini_url, json=payload, timeout=60.0)
                            response.raise_for_status()
                        except Exception:
                            continue  # 503 retry also failed, move to next model

                    response.raise_for_status()
                    result_json = _extract_gemini_tool_result(response.json())
                    _safe_log(f"[OK] Skill Analysis: Gemini function call ({g_model}) succeeded.")

                except Exception as e:
                    err_msg = (
                        f"HTTP {e.response.status_code}: {e.response.text}"
                        if isinstance(e, httpx.HTTPStatusError)
                        else f"Error: {repr(e)}"
                    )
                    _safe_log(f"Gemini API Error ({g_model}): {err_msg}")
                    error_details.append(f"Gemini ({g_model}): {err_msg}")

        # ── 3. Deterministic Fallback if All LLMs Fail ────────────────────────
        if result_json is None:
            _safe_log(f"[WARN] All LLM providers failed ({' | '.join(error_details)}). Falling back to deterministic NLP engine.")
            student_skills = request.student.skills
            required_skills = request.target.required_skills
            match_pct = ml_service.calculate_skill_match(student_skills, required_skills)
            
            missing_list = []
            matched_list = []
            for req in required_skills:
                req_clean = req.lower().strip()
                if any(req_clean in s.lower() or s.lower() in req_clean for s in student_skills):
                    matched_list.append(req)
                else:
                    missing_list.append(req)

            missing_skill_details = []
            for idx, sk in enumerate(missing_list[:4]):
                top_courses = coursera_service.search_courses(sk, limit=2)
                missing_skill_details.append({
                    "skill": sk,
                    "severity": "critical" if idx == 0 else "important",
                    "why_needed": f"Crucial requirement for technical interviews and screening at {request.target.name}.",
                    "estimated_days_to_learn": 14,
                    "roadmap": [
                        f"Master fundamental concepts and syntax of {sk}",
                        f"Implement hands-on placement mini-projects utilizing {sk}",
                        f"Solve curated company interview question patterns for {sk}"
                    ],
                    "resources": {
                        "youtube": [
                            {
                                "title": f"Complete {sk} Placement Crash Course",
                                "channel": "FreeCodeCamp / Striver",
                                "search_query": f"{sk} tutorial full course",
                                "type": "playlist"
                            }
                        ],
                        "courses": top_courses,
                        "practice": [
                            {
                                "platform": "LeetCode",
                                "suggestion": f"Practice top interview problems for {sk}",
                                "url": f"https://leetcode.com/problemset/?search={urllib.parse.quote_plus(sk)}"
                            }
                        ]
                    }
                })

            first_name = request.student.name.split()[0] if request.student.name else "Student"
            result_json = {
                "match_percentage": match_pct,
                "matched_skills": matched_list,
                "missing_skills": missing_skill_details,
                "overall_summary": f"Hi {first_name}, you have a strong base with {len(matched_list)} matched skills for {request.target.name}. Focus on closing the {len(missing_skill_details)} highlighted skill gaps to be fully placement-ready.",
                "priority_skill_to_learn_first": missing_list[0] if missing_list else "Mock Interviews & System Design",
                "estimated_total_preparation_days": max(14, len(missing_skill_details) * 12),
                "placement_readiness_message": f"Solid profile ({match_pct}% match)! Follow the targeted roadmap below to ace the {request.target.name} evaluation process."
            }

        # ── 4. Enrich & Guarantee 100% Verified Coursera Links from CSVs ──────
        for ms in result_json.get("missing_skills", []):
            skill_name = ms.get("skill", "")
            verified_coursera_courses = coursera_service.search_courses(skill_name, limit=2)
            
            if "resources" not in ms or not isinstance(ms["resources"], dict):
                ms["resources"] = {}
                
            existing_courses = ms["resources"].get("courses", [])
            # Retain non-Coursera courses (like GeeksForGeeks or NPTEL)
            other_courses = [c for c in existing_courses if isinstance(c, dict) and c.get("platform", "").lower() != "coursera"]
            
            # Place verified Coursera courses at the top
            ms["resources"]["courses"] = verified_coursera_courses + other_courses

        # ── 5. Ground match_percentage mathematically ─────────────────────────
        calc_match = ml_service.calculate_skill_match(request.student.skills, request.target.required_skills)
        if calc_match is not None:
            result_json["match_percentage"] = calc_match

        # ── 6. Cache for 24 hours ─────────────────────────────────────────────
        cache.set(cache_key, result_json, ttl=86400, namespace="skill_gap")
        return result_json


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
        # Get all required skills from all roles of the company
        all_req_skills = []
        for role in company.get('roles_offered', []):
            all_req_skills.extend(role.get('must_have_skills', []))
            all_req_skills.extend(role.get('good_to_have_skills', []))
        
        # Unique skills
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
    
    # Sort and return top 6
    top_6 = sorted(matches, key=lambda x: x['match_percentage'], reverse=True)[:6]
    return top_6
