"""
llm_router.py
-------------
Decides WHICH LLM to call for a given prompt:

  1. Try Ollama (local, free, fast when warm) -> Used for background agent tasks.
  2. For Chatbot (Streaming): Uses Groq API (Llama 3.1) / Gemini API for accuracy 
     and strict context adherence.

Public API
----------
  generate_response(prompt)        → str   (non-streaming, for agents)
  generate_response_stream(prompt) → AsyncGenerator  (streaming, for chatbot)
"""

import logging
from typing import Optional, AsyncGenerator

from app.llm.local_llm  import generate_local, is_ollama_available
from app.llm.api_llm    import groq_llm
from app.agents.confidence import evaluate_confidence

CONFIDENCE_THRESHOLD = 0.7      # Below this → fall back to Groq API


async def generate_response(prompt: str) -> str:
    """
    Non-streaming router used by agents (e.g. analysis, reasoning).
    Tries local LLM first; falls back to Groq API when needed.
    """
    # ── Step 1: try Ollama ──────────────────────────────────────────────
    if await is_ollama_available():
        local_resp = await generate_local(prompt)
        if local_resp:
            score = evaluate_confidence(local_resp)
            if score >= CONFIDENCE_THRESHOLD:
                logging.info(f"🦙 [LOCAL / Ollama] replied  (confidence={score:.2f})")
                return local_resp
            logging.info(f"⚠️  Local confidence too low ({score:.2f}) — falling back to Groq.")
        else:
            logging.info("⚠️  Ollama returned empty — falling back to Groq.")
    else:
        logging.info("☁️  Ollama unavailable — using Groq API directly.")

    # ── Step 2: Groq fallback ─────────────────────────────────────────
    groq_resp = await groq_llm.generate(prompt)
    if groq_resp:
        logging.info("☁️  [Groq API / Fallback] replied")
        return groq_resp

    return "I was unable to generate a response at this time. Please try again."


async def generate_response_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Streaming router used by the chatbot endpoint.
    Uses Groq API (or Gemini fallback) to ensure strict adherence 
    to database context and prevent hallucinations.
    """
    logging.info("☁️  [Groq API / Direct] streaming reply for chatbot accuracy")
    yield "[SOURCE:groq]"                      # ← hidden marker
    async for chunk in groq_llm.generate_stream(prompt):
        yield chunk
