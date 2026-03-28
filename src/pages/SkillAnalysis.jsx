import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Target, CheckCircle, AlertTriangle, Loader2, Briefcase, Building2, ChevronDown, BookOpen, PlayCircle, GraduationCap, Code2, CheckCircle2, Sparkles, TrendingUp, Clock, Star } from 'lucide-react';
import { API_URL } from '../config';
import { analyzeSkillGap, buildYouTubeSearchUrl } from '../services/skillAnalysisService';
import skillData from '../data/skillData.json';
import '../styles/SkillAnalysis.css';

const AVATAR_COLORS = ['sa-avatar-indigo', 'sa-avatar-teal', 'sa-avatar-amber', 'sa-avatar-coral', 'sa-avatar-purple', 'sa-avatar-emerald'];

const SkillAnalysis = () => {
    const [analysisMode, setAnalysisMode] = useState('company'); // 'role' or 'company'
    const [selectedTarget, setSelectedTarget] = useState('');

    // ── Derive companies and roles from skill_data.json ──
    // Deduplicate companies by display_name, keep the first entry
    const companyMap = {};
    skillData.forEach(c => {
        const name = (c.display_name || '').replace(/_$/, ''); // strip trailing underscore
        if (!companyMap[name]) companyMap[name] = c;
    });
    const companies = Object.keys(companyMap);

    // Build companySkills: display_name -> combined must_have + good_to_have
    const companySkills = {};
    companies.forEach(name => {
        const c = companyMap[name];
        const allSkills = new Set();
        (c.roles_offered || []).forEach(r => {
            (r.must_have_skills || []).forEach(s => allSkills.add(s));
            (r.good_to_have_skills || []).forEach(s => allSkills.add(s));
        });
        companySkills[name] = [...allSkills];
    });

    // Build roles: unique role_titles aggregated across all companies
    const roleMap = {};
    skillData.forEach(c => {
        (c.roles_offered || []).forEach(r => {
            if (!roleMap[r.role_title]) roleMap[r.role_title] = new Set();
            (r.must_have_skills || []).forEach(s => roleMap[r.role_title].add(s));
            (r.good_to_have_skills || []).forEach(s => roleMap[r.role_title].add(s));
        });
    });
    const roles = Object.keys(roleMap);
    const roleSkills = {};
    roles.forEach(r => { roleSkills[r] = [...roleMap[r]]; });

    // Set initial target once data is derived
    if (!selectedTarget && companies.length > 0) {
        // Will be set on first render via the effect below
    }

    const [studentProfile, setStudentProfile] = useState({});
    const [studentSkills, setStudentSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiError, setAiError] = useState(null);

    // New state for redesigned UI
    const [activeAccordionIndex, setActiveAccordionIndex] = useState(null);
    const [resourceTabs, setResourceTabs] = useState({});
    const [loadingStep, setLoadingStep] = useState(0);
    const [targetSearch, setTargetSearch] = useState('');

    const loadingMessages = [
        'Fetching your skill profile...',
        'Comparing against required skills...',
        'Generating your learning roadmap...',
        'Preparing YouTube & course links...',
    ];

    useEffect(() => {
        const fetchSkills = async () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.email) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/profile?email=${encodeURIComponent(user.email)}`);
                const data = await res.json();
                if (res.ok) {
                    setStudentProfile(data);
                    setStudentSkills(data.skills ?? []);
                }
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
        return required.filter(skill => !studentSkills.includes(skill));
    };

    const getMatchPercentage = () => {
        const required = getRequiredSkills();
        if (required.length === 0) return 0;
        const common = required.filter(skill => studentSkills.includes(skill));
        return Math.round((common.length / required.length) * 100);
    };

    // Reset AI analysis when mode or target changes
    useEffect(() => {
        setAiAnalysis(null);
        setAiError(null);
    }, [analysisMode, selectedTarget]);

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

    const chartData = (() => {
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
    })();

    // Helpers
    const fullName = studentProfile.firstName
        ? `${studentProfile.firstName} ${studentProfile.lastName || ''}`
        : 'Student';
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    const matchPct = getMatchPercentage();
    const requiredSkills = getRequiredSkills();
    const matchedCount = requiredSkills.filter(s => studentSkills.includes(s)).length;
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
        <div className="sa-page">

            {/* ═══ ZONE A — PAGE HEADER ═══ */}
            <div className="sa-header">
                <div className="sa-header-left">
                    <h2>Skill Gap Analyzer</h2>
                    <p>AI-powered readiness check for placements</p>
                </div>

                {loading ? (
                    <div className="sa-skeleton-strip">
                        <div className="sa-skeleton sa-skeleton-circle" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div className="sa-skeleton sa-skeleton-line w120" />
                            <div className="sa-skeleton sa-skeleton-line w80" />
                        </div>
                    </div>
                ) : (
                    <div className="sa-identity-strip" style={{ maxWidth: '200px' }}>
                        <div className="sa-avatar">{initials}</div>
                        <div className="sa-identity-info">
                            <div className="sa-identity-name">{fullName}</div>
                            <div className="sa-identity-chips">
                                {studentProfile.department && (
                                    <span className="sa-chip">{studentProfile.department}</span>
                                )}
                                {studentProfile.cgpa && (
                                    <span className="sa-chip">{studentProfile.cgpa} CGPA</span>
                                )}
                            </div>
                            <div className="sa-identity-sync">
                                <span className="sa-sync-dot" />
                                Profile synced
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ ZONE B + C — BODY ═══ */}
            <div className="sa-body">

                {/* ─── ZONE B: LEFT SIDEBAR ─── */}
                <div className="sa-sidebar">

                    {/* 5.1 Mode Toggle */}
                    <div className="sa-mode-toggle">
                        <button
                            className={`sa-mode-option ${analysisMode === 'role' ? 'active' : ''}`}
                            onClick={() => { setAnalysisMode('role'); setSelectedTarget(roles[0]); }}
                        >
                            <div className="sa-mode-icon"><Briefcase size={18} /></div>
                            <div className="sa-mode-text">
                                <h4>By Job Role</h4>
                                <p>Match against a role</p>
                            </div>
                        </button>
                        <button
                            className={`sa-mode-option ${analysisMode === 'company' ? 'active' : ''}`}
                            onClick={() => { setAnalysisMode('company'); setSelectedTarget(companies[0]); }}
                        >
                            <div className="sa-mode-icon"><Building2 size={18} /></div>
                            <div className="sa-mode-text">
                                <h4>By Company</h4>
                                <p>Match against a company</p>
                            </div>
                        </button>
                    </div>

                    {/* 5.2 Target Selector */}
                    <div>
                        <div className="sa-section-label">Select target ({currentTargets.length})</div>
                        <div className="sa-target-search">
                            <input
                                type="text"
                                placeholder={`Search ${analysisMode === 'role' ? 'roles' : 'companies'}...`}
                                value={targetSearch}
                                onChange={(e) => setTargetSearch(e.target.value)}
                            />
                        </div>
                        <div className="sa-target-grid sa-target-grid-scroll">
                            {currentTargets
                                .filter(item => item.toLowerCase().includes(targetSearch.toLowerCase()))
                                .map((item, idx) => (
                                <button
                                    key={item}
                                    className={`sa-target-card ${selectedTarget === item ? 'active' : ''}`}
                                    onClick={() => setSelectedTarget(item)}
                                >
                                    <div className={`sa-target-avatar ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                                        {item[0]}
                                    </div>
                                    <span className="sa-target-name">{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5.3 Skills Section */}
                    <div>
                        <div className="sa-skills-header">
                            <div className="sa-section-label" style={{ marginBottom: 0 }}>Your skills</div>
                            {!loading && (
                                <span className="sa-skills-count">{studentSkills.length} skills</span>
                            )}
                        </div>
                        <div className="sa-skills-container" style={{ marginTop: 8 }}>
                            {loading ? (
                                <>
                                    <div className="sa-skeleton-pill" />
                                    <div className="sa-skeleton-pill" />
                                    <div className="sa-skeleton-pill" />
                                </>
                            ) : (
                                studentSkills.map((skill, i) => (
                                    <span key={i} className="sa-skill-tag">
                                        {skill}
                                        <button onClick={() => setStudentSkills(studentSkills.filter(s => s !== skill))}>×</button>
                                    </span>
                                ))
                            )}
                        </div>
                        {!loading && (
                            <div className="sa-add-skill">
                                <span className="sa-add-skill-icon">+</span>
                                <input
                                    placeholder="Add a skill..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            setStudentSkills([...studentSkills, e.target.value.trim()]);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* 5.4 Required Skills for Target */}
                    {selectedTarget && requiredSkills.length > 0 && (
                        <div>
                            <div className="sa-skills-header">
                                <span className="sa-section-label" style={{ marginBottom: 0 }}>Required skills</span>
                                <span className="sa-skills-count">{requiredSkills.length}</span>
                            </div>
                            <div className="sa-skills-container sa-required-skills">
                                {requiredSkills.map((skill, i) => {
                                    const hasSkill = studentSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                                    return (
                                        <span key={i} className={`sa-req-skill-tag ${hasSkill ? 'matched' : 'missing'}`}>
                                            {hasSkill ? <CheckCircle2 size={11} /> : null}
                                            {skill}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 5.5 Quick Match Preview */}
                    <div className="sa-quick-match">
                        <div className="sa-quick-match-header">
                            <span className="sa-quick-match-label">Quick match</span>
                            <span className="sa-quick-match-right">
                                <span className="sa-quick-match-pct">{matchPct}%</span>
                                <span className="sa-quick-match-count">{matchedCount} of {requiredSkills.length}</span>
                            </span>
                        </div>
                        <div className="sa-match-bar-track">
                            <div
                                className={`sa-match-bar-fill ${getBarColor(matchPct)}`}
                                style={{ '--fill-pct': `${matchPct}%` }}
                            />
                        </div>
                        <div className="sa-quick-chips">
                            <span className="sa-qchip matched">{matchedCount} matched</span>
                            <span className="sa-qchip missing">{missingCount} missing</span>
                        </div>
                    </div>

                    {/* 5.5 Analyze Button */}
                    <button
                        className={`sa-analyze-btn ${shouldPulse ? 'pulse' : ''}`}
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || studentSkills.length === 0}
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="animate-spin" size={16} /> Analyzing with AI...</>
                        ) : (
                            <><Target size={16} /> Generate Detailed AI Analysis</>
                        )}
                    </button>

                    {aiError && (
                        <div className="sa-error-box">
                            <AlertTriangle size={14} />
                            <span>{aiError}</span>
                        </div>
                    )}
                </div>

                {/* ─── ZONE C: MAIN STAGE ─── */}
                <div className="sa-stage">

                    {/* STATE 1: IDLE */}
                    {!aiAnalysis && !isAnalyzing && (
                        <div className="sa-idle">
                            {/* Venn Diagram — labels above circles */}
                            <div className="sa-venn-wrapper">
                                <div className="sa-venn-labels-row">
                                    <span className="sa-venn-label left">Your skills</span>
                                    <span className="sa-venn-label center">Match</span>
                                    <span className="sa-venn-label right">Target skills</span>
                                </div>
                                <div className="sa-venn-circles">
                                    <div className="sa-venn-circle left" />
                                    <div className="sa-venn-circle right" />
                                </div>
                            </div>
                            <h3>Configure your analysis</h3>
                            <p className="sa-idle-desc">
                                Select a target role or company, then click "Generate Detailed AI Analysis"
                                to get a personalized learning roadmap.
                            </p>
                            <div className="sa-feature-pills">
                                <div className="sa-feature-pill"><Target size={14} /> Skill gap scoring</div>
                                <div className="sa-feature-pill"><CheckCircle size={14} /> Learning roadmap</div>
                                <div className="sa-feature-pill"><BookOpen size={14} /> YouTube + courses</div>
                            </div>
                        </div>
                    )}

                    {/* STATE 2: LOADING */}
                    {isAnalyzing && (
                        <div className="sa-loading">
                            <div className="sa-loading-ring" />
                            <div className="sa-loading-msg" key={loadingStep}>
                                {loadingMessages[loadingStep]}
                            </div>
                            <div className="sa-progress-bar-track">
                                <div className="sa-progress-bar-slide" />
                            </div>
                        </div>
                    )}

                    {/* STATE 3: RESULTS */}
                    {aiAnalysis && !isAnalyzing && (
                        <div className="sa-results">

                            {/* 3a. Results Header Strip */}
                            <div className="sa-results-header">
                                <div className="sa-results-target">
                                    <h3>{selectedTarget}</h3>
                                    <span className="sa-results-type-chip">
                                        {analysisMode === 'role' ? 'Role analysis' : 'Company analysis'}
                                    </span>
                                </div>

                                <div className="sa-results-score">
                                    <div className="sa-results-bar-track">
                                        <div
                                            className={`sa-results-bar-fill ${getBarColor(aiAnalysis.match_percentage || 0)}`}
                                            style={{ '--fill-pct': `${Math.min(aiAnalysis.match_percentage || 0, 100)}%` }}
                                        />
                                    </div>
                                    <div className="sa-results-stats">
                                        <span className="sa-stat-chip pct">{Math.round(aiAnalysis.match_percentage || 0)}% match</span>
                                        <span className="sa-stat-chip">{(aiAnalysis.matched_skills || []).length} matched</span>
                                        <span className="sa-stat-chip">{(aiAnalysis.missing_skills || []).length} missing</span>
                                    </div>
                                </div>

                                <div className="sa-results-priority">
                                    <div className="sa-priority-label">Priority skill:</div>
                                    <span className="sa-priority-badge">{aiAnalysis.priority_skill_to_learn_first}</span>
                                    <div className="sa-prep-time">
                                        <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                        {aiAnalysis.estimated_total_preparation_days} days
                                    </div>
                                </div>
                            </div>

                            {/* 3b. Summary Card */}
                            <div className={`sa-summary-card ${getBarColor(aiAnalysis.match_percentage || 0)}`}>
                                <div className="sa-summary-label">Analysis Summary</div>
                                <p className="sa-summary-text">{aiAnalysis.overall_summary}</p>
                                <span className={`sa-readiness-pill ${(aiAnalysis.match_percentage || 0) >= 40 ? 'positive' : 'negative'}`}>
                                    <CheckCircle size={14} />
                                    Readiness: {aiAnalysis.placement_readiness_message}
                                </span>
                            </div>

                            {/* 3c. Matched Skills */}
                            <div className="sa-matched-section">
                                <div className="sa-matched-header">
                                    <span>Skills you already have</span>
                                    <span className="sa-matched-chip">✓ {(aiAnalysis.matched_skills || []).length}</span>
                                </div>
                                {(aiAnalysis.matched_skills || []).length > 0 ? (
                                    <div className="sa-matched-scroll">
                                        {(aiAnalysis.matched_skills || []).map((skill, i) => (
                                            <span key={i} className="sa-matched-pill">
                                                <CheckCircle2 size={12} /> {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="sa-no-match-msg">
                                        None of the required skills matched — start with the roadmap below.
                                    </p>
                                )}
                            </div>

                            {/* 3d. Missing Skills — Accordion or Celebration */}
                            {(aiAnalysis.missing_skills || []).length === 0 ? (
                                <div className="sa-celebration">
                                    <CheckCircle size={64} color="#10b981" />
                                    <h3>Placement Ready!</h3>
                                    <p>You already have all required skills for {selectedTarget}.</p>
                                    <p>{aiAnalysis.overall_summary}</p>
                                    <p>{aiAnalysis.placement_readiness_message}</p>
                                </div>
                            ) : (
                                <div className="sa-missing-section">
                                    <div className="sa-missing-header-row">
                                        <span>Skills to develop</span>
                                        <span className="sa-missing-count">{(aiAnalysis.missing_skills || []).length}</span>
                                    </div>

                                    {(aiAnalysis.missing_skills || []).map((ms, idx) => {
                                        const isOpen = activeAccordionIndex === idx;
                                        const currentTab = resourceTabs[idx] || 'youtube';

                                        return (
                                            <div key={idx} className="sa-accordion-item" style={{ '--i': idx }}>
                                                {/* Trigger */}
                                                <button className="sa-accordion-trigger" onClick={() => toggleAccordion(idx)}>
                                                    <div className="sa-accordion-trigger-left">
                                                        <span className={`sa-severity-dot ${ms.severity}`} />
                                                        <span className="sa-accordion-name">{ms.skill}</span>
                                                    </div>
                                                    <div className="sa-accordion-trigger-right">
                                                        <span className={`sa-severity-badge ${ms.severity}`}>
                                                            {ms.severity === 'good_to_have' ? 'Nice to have' : ms.severity}
                                                        </span>
                                                        <span className="sa-days-chip">~{ms.estimated_days_to_learn}d</span>
                                                        <ChevronDown size={15} className={`sa-chevron ${isOpen ? 'open' : ''}`} />
                                                    </div>
                                                </button>

                                                {/* Content */}
                                                <div className={`sa-accordion-content ${isOpen ? 'open' : ''}`}>

                                                    {/* Why needed */}
                                                    <div className={`sa-why-needed ${ms.severity}`}>
                                                        {ms.why_needed}
                                                    </div>

                                                    {/* Roadmap */}
                                                    <div className="sa-roadmap">
                                                        <div className="sa-roadmap-label">Learning Path</div>
                                                        <div className="sa-stepper">
                                                            {(ms.roadmap || []).map((step, i) => (
                                                                <div key={i} className="sa-step">
                                                                    <div className="sa-step-number">{i + 1}</div>
                                                                    {i < (ms.roadmap || []).length - 1 && <div className="sa-step-line" />}
                                                                    <div className="sa-step-text">{step}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Resource Tabs */}
                                                    <div className="sa-resource-tabs">
                                                        <button
                                                            className={`sa-resource-tab ${currentTab === 'youtube' ? 'active' : ''}`}
                                                            onClick={() => setSkillResourceTab(idx, 'youtube')}
                                                        >YouTube</button>
                                                        <button
                                                            className={`sa-resource-tab ${currentTab === 'courses' ? 'active' : ''}`}
                                                            onClick={() => setSkillResourceTab(idx, 'courses')}
                                                        >Courses</button>
                                                        <button
                                                            className={`sa-resource-tab ${currentTab === 'practice' ? 'active' : ''}`}
                                                            onClick={() => setSkillResourceTab(idx, 'practice')}
                                                        >Practice</button>
                                                    </div>

                                                    {/* YouTube Tab */}
                                                    {currentTab === 'youtube' && (ms.resources?.youtube || []).map((yt, i) => (
                                                        <a
                                                            key={i}
                                                            href={buildYouTubeSearchUrl(yt.search_query)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="sa-yt-card"
                                                        >
                                                            <PlayCircle size={20} className="sa-yt-icon" />
                                                            <div className="sa-yt-info">
                                                                <span className="sa-yt-title">{yt.title}</span>
                                                                <div className="sa-yt-meta">
                                                                    <span className="sa-yt-channel">{yt.channel}</span>
                                                                    {yt.type && <span className="sa-yt-type">{yt.type}</span>}
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))}

                                                    {/* Courses Tab */}
                                                    {currentTab === 'courses' && (ms.resources?.courses || []).map((c, i) => (
                                                        <div key={i} className="sa-course-row">
                                                            <span className={`sa-platform-badge ${c.platform}`}>{c.platform}</span>
                                                            <span className="sa-course-title">{c.title}</span>
                                                            {c.is_free && <span className="sa-free-chip">FREE</span>}
                                                            {c.url && (
                                                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="sa-view-link">
                                                                    View →
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Practice Tab */}
                                                    {currentTab === 'practice' && (ms.resources?.practice || []).map((p, i) => (
                                                        <div key={i} className="sa-practice-row">
                                                            <span className="sa-practice-platform">{p.platform}</span>
                                                            <span className="sa-practice-sep">—</span>
                                                            <span className="sa-practice-suggestion">{p.suggestion}</span>
                                                            {p.url && (
                                                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="sa-view-link">
                                                                    Link →
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* 3e. Results Footer */}
                            <div className="sa-results-footer">
                                Analysis powered by Google Gemini 2.0 Flash • {(aiAnalysis.matched_skills || []).length} matched • {(aiAnalysis.missing_skills || []).length} gaps identified • Estimated {aiAnalysis.estimated_total_preparation_days} days preparation
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ ZONE D — MARKET DEMAND CHART ═══ */}
            <div className="sa-chart-section">
                <h3 className="sa-chart-title">Top skills demanded for {selectedTarget}</h3>
                <div className="sa-chart-wrapper">
                    <Bar data={chartData} options={{ maintainAspectRatio: false }} />
                </div>
            </div>
        </div>
    );
};

export default SkillAnalysis;
