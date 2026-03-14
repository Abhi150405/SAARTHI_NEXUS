from fastapi import APIRouter, HTTPException, Query
from app.db.mongodb import get_database
import datetime

router = APIRouter()

def parse_date(ds):
    if not ds or str(ds).upper() in ['PPO', 'NC', 'NAN', 'NULL', 'NONE']: return None
    ds = str(ds).strip()
    try:
        parts = ds.split('-')
        if len(parts) == 3:
            if len(parts[2]) == 2:
                return datetime.datetime.strptime(ds, '%d-%m-%y')
            else:
                return datetime.datetime.strptime(ds, '%d-%m-%Y')
    except: pass
    return None

@router.get("/companies")
async def get_companies():
    db = get_database()
    pipeline = [
        {
            "$group": {
                "_id": "$company_name",
                "totalHires": { "$sum": { "$add": ["$selections.CE", "$selections.IT", "$selections.E&TC"] } },
                "yearsVisited": { "$addToSet": "$academic_year" },
                "maxSalary": { "$max": "$salary_lpa" },
                "minCgpa": { "$min": "$criteria.min_cgpa" },
                "visitDates": { "$addToSet": "$visit_date" }
            }
        },
        { "$sort": { "_id": 1 } }
    ]
    results = await db['placement_records'].aggregate(pipeline).to_list(None)
    
    formatted_results = []
    for res in results:
        parsed_dates = [parse_date(d) for d in res.get('visitDates', [])]
        valid_dates = [d for d in parsed_dates if d is not None]
        latest_date_iso = max(valid_dates).isoformat() if valid_dates else None

        formatted_results.append({
            "company": res['_id'],
            "totalHires": res['totalHires'],
            "visits": len(res['yearsVisited']),
            "years": sorted(list(res['yearsVisited']), reverse=True),
            "maxSalary": f"{res['maxSalary']} LPA",
            "minCgpa": res['minCgpa'],
            "latestVisitDate": latest_date_iso
        })
    return formatted_results

@router.get("/company/{name}")
async def get_company_details(name: str):
    db = get_database()
    records = await db['placement_records'].find({"company_name": name}).sort("academic_year", -1).to_list(None)
    
    if not records:
        raise HTTPException(status_code=404, detail="Company not found")
        
    history = []
    total_hires = 0
    for rec in records:
        hires = rec['selections']['CE'] + rec['selections']['IT'] + rec['selections']['E&TC']
        total_hires += hires
        history.append({
            "year": rec['academic_year'],
            "salary": f"{rec['salary_lpa']} LPA",
            "hires": hires,
            "dept_breakdown": rec['selections'],
            "gender_breakdown": rec.get('gender_distribution', {"male": 0, "female": 0, "total": 0}),
            "visit_date": rec.get('visit_date', None),
            "criteria": rec['criteria'],
            "category": rec.get('category', 'N/A')
        })
        
    return {
        "name": name,
        "total_hires": total_hires,
        "visit_count": len(history),
        "history": history
    }
