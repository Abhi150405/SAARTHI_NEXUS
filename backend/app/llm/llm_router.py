"""
llm_router.py
-------------
High-performance LLM Router using Cloud APIs (Groq + Gemini fallback).
Local LLMs (Ollama) and NVIDIA dependencies removed completely.

Public API
----------
  generate_response(prompt)        → str   (non-streaming)
  generate_response_stream(prompt) → AsyncGenerator  (streaming for chatbot)
"""

import logging
from typing import AsyncGenerator
from app.llm.api_llm import api_llm


async def generate_response(prompt: str) -> str:
    """
    Non-streaming response generator (Groq -> Gemini fallback).
    """
    resp = await api_llm.generate(prompt)
    if resp:
        return resp
    return "I was unable to generate a response at this time. Please try again."


async def generate_response_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Streaming response generator used by the chatbot endpoint.
    Yields hidden source marker followed by text chunks from api_llm.
    """
    logging.info("☁️ [LLMRouter] Streaming response generation started")
    yield "[SOURCE:groq]"  # Source marker for frontend
    async for chunk in api_llm.generate_stream(prompt):
        yield chunk
