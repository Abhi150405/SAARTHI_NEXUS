from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chatbot_service import chatbot_service
from app.services.stats_service import stats_service
from app.services.vector_store import vector_store
from app.db.mongodb import get_database
from bson import ObjectId
import logging
import re

router = APIRouter()


async def _build_context_from_rag(query: str, db) -> str:
    """
    Perform fast semantic vector search or fallback instantly to MongoDB queries.
    Never blocks or triggers heavy indexing during chat execution to prevent 
    timeouts and OOM crashes on 512MB RAM cloud environments (Render).
    """
    results = []

    # 1. Try vector store search with strict safety & fallback
    try:
        if vector_store.is_indexed():
            import asyncio
            # Limit vector search wait time to 1.5s max
            raw_results = await asyncio.wait_for(
                vector_store.search_async(query, n=8), 
                timeout=1.5
            )
            results = [r for r in raw_results if r.get("distance", 2.0) < 1.35]
            if not results and raw_results:
                results = raw_results[:3]
    except Exception as e:
        logging.warning(f"Vector search skipped/timed out: {e}")

    context_parts = []
    seen_mongo_ids = set()

    # 2. Process vector search results if found
    if results:
        placement_results  = [r for r in results if r["type"] == "placement"]
        experience_results = [r for r in results if r["type"] == "experience"]
        stats_results      = [r for r in results if r["type"] == "stats"]

        if placement_results:
            placement_ids = []
            for r in placement_results:
                mid = r["metadata"].get("mongo_id")
                if mid and mid not in seen_mongo_ids:
                    seen_mongo_ids.add(mid)
                    try:
                        placement_ids.append(ObjectId(mid))
                    except Exception:
                        pass

            if placement_ids:
                docs = await db["placement_records"].find(
                    {"_id": {"$in": placement_ids}}
                ).to_list(None)

                if docs:
                    context_parts.append("📋 RELEVANT PLACEMENT RECORDS:")
                    for d in docs:
                        sel = d.get("selections", {})
                        ce, it, etc, aids = sel.get("CE", 0), sel.get("IT", 0), sel.get("E&TC", 0), sel.get("AI&DS", 0)
                        total = int(ce) + int(it) + int(etc) + int(aids)
                        cgpa = d.get("criteria", {}).get("min_cgpa", "N/A")
                        context_parts.append(
                            f"  • [{d.get('academic_year', 'N/A')}] {d.get('company_name', 'N/A')} — "
                            f"{d.get('salary_lpa', 'N/A')} LPA | Hired: {total} students "
                            f"(CE: {ce}, IT: {it}, E&TC: {etc}, AI&DS: {aids}) | Min CGPA: {cgpa}"
                        )

        if experience_results:
            exp_ids = []
            for r in experience_results:
                mid = r["metadata"].get("mongo_id")
                if mid and mid not in seen_mongo_ids:
                    seen_mongo_ids.add(mid)
                    try:
                        exp_ids.append(ObjectId(mid))
                    except Exception:
                        pass

            if exp_ids:
                exps = await db["interview_experience"].find(
                    {"_id": {"$in": exp_ids}}
                ).to_list(None)

                if exps:
                    context_parts.append("\n🎤 RELEVANT INTERVIEW EXPERIENCES:")
                    for exp in exps:
                        exp_id = str(exp.get("_id", ""))
                        experience_link = f"#/app/experience/{exp_id}" if exp_id else None
                        link_text = f"\n  EXPERIENCE_LINK: {experience_link}" if experience_link else ""
                        context_parts.append(
                            f"  Company: {exp.get('company_name', 'N/A')} | "
                            f"Role: {exp.get('role', 'N/A')} | "
                            f"Rounds: {exp.get('rounds', 'N/A')}\n"
                            f"  Experience: {exp.get('experience', '')[:600]}\n"
                            f"  Tips: {exp.get('suggestions', '')[:300]}"
                            f"{link_text}"
                        )

        if stats_results:
            years_seen = set()
            context_parts.append("\n📊 RELEVANT PLACEMENT STATISTICS:")
            for r in stats_results[:3]:
                year = r["metadata"].get("year")
                if year and year not in years_seen:
                    years_seen.add(year)
                    stats = await stats_service.get_stats_for_year(year)
                    if stats:
                        branch_lines = "  ".join([
                            f"{b}: {s['totalPlaced']} placed (avg {s['avgPackage']})"
                            for b, s in stats.get("branchStats", {}).items()
                            if int(s.get("totalPlaced", 0)) > 0
                        ])
                        context_parts.append(
                            f"  [{year}] Total placed: {stats.get('totalPlaced', 0)} students | "
                            f"{stats.get('totalCompanies', 0)} companies | "
                            f"Highest: {stats.get('highestPackage', 'N/A')} | "
                            f"Avg: {stats.get('avgPackage', 'N/A')} | "
                            f"Median: {stats.get('medianPackage', 'N/A')}\n"
                            f"  Branch-wise: {branch_lines}"
                        )

    # 3. Direct Fast MongoDB Retrieval (Instant Fallback if vector store had no context)
    if not context_parts:
        logging.info("Chatbot: Using Instant Direct MongoDB Search Fallback")
        words = [w for w in re.findall(r"\w+", query.lower()) if len(w) > 2]
        
        if words:
            # Clean non-stopword terms
            stopwords = {"what", "which", "how", "many", "tell", "about", "pict", "the", "and", "for", "are", "were", "with", "does", "have", "company", "placement", "placements", "salary", "package", "hired", "students"}
            search_terms = [w for w in words if w not in stopwords]
            regex_pattern = "|".join(search_terms if search_terms else words)
            
            # a) Query Placement Records
            fallback_records = await db["placement_records"].find(
                {"company_name": {"$regex": regex_pattern, "$options": "i"}}
            ).to_list(10)

            if fallback_records:
                context_parts.append("📋 RELEVANT PLACEMENT RECORDS:")
                for d in fallback_records:
                    sel = d.get("selections", {})
                    ce, it, etc, aids = sel.get("CE", 0), sel.get("IT", 0), sel.get("E&TC", 0), sel.get("AI&DS", 0)
                    total = int(ce) + int(it) + int(etc) + int(aids)
                    cgpa = d.get("criteria", {}).get("min_cgpa", "N/A")
                    context_parts.append(
                        f"  • [{d.get('academic_year', 'N/A')}] {d.get('company_name', 'N/A')} — "
                        f"{d.get('salary_lpa', 'N/A')} LPA | Hired: {total} students "
                        f"(CE: {ce}, IT: {it}, E&TC: {etc}, AI&DS: {aids}) | Min CGPA: {cgpa}"
                    )

            # b) Query Interview Experiences
            exp_records = await db["interview_experience"].find(
                {"$or": [
                    {"company_name": {"$regex": regex_pattern, "$options": "i"}},
                    {"role": {"$regex": regex_pattern, "$options": "i"}}
                ]}
            ).to_list(5)

            if exp_records:
                context_parts.append("\n🎤 RELEVANT INTERVIEW EXPERIENCES:")
                for exp in exp_records:
                    exp_id = str(exp.get("_id", ""))
                    experience_link = f"#/app/experience/{exp_id}" if exp_id else None
                    link_text = f"\n  EXPERIENCE_LINK: {experience_link}" if experience_link else ""
                    context_parts.append(
                        f"  Company: {exp.get('company_name', 'N/A')} | "
                        f"Role: {exp.get('role', 'N/A')} | "
                        f"Rounds: {exp.get('rounds', 'N/A')}\n"
                        f"  Experience: {exp.get('experience', '')[:600]}\n"
                        f"  Tips: {exp.get('suggestions', '')[:300]}"
                        f"{link_text}"
                    )

        # c) Check for stats query keywords
        if any(term in query.lower() for term in ["stat", "total", "highest", "average", "avg", "placed", "branch", "202", "201"]):
            all_stats = await stats_service.get_all_years_stats()
            if all_stats:
                context_parts.append("\n📊 RELEVANT PLACEMENT STATISTICS:")
                for year, stats in list(all_stats.items())[:3]:
                    branch_lines = "  ".join([
                        f"{b}: {s['totalPlaced']} placed (avg {s['avgPackage']})"
                        for b, s in stats.get("branchStats", {}).items()
                        if int(s.get("totalPlaced", 0)) > 0
                    ])
                    context_parts.append(
                        f"  [{year}] Total placed: {stats.get('totalPlaced', 0)} students | "
                        f"{stats.get('totalCompanies', 0)} companies | "
                        f"Highest: {stats.get('highestPackage', 'N/A')} | "
                        f"Avg: {stats.get('avgPackage', 'N/A')} | "
                        f"Median: {stats.get('medianPackage', 'N/A')}\n"
                        f"  Branch-wise: {branch_lines}"
                    )

    return "\n".join(context_parts) if context_parts else "No specific database records found for this query."


@router.post("/chat")
@router.post("/chatbot/chat")
async def chat(request: Request):
    data = await request.json()
    query = data.get("query", "")
    is_first_message = data.get("is_first_message", False)

    if not query:
        raise HTTPException(status_code=400, detail="No query provided")

    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # ── RAG: Fast semantic vector search + robust MongoDB direct search fallback ──
    context_string = await _build_context_from_rag(query, db)
    logging.info(f"Chatbot [RAG]: context built ({len(context_string)} chars)")

    return StreamingResponse(
        chatbot_service.get_chat_response_stream(query, context_string, is_first_message),
        media_type="text/plain",
    )

