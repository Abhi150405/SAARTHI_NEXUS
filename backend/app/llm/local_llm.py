"""
local_llm.py
------------
Connects to a locally running Ollama instance via its REST API.
Default model: llama3:8b-instruct-q4_K_M
Non-streaming, synchronous HTTP call wrapped in an async executor.
"""

import httpx
import json
import logging
import asyncio
from typing import Optional

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL   = "llama3.2:1b"
TIMEOUT_SECONDS = 30           # Give local LLM up to 30 s
MAX_TOKENS      = 300          # Keep responses concise


def _call_ollama_sync(prompt: str, model: str) -> Optional[str]:
    """
    Blocking HTTP POST to Ollama /api/generate.
    Returns the response text or None on failure.
    """
    payload = {
        "model":  model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": MAX_TOKENS,
            "temperature": 0.4,
        },
    }
    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
            resp = client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "").strip()
    except httpx.ConnectError:
        logging.warning("LocalLLM: Ollama not reachable (connection refused).")
    except httpx.TimeoutException:
        logging.warning("LocalLLM: Ollama request timed out.")
    except Exception as e:
        logging.error(f"LocalLLM: Unexpected error → {e}")
    return None


async def generate_local(prompt: str, model: str = DEFAULT_MODEL) -> Optional[str]:
    """
    Async wrapper: runs the blocking Ollama call in a thread pool so it
    doesn't block the FastAPI event loop.
    Returns the response string or None.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _call_ollama_sync, prompt, model)


async def is_ollama_available() -> bool:
    """Quick health-check: returns True if Ollama is reachable."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False
