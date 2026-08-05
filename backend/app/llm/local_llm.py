"""
local_llm.py (Deprecated - Local LLM completely removed)
"""

from typing import Optional


async def generate_local(prompt: str, model: str = "") -> Optional[str]:
    return None


async def is_local_available() -> bool:
    return False


async def is_ollama_available() -> bool:
    return False
