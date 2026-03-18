import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowRight, Users, Briefcase, TrendingUp, IndianRupee, Building2, Clock, Award, ChevronRight, Filter } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { API_URL } from '../config';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [yearlyData, setYearlyData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/placement-stats`);
        if (!response.ok) throw new Error('Failed to fetch placement stats');
        const data = await response.json();
        setYearlyData(data);
        const years = Object.keys(data).sort((a, b) => b.localeCompare(a));
        if (years.length > 0) setSelectedYear(years[0]);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dash-page">
        <div className="dash-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2A2A2A', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
            <p style={{ color: '#A3A3A3', marginTop: 16, fontSize: 14 }}>Loading placement data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !yearlyData) {
    return (
      <div className="dash-page">
        <div className="dash-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: '#EF4444' }}>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Error loading data</p>
            <p style={{ fontSize: 13, color: '#A3A3A3', marginTop: 8 }}>{error || 'No data available'}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedYears = Object.keys(yearlyData).sort();
  const currentData = yearlyData[selectedYear];

  if (!currentData) {
    return (
      <div className="dash-page">
        <div className="dash-container" style={{ padding: '80px 24px', textAlign: 'center', color: '#A3A3A3' }}>
          No data available for {selectedYear}
        </div>
      </div>
    );
  }

  // Get display data based on branch filter
  const displayData = selectedBranch === 'All' 
    ? currentData 
    : (currentData.branchStats?.[selectedBranch] || currentData);

  // --- Compute dynamic values ---
  const totalPlaced = parseInt(displayData.totalPlaced) || 0;
  const avgPkg = displayData.avgPackage || '—';
  const highestPkg = displayData.highestPackage || '—';
  const numCompanies = displayData.totalCompanies || 0;

  // Build the area chart from ALL years (multi-year trend)
  const trendData = sortedYears.map(year => {
    const d = yearlyData[year];
    return {
      year: `20${year.split('-')[1] || year.slice(-2)}`,
      placed: parseInt(d?.totalPlaced) || 0,
    };
  });

  // Build bar chart from department distribution for selected year
  const deptDist = currentData.deptDistribution || [0, 0, 0];
  const barData = [
    { branch: 'CE', placed: deptDist[0] || 0 },
    { branch: 'IT', placed: deptDist[1] || 0 },
    { branch: 'E&TC', placed: deptDist[2] || 0 },
  ];

  // Top companies for the recruiter list
  const topCompanyLabels = currentData.topCompanies?.labels || [];
  const topCompanyData = currentData.topCompanies?.data || [];

  return (
    <div className="dash-page">
      <div className="dash-container">

        {/* SECTION 1 — PAGE HEADER */}
        <div className="dash-header">
          <div className="dash-header-left">
            <div className="overline">Placement Intelligence Hub</div>
            <h1 className="title">Analytics Dashboard</h1>
            <p className="subtitle">Live placement metrics and drive activity for your institution.</p>
          </div>
          <div className="dash-header-right">
            {/* Year Filter */}
            <div className="year-filter">
              <Filter size={14} style={{ color: '#A3A3A3', flexShrink: 0 }} />
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {Object.keys(yearlyData).sort((a,b) => b.localeCompare(a)).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {/* Branch Filter */}
            <div className="year-filter">
              <select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="All">All Branches</option>
                <option value="CE">Computer (CE)</option>
                <option value="IT">IT</option>
                <option value="E&TC">E&TC</option>
              </select>
            </div>
            <button className="btn-primary-dash" onClick={() => navigate('/app/eligibility')}>
              View All Drives <ArrowRight size={16} />
            </button>
            <div className="live-badge">
              <div className="live-dot"></div>
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 — KPI STAT CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <Users size={18} color="#F97316" />
            <div className="kpi-number">{totalPlaced}</div>
            <div className="kpi-label">Total Placed</div>
            <div className="kpi-sub">{selectedYear} · {selectedBranch === 'All' ? 'All branches' : selectedBranch}</div>
          </div>
          <div className="kpi-card">
            <Briefcase size={18} color="#F97316" />
            <div className="kpi-number">{numCompanies}</div>
            <div className="kpi-label">Companies Visited</div>
            <div className="kpi-sub">Top recruiters in {selectedYear}</div>
          </div>
          <div className="kpi-card">
            <TrendingUp size={18} color="#F97316" />
            <div className="kpi-number">{avgPkg}</div>
            <div className="kpi-label">Average Package</div>
            <div className="kpi-sub">{selectedYear} · {selectedBranch === 'All' ? 'Overall' : selectedBranch}</div>
          </div>
          <div className="kpi-card">
            <IndianRupee size={18} color="#F97316" />
            <div className="kpi-number">{highestPkg}</div>
            <div className="kpi-label">Highest Package</div>
            <div className="kpi-sub">{selectedYear} · {selectedBranch === 'All' ? 'Overall' : selectedBranch}</div>
          </div>
        </div>

        {/* SECTION 3 — CHARTS */}
        <div className="charts-row">
          {/* Left: Multi-year Placement Trend */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-overline">Year over Year</div>
                <div className="chart-title">Placement Trend — Total Students Placed</div>
              </div>
            </div>
            <div className="chart-area" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="placedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: '#525252', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#525252', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#111111', borderColor: '#2A2A2A', borderRadius: 8, color: '#F5F5F5', fontSize: 12 }}
                    itemStyle={{ color: '#F97316' }}
                  />
                  <Area type="monotone" dataKey="placed" stroke="#F97316" strokeWidth={2} fill="url(#placedGradient)" dot={{ fill: '#F97316', r: 4 }} name="Students Placed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#F97316' }}></div>
                <span className="legend-text">Students Placed (all years)</span>
              </div>
            </div>
          </div>

          {/* Right: Branch-wise Distribution for Selected Year */}
          <div className="chart-card">
            <div>
              <div className="chart-overline">By Department · {selectedYear}</div>
              <div className="chart-title">Branch-wise Placed</div>
            </div>
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#525252', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="branch" tick={{ fill: '#A3A3A3', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                  <RechartsTooltip
                    cursor={{ fill: '#1F1F1F' }}
                    contentStyle={{ backgroundColor: '#111111', borderColor: '#2A2A2A', borderRadius: 8, color: '#F5F5F5', fontSize: 12 }}
                  />
                  <Bar dataKey="placed" fill="#F97316" radius={[0, 4, 4, 0]} maxBarSize={18} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECTION 4 — SECONDARY STATS */}
        <div className="secondary-row">
          <div className="stat-hcard">
            <Building2 size={22} className="stat-hcard-icon" />
            <div>
              <div className="stat-hcard-num">{currentData.topCompanies?.labels?.length || 0}</div>
              <div className="stat-hcard-label">Top Recruiters Tracked</div>
              <div className="stat-hcard-sub">For {selectedYear}</div>
            </div>
          </div>
          <div className="stat-hcard">
            <Award size={22} className="stat-hcard-icon" />
            <div>
              <div className="stat-hcard-num">{currentData.highestPackage || '—'}</div>
              <div className="stat-hcard-label">Highest Package</div>
              <div className="stat-hcard-sub">Overall in {selectedYear}</div>
            </div>
          </div>
          <div className="stat-hcard">
            <Clock size={22} className="stat-hcard-icon" />
            <div>
              <div className="stat-hcard-num">{currentData.medianPackage || '—'}</div>
              <div className="stat-hcard-label">Median Package</div>
              <div className="stat-hcard-sub">Overall in {selectedYear}</div>
            </div>
          </div>
        </div>

        {/* SECTION 5 — TOP COMPANIES TABLE */}
        <div className="table-section">
          <div className="table-header">
            <div>
              <div className="chart-overline">Top Recruiters · {selectedYear}</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: '#F5F5F5' }}>Company Hiring Breakdown</div>
            </div>
            <button className="btn-ghost" onClick={() => navigate('/app/records')} style={{ padding: '6px 14px', fontSize: 12 }}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="table-wrap">
            <div className="table-scroll">
              <table className="drives-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Company</th>
                    <th>Students Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {topCompanyLabels.map((company, i) => (
                    <tr key={i}>
                      <td style={{ color: '#525252', fontWeight: 600 }}>{i + 1}</td>
                      <td className="td-company">{company}</td>
                      <td>
                        <span className="badge-pill badge-open">{topCompanyData[i]} students</span>
                      </td>
                    </tr>
                  ))}
                  {topCompanyLabels.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#525252', padding: '32px 20px' }}>
                        No company data available for {selectedYear}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 6 — BOTTOM ROW: Branch-wise Stats + Year Comparison */}
        <div className="bottom-row">
          {/* Left: Branch-wise breakdown for selected year */}
          <div className="bottom-card">
            <div className="bottom-card-header">
              <div className="bottom-card-overline">Branch Stats · {selectedYear}</div>
              <div className="bottom-card-title">Department Breakdown</div>
            </div>
            <div>
              {currentData.branchStats && Object.entries(currentData.branchStats).map(([branch, stats]) => (
                <div className="recruiter-item" key={branch}>
                  <div className="recruiter-left">
                    <div className="recruiter-rank" style={{ background: '#F97316', color: '#000', border: 'none', fontWeight: 700 }}>
                      {branch}
                    </div>
                    <div>
                      <div className="recruiter-name">{stats.totalPlaced} placed</div>
                      <div className="recruiter-sector">Avg: {stats.avgPackage}</div>
                    </div>
                  </div>
                  <div className="recruiter-right">
                    <div className="recruiter-count" style={{ fontSize: 12, fontWeight: 500 }}>{stats.highestPackage}</div>
                    <div className="recruiter-unit">highest</div>
                  </div>
                </div>
              ))}
              {!currentData.branchStats && (
                <div style={{ padding: 20, textAlign: 'center', color: '#525252', fontSize: 13 }}>
                  Branch-wise data not available for {selectedYear}
                </div>
              )}
            </div>
          </div>

          {/* Right: Year-over-year stats comparison */}
          <div className="bottom-card">
            <div className="bottom-card-header">
              <div className="bottom-card-overline">All Years</div>
              <div className="bottom-card-title">Year-wise Summary</div>
            </div>
            <div>
              {sortedYears.map((year, i) => {
                const d = yearlyData[year];
                return (
                  <div className="recruiter-item" key={year} 
                    style={{ cursor: 'pointer', background: year === selectedYear ? '#1A1A1A' : 'transparent', borderRadius: 6, padding: '12px 8px', margin: '0 -8px' }}
                    onClick={() => setSelectedYear(year)}
                  >
                    <div className="recruiter-left">
                      <div className="recruiter-rank" style={year === selectedYear ? { background: '#F97316', color: '#000', border: 'none', fontWeight: 700 } : {}}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="recruiter-name" style={{ color: year === selectedYear ? '#F97316' : '#F5F5F5' }}>
                          {year}
                        </div>
                        <div className="recruiter-sector">{d?.totalPlaced || 0} students placed</div>
                      </div>
                    </div>
                    <div className="recruiter-right">
                      <div className="recruiter-count">{d?.avgPackage || '—'}</div>
                      <div className="recruiter-unit">avg package</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
