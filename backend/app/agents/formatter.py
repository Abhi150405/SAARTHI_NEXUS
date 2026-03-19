"""
formatter.py
------------
Formatter Agent — last step of every pipeline.

Role:
  - Takes raw LLM output and wraps it into a clean, consistent JSON structure
  - Used by the RESUME pipeline (structured JSON output)
  - The chatbot pipeline uses a lightweight text-only variant

For the resume pipeline the expected output schema is:
{
  "skills":         [...],
  "missing_skills": [...],
  "improvements":   [...],
  "ats_score":      <int 0-100>,
  "summary":        "...",
  "education":      "...",
  "experience_years": <number>,
  "key_achievements": [...]
}
"""

import json
import logging
import re
from typing import Any, Dict, Optional


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Pull the first JSON object out of an LLM response string."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            logging.warning(f"Formatter: JSON parse failed on: {text[:200]}")
    return None


def format_resume_output(
    skill_extraction: Dict[str, Any],
    ats_evaluation:  Dict[str, Any],
    suggestions:     Dict[str, Any],
) -> Dict[str, Any]:
    """
    Merges outputs from the three resume sub-agents into one clean response.
    Provides default values for any missing keys so the frontend never breaks.
    """
    return {
        # From skill extraction
        "skills":           skill_extraction.get("skills", []),
        "summary":          skill_extraction.get("summary", ""),
        "education":        skill_extraction.get("education", ""),
        "experience_years": skill_extraction.get("experience_years", 0),
        "key_achievements": skill_extraction.get("key_achievements", []),
        # From ATS evaluation
        "ats_score":        ats_evaluation.get("ats_score", 0),
        "missing_skills":   ats_evaluation.get("missing_skills", []),
        # From suggestions
        "improvements":     suggestions.get("improvements", []),
    }


def format_chat_output(raw_text: str) -> str:
    """
    Lightweight formatter for chatbot answers.
    Currently a pass-through with basic cleanup; extend here if needed.
    """
    if not raw_text:
        return "I'm sorry, I couldn't generate a response."
    # Strip leading/trailing whitespace; collapse multiple blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", raw_text.strip())
    return cleaned
