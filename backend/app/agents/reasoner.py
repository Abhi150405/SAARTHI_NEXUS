"""
reasoner.py
-----------
Reasoner Agent — the core answer-generation step.

Role:
  - Takes the user query AND any retrieved DB context
  - Generates a factually-grounded plain-text answer
  - Used in the chatbot pipeline instead of calling Gemini directly

The Reasoner is ALWAYS routed through llm_router so local LLM is preferred.
"""

import logging
from typing import Optional

from app.llm.llm_router import generate_response

_SYSTEM_PROMPT = """\
You are Saarthi, the Official AI Placement Assistant for PICT (Pune Institute of Computer Technology).
Your goal is to provide accurate, helpful answers about PICT placements.

--- DATABASE CONTEXT ---
{context}
--- END CONTEXT ---

RULES:
1. If the DATABASE CONTEXT contains relevant PICT-specific stats (salary, company names, hiring numbers), quote them EXACTLY.
2. If a company is not in the context, DO NOT mention it. NEVER invent or guess PICT-specific companies or numbers.
3. For general advice, do not reference specific companies (like Wipro, HCL) as examples if they are not in the database.
4. Keep the answer concise (under 200 words) and professional.
5. Use bullet points for lists. Bold important numbers and company names using HTML <b> tags.

User question: {query}

Provide your answer:
"""


async def reason(query: str, context: str = "") -> str:
    """
    Generate a grounded answer for the user query using available context.

    Args:
        query:   The original user question.
        context: Pre-fetched DB records as a formatted string (or "").

    Returns:
        A plain-text / light-HTML answer string.
    """
    prompt = _SYSTEM_PROMPT.format(
        context=context or "No specific database records found for this query.",
        query=query,
    )
    try:
        answer = await generate_response(prompt)
        return answer or "I was unable to generate an answer. Please try again."
    except Exception as e:
        logging.error(f"Reasoner agent error: {e}")
        return "I encountered an error while reasoning about your query."
