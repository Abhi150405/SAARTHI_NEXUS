"""
vector_store.py
---------------
MongoDB Atlas Vector Search-backed store for SAARTHI NEXUS RAG pipeline.

Replaces ChromaDB entirely. Embeddings are stored as a field directly on
each MongoDB document and searched via the $vectorSearch aggregation stage.

Collections:
  - placement_records     : embedding stored on existing docs
  - interview_experience  : embedding stored on existing docs
  - placement_stats_vectors: synthesized yearly stat summaries (new collection)

Atlas Vector Index Required (one-time setup in Atlas UI):
  Create a Search Index on each collection with:
    { "fields": [{ "type": "vector", "path": "embedding",
                   "numDimensions": 3072, "similarity": "cosine" }] }

Usage:
  from app.services.vector_store import vector_store

  # Full index (run once after deploy or to refresh)
  await vector_store.index_all(db)

  # Search (called on every chat query)
  results = await vector_store.search_async("which companies visit PICT", n=10)
"""

import logging
from typing import Any

from app.services.embedding_service import embedding_service
from app.services.stats_service import stats_service

_EMBED_DIMS = 3072

# ── Text serialisers ───────────────────────────────────────────────────────────

def _record_to_text(doc: dict) -> str:
    """Convert a placement_records MongoDB doc to a searchable text chunk."""
    sel   = doc.get("selections", {})
    ce    = sel.get("CE", 0)
    it    = sel.get("IT", 0)
    etc   = sel.get("E&TC", 0)
    aids  = sel.get("AI&DS", 0)
    total = int(ce) + int(it) + int(etc) + int(aids)
    cgpa  = doc.get("criteria", {}).get("min_cgpa", "N/A")
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


# ── VectorStore class ──────────────────────────────────────────────────────────

class VectorStore:
    """
    MongoDB Atlas Vector Search-backed RAG store.

    Embeddings are stored as `embedding` field on MongoDB documents.
    Search is performed via $vectorSearch aggregation (requires Atlas Search index).
    """

    # ── Status ────────────────────────────────────────────────────────────────

    def is_indexed(self, db=None) -> bool:
        """
        Returns True if at least some placement_records docs have an embedding.
        Sync version — used in startup checks.
        """
        if not embedding_service.is_available():
            return False
        # We can't easily do async here, so we just return True if the
        # embedding service is available — the search will gracefully
        # return empty results if no embeddings exist yet.
        return True

    async def is_indexed_async(self, db) -> bool:
        """Async version: checks if any docs have embeddings stored."""
        if not embedding_service.is_available():
            return False
        try:
            count = await db["placement_records"].count_documents(
                {"embedding": {"$exists": True, "$not": {"$size": 0}}}
            )
            return count > 0
        except Exception:
            return False

    # ── Indexing ──────────────────────────────────────────────────────────────

    async def index_all(self, db) -> dict:
        """
        Full re-index: embed all docs and upsert the `embedding` field into MongoDB.
        Safe to call multiple times (uses $set upsert — idempotent).
        Returns counts dict.
        """
        if not embedding_service.is_available():
            logging.info("VectorStore.index_all: skipped (GOOGLE_API_KEY not set)")
            return {"placements": 0, "experiences": 0, "stats": 0}

        counts = {"placements": 0, "experiences": 0, "stats": 0}

        # ── 1. Placement records ───────────────────────────────────────────
        logging.info("VectorStore: indexing placement_records…")
        records = await db["placement_records"].find({}).to_list(None)
        if records:
            texts      = [_record_to_text(r) for r in records]
            embeddings = await embedding_service.embed_batch_async(texts)
            for rec, emb in zip(records, embeddings):
                if emb:
                    await db["placement_records"].update_one(
                        {"_id": rec["_id"]},
                        {"$set": {"embedding": emb}},
                    )
                    counts["placements"] += 1
            logging.info(f"VectorStore: indexed {counts['placements']} placement records ✅")

        # ── 2. Interview experiences ───────────────────────────────────────
        logging.info("VectorStore: indexing interview_experience…")
        experiences = await db["interview_experience"].find({}).to_list(None)
        if experiences:
            texts      = [_experience_to_text(e) for e in experiences]
            embeddings = await embedding_service.embed_batch_async(texts)
            for exp, emb in zip(experiences, embeddings):
                if emb:
                    await db["interview_experience"].update_one(
                        {"_id": exp["_id"]},
                        {"$set": {"embedding": emb}},
                    )
                    counts["experiences"] += 1
            logging.info(f"VectorStore: indexed {counts['experiences']} interview experiences ✅")

        # ── 3. Yearly stats (placement_stats_vectors collection) ───────────
        logging.info("VectorStore: indexing yearly stats…")
        all_stats = await stats_service.get_all_years_stats()
        if all_stats:
            years      = list(all_stats.keys())
            texts      = [_stats_to_text(y, all_stats[y]) for y in years]
            embeddings = await embedding_service.embed_batch_async(texts)
            for year, emb, text in zip(years, embeddings, texts):
                if emb:
                    await db["placement_stats_vectors"].update_one(
                        {"year": year},
                        {"$set": {"year": year, "text": text, "embedding": emb}},
                        upsert=True,
                    )
                    counts["stats"] += 1
            logging.info(f"VectorStore: indexed {counts['stats']} stat summaries ✅")

        logging.info(f"VectorStore: indexing complete — {counts}")
        return counts

    async def index_document(self, db, collection: str, doc: dict):
        """
        Embed + store the embedding for a single document.
        Call this after inserting/updating a placement record or experience.
        """
        if not embedding_service.is_available():
            return
        try:
            if collection == "placement_records":
                text = _record_to_text(doc)
            elif collection == "interview_experience":
                text = _experience_to_text(doc)
            else:
                return
            emb = await embedding_service.embed_async(text)
            if emb:
                await db[collection].update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"embedding": emb}},
                )
        except Exception as e:
            logging.warning(f"VectorStore.index_document error [{collection}]: {e}")

    # ── Search ────────────────────────────────────────────────────────────────

    async def search_async(self, query: str, n: int = 10) -> list[dict]:
        """
        Embed the query and retrieve the top-N most relevant documents
        across placement_records, interview_experience, and placement_stats_vectors
        using MongoDB Atlas $vectorSearch.

        Returns a list of dicts with keys:
          - type     : "placement" | "experience" | "stats"
          - text     : the serialised document text
          - metadata : subset of original document fields
          - distance : similarity score (higher = more similar; range 0-1 for cosine)
        """
        from app.db.mongodb import get_database
        db = get_database()
        if db is None:
            return []

        query_embedding = await embedding_service.embed_async(query)
        if not query_embedding:
            return []

        results: list[dict] = []
        k = max(n, 5)

        # ── Placement records ──────────────────────────────────────────────
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "placement_vector_index",
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": k * 10,
                        "limit": k,
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "company_name": 1,
                        "academic_year": 1,
                        "salary_lpa": 1,
                        "selections": 1,
                        "criteria": 1,
                        "score": {"$meta": "vectorSearchScore"},
                    }
                },
            ]
            async for doc in db["placement_records"].aggregate(pipeline):
                results.append({
                    "type":     "placement",
                    "text":     _record_to_text(doc),
                    "metadata": {
                        "mongo_id": str(doc["_id"]),
                        "company":  doc.get("company_name", ""),
                        "year":     doc.get("academic_year", ""),
                        "salary":   str(doc.get("salary_lpa", "")),
                        "type":     "placement",
                    },
                    "distance": 1.0 - doc.get("score", 0),  # convert to distance
                })
        except Exception as e:
            logging.warning(f"VectorStore.search [placement_records]: {e}")

        # ── Interview experiences ──────────────────────────────────────────
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "experience_vector_index",
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": k * 10,
                        "limit": k,
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "company_name": 1,
                        "role": 1,
                        "rounds": 1,
                        "experience": 1,
                        "suggestions": 1,
                        "score": {"$meta": "vectorSearchScore"},
                    }
                },
            ]
            async for doc in db["interview_experience"].aggregate(pipeline):
                results.append({
                    "type":     "experience",
                    "text":     _experience_to_text(doc),
                    "metadata": {
                        "mongo_id": str(doc["_id"]),
                        "company":  doc.get("company_name", ""),
                        "role":     doc.get("role", ""),
                        "type":     "experience",
                    },
                    "distance": 1.0 - doc.get("score", 0),
                })
        except Exception as e:
            logging.warning(f"VectorStore.search [interview_experience]: {e}")

        # ── Yearly stats ───────────────────────────────────────────────────
        try:
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "stats_vector_index",
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": k * 10,
                        "limit": min(k, 5),
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "year": 1,
                        "text": 1,
                        "score": {"$meta": "vectorSearchScore"},
                    }
                },
            ]
            async for doc in db["placement_stats_vectors"].aggregate(pipeline):
                results.append({
                    "type":     "stats",
                    "text":     doc.get("text", ""),
                    "metadata": {
                        "year": doc.get("year", ""),
                        "type": "stats",
                    },
                    "distance": 1.0 - doc.get("score", 0),
                })
        except Exception as e:
            logging.warning(f"VectorStore.search [placement_stats_vectors]: {e}")

        # Sort by distance ascending (most similar first) and return top-N
        results.sort(key=lambda x: x["distance"])
        return results[:n]

    def search(self, query: str, n: int = 10) -> list[dict]:
        """Sync wrapper — runs the async search in a new event loop thread."""
        import asyncio
        return asyncio.run(self.search_async(query, n))

    def clear(self):
        """Remove all embedding fields from documents (full reset)."""
        import asyncio
        from app.db.mongodb import get_database

        async def _clear():
            db = get_database()
            if db is None:
                return
            await db["placement_records"].update_many({}, {"$unset": {"embedding": ""}})
            await db["interview_experience"].update_many({}, {"$unset": {"embedding": ""}})
            await db["placement_stats_vectors"].drop()
            logging.info("VectorStore: all embeddings cleared")

        asyncio.run(_clear())


# Module-level singleton
vector_store = VectorStore()
