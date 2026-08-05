"""
embedding_service.py
--------------------
Singleton wrapper around the sentence-transformers model.
Lazy-loads the model on first use to avoid slow server startup.

Model: all-MiniLM-L6-v2
  - 384-dimensional vectors
  - ~90MB download (cached after first use)
  - Fast inference, good semantic quality

Cloud/Production Note:
  Set ENABLE_VECTOR_SEARCH=false to completely skip loading PyTorch and
  SentenceTransformers. This prevents OOM crashes on low-RAM cloud hosts
  like Render free tier (512 MB). The chatbot will use fast MongoDB fallback.
"""

import os
import logging
from typing import Optional
import numpy as np

# ── Cloud Safety Gate ──────────────────────────────────────────────────────────
# On Render free tier (512MB RAM), loading PyTorch/SentenceTransformers causes
# OOM kills. Default is DISABLED for cloud safety. Enable only on local/paid hosts.
_VECTOR_ENABLED = os.getenv("ENABLE_VECTOR_SEARCH", "false").strip().lower() == "true"

if _VECTOR_ENABLED:
    logging.info("EmbeddingService: ENABLE_VECTOR_SEARCH=true — vector search active.")
else:
    logging.info(
        "EmbeddingService: ENABLE_VECTOR_SEARCH=false — "
        "vector search disabled (chatbot will use direct MongoDB fallback)."
    )

_model = None


def _get_model():
    """Lazy-load the embedding model on first call. Returns None if disabled."""
    global _model
    if not _VECTOR_ENABLED:
        return None
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logging.info("EmbeddingService: loading all-MiniLM-L6-v2 model…")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logging.info("EmbeddingService: model loaded ✅")
        except Exception as e:
            logging.error(f"EmbeddingService: failed to load model — {e}")
            raise
    return _model


class EmbeddingService:
    """
    Thin wrapper that exposes encode/embed calls.
    Always returns plain Python lists (ChromaDB-compatible).
    Returns empty list when vector search is disabled (cloud mode).
    """

    def is_available(self) -> bool:
        """Returns True only if vector search is enabled and model loaded OK."""
        if not _VECTOR_ENABLED:
            return False
        try:
            _get_model()
            return True
        except Exception:
            return False

    def embed(self, text: str) -> list[float]:
        """Embed a single text string → 384-dim float list. Returns [] if disabled."""
        model = _get_model()
        if model is None:
            return []
        vec: np.ndarray = model.encode(text, normalize_embeddings=True)
        return vec.tolist()

    async def embed_async(self, text: str) -> list[float]:
        """Non-blocking async single text embed."""
        import asyncio
        return await asyncio.to_thread(self.embed, text)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts — much faster than calling embed() in a loop."""
        if not texts:
            return []
        model = _get_model()
        if model is None:
            return [[] for _ in texts]
        vec: np.ndarray = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
        return vec.tolist()

    async def embed_batch_async(self, texts: list[str]) -> list[list[float]]:
        """Non-blocking async version that offloads CPU encoding to thread pool."""
        if not texts:
            return []
        import asyncio
        return await asyncio.to_thread(self.embed_batch, texts)


# Module-level singleton
embedding_service = EmbeddingService()
