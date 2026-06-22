import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Briefcase, TrendingUp, IndianRupee, Building2, Clock, Award, ChevronRight, Filter } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { API_URL } from '../config';

const pageAnim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const cardAnim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

/* Custom flat tooltip for Recharts */
const BrutalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F0F0F] border-[2px] border-[#0F0F0F] px-3 py-2 shadow-[3px_3px_0px_#F97316]">
      <p className="font-mono text-[11px] text-[#FACC15] font-bold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono text-[12px] text-[#F97316]">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

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

  const sortedYears = yearlyData ? Object.keys(yearlyData).sort() : [];
  const currentData = yearlyData ? yearlyData[selectedYear] : null;
  const displayData = (currentData && selectedBranch !== 'All')
    ? (currentData.branchStats?.[selectedBranch] || currentData)
    : currentData;

  const totalPlaced = displayData ? (parseInt(displayData.totalPlaced) || 0) : 0;
  const avgPkg = displayData ? (displayData.avgPackage || '—') : '—';
  const highestPkg = displayData ? (displayData.highestPackage || '—') : '—';
  const numCompanies = displayData ? (displayData.totalCompanies || 0) : 0;

  const trendData = sortedYears.map(year => {
    const d = yearlyData[year];
    return { year: `20${year.split('-')[1] || year.slice(-2)}`, placed: parseInt(d?.totalPlaced) || 0 };
  });

  const deptDist = currentData?.deptDistribution || [0, 0, 0, 0, 0];
  const barData = [
    { branch: 'CE', placed: deptDist[0] || 0 },
    { branch: 'IT', placed: deptDist[1] || 0 },
    { branch: 'E&TC', placed: deptDist[2] || 0 },
    { branch: 'E&CE', placed: deptDist[3] || 0 },
    { branch: 'AI&DS', placed: deptDist[4] || 0 },
  ];

  const topCompanyLabels = currentData?.topCompanies?.labels || [];
  const topCompanyData = currentData?.topCompanies?.data || [];

  const kpiItems = [
    { icon: Users, value: totalPlaced, label: 'Total Placed', sub: `${selectedYear} · ${selectedBranch === 'All' ? 'All branches' : selectedBranch}`, bg: 'bg-[#FACC15]' },
    { icon: Briefcase, value: numCompanies, label: 'Companies Visited', sub: `Top recruiters in ${selectedYear}`, bg: 'bg-[#A3E635]' },
    { icon: TrendingUp, value: avgPkg, label: 'Average Package', sub: `${selectedYear} · ${selectedBranch === 'All' ? 'Overall' : selectedBranch}`, bg: 'bg-[#F97316]' },
    { icon: IndianRupee, value: highestPkg, label: 'Highest Package', sub: `${selectedYear} · ${selectedBranch === 'All' ? 'Overall' : selectedBranch}`, bg: 'bg-white' },
  ];

  return (
    <motion.div {...pageAnim}>
      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div>
          <span className="font-black uppercase tracking-widest text-[10px] text-[#888888]">Analytics Overview</span>
          <h1 className="font-black text-[32px] tracking-[-0.03em] text-[#0F0F0F] leading-tight">Placement Dashboard</h1>
          <p className="font-medium text-[14px] text-[#4B4B4B] mt-1">Live placement metrics and drive activity for your institution.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {yearlyData && !loading && !error && (
            <>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white border-[3px] border-[#0F0F0F] px-4 py-2 font-mono text-[13px] text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100"
              >
                {Object.keys(yearlyData).sort((a,b) => b.localeCompare(a)).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white border-[3px] border-[#0F0F0F] px-4 py-2 font-mono text-[13px] text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100"
              >
                <option value="All">All Branches</option>
                <option value="CE">Computer (CE)</option>
                <option value="IT">IT</option>
                <option value="E&TC">E&TC</option>
                <option value="E&CE">E&CE</option>
                <option value="AI&DS">AI&DS</option>
              </select>
            </>
          )}
          <div className="flex items-center gap-2 bg-[#A3E635] border-[2px] border-[#0F0F0F] px-3 py-1.5 shadow-[2px_2px_0px_#0F0F0F]">
            <div className="w-2 h-2 bg-[#0F0F0F] animate-pulse" />
            <span className="font-black text-[10px] uppercase tracking-widest text-[#0F0F0F]">Live</span>
          </div>
        </div>
      </div>

      {/* LOADING / ERROR / EMPTY STATES */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-[3px] border-[#0F0F0F] border-t-[#F97316] animate-spin mx-auto" />
            <p className="font-mono text-[13px] text-[#888888] mt-4">Loading placement data...</p>
          </div>
        </div>
      ) : error || !yearlyData ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-[#FCA5A5] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-8 text-center">
            <p className="font-black text-[16px] text-[#0F0F0F]">Error loading data</p>
            <p className="font-mono text-[13px] text-[#4B4B4B] mt-2">{error || 'No data available'}</p>
          </div>
        </div>
      ) : !currentData ? (
        <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-12 text-center">
          <p className="font-mono text-[14px] text-[#888888]">No data available for {selectedYear}</p>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-[3px] border-[#0F0F0F] mb-8" variants={stagger} initial="initial" animate="animate">
            {kpiItems.map((item, i) => (
              <motion.div
                key={i}
                variants={cardAnim}
                className={`${item.bg} p-6 ${i < 3 ? 'border-r-0 lg:border-r-[3px] border-b-[3px] lg:border-b-0' : 'border-b-0'} border-[#0F0F0F]`}
              >
                <item.icon size={18} className="text-[#0F0F0F] mb-3" />
                <div className="font-black text-[32px] leading-none text-[#0F0F0F]">{item.value}</div>
                <div className="font-black text-[12px] uppercase tracking-widest text-[#0F0F0F] mt-2">{item.label}</div>
                <div className="font-mono text-[11px] text-[#4B4B4B] mt-1">{item.sub}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-[3px] border-[#0F0F0F] mb-8">
            {/* Left: Multi-year Placement Trend */}
            <div className="lg:col-span-7 bg-white border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-[#0F0F0F] p-6">
              <span className="font-black uppercase tracking-widest text-[10px] text-[#888888] border-b-[2px] border-[#0F0F0F] pb-2 inline-block mb-4">Year Over Year</span>
              <h3 className="font-black text-[18px] text-[#0F0F0F] mb-4">Placement Trend — Total Students Placed</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: '#888888', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: '#0F0F0F', strokeWidth: 2 }} tickLine={false} />
                    <YAxis tick={{ fill: '#888888', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<BrutalTooltip />} />
                    <Area type="monotone" dataKey="placed" stroke="#F97316" strokeWidth={3} fill="#F97316" fillOpacity={0.1} dot={{ fill: '#F97316', stroke: '#0F0F0F', strokeWidth: 2, r: 5 }} name="Students Placed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Branch-wise Distribution */}
            <div className="lg:col-span-5 bg-white p-6">
              <span className="font-black uppercase tracking-widest text-[10px] text-[#888888] border-b-[2px] border-[#0F0F0F] pb-2 inline-block mb-2">By Department · {selectedYear}</span>
              <h3 className="font-black text-[18px] text-[#0F0F0F] mb-4">Branch-wise Placed</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#888888', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="branch" tick={{ fill: '#0F0F0F', fontSize: 12, fontWeight: 800 }} axisLine={false} tickLine={false} width={45} />
                    <RechartsTooltip content={<BrutalTooltip />} />
                    <Bar dataKey="placed" fill="#F97316" stroke="#0F0F0F" strokeWidth={2} maxBarSize={20} name="Students" radius={0} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SECONDARY STATS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-[3px] border-[#0F0F0F] mb-8">
            {[
              { icon: Building2, value: currentData.topCompanies?.labels?.length || 0, label: 'Top Recruiters Tracked', sub: `For ${selectedYear}` },
              { icon: Award, value: currentData.highestPackage || '—', label: 'Highest Package', sub: `Overall in ${selectedYear}` },
              { icon: Clock, value: currentData.medianPackage || '—', label: 'Median Package', sub: `Overall in ${selectedYear}` },
            ].map((stat, i) => (
              <div key={i} className={`bg-white p-6 flex items-center gap-4 ${i < 2 ? 'border-r-0 sm:border-r-[3px] border-b-[3px] sm:border-b-0' : ''} border-[#0F0F0F]`}>
                <div className="w-12 h-12 bg-[#F97316] border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center justify-center flex-shrink-0">
                  <stat.icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-black text-[22px] text-[#0F0F0F]">{stat.value}</div>
                  <div className="font-black text-[11px] uppercase tracking-widest text-[#4B4B4B]">{stat.label}</div>
                  <div className="font-mono text-[10px] text-[#888888]">{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* TOP COMPANIES TABLE */}
          <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] mb-8">
            <div className="flex items-center justify-between p-6 border-b-[3px] border-[#0F0F0F]">
              <div>
                <span className="font-black uppercase tracking-widest text-[10px] text-[#888888]">Top Recruiters · {selectedYear}</span>
                <h3 className="font-black text-[20px] text-[#0F0F0F]">Company Hiring Breakdown</h3>
              </div>
              <button
                onClick={() => navigate('/app/records')}
                className="bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-4 py-2 text-[12px] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center gap-1"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FACC15] border-b-[3px] border-[#0F0F0F]">
                    <th className="font-black text-[11px] uppercase tracking-widest px-6 py-3 text-left border-r-[2px] border-[#0F0F0F]">#</th>
                    <th className="font-black text-[11px] uppercase tracking-widest px-6 py-3 text-left border-r-[2px] border-[#0F0F0F]">Company</th>
                    <th className="font-black text-[11px] uppercase tracking-widest px-6 py-3 text-left">Students Hired</th>
                  </tr>
                </thead>
                <tbody>
                  {topCompanyLabels.map((company, i) => (
                    <tr key={i} className="border-b-[2px] border-[#0F0F0F] hover:bg-[#FEF08A] transition-colors duration-75">
                      <td className="font-mono text-[13px] text-[#888888] px-6 py-3 border-r-[2px] border-[#0F0F0F] font-bold">{i + 1}</td>
                      <td className="font-bold text-[14px] text-[#0F0F0F] px-6 py-3 border-r-[2px] border-[#0F0F0F]">{company}</td>
                      <td className="px-6 py-3">
                        <span className="inline-block bg-[#A3E635] border-[2px] border-[#0F0F0F] font-black text-[11px] uppercase px-2.5 py-0.5 text-[#0F0F0F]">
                          {topCompanyData[i]} students
                        </span>
                      </td>
                    </tr>
                  ))}
                  {topCompanyLabels.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center font-mono text-[13px] text-[#888888] py-8">
                        No company data available for {selectedYear}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM ROW: Branch-wise + Year-over-year */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-[3px] border-[#0F0F0F]">
            {/* Left: Branch-wise breakdown */}
            <div className="bg-white border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-[#0F0F0F] p-6">
              <span className="font-black uppercase tracking-widest text-[10px] text-[#888888] border-b-[2px] border-[#0F0F0F] pb-2 inline-block mb-3">Branch Stats · {selectedYear}</span>
              <h3 className="font-black text-[18px] text-[#0F0F0F] mb-4">Department Breakdown</h3>
              {currentData.branchStats && Object.entries(currentData.branchStats).map(([branch, stats]) => (
                <div key={branch} className="flex items-center justify-between border-b-[2px] border-[#0F0F0F] py-3 hover:bg-[#FEF08A] transition-colors duration-75 px-2 -mx-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-[#F97316] border-[2px] border-[#0F0F0F] flex items-center justify-center font-black text-[10px] text-white">{branch}</div>
                    <div>
                      <div className="font-black text-[14px] text-[#0F0F0F]">{stats.totalPlaced} placed</div>
                      <div className="font-mono text-[11px] text-[#888888]">Avg: {stats.avgPackage}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[13px] text-[#F97316]">{stats.highestPackage}</div>
                    <div className="font-mono text-[10px] text-[#888888]">highest</div>
                  </div>
                </div>
              ))}
              {!currentData.branchStats && (
                <div className="py-8 text-center font-mono text-[13px] text-[#888888]">
                  Branch-wise data not available for {selectedYear}
                </div>
              )}
            </div>

            {/* Right: Year-over-year stats */}
            <div className="bg-[#FACC15] p-6">
              <span className="font-black uppercase tracking-widest text-[10px] text-[#0F0F0F] border-b-[2px] border-[#0F0F0F] pb-2 inline-block mb-3">All Years</span>
              <h3 className="font-black text-[18px] text-[#0F0F0F] mb-4">Year-wise Summary</h3>
              {sortedYears.map((year, i) => {
                const d = yearlyData[year];
                const isActive = year === selectedYear;
                return (
                  <div
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`flex items-center justify-between py-3 px-3 -mx-3 cursor-pointer border-b-[2px] border-[#0F0F0F] transition-all duration-100 ${
                      isActive ? 'bg-[#0F0F0F]' : 'hover:bg-[#F97316]/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 flex items-center justify-center font-black text-[11px] border-[2px] border-[#0F0F0F] ${
                        isActive ? 'bg-[#F97316] text-white' : 'bg-white text-[#0F0F0F]'
                      }`}>{i + 1}</div>
                      <div>
                        <div className={`font-black text-[14px] ${isActive ? 'text-[#F97316]' : 'text-[#0F0F0F]'}`}>{year}</div>
                        <div className={`font-mono text-[11px] ${isActive ? 'text-[#888888]' : 'text-[#4B4B4B]'}`}>{d?.totalPlaced || 0} students placed</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-[14px] ${isActive ? 'text-[#FACC15]' : 'text-[#0F0F0F]'}`}>{d?.avgPackage || '—'}</div>
                      <div className={`font-mono text-[10px] ${isActive ? 'text-[#888888]' : 'text-[#4B4B4B]'}`}>avg package</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Dashboard;
