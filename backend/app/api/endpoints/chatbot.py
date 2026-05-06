from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chatbot_service import chatbot_service
from app.services.stats_service import stats_service
from app.db.mongodb import get_database
import re
import logging

router = APIRouter()

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
                context_parts.append(
                    f"Company: {exp['company_name']} | Role: {exp.get('role', 'N/A')} | "
                    f"Rounds: {exp.get('rounds', 'N/A')} | "
                    f"Experience: {exp.get('experience', '')[:600]}... | "
                    f"Suggestions: {exp.get('suggestions', '')[:200]}"
                )
    elif is_interview_query:
        exps = await exp_collection.find().sort("date", -1).to_list(3)
        if exps:
            context_parts.append("--- SOME RECENT INTERVIEW EXPERIENCES ---")
            for exp in exps:
                context_parts.append(
                    f"Company: {exp['company_name']} | Role: {exp.get('role', 'N/A')} | "
                    f"Rounds: {exp.get('rounds', 'N/A')} | "
                    f"Experience: {exp.get('experience', '')[:300]}..."
                )

    context_string = "\n\n".join(context_parts) if context_parts else "No specific database records found for this query."
    
    return StreamingResponse(
        chatbot_service.get_chat_response_stream(query, context_string, is_first_message),
        media_type="text/plain"
    )
