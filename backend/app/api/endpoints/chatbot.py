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
    if not query:
        raise HTTPException(status_code=400, detail="No query provided")

    db = get_database()
    collection = db['placement_records']
    
    # Retrieval logic (simplified for now, matching Flask)
    # In a real app, this should be in a separate repository/service
    query_lower = query.lower()
    companies = await collection.distinct("company_name")
    
    found_companies = [c for c in companies if re.search(rf"\b{re.escape(c.lower())}\b", query_lower)]
    found_years = re.findall(r"20\d{2}", query)
    
    context_parts = []
    if found_companies:
        docs = await collection.find({"company_name": {"$in": found_companies}}).sort("academic_year", -1).to_list(10)
        for d in docs:
            hires = d['selections']['CE'] + d['selections']['IT'] + d['selections']['E&TC']
            context_parts.append(f"Company: {d['company_name']} ({d['academic_year']}) | Salary: {d['salary_lpa']} LPA | Total Hired: {hires}")
    
    context_string = "\n".join(context_parts) if context_parts else "PICT has excellent placements with top recruiters."
    
    return StreamingResponse(
        chatbot_service.get_chat_response_stream(query, context_string),
        media_type="text/plain"
    )
    # Note: Flask had some headers like X-Accel-Buffering, which can be added if needed via custom response
