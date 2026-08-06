"""
embedding_service.py
--------------------
Singleton wrapper for Google text-embedding using the official
google-genai SDK.

Model: gemini-embedding-001
  - 3072-dimensional vectors
"""

import os
import asyncio
import logging

_GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
_EMBED_MODEL = "gemini-embedding-001"  # confirmed available for this project
_EMBED_DIMS = 3072                             # gemini-embedding-001 produces 3072-dim vectors
_CONCURRENCY = 10


def _get_client():
    """Lazy-import and configure the new google.genai module."""
    from google import genai
    return genai.Client(api_key=_GOOGLE_API_KEY)


class EmbeddingService:
    """
    Uses the new official google-genai SDK to call embeddings.
    """

    def is_available(self) -> bool:
        """Returns True when a Google API key is configured."""
        available = bool(_GOOGLE_API_KEY)
        if not available:
            logging.warning("EmbeddingService: GOOGLE_API_KEY not set — vector search unavailable.")
        return available

    # ── Single embed ──────────────────────────────────────────────────────────

    def embed(self, text: str, raise_errors: bool = False) -> list[float]:
        """Embed a single text → 3072-dim float list. Returns [] on failure unless raise_errors is True."""
        if not self.is_available():
            return []
        try:
            client = _get_client()
            result = client.models.embed_content(
                model=_EMBED_MODEL,
                contents=text,
                config={"task_type": "RETRIEVAL_DOCUMENT"}
            )
            return result.embeddings[0].values
        except Exception as e:
            if raise_errors:
                raise e
            logging.error(f"EmbeddingService.embed error: {e}")
            return []

    async def embed_async(self, text: str) -> list[float]:
        """Non-blocking async single text embed (offloads to thread pool)."""
        return await asyncio.to_thread(self.embed, text)

    # ── Batch embed ───────────────────────────────────────────────────────────

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of texts sequentially. Use embed_batch_async for speed."""
        if not texts:
            return []
        if not self.is_available():
            return [[] for _ in texts]
        return [self.embed(t) for t in texts]

    async def embed_batch_async(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of texts, chunking to avoid rate limits.
        Google counts EACH document in a batch towards the 100 requests/min quota.
        So we process 50 docs, then wait 35 seconds, ensuring we process ~85 docs/min.
        """
        if not texts:
            return []
        if not self.is_available():
            return [[] for _ in texts]

        all_embeddings = []
        chunk_size = 50

        for i in range(0, len(texts), chunk_size):
            chunk = texts[i : i + chunk_size]
            
            for attempt in range(5):
                try:
                    def _do_batch_embed():
                        client = _get_client()
                        res = client.models.embed_content(
                            model=_EMBED_MODEL,
                            contents=chunk,
                            config={"task_type": "RETRIEVAL_DOCUMENT"}
                        )
                        return [emb.values for emb in res.embeddings]
                        
                    chunk_embeddings = await asyncio.to_thread(_do_batch_embed)
                    all_embeddings.extend(chunk_embeddings)
                    break 
                except Exception as e:
                    error_msg = str(e).lower()
                    if "429" in error_msg or "quota" in error_msg or "rate" in error_msg:
                        delay = 30 + (attempt * 15)
                        logging.warning(f"Batch hit 429. Waiting {delay}s... (Attempt {attempt+1}/5)")
                        await asyncio.sleep(delay)
                    else:
                        logging.error(f"EmbeddingService.embed_batch error: {e}")
                        all_embeddings.extend([[] for _ in chunk])
                        break
            else:
                logging.error("Failed to embed batch after multiple retries.")
                all_embeddings.extend([[] for _ in chunk])

            # Wait 35s before the NEXT chunk to ensure we stay under 100 docs / minute
            if i + chunk_size < len(texts):
                logging.info(f"Processed {len(all_embeddings)}/{len(texts)} docs. Sleeping 35s to respect quota...")
                await asyncio.sleep(35.0)

        return all_embeddings


# Module-level singleton
embedding_service = EmbeddingService()
