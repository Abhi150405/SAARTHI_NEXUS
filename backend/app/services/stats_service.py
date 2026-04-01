from app.db.mongodb import get_database
import logging

class StatsService:
    def calculate_metrics(self, sal_list):
        if not sal_list: 
            return {"avg": "0 LPA", "median": "0 LPA", "highest": "0 LPA", "raw_avg": 0, "raw_median": 0, "raw_highest": 0}
        
        sal_list.sort()
        highest = sal_list[-1]
        avg = sum(sal_list) / len(sal_list)
        
        n = len(sal_list)
        if n % 2 == 1:
            median = sal_list[n//2]
        else:
            median = (sal_list[n//2 - 1] + sal_list[n//2]) / 2
            
        return {
            "avg": f"₹ {avg:.2f} LPA", 
            "median": f"₹ {median:.2f} LPA", 
            "highest": f"₹ {highest} LPA",
            "raw_avg": avg,
            "raw_median": median,
            "raw_highest": highest
        }

    async def get_stats_for_year(self, year: str = None):
        """
        Calculates detailed placement statistics for a specific year or overall if year is None.
        """
        db = get_database()
        query = {"academic_year": year} if year else {}
        results = await db['placement_records'].find(query).to_list(None)
        
        if not results:
            return None

        BRANCH_LIST = ['CE', 'IT', 'E&TC', 'AI&DS', 'E&CE']
        salaries = []
        branch_counts = {b: 0 for b in BRANCH_LIST}
        branch_salaries = {b: [] for b in BRANCH_LIST}
        unique_companies = set()
        
        for r in results:
            try:
                s_raw = r.get('salary_lpa', 0)
                s = float(s_raw) if s_raw and str(s_raw).strip() else 0.0
            except (ValueError, TypeError):
                s = 0.0
                
            if s > 0: 
                salaries.append(s)
            
            c_name = r.get('company_name', 'Unknown')
            unique_companies.add(c_name)
            
            selections = r.get('selections', {})
            # Handle branch selection variations
            for b in BRANCH_LIST:
                count = int(selections.get(b, 0) or 0)
                if count > 0:
                    branch_counts[b] += count
                    branch_salaries[b].extend([s] * count)

        overall_metrics = self.calculate_metrics(salaries)
        
        branch_stats = {}
        for b in BRANCH_LIST:
            m = self.calculate_metrics(branch_salaries[b])
            branch_stats[b] = {
                "totalPlaced": str(branch_counts[b]),
                "avgPackage": m['avg'],
                "medianPackage": m['median'],
                "highestPackage": m['highest']
            }

        return {
            "year": year if year else "Overall",
            "avgPackage": overall_metrics['avg'],
            "medianPackage": overall_metrics['median'],
            "highestPackage": overall_metrics['highest'],
            "totalPlaced": str(sum(branch_counts.values())),
            "totalCompanies": len(unique_companies),
            "branchStats": branch_stats
        }

    async def get_all_years_stats(self):
        db = get_database()
        years = await db['placement_records'].distinct("academic_year")
        all_stats = {}
        for y in sorted(years, reverse=True):
            stats = await self.get_stats_for_year(y)
            if stats:
                all_stats[y] = stats
        return all_stats

stats_service = StatsService()
