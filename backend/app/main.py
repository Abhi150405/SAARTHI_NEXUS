import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection

app = FastAPI(title=settings.PROJECT_NAME)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    # Auto-index vector embeddings into MongoDB if any docs are missing them.
    # Uses Google text-embedding-004 API — zero local RAM cost, safe on all tiers.
    try:
        from app.services.vector_store import vector_store
        from app.db.mongodb import get_database
        import asyncio
        db = get_database()
        if db is not None:
            has_embeddings = await vector_store.is_indexed_async(db)
            if not has_embeddings:
                logging.info("VectorStore: no embeddings found — auto-indexing in background…")
                asyncio.create_task(_run_indexing(db))
            else:
                logging.info("VectorStore: embeddings already present — skipping auto-index.")
    except Exception as e:
        logging.warning(f"VectorStore startup check skipped: {e}")

async def _run_indexing(db):
    try:
        from app.services.vector_store import vector_store
        counts = await vector_store.index_all(db)
        logging.info(f"VectorStore: background auto-index complete ✅ — {counts}")
    except Exception as e:
        logging.error(f"VectorStore: background auto-index failed — {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include API router
app.include_router(api_router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "SAARTHI NEXUS API is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
