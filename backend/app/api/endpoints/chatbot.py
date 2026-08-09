from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chatbot_service import chatbot_service
from app.services.stats_service import stats_service
from app.services.vector_store import vector_store
from app.db.mongodb import get_database
from bson import ObjectId
import re
import logging

router = APIRouter()

async def _build_context_from_rag(query: str, db) -> str:
    """
    Perform fast semantic vector search via MongoDB Atlas $vectorSearch,
    or fallback instantly to direct MongoDB keyword queries.
    Never blocks or triggers heavy indexing during chat execution.
    """
    results = []

    # 1. MongoDB Atlas Vector Search (cosine similarity via $vectorSearch)
    try:
        raw_results = await vector_store.search_async(query, n=8)
        # Filter to high-confidence results (distance < 0.35 → similarity > 0.65)
        results = [r for r in raw_results if r.get("distance", 2.0) < 0.35]
    except Exception as e:
        logging.warning(f"Vector search skipped: {e}")

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
async def chat(request: Request):
    data = await request.json()
    query = data.get('query', '')
    is_first_message = data.get('is_first_message', False)
    
    if not query:
        raise HTTPException(status_code=400, detail="No query provided")

    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    collection = db['placement_records']
    
    query_lower = query.lower()
    
    # ── Detect Statistical Intent ───────────────────────────────────
    is_stats_query = any(word in query_lower for word in ["average", "median", "highest", "stats", "placement report", "total", "statistic", "package"])
    
    context_parts = []
    
    # ── Handle Statistics Queries specifically ─────────────────────
    if is_stats_query:
        found_years = re.findall(r"(?:20)?\d{2}-\d{2}|20\d{2}", query)
        logging.info(f"Chatbot: detected stats query. Found years: {found_years}")
        
        if found_years:
            for yr in found_years:
                stats = await stats_service.get_stats_for_year(yr)
                if stats:
                    context_parts.append(
                        f"📊 STATS for Academic Year {yr}:\n"
                        f"- Highest Package: {stats['highestPackage']}\n"
                        f"- Average Package: {stats['avgPackage']}\n"
                        f"- Median Package: {stats['medianPackage']}\n"
                        f"- Total Companies visited: {stats['totalCompanies']}\n"
                        f"- Total Students Placed: {stats['totalPlaced']}\n"
                        f"- Branch-wise stats (Placed | Avg | Highest):\n"
                        + "\n".join([f"  • {b}: {s['totalPlaced']} placed, {s['highestPackage']} highest, {s['avgPackage']} avg" 
                                   for b, s in stats['branchStats'].items() if int(s['totalPlaced']) > 0])
                    )
        else:
            # Overall stats
            stats = await stats_service.get_stats_for_year(None)
            if stats:
                context_parts.append(
                    f"📊 OVERALL PLACEMENT STATS (Across all years):\n"
                    f"- Highest Package: {stats['highestPackage']}\n"
                    f"- Average Package: {stats['avgPackage']}\n"
                    f"- Median Package: {stats['medianPackage']}\n"
                    f"- Total Companies visited: {stats['totalCompanies']}\n"
                    f"- Total Students Placed: {stats['totalPlaced']}\n"
                )

    # ── Conventional Company/Year Retrieval ──────────────────────────
    companies = await collection.distinct("company_name")
    found_companies = [c for c in companies if re.search(rf"\b{re.escape(c.lower())}\b", query_lower)]
    found_years = re.findall(r"(?:20)?\d{2}-\d{2}|20\d{2}", query)
    
    query_filter = {}
    if found_companies and found_years:
        query_filter = {"company_name": {"$in": found_companies}, "academic_year": {"$in": found_years}}
    elif found_companies:
        query_filter = {"company_name": {"$in": found_companies}}
    elif not is_stats_query and found_years: # Only do basic year search if we didn't already get stats
        query_filter = {"academic_year": {"$in": found_years}}
    
    if query_filter:
        docs = await collection.find(query_filter).sort([("academic_year", -1), ("salary_lpa", -1)]).to_list(15)
        for d in docs:
            hires = d['selections']['CE'] + d['selections']['IT'] + d['selections']['E&TC']
            context_parts.append(
                f"Record for {d['academic_year']} | Company: {d['company_name']} | Salary: {d['salary_lpa']} LPA | "
                f"Hired: {hires} (CE: {d['selections']['CE']}, IT: {d['selections']['IT']}, E&TC: {d['selections']['E&TC']}) | "
                f"Criteria: {d.get('criteria', {}).get('min_cgpa', 'N/A')} CGPA"
            )

    # ── Inject Interview Experiences ────────────────────────────────
    exp_collection = db['interview_experience']
    is_interview_query = any(word in query_lower for word in ["interview", "experience", "rounds", "questions", "asked", "process"])
    
    if found_companies:
        exps = await exp_collection.find({"company_name": {"$in": found_companies}}).sort("date", -1).to_list(5)
        if exps:
            context_parts.append("--- RECENT INTERVIEW EXPERIENCES ---")
            for exp in exps:
                exp_id = str(exp.get("_id", ""))
                link_text = f"\n  EXPERIENCE_LINK: /#/app/experience/{exp_id}" if exp_id else ""
                context_parts.append(
                    f"Company: {exp['company_name']} | Role: {exp.get('role', 'N/A')} | "
                    f"Rounds: {exp.get('rounds', 'N/A')} | "
                    f"Experience: {exp.get('experience', '')[:600]}... | "
                    f"Suggestions: {exp.get('suggestions', '')[:200]}"
                    f"{link_text}"
                )
    elif is_interview_query:
        exps = await exp_collection.find().sort("date", -1).to_list(3)
        if exps:
            context_parts.append("--- SOME RECENT INTERVIEW EXPERIENCES ---")
            for exp in exps:
                exp_id = str(exp.get("_id", ""))
                link_text = f"\n  EXPERIENCE_LINK: /#/app/experience/{exp_id}" if exp_id else ""
                context_parts.append(
                    f"Company: {exp['company_name']} | Role: {exp.get('role', 'N/A')} | "
                    f"Rounds: {exp.get('rounds', 'N/A')} | "
                    f"Experience: {exp.get('experience', '')[:300]}..."
                    f"{link_text}"
                )

    context_string = "\n\n".join(context_parts) if context_parts else "No specific database records found for this query."
    
    return StreamingResponse(
        chatbot_service.get_chat_response_stream(query, context_string, is_first_message),
        media_type="text/plain"
    )
