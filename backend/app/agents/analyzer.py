"""
analyzer.py
-----------
Analyzer Agent — first step in every pipeline.

Responsibilities:
  - Extract the user's INTENT from the query
  - Identify KEY ENTITIES (companies, years, skills)
  - Decide whether DB context is needed

Strategy: Rule-based (regex + keyword matching) — NO LLM call.
Reasons:
  - Small local models (llama3.2:1b) can't reliably produce structured JSON
    from schema-style prompts — they echo the template back literally.
  - Rule-based is faster, deterministic, and uses 0 tokens.
  - Saves both LLM call slots for the actual answer generation.

Output dict:
{
  "intent":        "placement_stats" | "career_advice" | "resume_help" | "general",
  "entities": {
      "companies": [...],
      "years":     [...],
      "skills":    [...],
      "topics":    [...]
  },
  "needs_context": True | False
}
"""

import re
import logging
from typing import Any, Dict

# ── Keyword maps ──────────────────────────────────────────────────────────────

_PLACEMENT_KEYWORDS = [
    "salary", "lpa", "placed", "placement", "package", "hired",
    "selections", "offer", "recruit", "campus", "ctc", "company",
    "companies", "which companies", "how many", "stats", "data",
    "record", "year", "batch", "highest", "average", "median",
]

_CAREER_KEYWORDS = [
    "interview", "tips", "prepare", "resume", "career", "job",
    "soft skills", "communication", "aptitude", "coding", "advice",
    "how to", "suggest", "guidance", "internship", "experience",
    "profile", "linkedin", "portfolio", "roadmap",
]

_RESUME_KEYWORDS = [
    "resume", "cv", "ats", "improve resume", "resume tips",
    "resume format", "resume help", "check my resume",
]

# Known companies in PICT placement data (lower-case for matching)
_KNOWN_COMPANIES = list(set([
    "amazon", "adobe", "phonepe", "tcs", "infosys", "cognizant", "accenture",
    "capgemini", "microsoft", "oracle", "palo alto", "persistent", "zensar",
    "bloomberg", "ittiam", "arista networks", "deloitte", "ibm", "barclays",
    "uptiq", "goldman sachs", "jp morgan", "hsbc", "dell technologies",
    "bny mellon", "druva", "alpha sense", "deutsche bank", "pubmatic",
    "ion group", "cadence", "qualcomm", "bmc software", "eq technologies",
    "zs associates", "mastercard", "nvidia", "google", "uber", "atlassian",
]))

_YEAR_PATTERN = re.compile(
    r"\b(?:20)?(\d{2})[- /](\d{2})\b"          # 23-24 or 2023-24
    r"|"
    r"\b(20\d{2})\b"                            # 2024
)

_SKILL_KEYWORDS = [
    "python", "java", "c\+\+", "react", "node", "sql", "ml",
    "machine learning", "deep learning", "data science", "aws",
    "azure", "docker", "kubernetes", "flutter", "django", "fastapi",
]

_INTERVIEW_KEYWORDS = [
    "interview", "experience", "rounds", "questions asked", "asked in interview",
    "process", "technical round", "hr round",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_companies(text: str) -> list:
    lower = text.lower()
    matched = []
    for c in _KNOWN_COMPANIES:
        if re.search(rf"\b{re.escape(c)}\b", lower):
            matched.append(c)
    return matched


def _has_keyword(text: str, keywords: list) -> bool:
    return any(re.search(rf"\b{re.escape(k)}\b", text) for k in keywords)


def _detect_intent(text: str, companies: list = None, years: list = None) -> str:
    lower = text.lower()
    # Check resume first
    if _has_keyword(lower, _RESUME_KEYWORDS):
        return "resume_help"
    # Interview experiences
    if _has_keyword(lower, _INTERVIEW_KEYWORDS):
        return "interview_experience"
    # Placement stats if company/year/salary/stats mentioned
    if _has_keyword(lower, _PLACEMENT_KEYWORDS) or bool(companies) or bool(years):
        return "placement_stats"
    # Career advice
    if _has_keyword(lower, _CAREER_KEYWORDS):
        return "career_advice"
    return "general"


def _extract_years(text: str) -> list:
    matches = _YEAR_PATTERN.findall(text)
    years = []
    for m in matches:
        if m[0] and m[1]:          # e.g. 23-24
            years.append(f"{m[0]}-{m[1]}")
        elif m[2]:                  # e.g. 2024
            yr = m[2][2:]          # → "24"
            years.append(f"{int(yr)-1}-{yr}")
    return list(set(years))


def _extract_skills(text: str) -> list:
    lower = text.lower()
    found = []
    for sk in _SKILL_KEYWORDS:
        if re.search(rf"\b{sk}\b", lower):
            found.append(sk.replace("\\", ""))
    return found


# ── Public interface ──────────────────────────────────────────────────────────

_FALLBACK: Dict[str, Any] = {
    "intent": "general",
    "entities": {"companies": [], "years": [], "skills": [], "topics": []},
    "needs_context": False,
}


async def analyze(query: str) -> Dict[str, Any]:
    """
    Rule-based intent and entity extraction. No LLM call — instant and reliable.

    Returns a structured dict describing intent and entities.
    """
    if not query or not query.strip():
        return _FALLBACK.copy()

    try:
        companies = _extract_companies(query)
        years     = _extract_years(query)
        skills    = _extract_skills(query)
        intent    = _detect_intent(query, companies, years)

        # DB context is useful when asking about placement stats, interview experiences, or specific entities
        needs_context = intent in ("placement_stats", "interview_experience") or bool(companies) or bool(years)

        result = {
            "intent": intent,
            "entities": {
                "companies": companies,
                "years":     years,
                "skills":    skills,
                "topics":    [],
            },
            "needs_context": needs_context,
        }
        logging.info(
            f"Analyzer: intent={intent}  companies={companies}  "
            f"years={years}  needs_context={needs_context}"
        )
        return result

    except Exception as e:
        logging.error(f"Analyzer error: {e}")
        return _FALLBACK.copy()

