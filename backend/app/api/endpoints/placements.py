from fastapi import APIRouter, Query, Path
from app.db.mongodb import get_database
from typing import Optional
import math

router = APIRouter()

COLLECTION = "placement_records"

# ─────────────────────────────────────────────────────────────────
# Helper: derive tier string from category field
# ─────────────────────────────────────────────────────────────────
def derive_tier(category: str) -> str:
    if not category:
        return "MASS"
    c = category.upper()
    if "SUPER DREAM" in c or "SUPER-DREAM" in c:
        return "SUPER_DREAM"
    if "DREAM" in c:
        return "DREAM"
    if "GROUP I" in c or "GROUP 1" in c:
        return "GROUP_I"
    if "GROUP II" in c or "GROUP 2" in c:
        return "GROUP_II"
    return "MASS"


# ─────────────────────────────────────────────────────────────────
# A) GET /placements/visit-frequency
# ─────────────────────────────────────────────────────────────────
@router.get("/visit-frequency")
async def visit_frequency():
    """
    Returns heatmap data: for every company, how many were hired each year.
    available_years is DERIVED from the data — never hardcoded.
    """
    db = get_database()

    # Step 1: group by (company, year) → get per-year hired counts
    company_year_pipeline = [
        {
            "$group": {
                "_id": {"company": "$company_name", "year": "$academic_year"},
                "hired": {"$sum": "$gender_distribution.total"}
            }
        },
        {
            "$group": {
                "_id": "$_id.company",
                "years": {"$push": {"year": "$_id.year", "hired": "$hired"}},
                "total_hired": {"$sum": "$hired"}
            }
        },
        {"$sort": {"total_hired": -1}}
    ]

    # Step 2: derive available_years from a distinct query on the same collection
    company_docs = await db[COLLECTION].aggregate(company_year_pipeline).to_list(None)
    raw_years = await db[COLLECTION].distinct("academic_year")
    available_years = sorted([y for y in raw_years if y], reverse=False)

    companies = []
    for doc in company_docs:
        years_obj = {}
        for entry in doc.get("years", []):
            years_obj[entry["year"]] = entry["hired"]
        companies.append({
            "company": doc["_id"],
            "years": years_obj,
            "total_hired": doc["total_hired"]
        })

    return {
        "available_years": available_years,
        "companies": companies
    }


# ─────────────────────────────────────────────────────────────────
# B) GET /placements/hall-of-offers
# ─────────────────────────────────────────────────────────────────
@router.get("/hall-of-offers")
async def hall_of_offers(
    year: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    sort: Optional[str] = Query("salary_desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    visit_type: Optional[str] = Query(None)
):
    """
    Paginated, filterable list of placement offers.
    Every derived field (tier, visit_type, hiring_branches) is computed here
    from the raw doc — never stored as a separate static lookup.
    """
    db = get_database()

    match = {}
    if year and year != "all":
        match["academic_year"] = year
    if search:
        match["company_name"] = {"$regex": search, "$options": "i"}
    if branch:
        match[f"selections.{branch}"] = {"$gt": 0}
    if visit_type == "PPO":
        match["$or"] = [
            {"visit_date": "PPO"},
            {"criteria.min_cgpa": "PPO"}
        ]

    sort_map = {
        "salary_desc": [("salary_lpa", -1)],
        "salary_asc":  [("salary_lpa", 1)],
        "hired_desc":  [("gender_distribution.total", -1)],
        "company_asc": [("company_name", 1)]
    }
    sort_spec = sort_map.get(sort, sort_map["salary_desc"])

    total = await db[COLLECTION].count_documents(match)
    cursor = db[COLLECTION].find(match).sort(sort_spec).skip((page - 1) * limit).limit(limit)
    raw_docs = await cursor.to_list(None)

    offers = []
    for doc in raw_docs:
        # Derive hiring_branches from selections where count > 0
        hiring_branches = []
        selections = doc.get("selections") or {}
        if isinstance(selections, dict):
            for br, cnt in selections.items():
                try:
                    if int(cnt or 0) > 0:
                        hiring_branches.append(br)
                except (ValueError, TypeError):
                    pass

        # Determine visit_type from raw doc
        doc_visit_type = "regular"
        vd = str(doc.get("visit_date", "")).strip().upper()
        min_cgpa = str((doc.get("criteria") or {}).get("min_cgpa", "")).strip().upper()
        if vd == "PPO" or min_cgpa == "PPO":
            doc_visit_type = "PPO"

        # Gender distribution
        gender = doc.get("gender_distribution") or {}
        male_count = int(gender.get("male", 0) or 0)
        female_count = int(gender.get("female", 0) or 0)
        total_hired = int(gender.get("total", 0) or 0)

        # Eligible branches string (fallback display)
        eligible_branches = (doc.get("criteria") or {}).get("eligible_branches", "")

        offers.append({
            "company_name": doc.get("company_name", ""),
            "academic_year": doc.get("academic_year", ""),
            "salary_lpa": doc.get("salary_lpa", 0),
            "tier": derive_tier(doc.get("category", "")),
            "category": doc.get("category", ""),
            "visit_type": doc_visit_type,
            "hiring_branches": hiring_branches,
            "eligible_branches": eligible_branches,
            "total_hired": total_hired,
            "male": male_count,
            "female": female_count
        })

    has_more = (page * limit) < total
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": has_more,
        "data": offers
    }


# ─────────────────────────────────────────────────────────────────
# C) GET /placements/filters-meta
# ─────────────────────────────────────────────────────────────────
@router.get("/filters-meta")
async def filters_meta():
    """
    Powers dropdowns and salary slider.
    All values are 100% derived from the database — no hardcoded arrays.
    """
    db = get_database()

    pipeline = [
        {
            "$facet": {
                "years": [
                    {"$group": {"_id": "$academic_year"}},
                    {"$sort": {"_id": 1}}
                ],
                "salary_range": [
                    {
                        "$group": {
                            "_id": None,
                            "min": {"$min": "$salary_lpa"},
                            "max": {"$max": "$salary_lpa"}
                        }
                    }
                ],
                "total_companies": [
                    {"$group": {"_id": "$company_name"}},
                    {"$count": "count"}
                ],
                "total_placed": [
                    {
                        "$group": {
                            "_id": None,
                            "total": {"$sum": "$gender_distribution.total"}
                        }
                    }
                ],
                "ppo_count": [
                    {
                        "$match": {
                            "$or": [
                                {"visit_date": "PPO"},
                                {"criteria.min_cgpa": "PPO"}
                            ]
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "count": {"$sum": "$gender_distribution.total"}
                        }
                    }
                ]
            }
        }
    ]

    result = await db[COLLECTION].aggregate(pipeline).to_list(None)
    facets = result[0] if result else {}

    years = sorted(
        [doc["_id"] for doc in facets.get("years", []) if doc.get("_id")],
        reverse=False
    )

    # Derive branches by scanning the selections keys that actually appear
    # (avoids hardcoding ["CE","IT","E&TC"])
    branch_pipeline = [
        {"$project": {"branches": {"$objectToArray": "$selections"}}},
        {"$unwind": "$branches"},
        {"$group": {"_id": "$branches.k"}},
        {"$sort": {"_id": 1}}
    ]
    branch_docs = await db[COLLECTION].aggregate(branch_pipeline).to_list(None)
    branches = sorted([doc["_id"] for doc in branch_docs if doc.get("_id")])

    salary_range_raw = facets.get("salary_range", [{}])
    salary_range = salary_range_raw[0] if salary_range_raw else {"min": 0, "max": 0}

    total_companies = (facets.get("total_companies") or [{}])[0].get("count", 0)
    total_placed = (facets.get("total_placed") or [{}])[0].get("total", 0)
    ppo_count = (facets.get("ppo_count") or [{}])[0].get("count", 0)

    return {
        "years": years,
        "branches": branches,
        "salary_range": {
            "min": salary_range.get("min", 0),
            "max": salary_range.get("max", 0)
        },
        "total_companies": total_companies,
        "total_placed": total_placed,
        "ppo_count": ppo_count
    }


# ─────────────────────────────────────────────────────────────────
# D) GET /placements/summary  (hero stats — all derived)
# ─────────────────────────────────────────────────────────────────
@router.get("/summary")
async def placement_summary():
    """
    Overall hero stats. Every number comes from aggregation — none hardcoded.
    placement_rate is omitted because eligible_count is not in the schema;
    per the spec: if it cannot be derived from a real query, it is not shown.
    """
    db = get_database()

    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_placed": {"$sum": "$gender_distribution.total"},
                "highest_lpa": {"$max": "$salary_lpa"},
                "unique_companies": {"$addToSet": "$company_name"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "total_placed": 1,
                "highest_lpa": 1,
                "total_companies": {"$size": "$unique_companies"}
            }
        }
    ]

    result = await db[COLLECTION].aggregate(pipeline).to_list(None)
    if not result:
        return {"total_placed": 0, "highest_lpa": 0, "total_companies": 0}
    return result[0]


# ─────────────────────────────────────────────────────────────────
# E) GET /placements/by-year  (year selector mini-stats bar)
# ─────────────────────────────────────────────────────────────────
@router.get("/by-year")
async def by_year():
    """Per-year summary: total_placed, highest_lpa, total_companies, avg_lpa."""
    db = get_database()

    pipeline = [
        {
            "$group": {
                "_id": "$academic_year",
                "total_placed": {"$sum": "$gender_distribution.total"},
                "highest_lpa": {"$max": "$salary_lpa"},
                "unique_companies": {"$addToSet": "$company_name"},
                "total_lpa_sum": {"$sum": "$total_salary_lpa"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "year": "$_id",
                "total_placed": 1,
                "highest_lpa": 1,
                "total_companies": {"$size": "$unique_companies"},
                "avg_lpa": {
                    "$cond": [
                        {"$eq": ["$total_placed", 0]},
                        0,
                        {"$divide": ["$total_lpa_sum", "$total_placed"]}
                    ]
                }
            }
        },
        {"$sort": {"year": 1}}
    ]

    result = await db[COLLECTION].aggregate(pipeline).to_list(None)
    return result


# ─────────────────────────────────────────────────────────────────
# F) GET /placements/package-distribution?year=2024-25
# ─────────────────────────────────────────────────────────────────
@router.get("/package-distribution")
async def package_distribution(year: str = Query(...)):
    """Salary bracket counts for a given year."""
    db = get_database()

    pipeline = [
        {"$match": {"academic_year": year}},
        {
            "$bucket": {
                "groupBy": "$salary_lpa",
                "boundaries": [0, 10, 20, 30, 40],
                "default": "40+",
                "output": {
                    "count": {"$sum": "$gender_distribution.total"}
                }
            }
        }
    ]

    result = await db[COLLECTION].aggregate(pipeline).to_list(None)

    label_map = {0: "<10 LPA", 10: "10-20 LPA", 20: "20-30 LPA", 30: "30-40 LPA", "40+": "40+ LPA"}
    formatted = [{"bracket": label_map.get(b["_id"], str(b["_id"])), "count": b["count"]} for b in result]
    return formatted


# ─────────────────────────────────────────────────────────────────
# G) GET /placements/top-recruiters?year=2024-25&limit=8
# ─────────────────────────────────────────────────────────────────
@router.get("/top-recruiters")
async def top_recruiters(year: str = Query(...), limit: int = Query(8)):
    """Top companies by hires for a given year, with bar_pct for animation."""
    db = get_database()

    pipeline = [
        {"$match": {"academic_year": year}},
        {
            "$group": {
                "_id": "$company_name",
                "total_hired": {"$sum": "$gender_distribution.total"},
                "avg_lpa": {"$avg": "$salary_lpa"}
            }
        },
        {"$sort": {"total_hired": -1}},
        {"$limit": limit},
        {
            "$project": {
                "_id": 0,
                "company": "$_id",
                "total_hired": 1,
                "avg_lpa": {"$round": ["$avg_lpa", 1]}
            }
        }
    ]

    result = await db[COLLECTION].aggregate(pipeline).to_list(None)
    if result:
        max_hires = result[0]["total_hired"]
        for r in result:
            r["bar_pct"] = round((r["total_hired"] / max_hires) * 100, 1) if max_hires else 0
    return result


# ─────────────────────────────────────────────────────────────────
# H) GET /placements/loyalty-spectrum
# ─────────────────────────────────────────────────────────────────
@router.get("/loyalty-spectrum")
async def loyalty_spectrum():
    """
    Classifies every company into one of 5 behavioural segments based on
    which academic years they appear in. Returns summary counts, per-company
    sparkline values, trend direction, avg LPA — all derived from DB.
    """
    db = get_database()

    # ── 1. Get all academic years present in the collection (sorted) ──
    raw_years = await db[COLLECTION].distinct("academic_year")
    all_years = sorted([y for y in raw_years if y])

    if not all_years:
        return {
            "all_years": [],
            "summary": {"always_there": 0, "comeback": 0, "first_timer": 0, "ghosted": 0, "irregular": 0},
            "companies": []
        }

    latest_year = all_years[-1]

    # ── 2. Aggregate per-company yearly data ──
    pipeline = [
        {
            "$group": {
                "_id": {
                    "company": "$company_name",
                    "year": "$academic_year"
                },
                "hired": {"$sum": "$gender_distribution.total"},
                "avg_lpa": {"$avg": "$salary_lpa"}
            }
        },
        {
            "$group": {
                "_id": "$_id.company",
                "yearly_data": {
                    "$push": {
                        "year": "$_id.year",
                        "hired": "$hired",
                        "avg_lpa": "$avg_lpa"
                    }
                },
                "total_hired": {"$sum": "$hired"},
                "overall_avg_lpa": {"$avg": "$avg_lpa"}
            }
        }
    ]

    raw_docs = await db[COLLECTION].aggregate(pipeline).to_list(None)

    # ── 3. Classification helpers ──
    def classify_company(years_present, all_yrs):
        latest = all_yrs[-1]
        present_in_latest = latest in years_present
        present_in_all = all(y in years_present for y in all_yrs)

        sorted_present = sorted(years_present)
        first_year = sorted_present[0] if sorted_present else None
        is_first_timer = (len(years_present) == 1 and present_in_latest)

        if present_in_all:
            return "ALWAYS_THERE"
        if is_first_timer:
            return "FIRST_TIMER"

        # Check for a gap between first and last appearance
        if first_year:
            first_idx = all_yrs.index(first_year) if first_year in all_yrs else 0
            span = all_yrs[first_idx:]
            has_gap = any(y not in years_present for y in span)
            if has_gap and present_in_latest:
                return "COMEBACK"

        if not present_in_latest:
            return "GHOSTED"

        return "IRREGULAR"

    def get_trend(yearly_hired, all_yrs):
        """Returns direction ('rising'|'declining'|'flat') and sparkline values."""
        val_map = {d["year"]: d["hired"] for d in yearly_hired}
        values = [val_map.get(y, None) for y in all_yrs]
        non_null = [v for v in values if v is not None]
        if len(non_null) < 2:
            direction = "flat"
        else:
            first, last = non_null[0], non_null[-1]
            if last > first:
                direction = "rising"
            elif last < first:
                direction = "declining"
            else:
                direction = "flat"
        return direction, values

    # ── 4. Build response ──
    summary_counts = {
        "always_there": 0,
        "comeback": 0,
        "first_timer": 0,
        "ghosted": 0,
        "irregular": 0
    }
    companies_out = []

    for doc in raw_docs:
        yearly_data = doc.get("yearly_data", [])
        years_present = sorted(set(d["year"] for d in yearly_data if d.get("year")))
        company_name = doc["_id"]

        segment = classify_company(years_present, all_years)
        trend_dir, sparkline = get_trend(yearly_data, all_years)

        # last_year_hired: hired count in latest year, or null
        last_entry = next((d for d in yearly_data if d["year"] == latest_year), None)
        last_year_hired = last_entry["hired"] if last_entry else None

        avg_lpa = doc.get("overall_avg_lpa")
        avg_lpa_rounded = round(avg_lpa, 1) if avg_lpa is not None else None

        # Track summary counts
        key = segment.lower()
        if key in summary_counts:
            summary_counts[key] += 1

        companies_out.append({
            "company": company_name,
            "segment": segment,
            "trend": trend_dir,
            "sparkline": sparkline,          # list len == len(all_years), None = no visit
            "total_hired": doc.get("total_hired", 0),
            "avg_lpa": avg_lpa_rounded,
            "last_year_hired": last_year_hired,
            "years_present": years_present
        })

    # Sort: always_there first, then by total_hired desc
    segment_order = ["ALWAYS_THERE", "COMEBACK", "FIRST_TIMER", "IRREGULAR", "GHOSTED"]
    companies_out.sort(
        key=lambda c: (segment_order.index(c["segment"]) if c["segment"] in segment_order else 99,
                       -c["total_hired"])
    )

    return {
        "all_years": all_years,
        "summary": summary_counts,
        "companies": companies_out
    }


# ─────────────────────────────────────────────────────────────────
# I) GET /placements/company-xray/{company_name}
# ─────────────────────────────────────────────────────────────────
@router.get("/company-xray/{company_name}")
async def company_xray(
    company_name: str = Path(..., description="Company name (URL-decoded)")
):
    """
    Full analytics dossier for one company.
    Every field is aggregated from real placement_records documents.
    No student names. No hardcoded values.
    """
    db = get_database()

    # ── 1. Fetch all docs for this company, sorted by year ──
    cursor = db[COLLECTION].find(
        {"company_name": company_name},
        {"_id": 0}
    ).sort("academic_year", 1)
    docs = await cursor.to_list(None)

    if not docs:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Company not found")

    # ── 2. Campus-wide years list (for consistency % denominator) ──
    raw_all_years = await db[COLLECTION].distinct("academic_year")
    all_years = sorted([y for y in raw_all_years if y])
    years_active = sorted(set(d["academic_year"] for d in docs if d.get("academic_year")))
    consistency_pct = round((len(years_active) / len(all_years)) * 100) if all_years else 0

    # ── 3. Branch totals across ALL years ──
    branch_totals = {}
    for d in docs:
        for branch, count in (d.get("selections") or {}).items():
            try:
                branch_totals[branch] = branch_totals.get(branch, 0) + int(count or 0)
            except (ValueError, TypeError):
                pass

    # ── 4. Gender totals ──
    gender_totals = {"male": 0, "female": 0, "total": 0}
    for d in docs:
        g = d.get("gender_distribution") or {}
        gender_totals["male"]   += int(g.get("male",   0) or 0)
        gender_totals["female"] += int(g.get("female", 0) or 0)
        gender_totals["total"]  += int(g.get("total",  0) or 0)

    # ── 5. Salary trend (one entry per year, only years visited) ──
    salary_trend = [
        {"year": d["academic_year"], "salary_lpa": d.get("salary_lpa", 0)}
        for d in docs
    ]

    # ── 6. CGPA trend (numeric or flagged null) ──
    cgpa_trend = []
    for d in docs:
        raw = (d.get("criteria") or {}).get("min_cgpa", "")
        try:
            numeric = float(raw) if raw else None
        except (ValueError, TypeError):
            numeric = None
        cgpa_trend.append({
            "year": d["academic_year"],
            "min_cgpa": numeric,
            "raw_label": str(raw) if numeric is None and raw else None
        })

    # ── 7. Category + eligibility timelines ──
    category_timeline = [
        {"year": d["academic_year"], "category": d.get("category", "")}
        for d in docs
    ]
    eligibility_timeline = [
        {
            "year": d["academic_year"],
            "min_cgpa": (d.get("criteria") or {}).get("min_cgpa", ""),
            "eligible_branches": (d.get("criteria") or {}).get("eligible_branches", "")
        }
        for d in docs
    ]

    # ── 8. Vitals ──
    ppo_count = sum(
        1 for d in docs
        if str(d.get("visit_date", "")).strip().upper() == "PPO"
        or str((d.get("criteria") or {}).get("min_cgpa", "")).strip().upper() == "PPO"
    )
    total_value = sum(int(d.get("total_salary_lpa", 0) or 0) for d in docs)
    avg_salary_weighted = (
        round(total_value / gender_totals["total"], 2)
        if gender_totals["total"] else 0
    )
    highest_salary = max((d.get("salary_lpa", 0) or 0) for d in docs)

    # ── 9. Trend direction (salary first vs last) ──
    if len(salary_trend) >= 2:
        first_s, last_s = salary_trend[0]["salary_lpa"], salary_trend[-1]["salary_lpa"]
        if last_s > first_s:
            trend_direction = "rising"
        elif last_s < first_s:
            trend_direction = "declining"
        else:
            trend_direction = "flat"
    else:
        trend_direction = "flat"

    # ── 10. Benchmark: campus avg salary + percentile rank ──
    benchmark_pipeline = [
        {
            "$group": {
                "_id": "$company_name",
                "avg_salary": {"$avg": "$salary_lpa"}
            }
        }
    ]
    all_company_avgs = await db[COLLECTION].aggregate(benchmark_pipeline).to_list(None)
    campus_avg = (
        sum(c["avg_salary"] for c in all_company_avgs if c["avg_salary"] is not None)
        / len(all_company_avgs)
    ) if all_company_avgs else 0

    companies_below = sum(
        1 for c in all_company_avgs
        if (c["avg_salary"] or 0) < avg_salary_weighted
    )
    percentile = round((companies_below / len(all_company_avgs)) * 100) if all_company_avgs else 0

    # ── 11. Recruiter Score: 40% consistency + 30% percentile + 30% trend ──
    trend_score = 30 if trend_direction == "rising" else 15 if trend_direction == "flat" else 0
    recruiter_score = round((consistency_pct * 0.4) + (percentile * 0.3) + trend_score)
    recruiter_score = max(0, min(100, recruiter_score))

    # ── 12. Sector tag from category ──
    def derive_sector(category):
        c = (category or "").lower()
        if "super dream" in c or "super-dream" in c:
            return "SUPER DREAM"
        if "dream" in c:
            return "DREAM"
        if "niche" in c:
            return "NICHE"
        if "mass" in c:
            return "MASS RECRUITER"
        if "group i" in c or "group 1" in c:
            return "GROUP I"
        if "group ii" in c or "group 2" in c:
            return "GROUP II"
        return "GENERAL"

    latest_doc = docs[-1]
    current_category = latest_doc.get("category", "")

    # ── 13. Per-year branch breakdown ──
    yearly_branch_breakdown = [
        {"year": d["academic_year"], "branches": d.get("selections") or {}}
        for d in docs
    ]

    return {
        "company": company_name,
        "category_current": current_category,
        "sector_tag": derive_sector(current_category),
        "years_active": years_active,
        "all_years": all_years,
        "consistency_pct": consistency_pct,
        "recruiter_score": recruiter_score,
        "trend": trend_direction,
        "vitals": {
            "total_hired": gender_totals["total"],
            "total_value_brought": total_value,
            "avg_salary": avg_salary_weighted,
            "highest_salary": highest_salary,
            "ppo_count": ppo_count,
            "seasons_active": len(years_active)
        },
        "branch_totals": branch_totals,
        "gender_totals": gender_totals,
        "salary_trend": salary_trend,
        "cgpa_trend": cgpa_trend,
        "category_timeline": category_timeline,
        "eligibility_timeline": eligibility_timeline,
        "benchmark": {
            "campus_avg_salary": round(campus_avg, 2),
            "this_company_avg": avg_salary_weighted,
            "delta_pct": round(
                ((avg_salary_weighted - campus_avg) / campus_avg) * 100
            ) if campus_avg else 0,
            "percentile": percentile
        },
        "yearly_branch_breakdown": yearly_branch_breakdown
    }
