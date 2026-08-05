from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.ml_service import ml_service
import httpx
import os
import json
import re
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

class AnalysisRequest(BaseModel):
    student: StudentData
    target: TargetData

class MatchPercentageRequest(BaseModel):
    student_skills: List[str]
    required_skills: List[str]

SYSTEM_PROMPT = """
You are SkillSaarthi — an expert career counselor and placement intelligence engine 
for PICT (Pune Institute of Computer Technology) students.

Your job is to:
1. Analyze a student's current skillset
2. Compare it against the required skills for a target job role or company
3. Identify skill gaps with severity scoring
4. For EACH missing skill, generate a concrete, actionable learning plan

=== INPUT FORMAT ===
You will receive a JSON object:
{
  "student": {
    "name": "<student name>",
    "branch": "<CE | IT | E&TC | AI&DS>",
    "cgpa": <float>,
    "skills": ["<skill1>", "<skill2>", ...]
  },
  "target": {
    "type": "<role | company>",
    "name": "<e.g. 'Software Engineer' or 'Goldman Sachs'>",
    "required_skills": ["<skill1>", "<skill2>", ...]
  }
}

=== YOUR TASK ===
Perform skill gap analysis and return a structured JSON response (no markdown, 
no preamble, no explanation — pure JSON only).

=== OUTPUT FORMAT ===
Return EXACTLY this JSON structure:

{
  "match_percentage": <integer 0-100>,
  "matched_skills": ["<skill>", ...],
  "missing_skills": [
    {
      "skill": "<exact skill name>",
      "severity": "<critical | important | good_to_have>",
      "why_needed": "<1 sentence: why this skill matters for the target role/company>",
      "estimated_days_to_learn": <integer>,
      "roadmap": [
        "<Step 1: brief actionable step>",
        "<Step 2: ...>",
        "<Step 3: ...>"
      ],
      "resources": {
        "youtube": [
          {
            "title": "<video/playlist title>",
            "channel": "<channel name>",
            "search_query": "<exact YouTube search string to find this video>",
            "type": "<video | playlist | course>"
          }
        ],
        "courses": [
          {
            "title": "<course name>",
            "platform": "<Udemy | Coursera | freeCodeCamp | GeeksForGeeks | NPTEL | LeetCode>",
            "url": "<direct URL if well-known, else null>",
            "is_free": <true | false>
          }
        ],
        "practice": [
          {
            "platform": "<LeetCode | HackerRank | CodeChef | Kaggle | GitHub>",
            "suggestion": "<specific what to practice, e.g. 'Solve 20 medium DP problems on LeetCode'>",
            "url": "<direct URL if applicable>"
          }
        ]
      }
    }
  ],
  "overall_summary": "<2-3 sentences personalized to the student's name, branch, and target>",
  "priority_skill_to_learn_first": "<single skill name — the one that gives most placement leverage>",
  "estimated_total_preparation_days": <integer>,
  "placement_readiness_message": "<Encouraging, honest, concise message in 1 sentence — always in English. Do not be overly optimistic or harsh.>"
}

=== STRICT RULES ===
1. Return ONLY valid JSON. No markdown fences. No explanation text. No comments.
2. Use semantic reasoning for matching — if a student has "React.js" and the requirement is "React", count it as a matched skill. Do not be restricted to literal string equality.
3. For YouTube resources: provide the most popular, well-known channels for that skill 
   (e.g., Traversy Media for web dev, Striver for DSA, StatQuest for ML). 
   The search_query must be specific enough to find a real video.
4. Severity scoring:
   - critical = core technical skill without which student CANNOT clear interview
   - important = expected by most interviewers, strong advantage
   - good_to_have = differentiator, not blocking
5. Sort missing_skills by severity: critical first, then important, then good_to_have.
6. estimated_days_to_learn must be realistic for a college student (1-2 hours/day).
7. For Indian students: prefer NPTEL, GeeksForGeeks, and free resources where possible.
8. roadmap must have exactly 3 steps minimum, max 5 steps. Each step is one actionable line.
9. The match_percentage formula: 
   (count of student skills that semantically satisfy required_skills / total required_skills) * 100
   Round to nearest integer. Use your reasoning to identify synonyms (e.g. DSA = Data Structures) and related terminology.
10. overall_summary must address the student by their first name.
11. Very Important: You MUST LIMIT the missing_skills array to a MAXIMUM of 4 most critical skills. Do not output more than 4 missing skills.
12. EXPLICIT MATCHING RULE: SQL, MySQL, PostgreSQL, Oracle, DBMS, RDBMS, and Database Management System are fully equivalent. If a student has any of these, consider all others matched.
"""

@router.post("/")
async def analyze_skill_gap(request: AnalysisRequest):
    groq_api_key = os.getenv("GROQ_API_KEY")
    google_api_key = os.getenv("GOOGLE_API_KEY")

    if not groq_api_key and not google_api_key:
        raise HTTPException(status_code=500, detail="Neither GROQ_API_KEY nor GOOGLE_API_KEY is set in backend environment.")

    # --- Fetch Interview Experiences ---
    db = get_database()
    interview_context = ""
    if db is not None:
        try:
            company_target = request.target.name
            # Basic search for matching company name (case-insensitive)
            experiences = await db['interview_experience'].find({"company_name": {"$regex": company_target, "$options": "i"}}).sort("date", -1).to_list(3)
            
            if experiences:
                interview_context = "\n\n=== RECENT INTERVIEW EXPERIENCES FOR THIS COMPANY ===\n"
                for exp in experiences:
                    interview_context += f"Role: {exp.get('role', 'N/A')}\n"
                    interview_context += f"Rounds: {exp.get('rounds', 'N/A')}\n"
                    interview_context += f"Experience: {exp.get('experience', '')[:400]}...\n"
                    interview_context += f"Suggestions: {exp.get('suggestions', '')[:200]}\n"
                    interview_context += "-" * 30 + "\n"
                interview_context += "Use these interview experiences to tailor the skill gap analysis and roadmap to reflect the actual interview process of this company if applicable.\n"
        except Exception as e:
            print(f"Failed to fetch interview experience: {e}")

    input_text = f"{SYSTEM_PROMPT}{interview_context}\n\n=== STUDENT INPUT ===\n{request.model_dump_json(indent=2)}"

    async with httpx.AsyncClient() as client:
        try:
            error_details = []
            result_json = None

            def parse_llm_json(text: str):
                """Helper to cleanly parse JSON or throw ValueError."""
                def clean_json(t: str) -> str:
                    t = re.sub(r'^```(?:json)?\s*', '', t, flags=re.MULTILINE)
                    t = re.sub(r'```\s*$', '', t, flags=re.MULTILINE)
                    t = t.strip()
                    t = re.sub(r',\s*([\]}])', r'\1', t)
                    t = re.sub(r'//[^\n]*', '', t)
                    return t

                parse_errors = []
                try:
                    return json.loads(text, strict=False)
                except json.JSONDecodeError as e1:
                    parse_errors.append(f"Direct parse: {e1}")

                try:
                    return json.loads(clean_json(text), strict=False)
                except json.JSONDecodeError as e2:
                    parse_errors.append(f"Cleaned parse: {e2}")

                json_match = re.search(r'\{[\s\S]*\}', text)
                if json_match:
                    try:
                        return json.loads(clean_json(json_match.group(0)), strict=False)
                    except json.JSONDecodeError as e3:
                        parse_errors.append(f"Extracted parse: {e3}")

                raise ValueError(
                    f"Failed to parse LLM JSON after 3 attempts. "
                    f"Errors: {'; '.join(parse_errors)}. "
                    f"Raw (first 500 chars): {text[:500]}"
                )

            # --- Groq (Primary for Skill Analysis) ---
            if groq_api_key:
                groq_url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": input_text}],
                    "max_tokens": 4096,
                    "temperature": 0.3,
                    "top_p": 0.8
                }
                try:
                    response = await client.post(groq_url, headers=headers, json=payload, timeout=60.0)
                    response.raise_for_status()
                    data = response.json()
                    raw_text = data["choices"][0]["message"]["content"]
                    result_json = parse_llm_json(raw_text)
                    print("✅ Skill Analysis: Groq API responded successfully")
                except Exception as e:
                    err_msg = ""
                    if isinstance(e, httpx.HTTPError):
                        if getattr(e, "response", None) is not None and e.response.text:
                            err_msg = f"HTTP {e.response.status_code}: {e.response.text}"
                        else:
                            err_msg = f"Network Error: {repr(e)}"
                    else:
                        err_msg = f"Error: {repr(e)}"
                    print(f"Groq API Error or Parse Error: {err_msg}")
                    error_details.append(f"Groq Error: {err_msg}")

            # --- Gemini Fallback attempt ---
            if result_json is None and google_api_key:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={google_api_key}"
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {"text": input_text}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                        "topP": 0.8,
                        "maxOutputTokens": 8192,
                        "responseMimeType": "application/json"
                    }
                }
                try:
                    response = await client.post(gemini_url, json=payload, timeout=60.0)
                    response.raise_for_status()
                    data = response.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    result_json = parse_llm_json(raw_text)
                    print("✅ Skill Analysis: Gemini fallback responded successfully")
                except Exception as e:
                    err_msg = ""
                    if isinstance(e, httpx.HTTPError):
                        if getattr(e, "response", None) is not None and e.response.text:
                            err_msg = f"HTTP {e.response.status_code}: {e.response.text}"
                        else:
                            err_msg = f"Network Error: {repr(e)}"
                    else:
                        err_msg = f"Error: {repr(e)}"
                    print(f"Gemini API Error or Parse Error: {err_msg}")
                    error_details.append(f"Gemini Error: {err_msg}")

            if result_json is None:
                raise HTTPException(status_code=502, detail=f"LLM API Errors: {' | '.join(error_details)}")

            return result_json
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

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
