from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.ml_service import ml_service
import httpx
import os
import json
import re

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
"""

@router.post("/")
async def analyze_skill_gap(request: AnalysisRequest):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY is not set in backend environment.")

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    input_text = f"{SYSTEM_PROMPT}\n\n=== STUDENT INPUT ===\n{request.model_dump_json(indent=2)}"

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

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(gemini_url, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            
            # ── Robust JSON parsing with cleanup ──
            def clean_json(text: str) -> str:
                """Fix common Gemini JSON issues."""
                # Strip markdown code fences
                text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
                text = re.sub(r'```\s*$', '', text, flags=re.MULTILINE)
                text = text.strip()
                # Remove trailing commas before } or ]
                text = re.sub(r',\s*([\]}])', r'\1', text)
                # Remove single-line // comments
                text = re.sub(r'//[^\n]*', '', text)
                return text

            result_json = None
            parse_errors = []

            # Attempt 1: direct parse
            try:
                result_json = json.loads(raw_text, strict=False)
            except json.JSONDecodeError as e1:
                parse_errors.append(f"Direct parse: {e1}")

            # Attempt 2: clean then parse
            if result_json is None:
                try:
                    cleaned = clean_json(raw_text)
                    result_json = json.loads(cleaned, strict=False)
                except json.JSONDecodeError as e2:
                    parse_errors.append(f"Cleaned parse: {e2}")

            # Attempt 3: extract first { ... } block, clean, parse
            if result_json is None:
                json_match = re.search(r'\{[\s\S]*\}', raw_text)
                if json_match:
                    try:
                        extracted = clean_json(json_match.group(0))
                        result_json = json.loads(extracted, strict=False)
                    except json.JSONDecodeError as e3:
                        parse_errors.append(f"Extracted parse: {e3}")

            if result_json is None:
                raise ValueError(
                    f"Failed to parse Gemini JSON after 3 attempts. "
                    f"Errors: {'; '.join(parse_errors)}. "
                    f"Raw (first 500 chars): {raw_text[:500]}"
                )
                    
            return result_json
            
        except httpx.HTTPError as e:
            error_details = e.response.text if getattr(e, "response", None) else str(e)
            raise HTTPException(status_code=502, detail=f"Gemini API Error: {error_details}")
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
