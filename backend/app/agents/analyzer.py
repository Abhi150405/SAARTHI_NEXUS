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
_KNOWN_COMPANIES = [
    "amazon","adobe","phonepe", "tcs", "infosys", "cognizant", "accenture",
    "capgemini", "amazon", "microsoft", "oracle",
    "palo alto", "persistent", "zensar", "bloomberg", "zensar",
    "ittiam", "arista networks", "deloitte", "ibm", "barclays",
    "uptiq", "goldman sachs", "jp morgan", "hsbc",
    "dell technologies", "BNY Mellon", "Druva", "Alpha Sense", "Deutsche Bank",
    "Pubmatic", "Ion Group", "Cadence", "Qualcomm", "BMC Software",
    "eQ Technologies", "ZS Associates", "Mastercard",
]

_YEAR_PATTERN = re.compile(
    r"\b(?:20)?(\d{2})[- /](\d{2})\b"          # 23-24 or 2023-24
    r"|"
    r"\b(20\d{2})\b"                            # 2024
)

_SKILL_KEYWORDS = [
    "python", "java", r"c\+\+", "react", "node", "sql", "ml",
    "machine learning", "deep learning", "data science", "aws",
    "azure", "docker", "kubernetes", "flutter", "django", "fastapi",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _detect_intent(text: str) -> str:
    lower = text.lower()
    # Check resume first (subset of career)
    if any(k in lower for k in _RESUME_KEYWORDS):
        return "resume_help"
    # Placement stats if company/year/salary mentioned
    if any(k in lower for k in _PLACEMENT_KEYWORDS):
        return "placement_stats"
    # Career advice
    if any(k in lower for k in _CAREER_KEYWORDS):
        return "career_advice"
    return "general"


def _extract_companies(text: str) -> list:
    lower = text.lower()
    return [c for c in _KNOWN_COMPANIES if c in lower]


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
        intent    = _detect_intent(query)
        companies = _extract_companies(query)
        years     = _extract_years(query)
        skills    = _extract_skills(query)

        # DB context is useful only when asking about placements
        needs_context = intent == "placement_stats" or bool(companies) or bool(years)

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
