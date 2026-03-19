"""
resume_service.py  — reliable single-call approach
----------------------------------------------------
Uses ONE well-crafted Gemini call that extracts everything in one shot.
This is more reliable than chaining 3 separate calls (quota, latency, parse errors).

Output schema (backward-compatible + new fields):
{
  "skills":           [...],        ← specific tech skill names (NOT categories)
  "missing_skills":   [...],        ← important skills absent from resume
  "improvements":     [...],        ← 5 actionable suggestions
  "ats_score":        <int 0-100>,
  "summary":          "...",
  "education":        "...",
  "experience_years": <number>,     ← 0 for students with no work experience
  "key_achievements": [...]
}
"""

import io
import json
import logging
import re
import os
import asyncio
from typing import Any, Dict, Optional

import PyPDF2
import docx
from google import genai
from app.core.config import settings


# ── Prompt ────────────────────────────────────────────────────────────────────

_RESUME_PROMPT = """You are an expert resume parser and career coach. Analyze the resume below and return ONLY a valid JSON object with NO markdown fences, NO extra text before or after.

IMPORTANT RULES:
- "skills": List SPECIFIC technology names visible in the resume. Examples of GOOD values: "Python", "React.js", "TensorFlow", "MySQL", "Git", "REST APIs". BAD values: "Programming", "Web Development", "Core Skills". List ALL specific technologies you see.
- "missing_skills": List 5 specific high-demand tech skills NOT in the resume. Good examples: "Docker", "AWS", "Kubernetes", "System Design", "LangChain".
- "improvements": 5 short, specific, actionable suggestions to improve the resume.
- "ats_score": Integer from 0-100 rating how ATS-friendly this resume is.
- "summary": 2-sentence professional summary of the candidate.
- "education": Full degree + college name (e.g. "B.E. Electronics & Computer Engg, PICT Pune").
- "experience_years": Count ONLY full-time work experience. For students with no jobs, return 0. Study years do NOT count.
- "key_achievements": List 3-5 project names from resume, each as "Project Name: one-line description".

Return this exact JSON structure:
{
  "skills": ["list", "of", "specific", "skill", "names"],
  "missing_skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3", "improvement 4", "improvement 5"],
  "ats_score": 70,
  "summary": "...",
  "education": "...",
  "experience_years": 0,
  "key_achievements": ["Project: description", "..."]
}

Resume Text:
"""


class ResumeService:
    def __init__(self):
        self.client = None
        self.model_name = "gemini-flash-latest"
        self._init_gemini()

    def _init_gemini(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logging.warning("ResumeService: No Gemini API key set.")
            return
        try:
            import certifi
            os.environ['SSL_CERT_FILE'] = certifi.where()
            self.client = genai.Client(api_key=api_key)
            logging.info("ResumeService: Gemini client initialised.")
        except Exception as e:
            logging.error(f"ResumeService: Gemini init error → {e}")

    # ── File Parsing ──────────────────────────────────────────────────────────

    def extract_text(self, file_content: bytes, filename: str) -> str:
        """Extract plain text from PDF, DOCX, or TXT."""
        text = ""
        try:
            if filename.lower().endswith(".pdf"):
                reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                for page in reader.pages:
                    text += page.extract_text() or ""
            elif filename.lower().endswith(".docx"):
                document = docx.Document(io.BytesIO(file_content))
                for para in document.paragraphs:
                    text += para.text + "\n"
            else:
                text = file_content.decode("utf-8", errors="ignore")
        except Exception as e:
            logging.error(f"ResumeService.extract_text error: {e}")
        return text

    # ── JSON Parser ───────────────────────────────────────────────────────────

    def _parse_response(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from Gemini response, handling markdown fences."""
        if not text:
            logging.error("ResumeService: empty response from Gemini")
            return None

        logging.info(f"ResumeService: raw response ({len(text)} chars): {repr(text[:300])}")

        # Strip markdown code fences if present
        clean = re.sub(r"```(?:json)?\s*", "", text).strip()
        clean = re.sub(r"```", "", clean).strip()

        # Find JSON object
        match = re.search(r"\{.*\}", clean, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError as e:
                logging.error(f"ResumeService: JSON decode error: {e}\nText: {clean[:500]}")
                return None

        logging.error(f"ResumeService: No JSON object found in response:\n{clean[:500]}")
        return None

    # ── Main Analysis (single Gemini call) ────────────────────────────────────

    async def analyze_resume(self, text: str, max_retries: int = 2) -> Optional[Dict[str, Any]]:
        """
        Analyze resume text using a single detailed Gemini call.
        Retries on rate limit errors.
        """
        if not self.client:
            logging.error("ResumeService: Gemini client not initialised")
            return None

        if not text or not text.strip():
            logging.error("ResumeService: empty resume text")
            return None

        # Truncate to ~5000 chars to stay within token limits
        truncated_text = text[:5000]
        prompt = _RESUME_PROMPT + truncated_text

        for attempt in range(max_retries + 1):
            try:
                logging.info(f"ResumeService: calling Gemini (attempt {attempt + 1})…")

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config={
                        "temperature": 0.2,
                        "top_p": 0.95,
                        "max_output_tokens": 2048,
                    }
                )

                if not response or not response.text:
                    logging.warning(f"ResumeService: empty Gemini response on attempt {attempt + 1}")
                    if attempt < max_retries:
                        await asyncio.sleep(2)
                        continue
                    return None

                result = self._parse_response(response.text)
                if result:
                    # Ensure all required keys are present with defaults
                    result.setdefault("skills", [])
                    result.setdefault("missing_skills", [])
                    result.setdefault("improvements", [])
                    result.setdefault("ats_score", 60)
                    result.setdefault("summary", "")
                    result.setdefault("education", "")
                    result.setdefault("experience_years", 0)
                    result.setdefault("key_achievements", [])

                    logging.info(
                        f"ResumeService ✅ done — "
                        f"skills={len(result['skills'])}, "
                        f"ats={result['ats_score']}, "
                        f"exp={result['experience_years']} yrs"
                    )
                    return result

                if attempt < max_retries:
                    logging.warning(f"ResumeService: parse failed, retrying…")
                    await asyncio.sleep(2)

            except Exception as e:
                err = str(e).upper()
                logging.error(f"ResumeService: Gemini error (attempt {attempt + 1}): {e}")
                if ("RESOURCE_EXHAUSTED" in err or "429" in err) and attempt < max_retries:
                    wait = (attempt + 1) * 5
                    logging.warning(f"ResumeService: rate limited, retrying in {wait}s…")
                    await asyncio.sleep(wait)
                elif attempt >= max_retries:
                    raise

        return None


# Module-level singleton
resume_service = ResumeService()
