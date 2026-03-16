from fastapi import APIRouter, HTTPException
from app.db.mongodb import get_database

router = APIRouter()

def get_stats(sal_list):
    if not sal_list: return {"avg": "0 LPA", "median": "0 LPA", "highest": "0 LPA"}
    sal_list.sort()
    avg = sum(sal_list) / len(sal_list)
    highest = sal_list[-1]
    n = len(sal_list)
    if n % 2 == 1:
        median = sal_list[n//2]
    else:
        median = (sal_list[n//2 - 1] + sal_list[n//2]) / 2
    return {"avg": f"₹ {avg:.2f} LPA", "median": f"₹ {median:.2f} LPA", "highest": f"₹ {highest} LPA"}

@router.get("/placement-stats")
async def get_placement_stats():
    db = get_database()
    results = await db['placement_records'].find().to_list(None)
    
    yearly_raw = {}
    for r in results:
        year = r.get('academic_year')
        if not year: continue
        if year not in yearly_raw:
            yearly_raw[year] = []
        yearly_raw[year].append(r)
        
    yearly_data = {}
    for year, records in yearly_raw.items():
        compCount = sum(r.get('selections', {}).get('CE', 0) for r in records)
        itCount = sum(r.get('selections', {}).get('IT', 0) for r in records)
        etcCount = sum(r.get('selections', {}).get('E&TC', 0) for r in records)
        totalPlaced = compCount + itCount + etcCount
        
        salaries = []
        ce_salaries, it_salaries, etc_salaries = [], [], []
        
        company_hires = {}
        unique_companies = set()
        branch_unique_companies = {"CE": set(), "IT": set(), "E&TC": set()}
        
        for r in records:
            try:
                s_raw = r.get('salary_lpa', 0)
                s = float(s_raw) if s_raw and str(s_raw).strip() else 0.0
            except (ValueError, TypeError):
                s = 0.0
                
            if s > 0: salaries.append(s)
            
            selections = r.get('selections', {})
            ce_hired = int(selections.get('CE', 0) or 0)
            it_hired = int(selections.get('IT', 0) or 0)
            etc_hired = int(selections.get('E&TC', 0) or 0)
            
            if ce_hired > 0: 
                ce_salaries.extend([s] * ce_hired)
                branch_unique_companies["CE"].add(r.get('company_name'))
            if it_hired > 0: 
                it_salaries.extend([s] * it_hired)
                branch_unique_companies["IT"].add(r.get('company_name'))
            if etc_hired > 0: 
                etc_salaries.extend([s] * etc_hired)
                branch_unique_companies["E&TC"].add(r.get('company_name'))
            
            c_name = r.get('company_name', 'Unknown')
            unique_companies.add(c_name)
            company_hires[c_name] = company_hires.get(c_name, 0) + ce_hired + it_hired + etc_hired
        
        sorted_companies = sorted(company_hires.items(), key=lambda x: x[1], reverse=True)[:5]
        
        def format_branch_stats(stats_dict, count, branch_companies):
            return {
                "totalPlaced": str(count),
                "avgPackage": stats_dict['avg'],
                "medianPackage": stats_dict['median'],
                "highestPackage": stats_dict['highest'],
                "totalCompanies": len(branch_companies)
            }

        yearly_data[year] = {
            "avgPackage": get_stats(salaries)['avg'],
            "medianPackage": get_stats(salaries)['median'],
            "highestPackage": get_stats(salaries)['highest'],
            "totalPlaced": str(totalPlaced),
            "totalCompanies": len(unique_companies),
            "deptDistribution": [compCount, itCount, etcCount],
            "topCompanies": {
                 "labels": [c[0] for c in sorted_companies], 
                 "data": [c[1] for c in sorted_companies]
            },
            "branchStats": {
                "CE": format_branch_stats(get_stats(ce_salaries), compCount, branch_unique_companies["CE"]),
                "IT": format_branch_stats(get_stats(it_salaries), itCount, branch_unique_companies["IT"]),
                "E&TC": format_branch_stats(get_stats(etc_salaries), etcCount, branch_unique_companies["E&TC"])
            }
        }
        
    return {k: yearly_data[k] for k in sorted(yearly_data.keys(), reverse=True)}
