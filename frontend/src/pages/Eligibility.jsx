import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Search, ChevronDown, Star, Building2, TrendingUp,
    Users, IndianRupee, Briefcase, Filter, LayoutGrid, List,
    Clock, MapPin, Award, AlertTriangle, ChevronRight, Eye, Bookmark,
    Zap, Target, ArrowUpRight, GraduationCap, Shield
} from 'lucide-react';
import skillData from '../data/skillData.json';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPER: deduplicate companies from JSON
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const companyList = (() => {
    const seen = new Map();
    skillData.forEach(c => {
        const name = (c.display_name || '').replace(/_$/, '');
        if (!seen.has(name)) seen.set(name, { ...c, display_name: name });
    });
    return [...seen.values()];
})();

const ALL_SECTORS = [...new Set(companyList.map(c => c.sector))].sort();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ELIGIBILITY CHECK
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const checkEligibility = (company, profile, maxCtc) => {
    const el = company.eligibility || {};
    const checks = {
        cgpa: !el.min_cgpa || parseFloat(profile.cgpa) >= el.min_cgpa,
        tenth: !el.min_10th || parseFloat(profile.tenth) >= el.min_10th,
        twelfth: !el.min_12th || parseFloat(profile.twelfth) >= el.min_12th,
        amcat: maxCtc <= 20 || !el.min_amcat || el.min_amcat === 0 || parseFloat(profile.amcat) >= el.min_amcat,
        branch: !el.allowed_branches || el.allowed_branches.length === 0 || el.allowed_branches.includes(profile.department),
        backlogs: el.active_backlogs_allowed || parseInt(profile.backlogs) === 0
    };
    const isEligible = Object.values(checks).every(Boolean);
    const failedChecks = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
    return { isEligible, checks, failedChecks };
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ANIMATED COUNTER HOOK
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

const CRITERIA_LABELS = {
    cgpa: 'CGPA', tenth: '10th %', twelfth: '12th %',
    amcat: 'AMCAT', branch: 'Branch', backlogs: 'Backlogs'
};


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const Eligibility = () => {
    const [profile, setProfile] = useState({
        cgpa: '8.5', tenth: '85', twelfth: '82', amcat: '70',
        department: 'CE', backlogs: '0'
    });
    const updateProfile = (key, value) => setProfile(p => ({ ...p, [key]: value }));

    const [filters, setFilters] = useState({
        search: '', sectors: [], sortBy: 'package'
    });
    const [shortlist, setShortlist] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null);
    const [modalCompany, setModalCompany] = useState(null);

    const enrichedCompanies = useMemo(() => {
        return companyList.map(c => {
            const maxCtc = Math.max(...(c.roles_offered || []).map(r => r.ctc_lpa || 0), 0);
            const { isEligible, checks, failedChecks } = checkEligibility(c, profile, maxCtc);
            return { ...c, isEligible, checks, failedChecks, maxCtc };
        });
    }, [profile]);

    const filteredCompanies = useMemo(() => {
        let result = [...enrichedCompanies];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(c =>
                c.display_name.toLowerCase().includes(q) ||
                (c.sector || '').toLowerCase().includes(q)
            );
        }
        if (filters.sectors.length > 0) {
            result = result.filter(c => filters.sectors.includes(c.sector));
        }
        switch (filters.sortBy) {
            case 'package': result.sort((a, b) => b.maxCtc - a.maxCtc); break;
            case 'eligibility': result.sort((a, b) => (b.isEligible ? 1 : 0) - (a.isEligible ? 1 : 0)); break;
            case 'name': result.sort((a, b) => a.display_name.localeCompare(b.display_name)); break;
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
        return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'â€”';
    }, [eligibleCompanies]);

    const insights = useMemo(() => {
        const highestPkg = eligibleCompanies.length > 0
            ? eligibleCompanies.reduce((best, c) => c.maxCtc > best.maxCtc ? c : best)
            : null;
        const blockerFreq = {};
        enrichedCompanies.filter(c => !c.isEligible).forEach(c => {
            c.failedChecks.forEach(k => { blockerFreq[k] = (blockerFreq[k] || 0) + 1; });
        });
        const topBlocker = Object.entries(blockerFreq).sort((a, b) => b[1] - a[1])[0];
        const quickWins = enrichedCompanies.filter(c => !c.isEligible && c.failedChecks.length === 1);
        return { highestPkg, topBlocker, quickWins };
    }, [enrichedCompanies, eligibleCompanies]);

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

    const animEligible = useAnimatedCount(eligibleCount);
    const animTotal = useAnimatedCount(companyList.length);

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


    // â•â•â•â•â•â•â• RENDER â•â•â•â•â•â•â•
    return (
        <div className="flex flex-col gap-4 p-2 bg-[#FFFBF0] min-h-screen">
            {/* â•â•â• STATS STRIP â•â•â• */}
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {icon:<Shield size={18}/>,val:animEligible,label:'ELIGIBLE',bg:'bg-[#A3E635]'},
                    {icon:<Building2 size={18}/>,val:animTotal,label:'TOTAL COMPANIES',bg:'bg-[#FACC15]'},
                    {icon:<IndianRupee size={18}/>,val:avgPackage,label:'AVG PKG (LPA)',bg:'bg-[#F97316] text-white'},
                    {icon:<TrendingUp size={18}/>,val:topSector,label:'TOP SECTOR',bg:'bg-white',isText:true},
                ].map((s,i)=>(
                    <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
                        className={`${s.bg} border-[3px] border-[#0F0F0F] p-3 shadow-[4px_4px_0px_#0F0F0F] flex items-center gap-3`}>
                        <div className="border-2 border-[#0F0F0F] p-2 bg-white/30">{s.icon}</div>
                        <div className="flex flex-col">
                            <span className={`font-black ${s.isText?'text-sm':'text-2xl'} leading-tight`}>{s.val}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{s.label}</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* â•â•â• MAIN 2-COL LAYOUT â•â•â• */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 flex-1">

                {/* â”€â”€â”€ LEFT PANEL â”€â”€â”€ */}
                <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:0.2}} className="flex flex-col gap-4">
                    {/* Profile Card */}
                    <div className="bg-white border-[3px] border-[#0F0F0F] p-4 shadow-[4px_4px_0px_#0F0F0F]">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[#0F0F0F]">
                            <Target size={16}/>
                            <h3 className="font-black text-sm uppercase">Your Profile</h3>
                            <span className="ml-auto text-xs font-black px-2 py-0.5 border-2 border-[#0F0F0F]"
                                style={{background:cgpaColor,color:cgpaVal>=6?'#0F0F0F':'#fff'}}>
                                {profileHealth}% Strength
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {label:'CGPA',key:'cgpa',max:'10',step:'0.1'},
                                {label:'AMCAT %',key:'amcat',max:'100'},
                                {label:'10th %',key:'tenth',max:'100'},
                                {label:'12th %',key:'twelfth',max:'100'},
                            ].map(f=>(
                                <div key={f.key} className="flex flex-col gap-1">
                                    <label className="text-[10px] font-black uppercase text-gray-500">{f.label}</label>
                                    <input type="number" step={f.step||'1'} min="0" max={f.max}
                                        value={profile[f.key]}
                                        onChange={e=>updateProfile(f.key,e.target.value)}
                                        className="w-full bg-[#FFFBF0] border-2 border-[#0F0F0F] px-2 py-1.5 font-bold text-sm focus:outline-none focus:shadow-[2px_2px_0px_#F97316]"/>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase text-gray-500">Department</label>
                                <select value={profile.department} onChange={e=>updateProfile('department',e.target.value)}
                                    className="bg-[#FFFBF0] border-2 border-[#0F0F0F] px-2 py-1.5 font-bold text-sm focus:outline-none">
                                    {['CE','IT','E&TC','AI&DS','ECE'].map(d=><option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase text-gray-500">Backlogs</label>
                                <div className="flex gap-1">
                                    <button onClick={()=>updateProfile('backlogs','0')}
                                        className={`flex-1 py-1.5 border-2 border-[#0F0F0F] font-black text-xs ${parseInt(profile.backlogs)===0?'bg-[#A3E635] shadow-[2px_2px_0px_#0F0F0F]':'bg-white'}`}>No</button>
                                    <button onClick={()=>updateProfile('backlogs','1')}
                                        className={`flex-1 py-1.5 border-2 border-[#0F0F0F] font-black text-xs ${parseInt(profile.backlogs)>0?'bg-red-400 text-white shadow-[2px_2px_0px_#0F0F0F]':'bg-white'}`}>Yes</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="flex flex-col gap-3">
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}
                            className="bg-[#A3E635] border-[3px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F]">
                            <div className="flex items-center gap-2 mb-1"><Award size={14}/><span className="text-[10px] font-black uppercase">Best Package</span></div>
                            <p className="font-black text-sm truncate">{insights.highestPkg ? `Rs.${insights.highestPkg.maxCtc} LPA - ${insights.highestPkg.display_name}` : 'Build profile'}</p>
                        </motion.div>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
                            className="bg-[#FACC15] border-[3px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F]">
                            <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14}/><span className="text-[10px] font-black uppercase">Top Blocker</span></div>
                            <p className="font-black text-sm truncate">{insights.topBlocker ? `${CRITERIA_LABELS[insights.topBlocker[0]]} - ${insights.topBlocker[1]} companies` : 'No blockers!'}</p>
                        </motion.div>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
                            className="bg-[#F97316] border-[3px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F] text-white">
                            <div className="flex items-center gap-2 mb-1"><Zap size={14}/><span className="text-[10px] font-black uppercase">Quick Wins</span></div>
                            <p className="font-black text-sm truncate">{insights.quickWins.length > 0 ? `${insights.quickWins.length} companies - 1 fix away` : 'None right now'}</p>
                        </motion.div>
                    </div>

                    {/* Shortlist */}
                    {shortlist.length > 0 && (
                        <div className="bg-white border-[3px] border-[#0F0F0F] p-3 shadow-[3px_3px_0px_#0F0F0F]">
                            <div className="flex items-center gap-2 mb-2"><Bookmark size={14}/><span className="font-black text-xs uppercase">Shortlisted ({shortlist.length})</span></div>
                            <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                                {shortlist.map(n=>(
                                    <div key={n} className="flex justify-between items-center bg-[#FFFBF0] border border-[#0F0F0F] px-2 py-1">
                                        <span className="text-xs font-bold truncate">{n}</span>
                                        <button onClick={()=>toggleShortlist(n)} className="hover:text-red-500"><X size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* â”€â”€â”€ RIGHT: COMPANY DIRECTORY â”€â”€â”€ */}
                <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:0.15}} className="flex flex-col gap-3">
                    {/* Search + Sort Bar */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="text" placeholder="Search companies..."
                                value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border-[3px] border-[#0F0F0F] font-bold text-sm focus:outline-none focus:shadow-[3px_3px_0px_#F97316]"/>
                        </div>
                        <select value={filters.sortBy} onChange={e=>setFilters(f=>({...f,sortBy:e.target.value}))}
                            className="bg-white border-[3px] border-[#0F0F0F] px-3 py-2.5 font-bold text-sm shadow-[2px_2px_0px_#0F0F0F] focus:outline-none">
                            <option value="package">Package</option>
                            <option value="eligibility">Eligible First</option>
                            <option value="name">Name A-Z</option>
                        </select>
                        <div className="bg-[#0F0F0F] text-white px-3 py-2.5 font-black text-xs">
                            {filteredCompanies.filter(c=>c.isEligible).length}/{filteredCompanies.length}
                        </div>
                    </div>

                    {/* Sector Chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {ALL_SECTORS.slice(0,14).map(s=>(
                            <button key={s} onClick={()=>toggleSector(s)}
                                className={`px-2.5 py-1 border-2 border-[#0F0F0F] text-[11px] font-bold transition-all ${filters.sectors.includes(s)?'bg-[#FACC15] shadow-[2px_2px_0px_#0F0F0F] -translate-x-[1px] -translate-y-[1px]':'bg-white hover:bg-[#FFFBF0]'}`}>
                                {s}
                            </button>
                        ))}
                        {filters.sectors.length>0 && (
                            <button onClick={()=>setFilters(f=>({...f,sectors:[]}))}
                                className="px-2.5 py-1 border-2 border-red-400 text-[11px] font-bold text-red-500 hover:bg-red-50">Clear</button>
                        )}
                    </div>

                    {/* Company Table */}
                    <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] overflow-hidden flex-1 flex flex-col">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_120px_90px_110px_40px] gap-2 px-4 py-2 bg-[#0F0F0F] text-white text-[10px] font-black uppercase tracking-wider">
                            <span>Company</span><span>Sector</span><span>Package</span><span>Status</span><span></span>
                        </div>
                        {/* Table Body */}
                        <div className="overflow-y-auto max-h-[calc(100vh-420px)] divide-y-2 divide-[#0F0F0F]">
                            {filteredCompanies.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Search size={40} className="mx-auto mb-3 text-gray-300"/>
                                    <h3 className="font-black text-lg text-[#0F0F0F]">No companies found</h3>
                                    <p className="text-sm font-bold text-gray-500">Adjust filters or profile</p>
                                </div>
                            ) : (
                                filteredCompanies.map((company, idx) => {
                                    const el = company.eligibility || {};
                                    const isShortlisted = shortlist.includes(company.display_name);
                                    const isExpanded = expandedRow === company.company_name;
                                    return (
                                        <motion.div key={company.company_name}
                                            initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:Math.min(idx*0.02,0.5)}}>
                                            {/* Row */}
                                            <div onClick={()=>setExpandedRow(isExpanded?null:company.company_name)}
                                                className={`grid grid-cols-[1fr_120px_90px_110px_40px] gap-2 px-4 py-2.5 items-center cursor-pointer transition-all hover:bg-[#FFFBF0] ${isExpanded?'bg-[#FFFBF0]':''}`}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <button onClick={e=>{e.stopPropagation();toggleShortlist(company.display_name)}}
                                                        className="shrink-0"><Star size={14} fill={isShortlisted?'#F59E0B':'none'} stroke={isShortlisted?'#F59E0B':'#999'}/></button>
                                                    <span className="font-bold text-sm text-[#0F0F0F] truncate">{company.display_name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold bg-[#FFFBF0] border border-[#0F0F0F] px-1.5 py-0.5 truncate text-center">{company.sector}</span>
                                                <span className="font-black text-sm">Rs.{company.maxCtc}</span>
                                                <span className={`text-[10px] font-black px-2 py-1 border-2 border-[#0F0F0F] text-center ${company.isEligible?'bg-[#A3E635]':'bg-red-100 text-red-600'}`}>
                                                    {company.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                                                </span>
                                                <ChevronDown size={14} className={`transition-transform ${isExpanded?'rotate-180':''}`}/>
                                            </div>
                                            {/* Expanded Detail */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                                                        transition={{duration:0.25}} className="overflow-hidden border-t-2 border-dashed border-gray-300">
                                                        <div className="px-4 py-3 bg-[#FFFBF0]">
                                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                                                {[
                                                                    {key:'cgpa',label:'CGPA',yours:profile.cgpa,req:el.min_cgpa},
                                                                    {key:'tenth',label:'10th',yours:profile.tenth+'%',req:el.min_10th?el.min_10th+'%':null},
                                                                    {key:'twelfth',label:'12th',yours:profile.twelfth+'%',req:el.min_12th?el.min_12th+'%':null},
                                                                    {key:'amcat',label:'AMCAT',yours:profile.amcat+'%',req:el.min_amcat?el.min_amcat+'%':null},
                                                                ].filter(item=>{
                                                                    if(item.key==='amcat'&&company.maxCtc<=20) return false;
                                                                    return item.req&&item.req!=='0%'&&item.req!==0;
                                                                }).map(item=>(
                                                                    <div key={item.key} className={`flex items-center gap-2 px-2 py-1.5 border-2 border-[#0F0F0F] text-xs font-bold ${company.checks[item.key]?'bg-[#A3E635]':'bg-red-100'}`}>
                                                                        {company.checks[item.key]?<Check size={12}/>:<X size={12} className="text-red-500"/>}
                                                                        <span>{item.label}</span>
                                                                        <span className="ml-auto font-black">{item.yours}/{item.req}</span>
                                                                    </div>
                                                                ))}
                                                                <div className={`flex items-center gap-2 px-2 py-1.5 border-2 border-[#0F0F0F] text-xs font-bold ${company.checks.branch?'bg-[#A3E635]':'bg-red-100'}`}>
                                                                    {company.checks.branch?<Check size={12}/>:<X size={12} className="text-red-500"/>}
                                                                    <span>Branch</span><span className="ml-auto font-black">{profile.department}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={()=>setModalCompany(company)}
                                                                    className="bg-[#F97316] text-white border-2 border-[#0F0F0F] px-3 py-1.5 font-black text-xs flex items-center gap-1 hover:shadow-[2px_2px_0px_#0F0F0F]">
                                                                    <Eye size={12}/> Full Details
                                                                </button>
                                                                {company.hiring_season && <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><Clock size={12}/>{company.hiring_season}</span>}
                                                                {company.avg_selections_per_year && <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><Users size={12}/>~{company.avg_selections_per_year}/yr</span>}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* â•â•â• MODAL â•â•â• */}
            <AnimatePresence>
                {modalCompany && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={()=>setModalCompany(null)}>
                        <motion.div initial={{opacity:0,y:20,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20,scale:0.97}}
                            onClick={e=>e.stopPropagation()}
                            className="bg-[#FFFBF0] border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-black bg-[#FACC15] border border-[#0F0F0F] px-2 py-0.5 uppercase">{modalCompany.sector}</span>
                                    <h2 className="text-2xl font-black mt-1">{modalCompany.display_name}</h2>
                                    <div className="flex gap-3 mt-1 text-xs font-bold text-gray-500">
                                        {modalCompany.hiring_season && <span className="flex items-center gap-1"><Clock size={12}/>{modalCompany.hiring_season}</span>}
                                        {modalCompany.avg_selections_per_year && <span className="flex items-center gap-1"><Users size={12}/>~{modalCompany.avg_selections_per_year} selections/yr</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black px-3 py-1.5 border-2 border-[#0F0F0F] ${modalCompany.isEligible?'bg-[#A3E635]':'bg-red-100 text-red-600'}`}>
                                        {modalCompany.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                                    </span>
                                    <button onClick={()=>setModalCompany(null)} className="border-2 border-[#0F0F0F] p-1 hover:bg-red-100"><X size={16}/></button>
                                </div>
                            </div>

                            {/* Criteria */}
                            <div className="mb-4">
                                <h4 className="font-black text-xs uppercase mb-2 text-gray-500">Eligibility Criteria</h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(modalCompany.checks).filter(([key])=>{
                                        if(key==='amcat'&&modalCompany.maxCtc<=20) return false; return true;
                                    }).map(([key,passed])=>(
                                        <span key={key} className={`text-xs font-black px-2.5 py-1 border-2 border-[#0F0F0F] flex items-center gap-1 ${passed?'bg-[#A3E635]':'bg-red-100 text-red-600'}`}>
                                            {passed?<Check size={12}/>:<X size={12}/>}{CRITERIA_LABELS[key]||key}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Roles */}
                            <div className="mb-4">
                                <h4 className="font-black text-xs uppercase mb-2 text-gray-500">Roles Offered</h4>
                                {(modalCompany.roles_offered||[]).map((role,i)=>(
                                    <div key={i} className="bg-white border-2 border-[#0F0F0F] p-3 mb-2 shadow-[2px_2px_0px_#0F0F0F]">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-black text-sm">{role.role_title}</span>
                                            <div className="flex gap-2">
                                                <span className="text-[10px] font-bold bg-[#FFFBF0] border border-[#0F0F0F] px-2 py-0.5">{role.role_type}</span>
                                                <span className="text-[10px] font-black bg-[#F97316] text-white border border-[#0F0F0F] px-2 py-0.5">Rs.{role.ctc_lpa} LPA</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {(role.must_have_skills||[]).map(s=><span key={s} className="text-[10px] font-bold bg-[#F97316] text-white px-1.5 py-0.5 border border-[#0F0F0F]">{s}</span>)}
                                            {(role.good_to_have_skills||[]).map(s=><span key={s} className="text-[10px] font-bold bg-[#FFFBF0] px-1.5 py-0.5 border border-gray-300">{s}</span>)}
                                        </div>
                                        {role.rounds && (
                                            <div className="flex gap-2 overflow-x-auto">
                                                {role.rounds.map((r,ri)=>(
                                                    <div key={ri} className="flex items-center gap-1.5 shrink-0">
                                                        <span className="w-5 h-5 bg-[#0F0F0F] text-white text-[10px] font-black flex items-center justify-center">{ri+1}</span>
                                                        <span className="text-[10px] font-bold whitespace-nowrap">{r.round_name}</span>
                                                        {ri<role.rounds.length-1 && <ChevronRight size={10} className="text-gray-400"/>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Visit History */}
                            {modalCompany.pict_visit_history && (
                                <div className="mb-4">
                                    <h4 className="font-black text-xs uppercase mb-2 text-gray-500">Past Visits</h4>
                                    <div className="flex gap-2">
                                        {modalCompany.pict_visit_history.map(year=>(
                                            <span key={year} className="text-xs font-black bg-[#FACC15] border-2 border-[#0F0F0F] px-2 py-1">{year}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-3 border-t-2 border-[#0F0F0F]">
                                <button onClick={()=>toggleShortlist(modalCompany.display_name)}
                                    className={`flex items-center gap-1 px-4 py-2 border-2 border-[#0F0F0F] font-black text-xs ${shortlist.includes(modalCompany.display_name)?'bg-[#FACC15] shadow-[2px_2px_0px_#0F0F0F]':'bg-white hover:bg-[#FFFBF0]'}`}>
                                    <Star size={12} fill={shortlist.includes(modalCompany.display_name)?'#F59E0B':'none'}/>
                                    {shortlist.includes(modalCompany.display_name)?'Shortlisted':'Add to Shortlist'}
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

