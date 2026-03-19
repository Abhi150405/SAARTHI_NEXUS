"""
api_llm.py
----------
Thin async wrapper around the Google Gemini API (google-genai SDK).
Initialised once and reused across the process lifetime.
"""

import os
import logging
from typing import Optional

from google import genai
from google.genai import types
from app.core.config import settings

GEMINI_MODEL  = "gemini-flash-latest"
MAX_TOKENS    = 1024          # Resume extraction needs room for detailed JSON
TEMPERATURE   = 0.4


class GeminiLLM:
    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._init()

    def _init(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logging.warning("GeminiLLM: GEMINI_API_KEY not set — Gemini fallback disabled.")
            return
        try:
            import certifi
            os.environ["SSL_CERT_FILE"] = certifi.where()
            self._client = genai.Client(api_key=api_key)
            logging.info("GeminiLLM: client initialised.")
        except Exception as e:
            logging.error(f"GeminiLLM: init error → {e}")

    @property
    def available(self) -> bool:
        return self._client is not None

    async def generate(self, prompt: str) -> Optional[str]:
        """
        Non-streaming Gemini call.  Returns text or None on error.
        Keeps max_output_tokens capped at MAX_TOKENS.
        """
        if not self._client:
            return None
        config = types.GenerateContentConfig(
            temperature=TEMPERATURE,
            top_p=0.95,
            top_k=40,
            max_output_tokens=MAX_TOKENS,
        )
        try:
            response = self._client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=config,
            )
            return (response.text or "").strip()
        except Exception as e:
            logging.error(f"GeminiLLM.generate error → {e}")
            return None

    async def generate_stream(self, prompt: str):
        """
        Streaming Gemini call — yields text chunks.
        Used only by the chatbot endpoint which needs SSE streaming.
        """
        if not self._client:
            yield "I'm having trouble connecting to the AI service."
            return
        config = types.GenerateContentConfig(
            temperature=TEMPERATURE,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,   # Streaming can be longer
        )
        try:
            stream = self._client.models.generate_content_stream(
                model=GEMINI_MODEL,
                contents=prompt,
                config=config,
            )
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logging.error(f"GeminiLLM.generate_stream error → {e}")
            yield "Sorry, I encountered an error while processing your request."


# Module-level singleton
gemini_llm = GeminiLLM()
