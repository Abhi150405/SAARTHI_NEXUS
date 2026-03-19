from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chatbot_service import chatbot_service
from app.db.mongodb import get_database
import re

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
    
    # Retrieval logic (simplified for now, matching Flask)
    # In a real app, this should be in a separate repository/service
    query_lower = query.lower()
    companies = await collection.distinct("company_name")
    
    found_companies = [c for c in companies if re.search(rf"\b{re.escape(c.lower())}\b", query_lower)]
    found_years = re.findall(r"(?:20)?\d{2}-\d{2}|20\d{2}", query)
    
    context_parts = []
    query_filter = {}
    
    if found_companies and found_years:
        query_filter = {"company_name": {"$in": found_companies}, "academic_year": {"$in": found_years}}
    elif found_companies:
        query_filter = {"company_name": {"$in": found_companies}}
    elif found_years:
        query_filter = {"academic_year": {"$in": found_years}}
    
    if query_filter:
        docs = await collection.find(query_filter).sort([("academic_year", -1), ("salary_lpa", -1)]).to_list(20)
        for d in docs:
            hires = d['selections']['CE'] + d['selections']['IT'] + d['selections']['E&TC']
            context_parts.append(
                f"Year: {d['academic_year']} | Company: {d['company_name']} | Salary: {d['salary_lpa']} LPA | "
                f"Hired: {hires} (CE: {d['selections']['CE']}, IT: {d['selections']['IT']}, E&TC: {d['selections']['E&TC']}) | "
                f"Criteria: {d.get('criteria', {}).get('min_cgpa', 'N/A')} CGPA"
            )
    
    context_string = "\n".join(context_parts) if context_parts else "No specific database records found for this query."
    
    return StreamingResponse(
        chatbot_service.get_chat_response_stream(query, context_string, is_first_message),
        media_type="text/plain"
    )
    # Note: Flask had some headers like X-Accel-Buffering, which can be added if needed via custom response
