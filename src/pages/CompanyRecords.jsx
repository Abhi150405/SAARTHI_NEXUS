
import React, { useState, useEffect } from 'react';
import { 
    Search, Building, Calendar, IndianRupee, BookOpen, 
    ChevronRight, Users, TrendingUp, Award, Layers, 
    BarChart2, CalendarDays, SlidersHorizontal, ArrowUpDown 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import '../styles/CompanyRecords.css';
import { API_URL } from '../config';

const CompanyRecords = () => {
    // 1. STRCITLY PRESERVED STATE
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc');
    const [listSortOrder, setListSortOrder] = useState('asc');
    const detailsRef = React.useRef(null);

    // 2. STRICTLY PRESERVED API LOGIC
    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await fetch(`${API_URL}/api/companies`);
            const data = await response.json();
            setCompanies(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching companies:', error);
            setLoading(false);
        }
    };

    const fetchCompanyDetails = async (name) => {
        setDetailsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/company/${encodeURIComponent(name)}`);
            if (!response.ok) throw new Error('Failed to fetch details');
            const data = await response.json();
            setSelectedCompany(data);
            setSortOrder('desc');

            if (window.innerWidth <= 1024) {
                setTimeout(() => {
                    detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
            alert('Could not load company details. Please check your connection.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const filteredCompanies = companies
        .filter(c => c.company.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
             if (listSortOrder === 'asc') return a.company.localeCompare(b.company);
             if (listSortOrder === 'desc') return b.company.localeCompare(a.company);
             if (listSortOrder === 'newest') {
                 let dA = a.latestVisitDate ? new Date(a.latestVisitDate).getTime() : 0;
                 let dB = b.latestVisitDate ? new Date(b.latestVisitDate).getTime() : 0;
                 return dB - dA || a.company.localeCompare(b.company);
             }
             if (listSortOrder === 'oldest') {
                 let dA = a.latestVisitDate ? new Date(a.latestVisitDate).getTime() : 0;
                 let dB = b.latestVisitDate ? new Date(b.latestVisitDate).getTime() : 0;
                 return dA - dB || a.company.localeCompare(b.company);
             }
             return 0;
        });

    // 3. COMPUTATIONS FOR GENIUS UI
    const maxHires = companies.length > 0 
        ? Math.max(...companies.map(x => x.totalHires || 0)) 
        : 1;

    const totalPlatformHires = companies.reduce((a,c) => a + (c.totalHires || 0), 0);
    const totalPlatformVisits = companies.reduce((a,c) => a + (c.visits || 0), 0);

    // Dynamic Computations for Detail View
    let chartData = [];
    let sortedHistory = [];
    let highestHires = 0;
    let latestEntry = null;
    let allDeptTotals = {};
    let sortedDepts = [];
    let maxDeptCount = 1;

    if (selectedCompany && selectedCompany.history) {
        // Chart Data (Oldest to Newest left-to-right)
        chartData = [...selectedCompany.history]
            .sort((a,b) => a.year.localeCompare(b.year))
            .map(h => ({ year: h.year, hires: h.hires || 0 }));
        
        // Table Data (Using existing sort logic)
        sortedHistory = [...selectedCompany.history].sort((a, b) => {
            let dateA = a.parsed_visit_date ? new Date(a.parsed_visit_date).getTime() : new Date(a.year.substring(0, 4)).getTime();
            let dateB = b.parsed_visit_date ? new Date(b.parsed_visit_date).getTime() : new Date(b.year.substring(0, 4)).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        // KPI calculations
        const latestTimeSort = [...selectedCompany.history].sort((a,b) => {
            let dA = a.parsed_visit_date ? new Date(a.parsed_visit_date).getTime() : new Date(a.year.substring(0, 4)).getTime();
            let dB = b.parsed_visit_date ? new Date(b.parsed_visit_date).getTime() : new Date(b.year.substring(0, 4)).getTime();
            return dB - dA;
        });
        latestEntry = latestTimeSort[0];
        highestHires = Math.max(...selectedCompany.history.map(h => h.hires || 0));

        // Aggregate Dept calcs
        selectedCompany.history.forEach(h => {
             if (h.dept_breakdown) {
                 Object.entries(h.dept_breakdown).forEach(([dept, cnt]) => {
                     if (cnt > 0) allDeptTotals[dept] = (allDeptTotals[dept] || 0) + cnt;
                 });
             }
        });
        sortedDepts = Object.entries(allDeptTotals).sort((a,b) => b[1] - a[1]);
        if (sortedDepts.length > 0) {
            maxDeptCount = sortedDepts[0][1] || 1;
        }
    }


    return (
        <div className="cr-page company-records-scroll">
            
            {/* --- SECTION 1: HEADER --- */}
            <div className="cr-header">
                <div>
                    <span className="cr-overline">Recruitment Intelligence</span>
                    <h2 className="cr-title">Company Insights</h2>
                    <p className="cr-subtitle">Historical visit data and hiring trends across all recruitment seasons.</p>
                </div>
                <div className="cr-header-right">
                    <div className="badge-neutral">
                        <Building size={14} color="#F97316" />
                        <span>{companies.length} Companies</span>
                    </div>
                    <div className="badge-live">
                        <div className="dot-live"></div>
                        <span>Live Data</span>
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: MAIN LAYOUT --- */}
            <div className="cr-layout">
                
                {/* --- LEFT RAIL --- */}
                <div className="cr-sidebar">
                    <div className="cr-search-area">
                        <div className="cr-search-wrap">
                            <Search size={14} color="#525252" style={{flexShrink:0}} />
                            <input 
                                type="text" 
                                className="cr-search-input"
                                placeholder="Search companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="cr-sort-wrap">
                            <select 
                                className="cr-sort-select"
                                value={listSortOrder}
                                onChange={(e) => setListSortOrder(e.target.value)}
                            >
                                <option value="asc">A-Z</option>
                                <option value="desc">Z-A</option>
                                <option value="newest">Recent Visits</option>
                                <option value="oldest">Oldest Visits</option>
                            </select>
                            <ArrowUpDown className="cr-sort-icon" size={13} />
                        </div>
                    </div>
                    
                    <div className="cr-results-count">
                        {filteredCompanies.length} results
                    </div>

                    <div className="cr-list company-records-scroll">
                        {loading ? (
                            Array.from({length: 8}).map((_, i) => (
                                <div key={i} className="skel-item animate-pulse">
                                    <div className="skel-bar1"></div>
                                    <div className="skel-bar2"></div>
                                </div>
                            ))
                        ) : (
                            filteredCompanies.map((c, index) => {
                                const isActive = selectedCompany?.name === c.company;
                                const barWidth = Math.round(((c.totalHires || 0) / maxHires) * 100);
                                
                                return (
                                    <div
                                        key={index}
                                        className={`cr-list-item ${isActive ? 'active' : ''}`}
                                        onClick={() => fetchCompanyDetails(c.company)}
                                    >
                                        <div className="cr-item-row1">
                                            <span className="cr-item-name" title={c.company}>{c.company}</span>
                                            <ChevronRight size={14} className="cr-item-chevron" />
                                        </div>
                                        <div className="cr-item-row2">
                                            <span className="cr-item-meta">
                                                <Building size={11} style={{display:'inline', marginRight:2}} />
                                                {c.visits} visits
                                            </span>
                                            <span className="cr-item-meta">
                                                <Users size={11} style={{display:'inline', marginRight:2}} />
                                                {c.totalHires} hired
                                            </span>
                                        </div>
                                        <div className="cr-mini-bar-track">
                                            <div 
                                                className="cr-mini-bar-fill" 
                                                style={{ width: `${barWidth}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- RIGHT MAIN --- */}
                <div className="cr-main company-records-scroll" ref={detailsRef}>
                    
                    {/* STATE A: LOADING DETAILS */}
                    {detailsLoading && (
                        <div className="cr-loading-view">
                            <div className="cr-spinner"></div>
                            <span className="cr-loading-text">Fetching company intelligence...</span>
                        </div>
                    )}

                    {/* STATE B: EMPTY / NO COMPANY SELECTED */}
                    {!detailsLoading && !selectedCompany && (
                        <div className="cr-empty-view animate-fade-in">
                            <span className="cr-empty-ov">Platform Overview</span>
                            <h3 className="cr-empty-title">Intelligence at a Glance</h3>
                            <p className="cr-empty-sub">Select any company from the left to load its full hiring intelligence report.</p>

                            <div className="cr-agg-grid">
                                <div className="cr-card cr-agg-card">
                                    <span className="cr-agg-ov">Total Companies</span>
                                    <h4 className="cr-agg-num">{companies.length}</h4>
                                    <span className="cr-agg-sub">tracked in database</span>
                                </div>
                                <div className="cr-card cr-agg-card">
                                    <span className="cr-agg-ov">Total Hires Recorded</span>
                                    <h4 className="cr-agg-num">{totalPlatformHires.toLocaleString()}</h4>
                                    <span className="cr-agg-sub">across all seasons</span>
                                </div>
                                <div className="cr-card cr-agg-card">
                                    <span className="cr-agg-ov">Total Visits Logged</span>
                                    <h4 className="cr-agg-num">{totalPlatformVisits.toLocaleString()}</h4>
                                    <span className="cr-agg-sub">recruitment drives tracked</span>
                                </div>
                            </div>

                            <div className="cr-empty-prompt">
                                <div className="cr-empty-icon">
                                    <Building size={28} color="#2A2A2A" />
                                </div>
                                <h4>No company selected</h4>
                                <p>Choose a company from the directory to view its complete placement history, hiring trends, and department breakdown.</p>
                            </div>
                        </div>
                    )}

                    {/* STATE C: COMPANY DETAIL VIEW */}
                    {!detailsLoading && selectedCompany && (
                        <div className="cr-detail-view animate-fade-in">
                            
                            {/* BLOCK 1: HERO HEADER */}
                            <div className="cr-card cr-hero">
                                <div className="cr-hero-left">
                                    <div className="cr-avatar">
                                        {selectedCompany.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="cr-comp-name">{selectedCompany.name}</h3>
                                        <div className="cr-meta-row">
                                            <div className="cr-meta-pill green">
                                                <Users size={11} />
                                                <span>{selectedCompany.total_hires} Total Hires</span>
                                            </div>
                                            <div className="cr-meta-dot"></div>
                                            <div className="cr-meta-pill orange">
                                                <CalendarDays size={11} />
                                                <span>{selectedCompany.visit_count} Seasons</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="cr-hero-right">
                                    <div className="cr-sort-control">
                                        <span className="cr-sort-label">Sort:</span>
                                        <select 
                                            className="cr-sort-hero"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                        >
                                            <option value="desc">Newest First</option>
                                            <option value="asc">Oldest First</option>
                                        </select>
                                        <SlidersHorizontal className="cr-sort-hero-icon" size={13} />
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 2: KPI STRIP */}
                            <div className="cr-kpi-grid">
                                <div className="cr-card cr-kpi-card">
                                    <span className="cr-kpi-ov">Total Hires</span>
                                    <h4 className="cr-kpi-num">{selectedCompany.total_hires}</h4>
                                    <span className="cr-kpi-sub">across all years</span>
                                </div>
                                <div className="cr-card cr-kpi-card">
                                    <span className="cr-kpi-ov">Seasons Visited</span>
                                    <h4 className="cr-kpi-num">{selectedCompany.visit_count}</h4>
                                    <span className="cr-kpi-sub">recruitment drives</span>
                                </div>
                                <div className="cr-card cr-kpi-card">
                                    <span className="cr-kpi-ov">Peak Hires (Single Year)</span>
                                    <h4 className="cr-kpi-num">{highestHires}</h4>
                                    <span className="cr-kpi-sub">best recruitment year</span>
                                </div>
                                <div className="cr-card cr-kpi-card">
                                    <span className="cr-kpi-ov">Latest Package</span>
                                    <h4 className="cr-kpi-num text-val">{latestEntry?.salary || "N/A"}</h4>
                                    <span className="cr-kpi-sub">CTC offered — {latestEntry?.year || ''}</span>
                                </div>
                            </div>

                            {/* BLOCK 3: TREND CHART */}
                            {chartData.length > 0 && (
                                <div className="cr-card cr-chart-section">
                                    <div className="cr-section-header">
                                        <div>
                                            <span className="cr-sec-ov">Visual Trend</span>
                                            <h4 className="cr-sec-title">Year-on-Year Hiring</h4>
                                        </div>
                                        <BarChart2 size={16} color="#525252" />
                                    </div>
                                    <div style={{width:'100%', height:'200px'}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                                                <XAxis dataKey="year" tick={{fill:"#525252", fontSize:11}} axisLine={false} tickLine={false} />
                                                <YAxis tick={{fill:"#525252", fontSize:11}} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    cursor={{fill: 'rgba(249,115,22,0.06)'}}
                                                    contentStyle={{
                                                        backgroundColor: '#111111', 
                                                        borderColor: '#2A2A2A', 
                                                        borderRadius: '8px', 
                                                        color: '#F5F5F5', 
                                                        fontSize: '12px',
                                                        padding: '8px 12px'
                                                    }}
                                                    labelStyle={{ color: '#A3A3A3', fontSize: '11px', marginBottom: '4px' }}
                                                    formatter={(val) => [`${val} hired`, "Hires"]}
                                                />
                                                <Bar dataKey="hires" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} activeBar={{fill: '#FB923C'}} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* BLOCK 4: HISTORY TABLE */}
                            <div className="cr-card cr-table-wrapper">
                                <div className="cr-section-header" style={{margin:'20px 24px 0 24px'}}>
                                    <div>
                                        <span className="cr-sec-ov">Detailed Records</span>
                                        <h4 className="cr-sec-title">Hiring History</h4>
                                    </div>
                                    <div style={{display:'flex', alignItems:'center'}}>
                                        <Layers size={14} color="#525252" />
                                        <span style={{fontSize:'11px', color:'#525252', marginLeft:'6px'}}>
                                            {selectedCompany.history.length} records
                                        </span>
                                    </div>
                                </div>
                                <div className="cr-table-outer">
                                    <table className="cr-table">
                                        <thead>
                                            <tr>
                                                <th>Year</th>
                                                <th>Package</th>
                                                <th>Hired</th>
                                                <th>Criteria</th>
                                                <th>Dept Breakdown</th>
                                                <th>Gender</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedHistory.map((h, i) => (
                                                <tr key={i}>
                                                    {/* Col 1 */}
                                                    <td>
                                                        <span className="tb-year">{h.year}</span>
                                                        {h.visit_date && (
                                                            <span className="tb-date">
                                                                {new Date(h.visit_date).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}
                                                            </span>
                                                        )}
                                                    </td>
                                                    {/* Col 2 */}
                                                    <td>
                                                        <span className="tb-pkg">
                                                            <IndianRupee size={12} color="#F97316" />
                                                            {h.salary}
                                                        </span>
                                                    </td>
                                                    {/* Col 3 */}
                                                    <td>
                                                        <div className="tb-hired">{h.hires}</div>
                                                    </td>
                                                    {/* Col 4 */}
                                                    <td>
                                                        <div className="tb-crit-col">
                                                            <span className="tb-cgpa">CGPA {h.criteria.min_cgpa}+</span>
                                                            {h.criteria.eligible_branches && (
                                                                <span className="tb-branches">{h.criteria.eligible_branches}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Col 5 */}
                                                    <td>
                                                        <div className="tb-dept-col">
                                                            {h.dept_breakdown && Object.entries(h.dept_breakdown).map(([dept, count]) => {
                                                                if (count <= 0) return null;
                                                                const deptTotal = Object.values(h.dept_breakdown).reduce((a,b)=>a+b,0);
                                                                const barW = Math.max(2, Math.round((count/deptTotal)*100));
                                                                return (
                                                                    <div key={dept} className="tb-dept-row">
                                                                        <span className="tb-dept-label" title={dept}>{dept}</span>
                                                                        <div className="tb-dept-track">
                                                                            <div className="tb-dept-fill" style={{width: `${barW}%`}}></div>
                                                                        </div>
                                                                        <span className="tb-dept-count">{count}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </td>
                                                    {/* Col 6 */}
                                                    <td>
                                                        <div className="tb-gender-col">
                                                            <div className="tb-g-row">
                                                                <span className="tb-g-label m">M</span>
                                                                <div className="tb-g-track">
                                                                    <div className="tb-g-fill m" style={{width: `${((h.gender_breakdown?.male || 0) / Math.max(h.hires || 1, 1))*100}%`}}></div>
                                                                </div>
                                                                <span className="tb-g-count">{h.gender_breakdown?.male || 0}</span>
                                                            </div>
                                                            <div className="tb-g-row">
                                                                <span className="tb-g-label f">F</span>
                                                                <div className="tb-g-track">
                                                                    <div className="tb-g-fill f" style={{width: `${((h.gender_breakdown?.female || 0) / Math.max(h.hires || 1, 1))*100}%`}}></div>
                                                                </div>
                                                                <span className="tb-g-count">{h.gender_breakdown?.female || 0}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* BLOCK 5: AGGREGATE DEPT */}
                            {sortedDepts.length > 0 && (
                                <div className="cr-card cr-agg-dept">
                                    <div className="cr-section-header" style={{borderBottom:'1px solid #1F1F1F', margin:'0 0 16px 0', padding:'0 0 16px 0'}}>
                                        <div>
                                            <span className="cr-sec-ov">All-Time View</span>
                                            <h4 className="cr-sec-title">Department Hiring Intelligence</h4>
                                            <span className="cr-sec-sub">Aggregated across all recorded visits</span>
                                        </div>
                                    </div>
                                    <div>
                                        {sortedDepts.map(([dept, count], idx) => {
                                            const w = Math.max(2, Math.round((count/maxDeptCount)*100));
                                            return (
                                                <div key={idx} className="agg-dept-row">
                                                    <span className="agg-rank">#{idx+1}</span>
                                                    <span className="agg-name" title={dept}>{dept}</span>
                                                    <div className="agg-track">
                                                        <div className="agg-fill" style={{width: `${w}%`}}></div>
                                                    </div>
                                                    <div className="agg-count-wrap">
                                                        <span className="agg-count">{count}</span>
                                                        <span className="agg-sub">hires</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyRecords;

