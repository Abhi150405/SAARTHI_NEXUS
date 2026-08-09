import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle, AlertTriangle, Loader2, Briefcase, Building2, ChevronDown, BookOpen, PlayCircle, GraduationCap, CheckCircle2, Sparkles, Clock, Trophy, Search, X, ExternalLink, Zap } from 'lucide-react';
import { API_URL } from '../config';
import { apiFetch, getUser } from '../api';
import { analyzeSkillGap, buildYouTubeSearchUrl, isSkillSatisfied } from '../services/skillAnalysisService';
import skillData from '../data/skillData.json';

const ACCENT = ['bg-[#F97316]','bg-[#FACC15]','bg-[#A3E635]','bg-[#60A5FA]','bg-[#C084FC]','bg-[#14b8a6]'];

const SkillAnalysis = () => {
    const [analysisMode, setAnalysisMode] = useState('company'); // 'role' or 'company'
    const [selectedTarget, setSelectedTarget] = useState('');

    // ── Derive companies and roles from skill_data.json ──
    const { companies, companyMap, companySkills, companySalaries, roles, roleMap, roleSkills, roleSalaries } = useMemo(() => {
        // Deduplicate companies by display_name, keep the first entry
        const companyMap = {};
        skillData.forEach(c => {
            const name = (c.display_name || '').replace(/_$/, ''); // strip trailing underscore
            if (!companyMap[name]) companyMap[name] = c;
        });
        const companies = Object.keys(companyMap);

        // Build companySkills: display_name -> combined must_have + good_to_have
        const companySkills = {};
        const companySalaries = {};
        companies.forEach(name => {
            const c = companyMap[name];
            const allSkills = new Set();
            let maxCtc = 0;
            (c.roles_offered || []).forEach(r => {
                (r.must_have_skills || []).forEach(s => allSkills.add(s));
                (r.good_to_have_skills || []).forEach(s => allSkills.add(s));
                const ctc = parseFloat(r.ctc_lpa);
                if (!isNaN(ctc) && ctc > maxCtc) maxCtc = ctc;
            });
            companySkills[name] = [...allSkills];
            companySalaries[name] = maxCtc;
        });

        // Build roles: unique role_titles aggregated across all companies
        const roleMap = {};
        const roleSalaries = {};
        skillData.forEach(c => {
            (c.roles_offered || []).forEach(r => {
                if (!roleMap[r.role_title]) roleMap[r.role_title] = new Set();
                (r.must_have_skills || []).forEach(s => roleMap[r.role_title].add(s));
                (r.good_to_have_skills || []).forEach(s => roleMap[r.role_title].add(s));
                const ctc = parseFloat(r.ctc_lpa);
                if (!isNaN(ctc)) {
                    roleSalaries[r.role_title] = Math.max(roleSalaries[r.role_title] || 0, ctc);
                }
            });
        });
        const roles = Object.keys(roleMap);
        const roleSkills = {};
        roles.forEach(r => { roleSkills[r] = [...roleMap[r]]; });

        return { companies, companyMap, companySkills, companySalaries, roles, roleMap, roleSkills, roleSalaries };
    }, []);

    // Set initial target once data is derived
    if (!selectedTarget && companies.length > 0) {
        // Will be set on first render via the effect below
    }

    const [studentProfile, setStudentProfile] = useState({});
    const [studentSkills, setStudentSkills] = useState([]);
    const [modelMatchPercentage, setModelMatchPercentage] = useState(0);
    const [topMatches, setTopMatches] = useState([]);
    const [isLoadingTopMatches, setIsLoadingTopMatches] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiError, setAiError] = useState(null);

    // New state for redesigned UI
    const [activeAccordionIndex, setActiveAccordionIndex] = useState(null);
    const [resourceTabs, setResourceTabs] = useState({});
    const [loadingStep, setLoadingStep] = useState(0);
    const [targetSearch, setTargetSearch] = useState('');
    const [sortBy, setSortBy] = useState('name');

    const loadingMessages = [
        'Fetching your skill profile...',
        'Comparing against required skills...',
        'Generating your learning roadmap...',
        'Preparing YouTube & course links...',
    ];

    useEffect(() => {
        const fetchSkills = async () => {
            const user = getUser();
            if (!user || !user.email) {
                setLoading(false);
                return;
            }
            try {
                const res = await apiFetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
                const data = await res.json();
                setStudentProfile(data);
                setStudentSkills(data.skills ?? []);
            } catch (err) {
                console.error('Failed to fetch skills:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSkills();
    }, []);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAiError(null);
        try {
            const requiredSkills = analysisMode === 'role' ? roleSkills[selectedTarget] : companySkills[selectedTarget];

            const targetData = {
                type: analysisMode,
                name: selectedTarget,
                required_skills: requiredSkills || []
            };

            const studentData = {
                fullName: studentProfile.firstName ? `${studentProfile.firstName} ${studentProfile.lastName}` : 'Student',
                department: studentProfile.department || 'CE',
                cgpa: studentProfile.cgpa || 8.0,
                skills: studentSkills
            };

            const result = await analyzeSkillGap(studentData, targetData);
            setAiAnalysis(result);
        } catch (error) {
            console.error(error);
            setAiError(error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getRequiredSkills = () => {
        if (analysisMode === 'role') return roleSkills[selectedTarget] || [];
        return companySkills[selectedTarget] || [];
    };

    const getMissingSkills = () => {
        const required = getRequiredSkills();
        return required.filter(skill => !isSkillSatisfied(studentSkills, skill));
    };

    const getMatchPercentage = () => {
        return modelMatchPercentage;
    };

    // 100% Real-time NLP Matching: Calculate match percentage locally
    useEffect(() => {
        const required = getRequiredSkills();
        if (!selectedTarget || required.length === 0 || studentSkills.length === 0) {
            setModelMatchPercentage(0);
            return;
        }
        const matched = required.filter(s => isSkillSatisfied(studentSkills, s)).length;
        setModelMatchPercentage(Math.round((matched / required.length) * 100));
    }, [studentSkills, selectedTarget, analysisMode]);

    // Reset AI analysis when mode or target changes
    useEffect(() => {
        setAiAnalysis(null);
        setAiError(null);
    }, [analysisMode, selectedTarget]);

    // 100% Real-time Top Matches Calculation
    useEffect(() => {
        if (studentSkills.length === 0) {
            setTopMatches([]);
            return;
        }
        const matches = [];
        companies.forEach(companyName => {
            const reqSkills = companySkills[companyName] || [];
            if (reqSkills.length > 0) {
                const matchedCount = reqSkills.filter(s => isSkillSatisfied(studentSkills, s)).length;
                const pct = Math.round((matchedCount / reqSkills.length) * 100);
                
                const companyInfo = companyMap[companyName];
                matches.push({
                    target_id: companyName,
                    company_name: companyInfo.display_name,
                    company_slug: companyInfo.company_name,
                    match_percentage: pct,
                    sector: companyInfo.sector || 'Tech',
                    ctc_lpa: companyInfo.roles_offered?.[0]?.ctc_lpa || 'N/A'
                });
            }
        });
        
        matches.sort((a, b) => b.match_percentage - a.match_percentage);
        setTopMatches(matches.slice(0, 6)); // Top 6 Matches in sidebar
        setIsLoadingTopMatches(false);
    }, [studentSkills]);

    // Loading step cycling
    useEffect(() => {
        if (!isAnalyzing) { setLoadingStep(0); return; }
        const timer = setInterval(() => {
            setLoadingStep(prev => (prev + 1) % loadingMessages.length);
        }, 1500);
        return () => clearInterval(timer);
    }, [isAnalyzing]);

    // Reset accordion when new results arrive
    useEffect(() => {
        setActiveAccordionIndex(null);
        setResourceTabs({});
    }, [aiAnalysis]);

    const toggleAccordion = (index) => {
        setActiveAccordionIndex(prev => prev === index ? null : index);
    };

    const setSkillResourceTab = (skillIndex, tab) => {
        setResourceTabs(prev => ({ ...prev, [skillIndex]: tab }));
    };

    const chartData = useMemo(() => {
        // Compute skill frequency across all companies for dynamic chart
        const freq = {};
        const targetSkills = getRequiredSkills();
        // Count how many companies list each skill
        skillData.forEach(c => {
            (c.roles_offered || []).forEach(r => {
                [...(r.must_have_skills || []), ...(r.good_to_have_skills || [])].forEach(s => {
                    freq[s] = (freq[s] || 0) + 1;
                });
            });
        });
        // Sort target skills by frequency, take top 8
        const sorted = targetSkills
            .map(s => ({ skill: s, count: freq[s] || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
        // Fallback: if no target skills, show top 8 overall
        const chartItems = sorted.length > 0 ? sorted :
            Object.entries(freq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([skill, count]) => ({ skill, count }));
        return {
            labels: chartItems.map(i => i.skill),
            datasets: [{
                label: 'Demand Frequency (Companies)',
                data: chartItems.map(i => i.count),
                backgroundColor: '#4F46E5',
                borderRadius: 4,
            }]
        };
    }, [selectedTarget, analysisMode, companySkills, roleSkills]);

    // Helpers
    const fullName = studentProfile.firstName
        ? `${studentProfile.firstName} ${studentProfile.lastName || ''}`
        : 'Student';
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    const matchPct = getMatchPercentage();
    const requiredSkills = getRequiredSkills();
    const matchedCount = requiredSkills.filter(s => isSkillSatisfied(studentSkills, s)).length;
    const missingCount = requiredSkills.length - matchedCount;
    const getBarColor = (pct) => pct >= 70 ? 'green' : pct >= 40 ? 'amber' : 'red';
    const currentTargets = analysisMode === 'role' ? roles : companies;

    // Set initial target when mode changes or on first render
    useEffect(() => {
        const targets = analysisMode === 'role' ? roles : companies;
        if (targets.length > 0 && !targets.includes(selectedTarget)) {
            setSelectedTarget(targets[0]);
        }
        setTargetSearch('');
    }, [analysisMode]);

    const shouldPulse = !aiAnalysis && !isAnalyzing && selectedTarget && studentSkills.length > 0;

    // ════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col gap-6 p-2 min-h-screen bg-[#FFFBF0]">
            {/* Top Config Ribbon */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Configuration */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
                    {/* Mode Toggle */}
                    <div className="flex gap-2">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-[#0F0F0F] font-black transition-all ${analysisMode === 'role' ? 'bg-[#FACC15] shadow-[4px_4px_0px_#0F0F0F] translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-[#FFFBF0]'}`}
                            onClick={() => { setAnalysisMode('role'); setSelectedTarget(roles[0]); }}
                        >
                            <Briefcase size={18} /> Role
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-[#0F0F0F] font-black transition-all ${analysisMode === 'company' ? 'bg-[#FACC15] shadow-[4px_4px_0px_#0F0F0F] translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-[#FFFBF0]'}`}
                            onClick={() => { setAnalysisMode('company'); setSelectedTarget(companies[0]); }}
                        >
                            <Building2 size={18} /> Company
                        </button>
                    </div>

                    {/* Target Selector */}
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-gray-500" />
                            </div>
                            <input
                                type="text"
                                placeholder={`Search ${analysisMode === 'role' ? 'roles' : 'companies'}...`}
                                value={targetSearch}
                                onChange={(e) => setTargetSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border-[3px] border-[#0F0F0F] text-[#0F0F0F] font-bold focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_#F97316] focus:border-[#F97316] transition-all"
                            />
                        </div>
                        <button 
                            onClick={() => setSortBy(prev => prev === 'name' ? 'salary' : 'name')}
                            className="bg-white border-[3px] border-[#0F0F0F] px-3 font-black text-xs hover:bg-[#FFFBF0] transition-all flex flex-col items-center justify-center shrink-0 min-w-[70px]"
                        >
                            <span className="text-gray-500 text-[10px] uppercase">Sort</span>
                            <span className="text-[#F97316]">{sortBy === 'name' ? 'A-Z' : 'LPA ↑'}</span>
                        </button>
                    </div>
                    
                    {/* Target Grid (Compact) */}
                    <div className="grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-3 custom-scrollbar">
                        <AnimatePresence>
                            {currentTargets
                                .filter(item => item.toLowerCase().includes(targetSearch.toLowerCase()))
                                .sort((a, b) => {
                                    if (sortBy === 'salary') {
                                        const salaryMap = analysisMode === 'role' ? roleSalaries : companySalaries;
                                        return (salaryMap[b] || 0) - (salaryMap[a] || 0);
                                    }
                                    return a.localeCompare(b);
                                })
                                .slice(0, 20)
                                .map((item, idx) => {
                                    const salaryMap = analysisMode === 'role' ? roleSalaries : companySalaries;
                                    const salary = salaryMap[item];
                                    return (
                                        <motion.button
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            key={item}
                                            onClick={() => setSelectedTarget(item)}
                                            className={`text-left px-3 py-2 border-[2px] border-[#0F0F0F] font-bold truncate transition-all flex justify-between items-center h-full group ${selectedTarget === item ? 'bg-[#A3E635] shadow-[2px_2px_0px_#0F0F0F] translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-[#FFFBF0]'}`}
                                        >
                                            <span className="text-sm truncate mr-2">{item}</span>
                                            {salary > 0 && <span className={`text-[10px] whitespace-nowrap px-1 border border-current ${selectedTarget === item ? 'opacity-100 text-[#0F0F0F]' : 'opacity-60 text-gray-500 group-hover:opacity-100'}`}>{salary} LPA</span>}
                                        </motion.button>
                                    );
                                })}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || studentSkills.length === 0}
                        className={`mt-2 w-full py-4 bg-[#F97316] border-[3px] border-[#0F0F0F] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isAnalyzing || studentSkills.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-400' : 'text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#0F0F0F]'} ${shouldPulse ? 'animate-pulse text-white bg-[#F97316]' : ''}`}
                    >
                        {isAnalyzing ? <><Loader2 className="animate-spin" size={18} /> Analyzing...</> : <><Zap size={18} /> Generate AI Analysis</>}
                    </button>
                </motion.div>

                {/* Middle: Skills Inventory */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="flex flex-col gap-4">
                    <div className="bg-white border-[3px] border-[#0F0F0F] p-4 shadow-[4px_4px_0px_#0F0F0F] h-full flex flex-col min-h-[300px]">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-black text-[#0F0F0F] uppercase">Your Skills</h3>
                            <span className="bg-[#0F0F0F] text-white text-xs font-black px-2 py-1">{studentSkills.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto flex flex-wrap gap-2 content-start mb-4 pb-2 custom-scrollbar">
                            <AnimatePresence>
                                {studentSkills.map((skill, i) => (
                                    <motion.span layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key={skill} className="inline-flex items-center gap-1 bg-[#F97316] text-white text-xs font-black px-2 py-1 border-2 border-[#0F0F0F]">
                                        {skill}
                                        <button onClick={() => setStudentSkills(studentSkills.filter(s => s !== skill))} className="hover:text-black"><X size={12}/></button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </div>
                        <div className="relative mt-auto pt-2 border-t-2 border-dashed border-gray-300">
                            <input
                                placeholder="Type & press Enter to add..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        setStudentSkills([...studentSkills, e.target.value.trim()]);
                                        e.target.value = '';
                                    }
                                }}
                                className="w-full bg-[#FFFBF0] border-2 border-[#0F0F0F] py-2 px-3 font-bold text-sm focus:outline-none focus:shadow-[2px_2px_0px_#0F0F0F]"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Right: Quick Match Status */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex flex-col gap-4">
                    <div className="bg-[#A3E635] border-[3px] border-[#0F0F0F] p-5 shadow-[4px_4px_0px_#0F0F0F] flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="font-black text-[#0F0F0F] uppercase text-sm">Quick Match</h3>
                            <div className="text-right">
                                <span className="text-4xl font-black block leading-none">{matchPct}%</span>
                                <span className="font-bold text-[#0F0F0F] text-xs opacity-80">{matchedCount} of {requiredSkills.length} matched</span>
                            </div>
                        </div>
                        <div className="h-4 w-full bg-white border-2 border-[#0F0F0F] overflow-hidden mb-3">
                            <motion.div className="h-full bg-[#0F0F0F]" initial={{ width: 0 }} animate={{ width: `${matchPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <AnimatePresence>
                                {requiredSkills.slice(0, 8).map((skill, i) => {
                                    const hasSkill = isSkillSatisfied(studentSkills, skill);
                                    return (
                                        <motion.span layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={skill} className={`text-[10px] font-black px-2 py-1 border border-[#0F0F0F] ${hasSkill ? 'bg-[#0F0F0F] text-white shadow-[1px_1px_0px_#FFFFFF]' : 'bg-white text-gray-600'}`}>
                                            {skill}
                                        </motion.span>
                                    );
                                })}
                            </AnimatePresence>
                            {requiredSkills.length > 8 && <span className="text-[10px] font-black px-2 py-1 bg-transparent">+{requiredSkills.length - 8} more</span>}
                        </div>
                    </div>

                    {/* Top Matches */}
                    {topMatches.length > 0 && (
                        <div className="bg-[#60A5FA] border-[3px] border-[#0F0F0F] p-4 shadow-[4px_4px_0px_#0F0F0F] flex flex-col flex-1">
                            <h3 className="font-black text-[#0F0F0F] uppercase text-sm mb-3">Top Matches For You</h3>
                            <div className="flex flex-col gap-2 overflow-y-auto max-h-[160px] custom-scrollbar pr-1">
                                {topMatches.map((match, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => { setAnalysisMode('company'); setSelectedTarget(match.target_id); }} 
                                        className="flex justify-between items-center bg-white border-2 border-[#0F0F0F] px-3 py-2 hover:bg-[#FFFBF0] transition-all text-left group"
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-xs text-[#0F0F0F] truncate group-hover:underline">{match.company_name}</span>
                                            <span className="text-[10px] font-bold text-gray-500 truncate">{match.sector} • {match.ctc_lpa} LPA</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <span className="font-black text-[#F97316] text-sm">{match.match_percentage}%</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Main Stage Area */}
            <div className="mt-4">
                <AnimatePresence mode="wait">
                    {!aiAnalysis && !isAnalyzing && (
                        <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white border-[3px] border-[#0F0F0F] p-10 shadow-[6px_6px_0px_#0F0F0F] text-center max-w-3xl mx-auto">
                            <div className="flex justify-center mb-6 relative h-24 w-48 mx-auto">
                                <div className="absolute left-0 top-0 w-24 h-24 bg-[#F97316] opacity-80 border-4 border-[#0F0F0F] mix-blend-multiply flex items-center justify-center font-black text-white text-xs">You</div>
                                <div className="absolute right-0 top-0 w-24 h-24 bg-[#FACC15] opacity-80 border-4 border-[#0F0F0F] mix-blend-multiply flex items-center justify-center font-black text-[#0F0F0F] text-xs">Target</div>
                            </div>
                            <h3 className="text-2xl font-black text-[#0F0F0F] mb-4 uppercase tracking-tight">Hit Generate for AI Roadmap</h3>
                            <p className="font-bold text-gray-600 mb-6">Select a target and generate a personalized skill gap analysis, complete with priority scoring and free resources.</p>
                            <div className="flex justify-center gap-4 flex-wrap">
                                <motion.span whileHover={{ y: -2 }} className="bg-[#FFFBF0] border-2 border-[#0F0F0F] px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_#0F0F0F]">Gap Scoring</motion.span>
                                <motion.span whileHover={{ y: -2 }} className="bg-[#FFFBF0] border-2 border-[#0F0F0F] px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_#0F0F0F]">Learning Path</motion.span>
                                <motion.span whileHover={{ y: -2 }} className="bg-[#FFFBF0] border-2 border-[#0F0F0F] px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_#0F0F0F]">Resources</motion.span>
                            </div>
                        </motion.div>
                    )}

                    {isAnalyzing && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-[#E5E7EB] border-t-[#F97316] rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                            <div className="text-xl font-black text-[#0F0F0F] uppercase tracking-widest">{loadingMessages[loadingStep]}</div>
                            <div className="mt-6 w-64 h-3 border-2 border-[#0F0F0F] bg-white overflow-hidden relative">
                                <motion.div className="h-full bg-[#A3E635]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, repeat: Infinity }} />
                            </div>
                        </motion.div>
                    )}

                    {aiAnalysis && !isAnalyzing && (
                        <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                            
                            {/* Result Summary Bar */}
                            <div className="flex flex-col md:flex-row gap-4 bg-white border-[3px] border-[#0F0F0F] p-5 shadow-[4px_4px_0px_#0F0F0F] items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black uppercase text-[#0F0F0F]">{selectedTarget}</h3>
                                    <span className="bg-[#0F0F0F] text-white text-[10px] font-black px-2 py-1 uppercase">{analysisMode} Analysis</span>
                                </div>
                                <div className="flex-1 max-w-md mx-8 text-center">
                                    <p className="font-bold text-[#0F0F0F] text-sm mb-2">{aiAnalysis.placement_readiness_message}</p>
                                    <div className="h-4 w-full bg-[#FFFBF0] border-2 border-[#0F0F0F] overflow-hidden">
                                        <div className="h-full bg-[#F97316]" style={{ width: `${Math.min(aiAnalysis.match_percentage || 0, 100)}%` }} />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-500 uppercase">Est. Prep Time</div>
                                    <div className="text-xl font-black text-[#0F0F0F]">{aiAnalysis.estimated_total_preparation_days} Days</div>
                                </div>
                            </div>

                            {/* Missing Skills Grid (Kanban style) */}
                            {aiAnalysis.missing_skills?.length > 0 ? (
                                <div>
                                    <h3 className="text-lg font-black text-[#0F0F0F] uppercase mb-4 flex items-center gap-2">
                                        Action Plan <span className="bg-[#EF4444] text-white px-2 py-1 text-xs">{aiAnalysis.missing_skills.length} gaps</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                        {aiAnalysis.missing_skills.map((ms, idx) => (
                                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] flex flex-col h-full">
                                                {/* Header */}
                                                <div className={`p-3 border-b-[3px] border-[#0F0F0F] flex justify-between items-center ${ms.severity === 'critical' ? 'bg-[#FCA5A5]' : ms.severity === 'important' ? 'bg-[#FEF08A]' : 'bg-[#BFDBFE]'}`}>
                                                    <h4 className="font-black text-[#0F0F0F] truncate" title={ms.skill}>{ms.skill}</h4>
                                                    <span className="text-[10px] font-black uppercase bg-white border border-[#0F0F0F] px-2 py-1 whitespace-nowrap">
                                                        {ms.estimated_days_to_learn}d
                                                    </span>
                                                </div>
                                                
                                                {/* Body */}
                                                <div className="p-4 flex-1 flex flex-col gap-4">
                                                    <p className="text-xs font-bold text-gray-700 italic border-l-4 border-[#0F0F0F] pl-2">{ms.why_needed}</p>
                                                    
                                                    {/* Steps */}
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Roadmap</div>
                                                        {ms.roadmap?.slice(0,3).map((step, i) => (
                                                            <div key={i} className="flex gap-2 items-start">
                                                                <span className="bg-[#0F0F0F] text-white text-[10px] font-black w-4 h-4 flex items-center justify-center shrink-0">{i+1}</span>
                                                                <span className="text-xs font-bold leading-tight">{step}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Resources */}
                                                    <div className="mt-auto flex flex-col gap-1 border-t-[2px] border-dashed border-[#0F0F0F] pt-2">
                                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Recommended Resources</div>
                                                        
                                                        {ms.resources?.youtube?.[0] && (
                                                            <a href={buildYouTubeSearchUrl(ms.resources.youtube[0].search_query)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#EF4444] transition-colors group">
                                                                <PlayCircle size={14} className="text-[#EF4444] shrink-0" />
                                                                <span className="text-[11px] font-black truncate text-[#0F0F0F] group-hover:underline">{ms.resources.youtube[0].title}</span>
                                                            </a>
                                                        )}
                                                        
                                                        {ms.resources?.courses?.[0] && (
                                                            <a href={ms.resources.courses[0].url || `https://www.google.com/search?q=${encodeURIComponent(ms.resources.courses[0].title + ' ' + ms.resources.courses[0].platform)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#3B82F6] transition-colors group">
                                                                <BookOpen size={14} className="text-[#3B82F6] shrink-0" />
                                                                <span className="text-[11px] font-black truncate text-[#0F0F0F] group-hover:underline">{ms.resources.courses[0].title}</span>
                                                            </a>
                                                        )}

                                                        {ms.resources?.practice?.[0] && (
                                                            <a href={ms.resources.practice[0].url || `https://www.google.com/search?q=${encodeURIComponent(ms.resources.practice[0].platform + ' practice ' + ms.skill)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#10B981] transition-colors group">
                                                                <ExternalLink size={14} className="text-[#10B981] shrink-0" />
                                                                <span className="text-[11px] font-black truncate text-[#0F0F0F] group-hover:underline">{ms.resources.practice[0].suggestion || `${ms.resources.practice[0].platform} Practice`}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#A3E635] border-[3px] border-[#0F0F0F] p-10 shadow-[6px_6px_0px_#0F0F0F] text-center">
                                    <Trophy size={48} className="mx-auto mb-4 text-[#0F0F0F]" />
                                    <h3 className="text-3xl font-black uppercase text-[#0F0F0F] mb-2">100% Ready</h3>
                                    <p className="font-bold text-[#0F0F0F] text-lg">You have all the required skills for {selectedTarget}!</p>
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Minimal footer padding */}
            <div className="h-8"></div>
        </div>
    );
};

export default SkillAnalysis;
