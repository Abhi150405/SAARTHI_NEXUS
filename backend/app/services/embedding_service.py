"""
embedding_service.py
--------------------
Singleton wrapper around the sentence-transformers model.
Lazy-loads the model on first use to avoid slow server startup.

Model: all-MiniLM-L6-v2
  - 384-dimensional vectors
  - ~90MB download (cached after first use)
  - Fast inference, good semantic quality
"""

import logging
from typing import Optional
import numpy as np

_model = None


def _get_model():
    """Lazy-load the embedding model on first call."""
    global _model
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
    """

    def embed(self, text: str) -> list[float]:
        """Embed a single text string → 384-dim float list."""
        model = _get_model()
        vec: np.ndarray = model.encode(text, normalize_embeddings=True)
        return vec.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts — much faster than calling embed() in a loop."""
        if not texts:
            return []
        model = _get_model()
        vecs: np.ndarray = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
        return vecs.tolist()

    def is_available(self) -> bool:
        try:
            _get_model()
            return True
        except Exception:
            return False


# Module-level singleton
embedding_service = EmbeddingService()
