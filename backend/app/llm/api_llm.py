"""
api_llm.py
----------
High-performance async wrapper with dual LLM engine support:
  1. Groq API (llama-3.3-70b-versatile) as Primary fast model.
  2. Google Gemini API (gemini-2.5-flash) as Resilient automatic fallback.

No local LLMs or NVIDIA dependencies required.
"""

import os
import logging
import json
from typing import Optional, AsyncGenerator

import httpx
from app.core.config import settings

GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

MAX_TOKENS = 4096
TEMPERATURE = 0.1
TOP_P = 1.0


class APILLM:
    """
    Unified LLM manager with primary Groq + fallback Google Gemini.
    """

    @property
    def groq_key(self) -> str:
        return settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")

    @property
    def gemini_key(self) -> str:
        return (
            settings.GEMINI_API_KEY
            or os.getenv("GOOGLE_API_KEY", "")
            or os.getenv("GEMINI_API_KEY", "")
        )

    async def generate(self, prompt: str) -> Optional[str]:
        """
        Non-streaming LLM call: Groq -> Gemini fallback.
        """
        # 1. Try Groq
        if self.groq_key:
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "top_p": TOP_P,
                "stream": False,
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(GROQ_URL, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"].strip()
                    logging.warning(f"GroqLLM generate non-200 ({resp.status_code}) -> falling back to Gemini")
            except Exception as e:
                logging.warning(f"GroqLLM generate exception ({e}) -> falling back to Gemini")

        # 2. Gemini Fallback
        if self.gemini_key:
            url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent?key={self.gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": TEMPERATURE,
                    "maxOutputTokens": MAX_TOKENS,
                },
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
            except Exception as e:
                logging.error(f"GeminiLLM generate exception: {e}")

        return None

    async def generate_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Streaming LLM call: Groq -> Gemini fallback.
        Yields text chunks.
        """
        yielded_any = False

        # 1. Try Groq Streaming
        if self.groq_key:
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "top_p": TOP_P,
                "stream": True,
            }
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", GROQ_URL, headers=headers, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    if data_str == "[DONE]":
                                        break
                                    if not data_str:
                                        continue
                                    try:
                                        data = json.loads(data_str)
                                        chunk = data["choices"][0]["delta"].get("content", "")
                                        if chunk:
                                            yielded_any = True
                                            yield chunk
                                    except (json.JSONDecodeError, KeyError, IndexError):
                                        continue
                            if yielded_any:
                                return
                        else:
                            err_text = await response.aread()
                            logging.warning(
                                f"Groq stream status error {response.status_code}: {err_text.decode()} -> switching to Gemini"
                            )
            except Exception as e:
                logging.warning(f"Groq stream exception: {e} -> switching to Gemini")

        if yielded_any:
            return

        # 2. Try Gemini Streaming Fallback
        if self.gemini_key:
            url = f"{GEMINI_BASE_URL}/{GEMINI_MODEL}:streamGenerateContent?alt=sse&key={self.gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": TEMPERATURE,
                    "maxOutputTokens": MAX_TOKENS,
                },
            }
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", url, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    if not data_str:
                                        continue
                                    try:
                                        data = json.loads(data_str)
                                        candidates = data.get("candidates", [])
                                        if candidates:
                                            parts = candidates[0].get("content", {}).get("parts", [])
                                            for p in parts:
                                                chunk = p.get("text", "")
                                                if chunk:
                                                    yielded_any = True
                                                    yield chunk
                                    except (json.JSONDecodeError, KeyError, IndexError):
                                        continue
                            if yielded_any:
                                return
                        else:
                            err_text = await response.aread()
                            logging.error(f"Gemini stream status error {response.status_code}: {err_text.decode()}")
            except Exception as e:
                logging.error(f"Gemini stream exception: {e}")

        if not yielded_any:
            yield "I am having trouble connecting to the AI services right now. Please check back in a moment."


# Module singletons
groq_llm = APILLM()
api_llm = groq_llm
