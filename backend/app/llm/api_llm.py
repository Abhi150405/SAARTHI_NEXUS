"""
api_llm.py
----------
High-performance async LLM wrapper using the Groq API (Llama 3.1 model)
with dual-engine support and Google Gemini API fallback.
Uses httpx for high-performance async requests.
"""

import os
import logging
import json
import asyncio
from typing import Optional, AsyncGenerator

import httpx
from app.core.config import settings

GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]
GROQ_MODEL = GROQ_MODELS[0]
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"]
GEMINI_MODEL = GEMINI_MODELS[0]
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

MAX_TOKENS = 4096
TEMPERATURE = 0.2


class GroqLLM:
    def __init__(self):
        pass

    @property
    def groq_key(self) -> str:
        return settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")

    @property
    def gemini_key(self) -> str:
        return settings.GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")

    @property
    def available(self) -> bool:
        return bool(self.groq_key or self.gemini_key)

    async def generate(self, prompt: str) -> Optional[str]:
        """
        Non-streaming call. Tries Groq API first across model cascade, falls back to Gemini API.
        """
        # 1. Try Groq API with Model Cascade & 429 Backoff
        if self.groq_key:
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=40.0) as client:
                for model_name in GROQ_MODELS:
                    payload = {
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": MAX_TOKENS,
                        "temperature": TEMPERATURE,
                        "stream": False
                    }
                    for attempt in range(2):
                        try:
                            response = await client.post(GROQ_URL, headers=headers, json=payload)
                            if response.status_code == 429:
                                logging.warning(f"Groq 429 Rate limit on model {model_name}. Waiting 2s before retry/fallback...")
                                await asyncio.sleep(2.0)
                                continue
                            if response.status_code == 200:
                                data = response.json()
                                text = data["choices"][0]["message"]["content"].strip()
                                if text:
                                    return text
                            else:
                                logging.warning(f"Groq API ({model_name}) returned HTTP {response.status_code}: {response.text}")
                                break
                        except Exception as e:
                            logging.error(f"GroqLLM.generate error on {model_name} → {e}")
                            break

        # 2. Fallback to Gemini API with Model Cascade
        if self.gemini_key:
            async with httpx.AsyncClient(timeout=40.0) as client:
                for g_model in GEMINI_MODELS:
                    url = f"{GEMINI_BASE_URL}/{g_model}:generateContent?key={self.gemini_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": TEMPERATURE,
                            "maxOutputTokens": MAX_TOKENS,
                        }
                    }
                    try:
                        response = await client.post(url, json=payload)
                        if response.status_code == 429:
                            await asyncio.sleep(2.0)
                            continue
                        if response.status_code == 200:
                            data = response.json()
                            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                            if text:
                                return text
                        else:
                            logging.warning(f"Gemini API ({g_model}) returned HTTP {response.status_code}: {response.text}")
                    except Exception as e:
                        logging.error(f"Gemini fallback generate error on {g_model} → {e}")

        return None

    async def generate_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Streaming call. Tries Groq API SSE stream across model cascade, falls back to Gemini SSE stream.
        """
        # 1. Try Groq Streaming with Model Cascade
        if self.groq_key:
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=40.0) as client:
                for model_name in GROQ_MODELS:
                    payload = {
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": MAX_TOKENS,
                        "temperature": TEMPERATURE,
                        "stream": True
                    }
                    yielded_any = False
                    try:
                        async with client.stream("POST", GROQ_URL, headers=headers, json=payload) as response:
                            if response.status_code == 429:
                                logging.warning(f"Groq stream 429 Rate limit on model {model_name}. Trying next model...")
                                await asyncio.sleep(1.5)
                                continue
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
                                logging.warning(f"Groq stream error HTTP {response.status_code} ({model_name}): {err_text.decode()}")
                    except Exception as e:
                        logging.error(f"GroqLLM.generate_stream error on {model_name} → {e}")

        # 2. Fallback to Gemini Streaming with Model Cascade
        if self.gemini_key:
            async with httpx.AsyncClient(timeout=40.0) as client:
                for g_model in GEMINI_MODELS:
                    url = f"{GEMINI_BASE_URL}/{g_model}:streamGenerateContent?alt=sse&key={self.gemini_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": TEMPERATURE,
                            "maxOutputTokens": MAX_TOKENS,
                        }
                    }
                    yielded_any = False
                    try:
                        async with client.stream("POST", url, json=payload) as response:
                            if response.status_code == 429:
                                await asyncio.sleep(1.5)
                                continue
                            if response.status_code == 200:
                                async for line in response.aiter_lines():
                                    if line.startswith("data: "):
                                        data_str = line[6:].strip()
                                        if not data_str:
                                            continue
                                        try:
                                            data = json.loads(data_str)
                                            chunk = data["candidates"][0]["content"]["parts"][0]["text"]
                                            if chunk:
                                                yielded_any = True
                                                yield chunk
                                        except (json.JSONDecodeError, KeyError, IndexError):
                                            continue
                                if yielded_any:
                                    return
                            else:
                                err_text = await response.aread()
                                logging.warning(f"Gemini stream error HTTP {response.status_code} ({g_model}): {err_text.decode()}")
                    except Exception as e:
                        logging.error(f"Gemini fallback generate_stream error on {g_model} → {e}")

        yield "Sorry, I encountered an error while processing your request. Please ensure GROQ_API_KEY or GOOGLE_API_KEY is configured."


# Singletons and exported aliases
groq_llm = GroqLLM()
api_llm = groq_llm
nvidia_llm = groq_llm  # Alias for backward compatibility
