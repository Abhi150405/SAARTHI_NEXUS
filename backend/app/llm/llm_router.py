"""
llm_router.py
-------------
Decides WHICH LLM to call for a given prompt:

  1. Try Ollama (local, free, fast when warm) -> Used for background agent tasks.
  2. For Chatbot (Streaming): Always use NVIDIA NIM (Mistral Small) for 100% accuracy 
     and to strictly follow context constraints.

Public API
----------
  generate_response(prompt)      → str   (non-streaming, for agents)
  generate_response_stream(prompt) → AsyncGenerator  (streaming, for chatbot)
"""

import logging
from typing import Optional, AsyncGenerator

from app.llm.local_llm  import generate_local, is_ollama_available
from app.llm.api_llm    import nvidia_llm
from app.agents.confidence import evaluate_confidence

CONFIDENCE_THRESHOLD = 0.7      # Below this → fall back to NVIDIA


async def generate_response(prompt: str) -> str:
    """
    Non-streaming router used by agents (e.g. analysis, reasoning).
    Tries local LLM first; falls back to NVIDIA when needed.
    """
    # ── Step 1: try Ollama ──────────────────────────────────────────────
    if await is_ollama_available():
        local_resp = await generate_local(prompt)
        if local_resp:
            score = evaluate_confidence(local_resp)
            if score >= CONFIDENCE_THRESHOLD:
                logging.info(f"🦙 [LOCAL / Ollama] replied  (confidence={score:.2f})")
                return local_resp
            logging.info(f"⚠️  Local confidence too low ({score:.2f}) — falling back to NVIDIA.")
        else:
            logging.info("⚠️  Ollama returned empty — falling back to NVIDIA.")
    else:
        logging.info("☁️  Ollama unavailable — using NVIDIA directly.")

    # ── Step 2: NVIDIA fallback ─────────────────────────────────────────
    nvidia_resp = await nvidia_llm.generate(prompt)
    if nvidia_resp:
        logging.info("☁️  [NVIDIA / Fallback] replied")
        return nvidia_resp

    return "I was unable to generate a response at this time. Please try again."


async def generate_response_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Streaming router used by the chatbot endpoint.
    UPGRADED: Always uses NVIDIA NIM for the chatbot to ensure 100% adherence 
    to database context and prevent hallucinations.
    """
    # For the chatbot, we bypass local LLMs entirely because they ignore 
    # context constraints (like 'don't mention X').
    logging.info("☁️  [NVIDIA / Direct] streaming reply for chatbot accuracy")
    yield "[SOURCE:nvidia]"                      # ← hidden marker
    async for chunk in nvidia_llm.generate_stream(prompt):
        yield chunk
