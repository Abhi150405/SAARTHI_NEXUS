import asyncio
import datetime
import uuid
from typing import Optional, List, Dict, Any
from app.db.mongodb import get_database
from app.core.cache import cache
from app.services.skill_analysis_service import (
    AnalysisRequest,
    run_skill_gap_pipeline,
    get_skill_analysis_cache_key
)


class SkillAnalysisQueueService:
    def __init__(self):
        self._queue: asyncio.Queue = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task] = None
        self._is_running: bool = False

    async def start_worker(self):
        """Starts the background worker and recovers pending tasks from MongoDB."""
        if self._is_running:
            return

        self._is_running = True
        self._worker_task = asyncio.create_task(self._worker_loop())
        print("[QUEUE] Skill Analysis Queue Worker started.")

        # Re-enqueue any stranded pending tasks from previous server run
        try:
            db = get_database()
            if db is not None:
                stranded_cursor = db['skill_analysis_tasks'].find({
                    "status": {"$in": ["queued", "processing"]}
                }).sort("created_at", 1)
                stranded_tasks = await stranded_cursor.to_list(50)
                for task in stranded_tasks:
                    task_id = task.get("task_id")
                    if task_id:
                        # Reset status back to queued if it was midway in processing
                        await db['skill_analysis_tasks'].update_one(
                            {"task_id": task_id},
                            {"$set": {
                                "status": "queued",
                                "progress_step": "Re-queued in background worker after server restart",
                                "updated_at": datetime.datetime.utcnow()
                            }}
                        )
                        await self._queue.put(task_id)
                        print(f"[QUEUE] Re-enqueued stranded task: {task_id}")
        except Exception as e:
            print(f"[QUEUE] Error recovering stranded tasks: {e}")

    async def stop_worker(self):
        """Stops the worker gracefully."""
        self._is_running = False
        if self._worker_task and not self._worker_task.done():
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        print("[QUEUE] Skill Analysis Queue Worker stopped.")

    async def enqueue_analysis(self, request: AnalysisRequest, user_email: Optional[str] = None) -> Dict[str, Any]:
        """
        Enqueues an analysis request.
        1. Checks memory cache for instant result.
        2. Checks if an active task for (user_email, target_name) is already running.
        3. Enqueues a new background task and returns task_id immediately.
        """
        email = user_email or (request.student.email if request.student else None) or "guest"
        target_name = request.target.name
        target_type = request.target.type

        # Ensure worker is alive
        if not self._is_running:
            await self.start_worker()

        # 1. Check memory cache for instant hit
        cache_key = get_skill_analysis_cache_key(request)
        hit, cached_result = cache.get(cache_key)
        if hit and cached_result:
            task_id = str(uuid.uuid4())
            now = datetime.datetime.utcnow()
            task_doc = {
                "task_id": task_id,
                "user_email": email,
                "target_name": target_name,
                "target_type": target_type,
                "status": "completed",
                "progress_step": "Analysis ready (instant from cache)",
                "request_payload": request.model_dump(),
                "result": cached_result,
                "error": None,
                "created_at": now,
                "updated_at": now,
                "completed_at": now,
            }
            db = get_database()
            if db is not None:
                try:
                    await db['skill_analysis_tasks'].insert_one(task_doc)
                except Exception as e:
                    print(f"[QUEUE] Error inserting cached task: {e}")

            return {
                "task_id": task_id,
                "status": "completed",
                "target_name": target_name,
                "target_type": target_type,
                "progress_step": "Analysis ready (instant from cache)",
                "result": cached_result,
                "cached": True,
                "created_at": now.isoformat()
            }

        # 2. Check for duplicate running task
        db = get_database()
        if db is not None:
            try:
                active = await db['skill_analysis_tasks'].find_one({
                    "user_email": email,
                    "target_name": target_name,
                    "target_type": target_type,
                    "status": {"$in": ["queued", "processing"]}
                })
                if active:
                    return {
                        "task_id": active["task_id"],
                        "status": active["status"],
                        "target_name": active.get("target_name", target_name),
                        "target_type": active.get("target_type", target_type),
                        "progress_step": active.get("progress_step", "Processing in background..."),
                        "created_at": active.get("created_at").isoformat() if active.get("created_at") else None
                    }
            except Exception as e:
                print(f"[QUEUE] Error checking active tasks: {e}")

        # 3. Create fresh queued task
        task_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow()
        task_doc = {
            "task_id": task_id,
            "user_email": email,
            "target_name": target_name,
            "target_type": target_type,
            "status": "queued",
            "progress_step": "Enqueued in processing pipeline",
            "request_payload": request.model_dump(),
            "result": None,
            "error": None,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        }

        if db is not None:
            try:
                await db['skill_analysis_tasks'].insert_one(task_doc)
            except Exception as e:
                print(f"[QUEUE] Error storing new task: {e}")

        await self._queue.put(task_id)

        return {
            "task_id": task_id,
            "status": "queued",
            "target_name": target_name,
            "target_type": target_type,
            "progress_step": "Enqueued in processing pipeline",
            "created_at": now.isoformat()
        }

    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves task state and result by task_id."""
        db = get_database()
        if db is None:
            return None

        task = await db['skill_analysis_tasks'].find_one({"task_id": task_id})
        if not task:
            return None

        return self._format_task_doc(task)

    async def get_latest_task(self, user_email: str, target_name: Optional[str] = None, target_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves the latest task for a given user and target."""
        db = get_database()
        if db is None:
            return None

        query: Dict[str, Any] = {"user_email": user_email}
        if target_name:
            query["target_name"] = target_name
        if target_type:
            query["target_type"] = target_type

        task = await db['skill_analysis_tasks'].find(query).sort("created_at", -1).limit(1).to_list(1)
        if not task:
            return None

        return self._format_task_doc(task[0])

    async def get_active_tasks(self, user_email: str) -> List[Dict[str, Any]]:
        """Returns all currently queued or processing tasks for this user."""
        db = get_database()
        if db is None:
            return []

        cursor = db['skill_analysis_tasks'].find({
            "user_email": user_email,
            "status": {"$in": ["queued", "processing"]}
        }).sort("created_at", -1)

        tasks = await cursor.to_list(20)
        return [self._format_task_doc(t) for t in tasks]

    def _format_task_doc(self, doc: dict) -> dict:
        """Helper to sanitize MongoDB document into JSON-serializable dict."""
        created_at = doc.get("created_at")
        updated_at = doc.get("updated_at")
        completed_at = doc.get("completed_at")

        return {
            "task_id": doc.get("task_id"),
            "user_email": doc.get("user_email"),
            "target_name": doc.get("target_name"),
            "target_type": doc.get("target_type"),
            "status": doc.get("status"),
            "progress_step": doc.get("progress_step"),
            "result": doc.get("result"),
            "error": doc.get("error"),
            "created_at": created_at.isoformat() if isinstance(created_at, datetime.datetime) else created_at,
            "updated_at": updated_at.isoformat() if isinstance(updated_at, datetime.datetime) else updated_at,
            "completed_at": completed_at.isoformat() if isinstance(completed_at, datetime.datetime) else completed_at,
        }

    async def _worker_loop(self):
        """Background worker that continuously pulls tasks from the queue."""
        while self._is_running:
            task_id = None
            try:
                task_id = await self._queue.get()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[QUEUE] Error getting task: {e}")
                continue

            try:
                db = get_database()
                if db is None:
                    print(f"[QUEUE] MongoDB not available for task {task_id}")
                    continue

                task = await db['skill_analysis_tasks'].find_one({"task_id": task_id})
                if not task:
                    print(f"[QUEUE] Task {task_id} not found in DB.")
                    continue

                # Don't re-run completed tasks
                if task.get("status") == "completed" and task.get("result"):
                    continue

                # Update status to processing
                now = datetime.datetime.utcnow()
                await db['skill_analysis_tasks'].update_one(
                    {"task_id": task_id},
                    {"$set": {
                        "status": "processing",
                        "progress_step": "Comparing skills against placement intelligence models...",
                        "updated_at": now
                    }}
                )

                # Reconstruct AnalysisRequest
                request_payload = task.get("request_payload") or {}
                request_obj = AnalysisRequest(**request_payload)

                # Run the actual analysis pipeline
                result = await run_skill_gap_pipeline(request_obj)

                completed_at = datetime.datetime.utcnow()
                await db['skill_analysis_tasks'].update_one(
                    {"task_id": task_id},
                    {"$set": {
                        "status": "completed",
                        "progress_step": "Analysis complete",
                        "result": result,
                        "completed_at": completed_at,
                        "updated_at": completed_at
                    }}
                )
                print(f"[QUEUE] Task {task_id} successfully completed for {task.get('target_name')}.")

                # Add notification
                try:
                    user_email = task.get("user_email")
                    target_name = task.get("target_name", "Target")
                    if user_email and user_email != "guest":
                        await db['notifications'].insert_one({
                            "message": f"Skill Gap Analysis for {target_name} is complete and ready to view!",
                            "user_email": user_email,
                            "type": "skill_analysis_ready",
                            "target_name": target_name,
                            "target_type": task.get("target_type", "company"),
                            "task_id": task_id,
                            "created_at": completed_at
                        })
                except Exception as ne:
                    print(f"[QUEUE] Notification insertion error: {ne}")

            except Exception as e:
                print(f"[QUEUE] Task {task_id} failed with error: {e}")
                db = get_database()
                if db is not None and task_id:
                    try:
                        await db['skill_analysis_tasks'].update_one(
                            {"task_id": task_id},
                            {"$set": {
                                "status": "failed",
                                "progress_step": "Analysis failed",
                                "error": str(e),
                                "updated_at": datetime.datetime.utcnow()
                            }}
                        )
                    except Exception as ue:
                        print(f"[QUEUE] Failed to update error state in DB: {ue}")

            finally:
                if task_id:
                    self._queue.task_done()


skill_queue_service = SkillAnalysisQueueService()
