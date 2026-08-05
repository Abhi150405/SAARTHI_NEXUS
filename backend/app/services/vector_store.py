"""
vector_store.py
---------------
ChromaDB-backed vector store for SAARTHI NEXUS RAG pipeline.

Collections:
  - placement_records     : one document per MongoDB placement record
  - interview_experiences : one document per interview experience
  - placement_stats       : synthesized yearly statistics summaries

Usage:
  from app.services.vector_store import vector_store

  # Index (run once or on startup if empty)
  await vector_store.index_all(db)

  # Search (called on every chat query)
  results = vector_store.search("which companies visit PICT", n=10)
"""

import os
import logging
from pathlib import Path
from typing import Optional, Any

# chromadb is imported lazily inside _ensure_client() so that this module
# can be safely imported on cloud deployments where chromadb is not installed.

from app.services.embedding_service import embedding_service
from app.services.stats_service import stats_service

# Persist ChromaDB next to the backend directory
_CHROMA_PATH = str(Path(__file__).resolve().parents[3] / "chroma_db")

# ── Helpers ──────────────────────────────────────────────────────────────────

def _record_to_text(doc: dict) -> str:
    """Convert a placement_records MongoDB doc to a searchable text chunk."""
    sel = doc.get("selections", {})
    ce  = sel.get("CE", 0)
    it  = sel.get("IT", 0)
    etc = sel.get("E&TC", 0)
    aids = sel.get("AI&DS", 0)
    total = int(ce) + int(it) + int(etc) + int(aids)
    cgpa = doc.get("criteria", {}).get("min_cgpa", "N/A")
    return (
        f"PICT placement record: Company {doc.get('company_name', '')} visited in "
        f"academic year {doc.get('academic_year', '')}. "
        f"They offered a package of {doc.get('salary_lpa', 'N/A')} LPA. "
        f"They hired {total} students total "
        f"(CE: {ce}, IT: {it}, E&TC: {etc}, AI&DS: {aids}). "
        f"Minimum CGPA required: {cgpa}."
    )


def _experience_to_text(doc: dict) -> str:
    """Convert an interview_experience MongoDB doc to a searchable text chunk."""
    return (
        f"Interview experience at {doc.get('company_name', '')} "
        f"for the role of {doc.get('role', 'Software Engineer')}. "
        f"Interview rounds: {doc.get('rounds', 'N/A')}. "
        f"Experience: {doc.get('experience', '')[:600]}. "
        f"Tips and suggestions: {doc.get('suggestions', '')[:300]}."
    )


def _stats_to_text(year: str, stats: dict) -> str:
    """Convert yearly stats to a searchable text chunk."""
    branch_lines = " ".join([
        f"{b}: {s['totalPlaced']} students placed with average {s['avgPackage']};"
        for b, s in stats.get("branchStats", {}).items()
        if int(s["totalPlaced"]) > 0
    ])
    return (
        f"PICT placement statistics for academic year {year}: "
        f"{stats.get('totalPlaced', 0)} students were placed in total. "
        f"{stats.get('totalCompanies', 0)} companies visited campus. "
        f"Highest package offered: {stats.get('highestPackage', 'N/A')}. "
        f"Average package: {stats.get('avgPackage', 'N/A')}. "
        f"Median package: {stats.get('medianPackage', 'N/A')}. "
        f"Branch-wise breakdown — {branch_lines}"
    )


# ── VectorStore class ─────────────────────────────────────────────────────────

class VectorStore:
    def __init__(self):
        self._client: Optional[Any] = None  # chromadb.PersistentClient, lazily imported
        self._placements_col = None
        self._experiences_col = None
        self._stats_col = None

    def _ensure_client(self):
        if self._client is None:
            # Lazy import — only runs when ENABLE_VECTOR_SEARCH=true and chromadb is installed
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            os.makedirs(_CHROMA_PATH, exist_ok=True)
            self._client = chromadb.PersistentClient(
                path=_CHROMA_PATH,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            self._placements_col  = self._client.get_or_create_collection("placement_records")
            self._experiences_col = self._client.get_or_create_collection("interview_experiences")
            self._stats_col       = self._client.get_or_create_collection("placement_stats")
            logging.info(f"VectorStore: ChromaDB opened at {_CHROMA_PATH}")

    # ── Indexing ──────────────────────────────────────────────────────────────

    def is_indexed(self) -> bool:
        """Returns True if the vector store already has documents."""
        # Short-circuit if embedding is disabled (cloud/low-RAM mode)
        if not embedding_service.is_available():
            return False
        try:
            self._ensure_client()
            return (
                self._placements_col.count() > 0 or
                self._experiences_col.count() > 0
            )
        except Exception:
            return False

    async def index_all(self, db) -> dict:
        """
        Full re-index: reads ALL docs from MongoDB and upserts into ChromaDB.
        Safe to call multiple times (upsert is idempotent).
        Returns counts dict.
        """
        # No-op when embedding is disabled (cloud/low-RAM mode)
        if not embedding_service.is_available():
            logging.info("VectorStore.index_all: skipped (ENABLE_VECTOR_SEARCH=false)")
            return {"placements": 0, "experiences": 0, "stats": 0}
        self._ensure_client()
        counts = {"placements": 0, "experiences": 0, "stats": 0}

        # ── 1. Placement records ──────────────────────────────────────────
        logging.info("VectorStore: indexing placement_records…")
        records = await db["placement_records"].find({}).to_list(None)
        if records:
            ids   = [str(r["_id"]) for r in records]
            texts = [_record_to_text(r) for r in records]
            metas = [
                {
                    "type": "placement",
                    "company": r.get("company_name", ""),
                    "year": r.get("academic_year", ""),
                    "salary": str(r.get("salary_lpa", "")),
                    "mongo_id": str(r["_id"]),
                }
                for r in records
            ]
            embeddings = await embedding_service.embed_batch_async(texts)
            self._placements_col.upsert(ids=ids, embeddings=embeddings, documents=texts, metadatas=metas)
            counts["placements"] = len(records)
            logging.info(f"VectorStore: indexed {len(records)} placement records ✅")

        # ── 2. Interview experiences ──────────────────────────────────────
        logging.info("VectorStore: indexing interview_experience…")
        experiences = await db["interview_experience"].find({}).to_list(None)
        if experiences:
            ids   = [str(e["_id"]) for e in experiences]
            texts = [_experience_to_text(e) for e in experiences]
            metas = [
                {
                    "type": "experience",
                    "company": e.get("company_name", ""),
                    "role": e.get("role", ""),
                    "mongo_id": str(e["_id"]),
                }
                for e in experiences
            ]
            embeddings = await embedding_service.embed_batch_async(texts)
            self._experiences_col.upsert(ids=ids, embeddings=embeddings, documents=texts, metadatas=metas)
            counts["experiences"] = len(experiences)
            logging.info(f"VectorStore: indexed {len(experiences)} interview experiences ✅")

        # ── 3. Yearly stats (synthesized) ─────────────────────────────────
        logging.info("VectorStore: indexing yearly stats…")
        all_stats = await stats_service.get_all_years_stats()
        if all_stats:
            ids, texts, metas, embeddings_list = [], [], [], []
            for year, stats in all_stats.items():
                doc_id = f"stats_{year}"
                text   = _stats_to_text(year, stats)
                ids.append(doc_id)
                texts.append(text)
                metas.append({"type": "stats", "year": year})
            embeddings_list = await embedding_service.embed_batch_async(texts)
            self._stats_col.upsert(ids=ids, embeddings=embeddings_list, documents=texts, metadatas=metas)
            counts["stats"] = len(ids)
            logging.info(f"VectorStore: indexed {len(ids)} stat summaries ✅")

        logging.info(f"VectorStore: indexing complete — {counts}")
        return counts

    # ── Search ────────────────────────────────────────────────────────────────

    def search(self, query: str, n: int = 10) -> list[dict]:
        """
        Embed the query and retrieve the top-N most relevant documents
        across all three collections.

        Returns a list of dicts with keys:
          - type        : "placement" | "experience" | "stats"
          - text        : the stored document text
          - metadata    : original metadata dict
          - distance    : cosine distance (lower = more similar)
        """
        self._ensure_client()
        query_embedding = embedding_service.embed(query)

        results = []

        for col, label in [
            (self._placements_col,  "placement"),
            (self._experiences_col, "experience"),
            (self._stats_col,       "stats"),
        ]:
            if col.count() == 0:
                continue
            try:
                k = min(n, col.count())
                res = col.query(
                    query_embeddings=[query_embedding],
                    n_results=k,
                    include=["documents", "metadatas", "distances"],
                )
                docs      = res["documents"][0]
                metas     = res["metadatas"][0]
                distances = res["distances"][0]
                for doc, meta, dist in zip(docs, metas, distances):
                    results.append({
                        "type":     label,
                        "text":     doc,
                        "metadata": meta,
                        "distance": dist,
                    })
            except Exception as e:
                logging.warning(f"VectorStore.search [{label}] error: {e}")

        # Sort all results globally by similarity (ascending distance)
        results.sort(key=lambda x: x["distance"])

        # Return top-N overall
        return results[:n]

    async def search_async(self, query: str, n: int = 10) -> list[dict]:
        """Non-blocking async search wrapper."""
        import asyncio
        return await asyncio.to_thread(self.search, query, n)

    def clear(self):
        """Delete and recreate all collections (full reset)."""
        self._ensure_client()
        for name in ["placement_records", "interview_experiences", "placement_stats"]:
            try:
                self._client.delete_collection(name)
            except Exception:
                pass
        self._placements_col  = self._client.get_or_create_collection("placement_records")
        self._experiences_col = self._client.get_or_create_collection("interview_experiences")
        self._stats_col       = self._client.get_or_create_collection("placement_stats")
        logging.info("VectorStore: all collections cleared")


# Module-level singleton
vector_store = VectorStore()
