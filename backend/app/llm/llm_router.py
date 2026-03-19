"""
llm_router.py
-------------
Decides WHICH LLM to call for a given prompt:

  1. Try Ollama (local, free, fast when warm)
  2. Evaluate confidence of the response
  3. If confidence < threshold → fall back to Gemini API

Public API
----------
  generate_response(prompt)      → str   (non-streaming, for agents)
  generate_response_stream(prompt) → AsyncGenerator  (streaming, for chatbot)
"""

import logging
from typing import Optional, AsyncGenerator

from app.llm.local_llm  import generate_local, is_ollama_available
from app.llm.api_llm    import gemini_llm
from app.agents.confidence import evaluate_confidence

CONFIDENCE_THRESHOLD = 0.7      # Below this → fall back to Gemini


async def generate_response(prompt: str) -> str:
    """
    Non-streaming router used by all agents.
    Tries local LLM first; falls back to Gemini when needed.
    Max 2 LLM calls per request.
    """
    # ── Step 1: try Ollama ──────────────────────────────────────────────
    if await is_ollama_available():
        local_resp = await generate_local(prompt)
        if local_resp:
            score = evaluate_confidence(local_resp)
            if score >= CONFIDENCE_THRESHOLD:
                logging.info(f"🦙 [LOCAL / Ollama] replied  (confidence={score:.2f})")
                return local_resp
            logging.info(f"⚠️  Local confidence too low ({score:.2f}) — falling back to Gemini.")
        else:
            logging.info("⚠️  Ollama returned empty — falling back to Gemini.")
    else:
        logging.info("☁️  Ollama unavailable — using Gemini directly.")

    # ── Step 2: Gemini fallback ─────────────────────────────────────────
    gemini_resp = await gemini_llm.generate(prompt)
    if gemini_resp:
        logging.info("☁️  [GEMINI / Fallback] replied")
        return gemini_resp

    return "I was unable to generate a response at this time. Please try again."


async def generate_response_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Streaming router used by the chatbot endpoint.
    Prepends a hidden [SOURCE:ollama] or [SOURCE:gemini] marker as the
    very first chunk so the frontend can show a badge without changing
    the API contract.
    """
    local_answer: Optional[str] = None

    if await is_ollama_available():
        local_answer = await generate_local(prompt)
        if local_answer:
            score = evaluate_confidence(local_answer)
            if score >= CONFIDENCE_THRESHOLD:
                logging.info(f"🦙 [LOCAL / Ollama] streaming reply  (confidence={score:.2f})")
                yield "[SOURCE:ollama]"          # ← hidden marker, stripped by frontend
                for word in local_answer.split(" "):
                    yield word + " "
                return
            logging.info(f"⚠️  Local confidence too low ({score:.2f}) — streaming from Gemini.")

    # Fall back to Gemini streaming
    logging.info("☁️  [GEMINI / Fallback] streaming reply")
    yield "[SOURCE:gemini]"                      # ← hidden marker, stripped by frontend
    async for chunk in gemini_llm.generate_stream(prompt):
        yield chunk


