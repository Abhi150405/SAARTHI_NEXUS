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
    # Auto-index vector store if it's empty (first run or after clear)
    try:
        from app.services.vector_store import vector_store
        db = __import__("app.db.mongodb", fromlist=["get_database"]).get_database()
        if not vector_store.is_indexed():
            import asyncio
            logging.info("VectorStore is empty — auto-indexing in background…")
            asyncio.create_task(_run_indexing(db))
        else:
            logging.info("VectorStore already indexed — skipping auto-index.")
    except Exception as e:
        logging.warning(f"VectorStore auto-index skipped: {e}")

async def _run_indexing(db):
    try:
        from app.services.vector_store import vector_store
        await vector_store.index_all(db)
        logging.info("VectorStore: background auto-index complete ✅")
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
