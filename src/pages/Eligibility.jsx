import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Search, ChevronDown, Star, Building2, TrendingUp,
    Users, IndianRupee, Briefcase, Filter, LayoutGrid, List,
    Clock, MapPin, Award, AlertTriangle, ChevronRight, Eye, Bookmark,
    Zap, Target, ArrowUpRight, GraduationCap, Shield
} from 'lucide-react';
import skillData from '../data/skillData.json';
import '../styles/Eligibility.css';

/* ═══════════════════════════════════════════════════
   INLINE DECORATIVE COMPONENTS
   ═══════════════════════════════════════════════════ */

// Hero background orbs
const HeroOrbs = () => (
    <div className="el-hero-orbs">
        <svg width="100%" height="100%">
            <defs>
                <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="80%" cy="20%" r="300" fill="url(#orb1)">
                <animate attributeName="cy" values="20%;30%;20%" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="20%" cy="80%" r="250" fill="url(#orb2)">
                <animate attributeName="cx" values="20%;28%;20%" dur="10s" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

// Score Ring SVG for profile health
const ScoreRing = ({ percentage, size = 110, color }) => {
    const circumference = 2 * Math.PI * 42;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className="el-score-ring">
            <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                transform="rotate(-90 50 50)"
            />
            <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
                fill={color} fontSize="22" fontWeight="700" fontFamily="Inter, sans-serif">
                {percentage}
            </text>
            <text x="50" y="62" textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">
                SCORE
            </text>
        </svg>
    );
};

// Animated Status Dot (pass/fail)
const StatusDot = ({ pass }) => (
    <motion.svg width="18" height="18" viewBox="0 0 20 20"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
        <circle cx="10" cy="10" r="8" fill={pass ? '#22C55E' : '#EF4444'} />
        <motion.path
            d={pass ? 'M6.5 10l2.5 2.5 4.5-4.5' : 'M7 7l6 6M13 7l-6 6'}
            stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 0.15, duration: 0.25 }}
        />
    </motion.svg>
);

// Empty state illustration
const EmptyIllustration = () => (
    <svg width="180" height="180" viewBox="0 0 200 200" fill="none" className="el-empty-svg">
        <defs>
            <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.08" />
            </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#emptyGrad)" opacity="0.5" />
        <circle cx="88" cy="88" r="28" stroke="#525252" strokeWidth="3" fill="none" />
        <line x1="110" y1="110" x2="130" y2="130" stroke="#525252" strokeWidth="3" strokeLinecap="round" />
        <rect x="125" y="60" width="36" height="45" rx="4" fill="#1A1A1A" stroke="#2A2A2A" />
        <line x1="132" y1="73" x2="154" y2="73" stroke="#3A3A3A" strokeWidth="2" />
        <line x1="132" y1="82" x2="154" y2="82" stroke="#3A3A3A" strokeWidth="2" />
        <line x1="132" y1="91" x2="146" y2="91" stroke="#3A3A3A" strokeWidth="2" />
        <line x1="58" y1="118" x2="66" y2="126" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="66" y1="118" x2="58" y2="126" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
);

// Motion variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};
const statVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } }
};

/* ═══════════════════════════════════════════════════
   HELPER: deduplicate companies from JSON
   ═══════════════════════════════════════════════════ */
const companyList = (() => {
    const seen = new Map();
    skillData.forEach(c => {
        const name = (c.display_name || '').replace(/_$/, '');
        if (!seen.has(name)) seen.set(name, { ...c, display_name: name });
    });
    return [...seen.values()];
})();

// Extract unique sectors
const ALL_SECTORS = [...new Set(companyList.map(c => c.sector))].sort();

/* ═══════════════════════════════════════════════════
   ELIGIBILITY CHECK
   ═══════════════════════════════════════════════════ */
const checkEligibility = (company, profile) => {
    const el = company.eligibility || {};
    const checks = {
        cgpa: !el.min_cgpa || parseFloat(profile.cgpa) >= el.min_cgpa,
        tenth: !el.min_10th || parseFloat(profile.tenth) >= el.min_10th,
        twelfth: !el.min_12th || parseFloat(profile.twelfth) >= el.min_12th,
        amcat: !el.min_amcat || el.min_amcat === 0 || parseFloat(profile.amcat) >= el.min_amcat,
        branch: !el.allowed_branches || el.allowed_branches.length === 0 || el.allowed_branches.includes(profile.department),
        backlogs: el.active_backlogs_allowed || parseInt(profile.backlogs) === 0
    };
    const isEligible = Object.values(checks).every(Boolean);
    const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    return { isEligible, checks, failedChecks };
};

/* ═══════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════ */
const useAnimatedCount = (target, duration = 600) => {
    const [count, setCount] = useState(0);
    const prevRef = useRef(0);
    useEffect(() => {
        const start = prevRef.current;
        const diff = target - start;
        if (diff === 0) return;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(start + diff * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        prevRef.current = target;
    }, [target, duration]);
    return count;
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const Eligibility = () => {
    // ── Profile state ──
    const [profile, setProfile] = useState({
        cgpa: '8.5', tenth: '85', twelfth: '82', amcat: '70',
        department: 'CE', backlogs: '0'
    });
    const updateProfile = (key, value) => setProfile(p => ({ ...p, [key]: value }));

    // ── Filter state ──
    const [filters, setFilters] = useState({
        search: '', sectors: [], sortBy: 'package', view: 'grid'
    });

    // ── UI state ──
    const [shortlist, setShortlist] = useState([]);
    const [expandedCard, setExpandedCard] = useState(null);
    const [modalCompany, setModalCompany] = useState(null);

    // ── Computed data ──
    const enrichedCompanies = useMemo(() => {
        return companyList.map(c => {
            const { isEligible, checks, failedChecks } = checkEligibility(c, profile);
            const maxCtc = Math.max(...(c.roles_offered || []).map(r => r.ctc_lpa || 0), 0);
            return { ...c, isEligible, checks, failedChecks, maxCtc };
        });
    }, [profile]);

    const filteredCompanies = useMemo(() => {
        let result = [...enrichedCompanies];
        // Search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(c =>
                c.display_name.toLowerCase().includes(q) ||
                (c.sector || '').toLowerCase().includes(q)
            );
        }
        // Sector filter
        if (filters.sectors.length > 0) {
            result = result.filter(c => filters.sectors.includes(c.sector));
        }
        // Sort
        switch (filters.sortBy) {
            case 'package':
                result.sort((a, b) => b.maxCtc - a.maxCtc);
                break;
            case 'eligibility':
                result.sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0));
                break;
            case 'name':
                result.sort((a, b) => a.display_name.localeCompare(b.display_name));
                break;
        }
        return result;
    }, [enrichedCompanies, filters]);

    const eligibleCount = enrichedCompanies.filter(c => c.isEligible).length;
    const eligibleCompanies = enrichedCompanies.filter(c => c.isEligible);

    const avgPackage = useMemo(() => {
        if (eligibleCompanies.length === 0) return 0;
        const total = eligibleCompanies.reduce((sum, c) => sum + c.maxCtc, 0);
        return (total / eligibleCompanies.length).toFixed(1);
    }, [eligibleCompanies]);

    const topSector = useMemo(() => {
        const freq = {};
        eligibleCompanies.forEach(c => { freq[c.sector] = (freq[c.sector] || 0) + 1; });
        return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    }, [eligibleCompanies]);

    // ── Insights ──
    const insights = useMemo(() => {
        const highestPkg = eligibleCompanies.length > 0
            ? eligibleCompanies.reduce((best, c) => c.maxCtc > best.maxCtc ? c : best)
            : null;
        // Most common blocker
        const blockerFreq = {};
        enrichedCompanies.filter(c => !c.isEligible).forEach(c => {
            c.failedChecks.forEach(k => { blockerFreq[k] = (blockerFreq[k] || 0) + 1; });
        });
        const topBlocker = Object.entries(blockerFreq).sort((a, b) => b[1] - a[1])[0];
        // Quick wins (1 criteria away)
        const quickWins = enrichedCompanies.filter(c => !c.isEligible && c.failedChecks.length === 1);
        return { highestPkg, topBlocker, quickWins };
    }, [enrichedCompanies, eligibleCompanies]);

    // ── Profile health ──
    const profileHealth = useMemo(() => {
        let score = 0;
        const cgpa = parseFloat(profile.cgpa) || 0;
        const tenth = parseFloat(profile.tenth) || 0;
        const twelfth = parseFloat(profile.twelfth) || 0;
        const amcat = parseFloat(profile.amcat) || 0;
        score += Math.min(cgpa / 10, 1) * 35;
        score += Math.min(tenth / 100, 1) * 20;
        score += Math.min(twelfth / 100, 1) * 20;
        score += Math.min(amcat / 100, 1) * 15;
        if (parseInt(profile.backlogs) === 0) score += 10;
        return Math.round(score);
    }, [profile]);

    const healthColor = profileHealth >= 75 ? '#22C55E' : profileHealth >= 50 ? '#F59E0B' : '#EF4444';

    // ── Animated counters ──
    const animEligible = useAnimatedCount(eligibleCount);
    const animTotal = useAnimatedCount(companyList.length);

    // ── Shortlist toggle ──
    const toggleShortlist = (name) => {
        setShortlist(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const toggleSector = (sector) => {
        setFilters(prev => ({
            ...prev,
            sectors: prev.sectors.includes(sector)
                ? prev.sectors.filter(s => s !== sector)
                : [...prev.sectors, sector]
        }));
    };

    const cgpaVal = parseFloat(profile.cgpa) || 0;
    const cgpaColor = cgpaVal >= 7.5 ? '#22C55E' : cgpaVal >= 6 ? '#F59E0B' : '#EF4444';

    const CRITERIA_LABELS = {
        cgpa: 'CGPA', tenth: '10th %', twelfth: '12th %',
        amcat: 'AMCAT', branch: 'Branch', backlogs: 'Backlogs'
    };

    /* ═══════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════ */
    return (
        <div className="el-page">

            {/* ═══ HERO SECTION ═══ */}
            <section className="el-hero">
                <HeroOrbs />
                <div className="el-hero-text">
                    <motion.h1 className="el-hero-title"
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}>
                        Placement Gateway
                    </motion.h1>
                    <motion.p className="el-hero-sub"
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}>
                        Discover where you qualify — powered by real TnP data
                    </motion.p>
                </div>
                <motion.div className="el-stats-row"
                    variants={containerVariants} initial="hidden" animate="show">
                    <motion.div className="el-stat-card green" variants={statVariants} whileHover={{ y: -3 }}>
                        <div className="el-stat-icon"><Shield size={20} /></div>
                        <div className="el-stat-info">
                            <span className="el-stat-number">{animEligible}</span>
                            <span className="el-stat-label">Eligible</span>
                        </div>
                    </motion.div>
                    <motion.div className="el-stat-card orange" variants={statVariants} whileHover={{ y: -3 }}>
                        <div className="el-stat-icon"><Building2 size={20} /></div>
                        <div className="el-stat-info">
                            <span className="el-stat-number">{animTotal}</span>
                            <span className="el-stat-label">Total Companies</span>
                        </div>
                    </motion.div>
                    <motion.div className="el-stat-card blue" variants={statVariants} whileHover={{ y: -3 }}>
                        <div className="el-stat-icon"><IndianRupee size={20} /></div>
                        <div className="el-stat-info">
                            <span className="el-stat-number">{avgPackage}</span>
                            <span className="el-stat-label">Avg Package (LPA)</span>
                        </div>
                    </motion.div>
                    <motion.div className="el-stat-card purple" variants={statVariants} whileHover={{ y: -3 }}>
                        <div className="el-stat-icon"><TrendingUp size={20} /></div>
                        <div className="el-stat-info">
                            <span className="el-stat-number el-stat-text">{topSector}</span>
                            <span className="el-stat-label">Top Sector</span>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══ MAIN LAYOUT ═══ */}
            <div className="el-main">

                {/* ═══ LEFT SIDEBAR ═══ */}
                <aside className="el-sidebar">
                    {/* Profile Card */}
                    <div className="el-profile-card">
                        <div className="el-card-header">
                            <Target size={16} />
                            <h3>Your Profile</h3>
                        </div>

                        {/* CGPA */}
                        <div className="el-field">
                            <label>CGPA</label>
                            <input type="number" step="0.1" min="0" max="10"
                                value={profile.cgpa}
                                onChange={e => updateProfile('cgpa', e.target.value)}
                            />
                            <div className="el-meter">
                                <div className="el-meter-fill" style={{
                                    width: `${Math.min((cgpaVal / 10) * 100, 100)}%`,
                                    background: cgpaColor
                                }} />
                            </div>
                        </div>

                        {/* 10th & 12th */}
                        <div className="el-field-row">
                            <div className="el-field">
                                <label>10th (%)</label>
                                <input type="number" min="0" max="100"
                                    value={profile.tenth}
                                    onChange={e => updateProfile('tenth', e.target.value)}
                                />
                            </div>
                            <div className="el-field">
                                <label>12th (%)</label>
                                <input type="number" min="0" max="100"
                                    value={profile.twelfth}
                                    onChange={e => updateProfile('twelfth', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* AMCAT */}
                        <div className="el-field">
                            <label>AMCAT Score (%)</label>
                            <input type="number" min="0" max="100"
                                value={profile.amcat}
                                onChange={e => updateProfile('amcat', e.target.value)}
                            />
                        </div>

                        {/* Department */}
                        <div className="el-field">
                            <label>Department</label>
                            <div className="el-select-wrap">
                                <select value={profile.department}
                                    onChange={e => updateProfile('department', e.target.value)}>
                                    <option value="CE">CE</option>
                                    <option value="IT">IT</option>
                                    <option value="E&TC">E&TC</option>
                                    <option value="AI&DS">AI&DS</option>
                                    <option value="ECE">ECE</option>
                                </select>
                                <ChevronDown size={14} className="el-select-arrow" />
                            </div>
                        </div>

                        {/* Backlogs */}
                        <div className="el-field">
                            <label>Active Backlogs</label>
                            <div className="el-toggle-row">
                                <button className={`el-toggle-btn ${parseInt(profile.backlogs) === 0 ? 'active' : ''}`}
                                    onClick={() => updateProfile('backlogs', '0')}>No</button>
                                <button className={`el-toggle-btn ${parseInt(profile.backlogs) > 0 ? 'active danger' : ''}`}
                                    onClick={() => updateProfile('backlogs', '1')}>Yes</button>
                            </div>
                            {parseInt(profile.backlogs) > 0 && (
                                <div className="el-warning">
                                    <AlertTriangle size={12} />
                                    <span>May reduce eligible companies</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Health — Score Ring */}
                    <div className="el-health-card">
                        <div className="el-card-header">
                            <Zap size={16} />
                            <h3>Profile Strength</h3>
                        </div>
                        <div className="el-health-ring-wrap">
                            <ScoreRing percentage={profileHealth} color={healthColor} />
                        </div>
                        <p className="el-health-tip">
                            {profileHealth >= 80
                                ? '🎯 Strong profile — you qualify for top companies'
                                : profileHealth >= 60
                                    ? '📈 Good profile — focus on CGPA & AMCAT to unlock more'
                                    : '⚡ Improve CGPA and scores to access more opportunities'}
                        </p>
                    </div>

                    {/* Shortlist */}
                    {shortlist.length > 0 && (
                        <div className="el-shortlist-card">
                            <div className="el-card-header">
                                <Bookmark size={16} />
                                <h3>Shortlisted ({shortlist.length})</h3>
                            </div>
                            <div className="el-shortlist-list">
                                {shortlist.map(name => (
                                    <div key={name} className="el-shortlist-item">
                                        <span>{name}</span>
                                        <button onClick={() => toggleShortlist(name)} className="el-remove-btn">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* ═══ RIGHT PANEL ═══ */}
                <div className="el-directory">
                    {/* Filter Bar */}
                    <div className="el-filter-bar">
                        <div className="el-search-wrap">
                            <Search size={15} className="el-search-icon" />
                            <input type="text" placeholder="Search companies..."
                                value={filters.search}
                                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                            />
                        </div>
                        <div className="el-filter-controls">
                            <div className="el-sort-wrap">
                                <select value={filters.sortBy}
                                    onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}>
                                    <option value="package">Package ↓</option>
                                    <option value="eligibility">Eligible First</option>
                                    <option value="name">Name A-Z</option>
                                </select>
                            </div>
                            <div className="el-view-toggle">
                                <button className={filters.view === 'grid' ? 'active' : ''}
                                    onClick={() => setFilters(f => ({ ...f, view: 'grid' }))}>
                                    <LayoutGrid size={15} />
                                </button>
                                <button className={filters.view === 'list' ? 'active' : ''}
                                    onClick={() => setFilters(f => ({ ...f, view: 'list' }))}>
                                    <List size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sector Pills */}
                    <div className="el-sector-pills">
                        {ALL_SECTORS.slice(0, 12).map(s => (
                            <button key={s}
                                className={`el-sector-pill ${filters.sectors.includes(s) ? 'active' : ''}`}
                                onClick={() => toggleSector(s)}>
                                {s}
                            </button>
                        ))}
                        {filters.sectors.length > 0 && (
                            <button className="el-sector-pill clear"
                                onClick={() => setFilters(f => ({ ...f, sectors: [] }))}>
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="el-results-meta">
                        <span>{filteredCompanies.length} companies</span>
                        <span className="el-results-eligible">{filteredCompanies.filter(c => c.isEligible).length} eligible</span>
                    </div>

                    {/* Company Cards */}
                    <motion.div className={`el-cards-grid ${filters.view}`}
                        variants={containerVariants} initial="hidden" animate="show" key={filters.search + filters.sectors.join() + filters.sortBy}>
                        {filteredCompanies.map((company, idx) => {
                            const el = company.eligibility || {};
                            const isShortlisted = shortlist.includes(company.display_name);
                            const isExpanded = expandedCard === company.company_name;
                            const topRole = (company.roles_offered || [])[0];

                            return (
                                <motion.div key={company.company_name}
                                    className={`el-company-card ${company.isEligible ? 'eligible' : 'not-eligible'} ${isExpanded ? 'expanded' : ''}`}
                                    variants={cardVariants}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                >
                                    {/* Card Header */}
                                    <div className="el-card-top">
                                        <span className="el-sector-badge">{company.sector}</span>
                                        <div className="el-card-actions">
                                            <button className={`el-star-btn ${isShortlisted ? 'active' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); toggleShortlist(company.display_name); }}>
                                                <Star size={14} fill={isShortlisted ? '#F59E0B' : 'none'} />
                                            </button>
                                            <span className={`el-elig-badge ${company.isEligible ? 'pass' : 'fail'}`}>
                                                {company.isEligible ? <><Check size={12} /> Eligible</> : <><X size={12} /> Not Eligible</>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Company Info */}
                                    <h4 className="el-company-name">{company.display_name}</h4>
                                    <div className="el-company-meta">
                                        {company.maxCtc > 0 && (
                                            <span className="el-meta-item">
                                                <IndianRupee size={12} /> ₹{company.maxCtc} LPA
                                            </span>
                                        )}
                                        {company.hiring_season && (
                                            <span className="el-meta-item">
                                                <Clock size={12} /> {company.hiring_season}
                                            </span>
                                        )}
                                    </div>

                                    {/* Eligibility Checklist */}
                                    <div className="el-checklist">
                                        {[
                                            { key: 'cgpa', label: 'CGPA', yours: profile.cgpa, req: el.min_cgpa },
                                            { key: 'tenth', label: '10th', yours: profile.tenth + '%', req: el.min_10th ? el.min_10th + '%' : null },
                                            { key: 'twelfth', label: '12th', yours: profile.twelfth + '%', req: el.min_12th ? el.min_12th + '%' : null },
                                            { key: 'amcat', label: 'AMCAT', yours: profile.amcat + '%', req: el.min_amcat ? el.min_amcat + '%' : null },
                                        ].filter(item => item.req && item.req !== '0%' && item.req !== 0).map(item => (
                                            <div key={item.key} className={`el-check-row ${company.checks[item.key] ? 'pass' : 'fail'}`}>
                                                <StatusDot pass={company.checks[item.key]} />
                                                <span className="el-check-label">{item.label}</span>
                                                <span className="el-check-values">{item.yours}/{item.req}</span>
                                            </div>
                                        ))}
                                        <div className={`el-check-row ${company.checks.branch ? 'pass' : 'fail'}`}>
                                            <StatusDot pass={company.checks.branch} />
                                            <span className="el-check-label">Branch</span>
                                            <span className="el-check-values">{profile.department}</span>
                                        </div>
                                        {!el.active_backlogs_allowed && (
                                            <div className={`el-check-row ${company.checks.backlogs ? 'pass' : 'fail'}`}>
                                                <StatusDot pass={company.checks.backlogs} />
                                                <span className="el-check-label">No Backlogs</span>
                                                <span className="el-check-values">{parseInt(profile.backlogs) === 0 ? 'Clear' : 'Has'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="el-card-footer">
                                        <button className="el-view-btn" onClick={() => setModalCompany(company)}>
                                            <Eye size={13} /> View Details
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Empty State */}
                    {filteredCompanies.length === 0 && (
                        <motion.div className="el-empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}>
                            <EmptyIllustration />
                            <h3>No companies found</h3>
                            <p>Adjust your filters or profile to discover opportunities</p>
                        </motion.div>
                    )}

                    {/* ═══ INSIGHT CARDS ═══ */}
                    <motion.div className="el-insights"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5, staggerChildren: 0.1 }}>
                        <motion.div className="el-insight-card green"
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                            <div className="el-insight-icon"><Award size={18} /></div>
                            <div className="el-insight-body">
                                <span className="el-insight-label">Highest Package You Qualify For</span>
                                <span className="el-insight-value">
                                    {insights.highestPkg ? `₹${insights.highestPkg.maxCtc} LPA — ${insights.highestPkg.display_name}` : 'Build your profile'}
                                </span>
                            </div>
                        </motion.div>
                        <motion.div className="el-insight-card red"
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                            <div className="el-insight-icon"><AlertTriangle size={18} /></div>
                            <div className="el-insight-body">
                                <span className="el-insight-label">Most Common Blocker</span>
                                <span className="el-insight-value">
                                    {insights.topBlocker
                                        ? `${CRITERIA_LABELS[insights.topBlocker[0]]} — blocking ${insights.topBlocker[1]} companies`
                                        : 'No blockers!'}
                                </span>
                            </div>
                        </motion.div>
                        <motion.div className="el-insight-card amber"
                            whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                            <div className="el-insight-icon"><Zap size={18} /></div>
                            <div className="el-insight-body">
                                <span className="el-insight-label">Quick Wins (1 Criteria Away)</span>
                                <span className="el-insight-value">
                                    {insights.quickWins.length > 0
                                        ? `${insights.quickWins.length} companies — ${insights.quickWins.slice(0, 3).map(c => c.display_name).join(', ')}`
                                        : 'None right now'}
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* ═══ COMPANY DETAIL MODAL ═══ */}
            <AnimatePresence>
                {modalCompany && (
                    <motion.div className="el-modal-overlay" onClick={() => setModalCompany(null)}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}>
                        <motion.div className="el-modal" onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.97 }}
                            transition={{ duration: 0.2 }}>
                            <button className="el-modal-close" onClick={() => setModalCompany(null)}>
                                <X size={18} />
                            </button>

                            <div className="el-modal-header">
                                <div>
                                    <span className="el-sector-badge">{modalCompany.sector}</span>
                                    <h2>{modalCompany.display_name}</h2>
                                    <div className="el-modal-meta">
                                        {modalCompany.hiring_season && <span><Clock size={13} /> {modalCompany.hiring_season}</span>}
                                        {modalCompany.avg_selections_per_year && (
                                            <span><Users size={13} /> ~{modalCompany.avg_selections_per_year} selections/yr</span>
                                        )}
                                    </div>
                                </div>
                                <span className={`el-elig-badge large ${modalCompany.isEligible ? 'pass' : 'fail'}`}>
                                    {modalCompany.isEligible ? <><Check size={14} /> Eligible</> : <><X size={14} /> Not Eligible</>}
                                </span>
                            </div>

                            {/* Eligibility Breakdown */}
                            <div className="el-modal-section">
                                <h4>Eligibility Criteria</h4>
                                <div className="el-modal-checks">
                                    {Object.entries(modalCompany.checks).map(([key, passed]) => (
                                        <div key={key} className={`el-modal-check ${passed ? 'pass' : 'fail'}`}>
                                            {passed ? <Check size={14} /> : <X size={14} />}
                                            <span>{CRITERIA_LABELS[key] || key}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Roles Offered */}
                            <div className="el-modal-section">
                                <h4>Roles Offered</h4>
                                {(modalCompany.roles_offered || []).map((role, i) => (
                                    <div key={i} className="el-modal-role">
                                        <div className="el-modal-role-header">
                                            <span className="el-role-title">{role.role_title}</span>
                                            <div className="el-role-badges">
                                                <span className="el-role-type">{role.role_type}</span>
                                                <span className="el-role-ctc">₹{role.ctc_lpa} LPA</span>
                                            </div>
                                        </div>
                                        {/* Skills */}
                                        <div className="el-modal-skills">
                                            {(role.must_have_skills || []).map(s => (
                                                <span key={s} className="el-skill-tag must">{s}</span>
                                            ))}
                                            {(role.good_to_have_skills || []).map(s => (
                                                <span key={s} className="el-skill-tag good">{s}</span>
                                            ))}
                                        </div>
                                        {/* Rounds */}
                                        {role.rounds && (
                                            <div className="el-modal-rounds">
                                                {role.rounds.map((r, ri) => (
                                                    <div key={ri} className="el-round-step">
                                                        <span className="el-round-num">{ri + 1}</span>
                                                        <div className="el-round-info">
                                                            <span className="el-round-name">{r.round_name}</span>
                                                            <span className="el-round-focus">{(r.focus_areas || []).join(', ')}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Visit History */}
                            {modalCompany.pict_visit_history && (
                                <div className="el-modal-section">
                                    <h4>Past Visits</h4>
                                    <div className="el-visit-pills">
                                        {modalCompany.pict_visit_history.map(year => (
                                            <span key={year} className="el-visit-pill">{year}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="el-modal-footer">
                                <button className={`el-shortlist-btn ${shortlist.includes(modalCompany.display_name) ? 'active' : ''}`}
                                    onClick={() => toggleShortlist(modalCompany.display_name)}>
                                    <Star size={14} fill={shortlist.includes(modalCompany.display_name) ? '#F59E0B' : 'none'} />
                                    {shortlist.includes(modalCompany.display_name) ? 'Shortlisted' : 'Add to Shortlist'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Eligibility;
