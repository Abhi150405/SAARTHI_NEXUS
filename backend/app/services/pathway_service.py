import datetime
from typing import List, Dict, Any, Optional
from app.db.mongodb import get_database


class PathwayService:
    @staticmethod
    def get_target_key(target_name: str, target_type: str) -> str:
        t_type = (target_type or "company").lower().strip()
        t_name = (target_name or "").lower().strip()
        return f"{t_type}:{t_name}"

    async def init_indexes(self):
        """Initializes MongoDB indexes for student pathway progress collection."""
        db = get_database()
        if db is None:
            return
        try:
            # Compound unique index for user + target
            await db['student_pathway_progress'].create_index(
                [("user_email", 1), ("target_key", 1)],
                unique=True
            )
            await db['student_pathway_progress'].create_index("user_email")
            await db['student_pathway_progress'].create_index("updated_at")
            print("[PATHWAY] MongoDB indexes initialized for student_pathway_progress.")
        except Exception as e:
            print(f"[PATHWAY] Index initialization notice: {e}")

    async def save_or_update_progress_from_analysis(
        self,
        user_email: str,
        target_name: str,
        target_type: str,
        result: Dict[str, Any],
        task_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Saves or updates the interactive learning pathway for a student.
        Preserves previously checked-off roadmap steps if the user re-runs analysis.
        """
        db = get_database()
        if db is None or not user_email or user_email.lower().strip() == "guest":
            return None

        email_clean = user_email.lower().strip()
        target_key = self.get_target_key(target_name, target_type)
        now = datetime.datetime.utcnow()

        # Check for existing progress to preserve checked-off steps
        existing = await db['student_pathway_progress'].find_one({
            "user_email": email_clean,
            "target_key": target_key
        })

        existing_completed_steps: Dict[str, set] = {}
        if existing and "missing_skills" in existing:
            for ms in existing["missing_skills"]:
                s_name = ms.get("skill", "").lower().strip()
                comp = ms.get("completed_steps") or []
                if not comp and "roadmap" in ms:
                    comp = [
                        i for i, step in enumerate(ms["roadmap"])
                        if isinstance(step, dict) and step.get("completed")
                    ]
                existing_completed_steps[s_name] = set(comp)

        raw_missing = result.get("missing_skills") or []
        enriched_missing_skills = []
        total_steps = 0
        completed_steps_total = 0
        mastered_skills_count = 0

        for ms in raw_missing:
            s_name = ms.get("skill", "")
            s_name_clean = s_name.lower().strip()
            prev_completed = existing_completed_steps.get(s_name_clean, set())

            raw_roadmap = ms.get("roadmap") or []
            steps = []
            for idx, r_step in enumerate(raw_roadmap):
                step_title = r_step.get("step") if isinstance(r_step, dict) else str(r_step)
                is_done = idx in prev_completed or (isinstance(r_step, dict) and r_step.get("completed", False))
                steps.append({
                    "step_id": idx,
                    "step": step_title,
                    "completed": bool(is_done)
                })
                if is_done:
                    completed_steps_total += 1
                total_steps += 1

            is_all_mastered = len(steps) > 0 and all(st["completed"] for st in steps)
            if is_all_mastered:
                mastered_skills_count += 1

            completed_indices = [st["step_id"] for st in steps if st["completed"]]

            enriched_missing_skills.append({
                "skill": s_name,
                "severity": ms.get("severity", "important"),
                "why_needed": ms.get("why_needed", ""),
                "estimated_days_to_learn": ms.get("estimated_days_to_learn", 14),
                "roadmap": steps,
                "completed_steps": completed_indices,
                "is_mastered": is_all_mastered,
                "resources": ms.get("resources", {})
            })

        initial_match = result.get("match_percentage", 0)
        matched_skills = result.get("matched_skills") or []
        total_analyzed = len(matched_skills) + len(enriched_missing_skills)

        if total_analyzed > 0:
            effective_matches = len(matched_skills) + mastered_skills_count
            current_match = min(100, round((effective_matches / total_analyzed) * 100))
        else:
            current_match = initial_match

        doc = {
            "user_email": email_clean,
            "target_key": target_key,
            "target_name": target_name,
            "target_type": target_type,
            "initial_match_percentage": initial_match,
            "current_match_percentage": max(initial_match, current_match),
            "overall_summary": result.get("overall_summary", ""),
            "priority_skill_to_learn_first": result.get("priority_skill_to_learn_first", ""),
            "estimated_total_preparation_days": result.get("estimated_total_preparation_days", 30),
            "placement_readiness_message": result.get("placement_readiness_message", ""),
            "matched_skills": matched_skills,
            "missing_skills": enriched_missing_skills,
            "total_steps": total_steps,
            "completed_steps": completed_steps_total,
            "status": "mastered" if (total_steps > 0 and completed_steps_total == total_steps) else "in_progress",
            "task_id": task_id,
            "updated_at": now
        }

        if not existing:
            doc["created_at"] = now
            await db['student_pathway_progress'].insert_one(doc)
        else:
            doc["created_at"] = existing.get("created_at", now)
            await db['student_pathway_progress'].update_one(
                {"user_email": email_clean, "target_key": target_key},
                {"$set": doc}
            )

        doc.pop("_id", None)
        return doc

    async def toggle_roadmap_step(
        self,
        user_email: str,
        target_name: str,
        target_type: str,
        skill_name: str,
        step_index: int,
        completed: bool
    ) -> Optional[Dict[str, Any]]:
        """
        Toggles a roadmap step completed status and recalculates the student's match score.
        """
        db = get_database()
        if db is None or not user_email:
            return None

        email_clean = user_email.lower().strip()
        target_key = self.get_target_key(target_name, target_type)

        pathway = await db['student_pathway_progress'].find_one({
            "user_email": email_clean,
            "target_key": target_key
        })
        if not pathway:
            return None

        missing_skills = pathway.get("missing_skills") or []
        skill_found = False
        completed_steps_total = 0
        total_steps = 0
        mastered_skills_count = 0

        for ms in missing_skills:
            if ms.get("skill", "").lower().strip() == skill_name.lower().strip():
                skill_found = True
                roadmap = ms.get("roadmap") or []
                for idx, step in enumerate(roadmap):
                    if idx == step_index or (isinstance(step, dict) and step.get("step_id") == step_index):
                        step["completed"] = completed
                ms["completed_steps"] = [i for i, st in enumerate(roadmap) if st.get("completed")]
                ms["is_mastered"] = len(roadmap) > 0 and all(st.get("completed") for st in roadmap)

            roadmap = ms.get("roadmap") or []
            for st in roadmap:
                total_steps += 1
                if st.get("completed"):
                    completed_steps_total += 1
            if ms.get("is_mastered"):
                mastered_skills_count += 1

        if not skill_found:
            return None

        matched_skills = pathway.get("matched_skills") or []
        total_analyzed = len(matched_skills) + len(missing_skills)
        initial_match = pathway.get("initial_match_percentage", 0)

        if total_analyzed > 0:
            effective_matches = len(matched_skills) + mastered_skills_count
            current_match = min(100, round((effective_matches / total_analyzed) * 100))
        else:
            current_match = initial_match

        now = datetime.datetime.utcnow()
        update_fields = {
            "missing_skills": missing_skills,
            "total_steps": total_steps,
            "completed_steps": completed_steps_total,
            "current_match_percentage": max(initial_match, current_match),
            "status": "mastered" if (total_steps > 0 and completed_steps_total == total_steps) else "in_progress",
            "updated_at": now
        }

        await db['student_pathway_progress'].update_one(
            {"user_email": email_clean, "target_key": target_key},
            {"$set": update_fields}
        )

        pathway.update(update_fields)
        pathway.pop("_id", None)
        return pathway

    async def get_student_pathway(
        self,
        user_email: str,
        target_name: str,
        target_type: str
    ) -> Optional[Dict[str, Any]]:
        """Retrieves a student's active pathway and progress for a target."""
        db = get_database()
        if db is None or not user_email:
            return None
        email_clean = user_email.lower().strip()
        target_key = self.get_target_key(target_name, target_type)
        doc = await db['student_pathway_progress'].find_one(
            {"user_email": email_clean, "target_key": target_key},
            {"_id": 0}
        )
        return doc

    async def get_all_student_pathways(self, user_email: str) -> List[Dict[str, Any]]:
        """Retrieves all tracked pathways for a student."""
        db = get_database()
        if db is None or not user_email:
            return []
        email_clean = user_email.lower().strip()
        cursor = db['student_pathway_progress'].find(
            {"user_email": email_clean},
            {"_id": 0}
        ).sort("updated_at", -1)
        return await cursor.to_list(50)


pathway_service = PathwayService()
