"""
api_llm.py
----------
Thin async wrapper around the NVIDIA NIM API (Mistral Small model).
Replaces Gemini to avoid "RESOURCE_EXHAUSTED" errors.
Uses httpx for high-performance async requests.
"""

import os
import logging
import json
from typing import Optional, AsyncGenerator

import httpx
from app.core.config import settings

NVIDIA_MODEL = "mistralai/mistral-small-4-119b-2603"
INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MAX_TOKENS = 4096  # Increased for complex reasoning
TEMPERATURE = 0.1
TOP_P = 1.0


class NvidiaLLM:
    def __init__(self):
        self._api_key = settings.NVIDIA_API_KEY
        if not self._api_key:
            logging.warning("NvidiaLLM: NVIDIA_API_KEY not set — NVIDIA fallback disabled.")

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    async def generate(self, prompt: str) -> Optional[str]:
        """
        Non-streaming NVIDIA NIM call.
        """
        if not self._api_key:
            return None

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Accept": "application/json",
        }

        payload = {
            "model": NVIDIA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": MAX_TOKENS,
            "temperature": TEMPERATURE,
            "top_p": TOP_P,
            "stream": False
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(INVOKE_URL, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logging.error(f"NvidiaLLM.generate error → {e}")
            return None

    async def generate_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Streaming NVIDIA NIM call — yields text chunks.
        """
        if not self._api_key:
            yield "I'm having trouble connecting to the AI service."
            return

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Accept": "text/event-stream",
        }

        payload = {
            "model": NVIDIA_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": MAX_TOKENS,
            "temperature": TEMPERATURE,
            "top_p": TOP_P,
            "stream": True
        }

        yielded_any = False
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", INVOKE_URL, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        err_data = await response.aread()
                        logging.error(f"NvidiaLLM status error {response.status_code} → {err_data.decode()}")
                        yield "I encountered an error connecting to the AI service."
                        return

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
        except Exception as e:
            logging.error(f"NvidiaLLM.generate_stream error → {e}")
            if not yielded_any:
                yield "Sorry, I encountered an error while processing your request."


# Module-level singleton
nvidia_llm = NvidiaLLM()
gemini_llm = nvidia_llm
