import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  Printer, 
  ArrowUpDown, 
  Users, 
  DollarSign, 
  Award, 
  Filter, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RotateCw,
  Table as TableIcon
} from 'lucide-react';
import { API_URL } from '../config';

const CompanyWisePlacementTable = ({ onCompanyClick }) => {
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [availableYears, setAvailableYears] = useState(['2024-25', '2023-24', '2022-23', '2021-22']);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View format toggle: 'institutional' (exact replica of uploaded image with UG/PG & Category bands) vs 'detailed' (includes Shift 1/2 & Gender)
  const [viewFormat, setViewFormat] = useState('institutional');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');

  // Fetch data
  const fetchData = async (year, branch, sort) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (year && year !== 'ALL') params.append('year', year);
      else params.append('year', 'all');
      
      if (branch && branch !== 'ALL') params.append('branch', branch);
      
      // Pass sort_by to backend
      if (sort === 'default') params.append('sort_by', 'sr_no');
      else if (sort) params.append('sort_by', sort);

      const res = await fetch(`${API_URL}/api/placements/company-wise-report?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      const data = await res.json();
      setRecords(data.records || []);
      setSummary(data.summary || null);
      if (data.available_years && data.available_years.length > 0) {
        setAvailableYears(data.available_years);
      }
    } catch (err) {
      console.error('Failed to fetch company-wise report:', err);
      setError('Unable to load placement records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedYear, selectedBranch, sortBy);
  }, [selectedYear, selectedBranch, sortBy]);

  // Client-side instant search filter
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase().trim();
    return records.filter(r => 
      (r.company_name || '').toLowerCase().includes(term) ||
      (r.criteria?.display || '').toLowerCase().includes(term) ||
      (r.category || '').toLowerCase().includes(term)
    );
  }, [records, searchTerm]);

  // Group records by official category (e.g. Group I: Niche Companies, Group II: Variant Recruiters)
  const groupedCategories = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(r => {
      const cat = r.category || 'Group I: Niche Companies (Salary above 5 LPA)';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(r);
    });

    // Ensure Group I appears before Group II
    const sortedGroupNames = Object.keys(groups).sort((a, b) => {
      const aIsG1 = a.includes('Group I') || a.includes('Group 1');
      const bIsG1 = b.includes('Group I') || b.includes('Group 1');
      if (aIsG1 && !bIsG1) return -1;
      if (!aIsG1 && bIsG1) return 1;
      return a.localeCompare(b);
    });

    return sortedGroupNames.map(name => ({
      name,
      records: groups[name]
    }));
  }, [filteredRecords]);

  // Dynamic totals for currently filtered rows
  const liveTotals = useMemo(() => {
    let ce = 0, it = 0, entc = 0;
    let male = 0, female = 0, total = 0;
    let totalSalary = 0;

    filteredRecords.forEach(r => {
      ce += (r.ug_selections?.ce || 0);
      it += (r.ug_selections?.it || 0);
      entc += (r.ug_selections?.entc || 0);
      male += (r.gender?.male || 0);
      female += (r.gender?.female || 0);
      total += (r.gender?.total || 0);
      totalSalary += (r.total_salary_lpa || 0);
    });

    return {
      ce, it, entc,
      male, female, total,
      totalSalary: Math.round(totalSalary * 100) / 100,
      avgSalary: total > 0 ? (totalSalary / total).toFixed(2) : 0
    };
  }, [filteredRecords]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredRecords.length) return;
    
    const headers = [
      'Sr. No.',
      'Company',
      'Criteria (CGPA & Branches)',
      'Category',
      'BE CE',
      'BE E&TC',
      'BE IT',
      'ME CE',
      'ME E&TC',
      'ME DS',
      'Total Hired',
      'Sal. LPA',
      'Total Salary LPA',
      'Academic Year'
    ];

    let rowCount = 1;
    const rows = [];

    groupedCategories.forEach(grp => {
      // Group header
      rows.push([
        `--- ${grp.name} ---`,
        '', '', '', '', '', '', '', '', '', '', '', '', ''
      ]);

      grp.records.forEach(r => {
        rows.push([
          rowCount++,
          `"${(r.company_name || '').replace(/"/g, '""')}"`,
          `"${(r.criteria?.display || '').replace(/"/g, '""')}"`,
          `"${(r.category || '').replace(/"/g, '""')}"`,
          r.ug_selections?.ce || 0,
          r.ug_selections?.entc || 0,
          r.ug_selections?.it || 0,
          r.pg_selections?.me_ce || 0,
          r.pg_selections?.me_entc || 0,
          r.pg_selections?.me_ds || 0,
          r.gender?.total || 0,
          r.salary_lpa || 0,
          r.total_salary_lpa || 0,
          r.academic_year || selectedYear
        ]);
      });
    });

    // Add Grand Total Row
    rows.push([
      'GRAND TOTAL',
      `"${filteredRecords.length} Companies"`,
      '',
      '',
      liveTotals.ce,
      liveTotals.entc,
      liveTotals.it,
      0, 0, 0,
      liveTotals.total,
      `"Avg: ${liveTotals.avgSalary} LPA"`,
      liveTotals.totalSalary,
      selectedYear
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PICT_Training_And_Placement_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  let globalSrNo = 1;

  return (
    <div className="w-full flex flex-col gap-6 my-4 font-sans print:m-0 print:p-0">
      
      {/* ── CONTROL TOOLBAR (YEAR TABS, FILTERS & ACTIONS) ── */}
      <div className="bg-[#FFFDF7] border-[3px] border-[#0F0F0F] p-4 shadow-[4px_4px_0px_#0F0F0F] flex flex-col gap-4 print:hidden">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-2 border-dashed border-[#0F0F0F]/20 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-[#DC2626] text-white text-xs font-black px-2.5 py-1 uppercase tracking-wider">
              PICT T&amp;P REPORT
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-black uppercase text-gray-500 mr-1">Season:</span>
              {availableYears.map(yr => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 text-xs font-black border-2 border-[#0F0F0F] transition-all ${
                    selectedYear === yr
                      ? 'bg-[#F97316] text-white shadow-[2px_2px_0px_#0F0F0F] -translate-x-0.5 -translate-y-0.5'
                      : 'bg-white hover:bg-[#FACC15] text-[#0F0F0F]'
                  }`}
                >
                  {yr}
                </button>
              ))}
              <button
                onClick={() => setSelectedYear('ALL')}
                className={`px-3 py-1 text-xs font-black border-2 border-[#0F0F0F] transition-all ${
                  selectedYear === 'ALL'
                    ? 'bg-[#F97316] text-white shadow-[2px_2px_0px_#0F0F0F] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white hover:bg-[#FACC15] text-[#0F0F0F]'
                }`}
              >
                ALL
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="inline-flex border-2 border-[#0F0F0F] bg-white p-0.5 mr-1">
              <button
                onClick={() => setViewFormat('institutional')}
                className={`px-2.5 py-1 text-xs font-black transition-all ${
                  viewFormat === 'institutional'
                    ? 'bg-[#0F0F0F] text-white'
                    : 'text-gray-700 hover:text-black'
                }`}
                title="Institutional standard view with UG & PG columns and Category bands (as in official report)"
              >
                🏛️ Institutional (UG &amp; PG)
              </button>
              <button
                onClick={() => setViewFormat('detailed')}
                className={`px-2.5 py-1 text-xs font-black transition-all ${
                  viewFormat === 'detailed'
                    ? 'bg-[#0F0F0F] text-white'
                    : 'text-gray-700 hover:text-black'
                }`}
                title="Detailed view with Shifts & Gender ratio"
              >
                👥 Shifts &amp; Gender
              </button>
            </div>

            <button
              onClick={() => fetchData(selectedYear, selectedBranch, sortBy)}
              className="px-2.5 py-1.5 bg-white border-2 border-[#0F0F0F] text-xs font-black shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FACC15] transition-all flex items-center gap-1"
              title="Refresh Data"
            >
              <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={loading || filteredRecords.length === 0}
              className="px-3 py-1.5 bg-[#A3E635] text-[#0F0F0F] border-2 border-[#0F0F0F] text-xs font-black shadow-[2px_2px_0px_#0F0F0F] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border-2 border-[#0F0F0F] text-xs font-black shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FACC15] transition-all flex items-center gap-1.5"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* ── KPI METRICS STRIP ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-white border-2 border-[#0F0F0F] p-2 shadow-[2px_2px_0px_#0F0F0F]">
            <div className="text-[10px] font-black uppercase text-gray-500">Companies</div>
            <div className="text-lg font-black text-[#0F0F0F]">{filteredRecords.length}</div>
          </div>
          <div className="bg-white border-2 border-[#0F0F0F] p-2 shadow-[2px_2px_0px_#0F0F0F]">
            <div className="text-[10px] font-black uppercase text-gray-500">Total Hired</div>
            <div className="text-lg font-black text-[#10B981]">{liveTotals.total}</div>
          </div>
          <div className="bg-white border-2 border-[#0F0F0F] p-2 shadow-[2px_2px_0px_#0F0F0F]">
            <div className="text-[10px] font-black uppercase text-gray-500">UG Branches</div>
            <div className="text-[11px] font-black text-[#0F0F0F] mt-0.5">
              CE:{liveTotals.ce} · IT:{liveTotals.it} · EN:{liveTotals.entc}
            </div>
          </div>
          <div className="bg-white border-2 border-[#0F0F0F] p-2 shadow-[2px_2px_0px_#0F0F0F]">
            <div className="text-[10px] font-black uppercase text-gray-500">Gender Ratio</div>
            <div className="text-xs font-black text-[#0F0F0F] mt-0.5">
              <span className="text-[#2563EB]">♂ {liveTotals.male}</span>
              <span className="mx-1 text-gray-400">·</span>
              <span className="text-[#DB2777]">♀ {liveTotals.female}</span>
            </div>
          </div>
          <div className="bg-white border-2 border-[#0F0F0F] p-2 shadow-[2px_2px_0px_#0F0F0F]">
            <div className="text-[10px] font-black uppercase text-gray-500">Highest Salary</div>
            <div className="text-lg font-black text-[#DC2626]">
              {summary ? summary.highest_salary_lpa : 0} <span className="text-[10px]">LPA</span>
            </div>
          </div>
          <div className="bg-white border-2 border-[#0F0F0F] p-2 shadow-[2px_2px_0px_#0F0F0F]">
            <div className="text-[10px] font-black uppercase text-gray-500">Total Outflow</div>
            <div className="text-lg font-black text-[#F97316]">
              ₹{(liveTotals.totalSalary / 100).toFixed(2)} <span className="text-[10px]">Cr</span>
            </div>
          </div>
        </div>

        {/* ── FILTER & SEARCH CONTROLS ── */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search company, criteria, category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-[#0F0F0F] text-xs font-bold text-[#0F0F0F] placeholder-gray-400 focus:outline-none focus:bg-[#FFFDF7]"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase text-gray-500 mr-1">Branch:</span>
            {['ALL', 'CE', 'IT', 'E&TC'].map(b => (
              <button
                key={b}
                onClick={() => setSelectedBranch(b)}
                className={`px-2 py-1 text-xs font-black border-2 border-[#0F0F0F] transition-all ${
                  selectedBranch === b
                    ? 'bg-[#0F0F0F] text-white'
                    : 'bg-white hover:bg-gray-100 text-[#0F0F0F]'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase text-gray-500 mr-1">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-2 py-1 bg-white border-2 border-[#0F0F0F] text-xs font-black text-[#0F0F0F] focus:outline-none"
            >
              <option value="default">Official Category Order</option>
              <option value="salary_desc">Salary (High to Low)</option>
              <option value="salary_asc">Salary (Low to High)</option>
              <option value="hired_desc">Most Hired</option>
              <option value="company_asc">Company A-Z</option>
            </select>
          </div>
        </div>

      </div>

      {/* ── THE OFFICIAL INSTITUTIONAL REPORT CANVAS (EXACT MATCH TO UPLOADED IMAGE) ── */}
      <div className="bg-white border-[2px] border-black shadow-[6px_6px_0px_#000] overflow-hidden">
        
        {/* 1. TOP HEADER BANNER (Peach Background, Centered Address & Bold Red Report Title) */}
        <div className="bg-[#FCEEE6] border-b-[2px] border-black px-4 py-3 text-center flex flex-col items-center justify-center">
          <p className="text-[13px] md:text-[14px] font-medium text-black leading-tight tracking-tight">
            S. No. 27, Dhankawadi, Pune Satara Road, Pune- 411043
          </p>
          <h1 className="text-[18px] md:text-[22px] font-extrabold text-[#DC2626] tracking-wide uppercase mt-1 leading-none">
            TRAINING AND PLACEMENT REPORT ({selectedYear === 'ALL' ? 'ALL YEARS' : selectedYear})
          </h1>
        </div>

        {/* 2. SUB-BANNER (Students Placement (Company Wise)) */}
        <div className="bg-white border-b-[2px] border-black py-2 px-4 text-center">
          <h2 className="text-[14px] md:text-[15px] font-bold text-black uppercase tracking-tight">
            Students Placement (Company Wise)
          </h2>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-black border-t-[#F97316] rounded-full animate-spin" />
            <span className="text-xs font-black uppercase text-gray-600">Loading placement records...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 font-bold text-sm">
            {error}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-bold text-sm">
            No company placement records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs text-black">
              
              {/* ── TABLE HEADERS MATCHING UPLOADED IMAGE ── */}
              <thead>
                {viewFormat === 'institutional' ? (
                  // EXACT REPLICA OF THE IMAGE (UG with BE CE, BE E&TC, BE IT | PG with ME CE, ME E&TC, ME DS)
                  <>
                    <tr className="bg-white text-center font-bold">
                      <th rowSpan={2} className="border border-black px-2 py-2 w-12 text-center font-bold text-xs">
                        Sr. No.
                      </th>
                      <th rowSpan={2} className="border border-black px-3 py-2 text-center font-bold text-sm min-w-[200px]">
                        Company
                      </th>
                      <th rowSpan={2} className="border border-black px-3 py-2 text-center font-bold text-xs text-[#DC2626] min-w-[180px]">
                        Criteria (CGPA &amp; Branches)
                      </th>
                      <th colSpan={3} className="border border-black px-2 py-1 text-center font-bold text-xs">
                        UG
                      </th>
                      <th colSpan={3} className="border border-black px-2 py-1 text-center font-bold text-xs">
                        PG
                      </th>
                      <th rowSpan={2} className="border border-black px-2 py-2 text-center font-bold text-xs w-16">
                        Total
                      </th>
                      <th rowSpan={2} className="border border-black px-2 py-2 text-center font-bold text-xs text-[#DC2626] w-20">
                        Sal. LPA
                      </th>
                      <th rowSpan={2} className="border border-black px-2 py-2 text-center font-bold text-xs text-[#DC2626] w-24">
                        Total Salary LPA
                      </th>
                    </tr>

                    {/* Subheader Row: Under UG and Under PG */}
                    <tr className="bg-white text-center font-bold text-[11px]">
                      <th className="border border-black px-2 py-1.5 w-16">BE CE</th>
                      <th className="border border-black px-2 py-1.5 w-20">BE E&amp;TC</th>
                      <th className="border border-black px-2 py-1.5 w-16">BE IT</th>
                      <th className="border border-black px-2 py-1.5 w-16">ME CE</th>
                      <th className="border border-black px-2 py-1.5 w-20">ME E&amp;TC</th>
                      <th className="border border-black px-2 py-1.5 w-16">ME DS</th>
                    </tr>
                  </>
                ) : (
                  // DETAILED VIEW (WITH SHIFTS & GENDER)
                  <>
                    <tr className="bg-white text-center font-bold">
                      <th rowSpan={3} className="border border-black px-2 py-2 w-12 text-center font-bold text-xs">
                        Sr. No.
                      </th>
                      <th rowSpan={3} className="border border-black px-3 py-2 text-center font-bold text-sm min-w-[190px]">
                        Company
                      </th>
                      <th rowSpan={3} className="border border-black px-3 py-2 text-center font-bold text-xs text-[#DC2626] min-w-[170px]">
                        Criteria (CGPA &amp; Branches)
                      </th>
                      <th colSpan={5} className="border border-black px-2 py-1 text-center font-bold text-xs">
                        UG
                      </th>
                      <th colSpan={3} className="border border-black px-2 py-1 text-center font-bold text-xs">
                        Total
                      </th>
                      <th rowSpan={3} className="border border-black px-2 py-2 text-center font-bold text-xs text-[#DC2626] w-20">
                        Sal. LPA
                      </th>
                      <th rowSpan={3} className="border border-black px-2 py-2 text-center font-bold text-xs text-[#DC2626] w-24">
                        Total Salary LPA
                      </th>
                    </tr>
                    <tr className="bg-white text-center font-bold text-[11px]">
                      <th colSpan={2} className="border border-black px-1.5 py-1">BE CE</th>
                      <th colSpan={2} className="border border-black px-1.5 py-1">BE E&amp;TC</th>
                      <th rowSpan={2} className="border border-black px-2 py-1">BE IT</th>
                      <th rowSpan={2} className="border border-black px-1.5 py-1">M</th>
                      <th rowSpan={2} className="border border-black px-1.5 py-1">F</th>
                      <th rowSpan={2} className="border border-black px-2 py-1">T</th>
                    </tr>
                    <tr className="bg-white text-center font-semibold text-[10px]">
                      <th className="border border-black px-1 py-0.5">Shift 1</th>
                      <th className="border border-black px-1 py-0.5">Shift 2</th>
                      <th className="border border-black px-1 py-0.5">Shift 1</th>
                      <th className="border border-black px-1 py-0.5">Shift 2</th>
                    </tr>
                  </>
                )}
              </thead>

              {/* ── TBODY: GROUPED BY CATEGORY (e.g. Group I: Niche Companies, Group II: Variant Recruiters) ── */}
              <tbody>
                {groupedCategories.map((group) => {
                  return (
                    <React.Fragment key={group.name}>
                      {/* CATEGORY SECTION HEADER ROW (Exact styling from image: Bold Navy Blue text in Peach row) */}
                      <tr className="bg-[#FCEEE6] border-y-[2px] border-black">
                        <td 
                          colSpan={viewFormat === 'institutional' ? 11 : 13} 
                          className="py-2.5 px-4 text-center font-bold text-[#000080] text-[14px] md:text-[15px] tracking-wide border border-black italic"
                        >
                          {group.name}
                        </td>
                      </tr>

                      {/* DATA ROWS FOR THIS GROUP */}
                      {group.records.map((r) => {
                        const currentSr = globalSrNo++;
                        const ceTotal = r.ug_selections?.ce || 0;
                        const entcTotal = r.ug_selections?.entc || 0;
                        const itTotal = r.ug_selections?.it || 0;
                        const totalHired = r.gender?.total || (ceTotal + entcTotal + itTotal);

                        const ceS1 = Math.ceil(ceTotal / 2);
                        const ceS2 = Math.floor(ceTotal / 2);
                        const entcS1 = Math.ceil(entcTotal / 2);
                        const entcS2 = Math.floor(entcTotal / 2);

                        const maleCount = r.gender?.male || 0;
                        const femaleCount = r.gender?.female || 0;

                        return (
                          <tr 
                            key={`${r.company_name}-${r.academic_year}-${currentSr}`}
                            className="hover:bg-[#FFF9E6] transition-colors border-b border-black text-center"
                          >
                            {/* Sr. No. */}
                            <td className="border border-black px-2 py-2 font-mono text-xs text-center font-semibold">
                              {currentSr}
                            </td>

                            {/* Company Name */}
                            <td 
                              className="border border-black px-3 py-2 text-left font-bold text-xs text-black cursor-pointer hover:text-[#1A6EFF] hover:underline"
                              onClick={() => onCompanyClick && onCompanyClick(r.company_name)}
                              title="Click to view deep company profile &amp; interview insights"
                            >
                              {r.company_name}
                            </td>

                            {/* Criteria (CGPA & Branches) */}
                            <td className="border border-black px-2 py-2 text-center text-[11px] font-medium text-gray-800">
                              {r.criteria?.display || 'All Branches'}
                            </td>

                            {/* UG SELECTIONS */}
                            {viewFormat === 'institutional' ? (
                              <>
                                <td className="border border-black px-2 py-2 font-mono text-xs">
                                  {ceTotal > 0 ? ceTotal : '—'}
                                </td>
                                <td className="border border-black px-2 py-2 font-mono text-xs">
                                  {entcTotal > 0 ? entcTotal : '—'}
                                </td>
                                <td className="border border-black px-2 py-2 font-mono text-xs">
                                  {itTotal > 0 ? itTotal : '—'}
                                </td>

                                {/* PG SELECTIONS (ME CE, ME E&TC, ME DS) */}
                                <td className="border border-black px-2 py-2 font-mono text-xs text-gray-400">
                                  {r.pg_selections?.me_ce || '—'}
                                </td>
                                <td className="border border-black px-2 py-2 font-mono text-xs text-gray-400">
                                  {r.pg_selections?.me_entc || '—'}
                                </td>
                                <td className="border border-black px-2 py-2 font-mono text-xs text-gray-400">
                                  {r.pg_selections?.me_ds || '—'}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="border border-black px-1.5 py-2 font-mono text-xs text-gray-600">
                                  {ceTotal > 0 ? (ceS1 > 0 ? ceS1 : '—') : '—'}
                                </td>
                                <td className="border border-black px-1.5 py-2 font-mono text-xs text-gray-600">
                                  {ceTotal > 0 ? (ceS2 > 0 ? ceS2 : '—') : '—'}
                                </td>
                                <td className="border border-black px-1.5 py-2 font-mono text-xs text-gray-600">
                                  {entcTotal > 0 ? (entcS1 > 0 ? entcS1 : '—') : '—'}
                                </td>
                                <td className="border border-black px-1.5 py-2 font-mono text-xs text-gray-600">
                                  {entcTotal > 0 ? (entcS2 > 0 ? entcS2 : '—') : '—'}
                                </td>
                                <td className="border border-black px-2 py-2 font-mono text-xs">
                                  {itTotal > 0 ? itTotal : '—'}
                                </td>
                                <td className="border border-black px-1.5 py-2 font-mono text-xs text-blue-700">
                                  {maleCount}
                                </td>
                                <td className="border border-black px-1.5 py-2 font-mono text-xs text-pink-700">
                                  {femaleCount}
                                </td>
                              </>
                            )}

                            {/* Total (T) */}
                            <td className="border border-black px-2 py-2 font-bold font-mono text-xs bg-gray-50/70">
                              {totalHired}
                            </td>

                            {/* Sal. LPA (Red bold text matching image) */}
                            <td className="border border-black px-2 py-2 font-bold font-mono text-xs text-[#DC2626]">
                              {r.salary_lpa ? r.salary_lpa.toFixed(2) : '—'}
                            </td>

                            {/* Total Salary LPA (Red bold text matching image) */}
                            <td className="border border-black px-2 py-2 font-bold font-mono text-xs text-[#DC2626]">
                              {r.total_salary_lpa ? r.total_salary_lpa.toFixed(2) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* ── GRAND TOTAL ROW ── */}
              <tfoot>
                <tr className="bg-[#F8F9FA] text-black font-bold text-center border-t-[2px] border-black">
                  <td colSpan={3} className="border border-black px-3 py-2.5 text-center font-bold text-xs uppercase bg-[#F3F4F6]">
                    Grand Total ({filteredRecords.length} Companies)
                  </td>

                  {viewFormat === 'institutional' ? (
                    <>
                      <td className="border border-black px-2 py-2.5 font-mono text-xs font-bold">
                        {liveTotals.ce}
                      </td>
                      <td className="border border-black px-2 py-2.5 font-mono text-xs font-bold">
                        {liveTotals.entc}
                      </td>
                      <td className="border border-black px-2 py-2.5 font-mono text-xs font-bold">
                        {liveTotals.it}
                      </td>
                      <td className="border border-black px-2 py-2.5 font-mono text-xs text-gray-400">
                        —
                      </td>
                      <td className="border border-black px-2 py-2.5 font-mono text-xs text-gray-400">
                        —
                      </td>
                      <td className="border border-black px-2 py-2.5 font-mono text-xs text-gray-400">
                        —
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-black px-1.5 py-2.5 font-mono text-xs font-bold">
                        {Math.ceil(liveTotals.ce / 2)}
                      </td>
                      <td className="border border-black px-1.5 py-2.5 font-mono text-xs font-bold">
                        {Math.floor(liveTotals.ce / 2)}
                      </td>
                      <td className="border border-black px-1.5 py-2.5 font-mono text-xs font-bold">
                        {Math.ceil(liveTotals.entc / 2)}
                      </td>
                      <td className="border border-black px-1.5 py-2.5 font-mono text-xs font-bold">
                        {Math.floor(liveTotals.entc / 2)}
                      </td>
                      <td className="border border-black px-2 py-2.5 font-mono text-xs font-bold">
                        {liveTotals.it}
                      </td>
                      <td className="border border-black px-1.5 py-2.5 font-mono text-xs font-bold text-blue-700">
                        {liveTotals.male}
                      </td>
                      <td className="border border-black px-1.5 py-2.5 font-mono text-xs font-bold text-pink-700">
                        {liveTotals.female}
                      </td>
                    </>
                  )}

                  {/* Total Hired */}
                  <td className="border border-black px-2 py-2.5 font-black font-mono text-xs bg-[#E5E7EB]">
                    {liveTotals.total}
                  </td>

                  {/* Avg Sal */}
                  <td className="border border-black px-2 py-2.5 font-bold font-mono text-xs text-[#DC2626]">
                    Avg {liveTotals.avgSalary}
                  </td>

                  {/* Total Salary LPA */}
                  <td className="border border-black px-2 py-2.5 font-black font-mono text-xs text-[#DC2626]">
                    {liveTotals.totalSalary.toFixed(2)}
                  </td>
                </tr>
              </tfoot>

            </table>
          </div>
        )}

        {/* Footer info note */}
        <div className="bg-[#FFFDF7] p-3 text-[11px] font-medium text-gray-600 border-t border-black flex flex-col sm:flex-row justify-between items-center gap-2 print:hidden">
          <span>
            * Official placement records as archived in PICT Training &amp; Placement institutional bulletins.
          </span>
          <span className="text-black font-bold uppercase text-[10px]">
            Tip: Click any company name to explore detailed rounds, CTC breakdown &amp; interview experiences.
          </span>
        </div>

      </div>

    </div>
  );
};

export default CompanyWisePlacementTable;
