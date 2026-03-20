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
    
    BRANCH_LIST = ['CE', 'IT', 'E&TC', 'E&CE', 'AI&DS']
    
    yearly_raw = {}
    for r in results:
        year = r.get('academic_year')
        if not year: continue
        if year not in yearly_raw:
            yearly_raw[year] = []
        yearly_raw[year].append(r)
        
    yearly_data = {}
    for year, records in yearly_raw.items():
        branch_counts = {b: 0 for b in BRANCH_LIST}
        salaries = []
        branch_salaries = {b: [] for b in BRANCH_LIST}
        
        company_hires = {}
        unique_companies = set()
        branch_unique_companies = {b: set() for b in BRANCH_LIST}
        
        for r in records:
            try:
                s_raw = r.get('salary_lpa', 0)
                s = float(s_raw) if s_raw and str(s_raw).strip() else 0.0
            except (ValueError, TypeError):
                s = 0.0
                
            if s > 0: salaries.append(s)
            
            selections = r.get('selections')
            if not isinstance(selections, dict):
                selections = {}
            
            # Consolate E&CE variations into 'E&CE'
            ece_keys = ['E&CE', 'Electronics and Computer Engineering', 'Electronics & Computer Engineering', 
                        'E&CE(Electronics & Computer Engineering)', 'E&CE(Electronics and Computer Engineering)']
            ece_total = 0
            for key in ece_keys:
                ece_total += int(selections.pop(key, 0) or 0)
            selections['E&CE'] = ece_total
            
            total_hired_this_company = 0
            for b in BRANCH_LIST:
                hired = int(selections.get(b, 0) or 0)
                if hired > 0:
                    branch_counts[b] += hired
                    total_hired_this_company += hired
                    branch_salaries[b].extend([s] * hired)
                    branch_unique_companies[b].add(r.get('company_name'))
            
            c_name = r.get('company_name', 'Unknown')
            unique_companies.add(c_name)
            company_hires[c_name] = company_hires.get(c_name, 0) + total_hired_this_company
        
        totalPlaced = sum(branch_counts.values())
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
            "deptDistribution": [branch_counts[b] for b in BRANCH_LIST],
            "topCompanies": {
                 "labels": [c[0] for c in sorted_companies], 
                 "data": [c[1] for c in sorted_companies]
            },
            "branchStats": {
                b: format_branch_stats(get_stats(branch_salaries[b]), branch_counts[b], branch_unique_companies[b])
                for b in BRANCH_LIST
            }
        }
        
    return {k: yearly_data[k] for k in sorted(yearly_data.keys(), reverse=True)}

