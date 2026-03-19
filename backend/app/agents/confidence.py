"""
confidence.py
-------------
Heuristic-based confidence scorer for LLM responses.

Returns a float in [0, 1].
The chatbot / router uses this to decide whether to keep a local-LLM answer
or escalate to the Gemini API fallback.

Heuristics (all lightweight, no extra model calls):
  - Length: very short responses are usually low-quality
  - Uncertainty phrases: "I don't know", "I'm not sure", etc.
  - Refusal phrases: "I cannot", "As an AI", etc.
  - Incoherence markers: repeated punctuation, empty content
  - Presence of structured tokens as expected
"""

import re
from typing import Optional

# Words/phrases that strongly signal low confidence
_UNCERTAINTY_PATTERNS = [
    r"\bi (don'?t|do not) know\b",
    r"\bi'?m not sure\b",
    r"\bi cannot (say|confirm|determine|provide)\b",
    r"\bas an ai\b",
    r"\bi (lack|don'?t have) (the )?(information|knowledge|data|access)\b",
    r"\bunable to (answer|respond|provide|determine)\b",
    r"\bnot enough (information|context|data)\b",
    r"\bno (relevant |specific )?(information|data|details) (available|provided|found)\b",
    r"\bcannot (assist|help) with that\b",
]

_UNCERTAINTY_RE = re.compile("|".join(_UNCERTAINTY_PATTERNS), re.IGNORECASE)

# A coherent response normally has these
_MIN_WORDS        = 10
_LOW_WORD_PENALTY = 0.25   # Deducted when response is super short


def evaluate_confidence(response: str) -> float:
    """
    Scores a response string and returns a confidence value in [0.0, 1.0].

    Rules:
      - Start at 1.0
      - Deduct 0.4 per each uncertainty/refusal pattern matched
      - Deduct 0.25 if fewer than MIN_WORDS words
      - Deduct 0.15 if response is just repeated characters / garbage
      - Floor at 0.0
    """
    if not response or not response.strip():
        return 0.0

    score = 1.0
    text  = response.strip()

    # 1. Word count check
    word_count = len(text.split())
    if word_count < _MIN_WORDS:
        score -= _LOW_WORD_PENALTY

    # 2. Uncertainty / refusal phrases
    matches = _UNCERTAINTY_RE.findall(text)
    score -= 0.4 * len(matches)

    # 3. Garbage detection: very high ratio of non-alpha chars
    non_alpha = sum(1 for c in text if not c.isalpha() and not c.isspace())
    if len(text) > 0 and non_alpha / len(text) > 0.5:
        score -= 0.3

    # Clamp to [0, 1]
    return max(0.0, min(1.0, score))
