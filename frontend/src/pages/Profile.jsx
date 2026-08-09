import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Lock, Mail, Hash, BookOpen, AlertCircle, CheckCircle2, LogOut,
    GraduationCap, Save, Award, FileText, UploadCloud, Link2, ExternalLink,
    Home, Shield, Target, Zap, ChevronRight, Calendar, Clock, TrendingUp,
    BarChart3, ArrowUpRight, Check, Circle, FolderGit2
} from 'lucide-react';
import { API_URL } from '../config';
import { apiFetch, logout as apiLogout, setUser } from '../api';
import skillData from '../data/skillData.json';
import '../styles/Profile.css';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════ */
const TABS = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'academics', label: 'Academics', icon: GraduationCap },
    { id: 'skills', label: 'Skills & Resume', icon: Award },
    { id: 'links', label: 'Professional Links', icon: Link2 },
    { id: 'security', label: 'Security', icon: Lock },
];

const DEPARTMENTS = ['CE', 'IT', 'E&TC', 'AI&DS', 'ECE'];

// Deduplicate companies from skillData
const companyList = (() => {
    const seen = new Map();
    skillData.forEach(c => {
        const name = (c.display_name || '').replace(/_$/, '');
        if (!seen.has(name)) seen.set(name, { ...c, display_name: name });
    });
    return [...seen.values()];
})();

/* ═══════════════════════════════════════════════════════════
   SVG DECORATIONS
   ═══════════════════════════════════════════════════════════ */

// Hero Orbs
const HeroOrbs = () => (
    <div className="pf-hero-orbs">
        <svg width="100%" height="100%">
            <defs>
                <radialGradient id="pfOrb1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="pfOrb2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="85%" cy="30%" r="200" fill="url(#pfOrb1)">
                <animate attributeName="cy" values="30%;35%;30%" dur="7s" repeatCount="indefinite" />
            </circle>
            <circle cx="10%" cy="70%" r="160" fill="url(#pfOrb2)">
                <animate attributeName="cx" values="10%;15%;10%" dur="9s" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

// Avatar Ring SVG
const AvatarRing = () => (
    <svg className="pf-avatar-ring" viewBox="0 0 124 124">
        <defs>
            <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
        </defs>
        <motion.circle
            cx="62" cy="62" r="59"
            fill="none" stroke="url(#avatarGrad)" strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <motion.circle
            cx="62" cy="3" r="3.5"
            fill="#F97316"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '62px 62px' }}
        />
    </svg>
);

// Strength Ring (circular progress)
const StrengthRing = ({ percentage, size = 140 }) => {
    const r = (size - 14) / 2;
    const circumference = 2 * Math.PI * r;
    const color = percentage >= 75 ? '#22C55E' : percentage >= 50 ? '#F59E0B' : '#EF4444';
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pf-strength-ring">
            <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="rgba(42,42,42,0.6)" strokeWidth="10" />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (circumference * percentage / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <text x="50%" y="46%" textAnchor="middle" fill="#F5F5F5"
                fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">{percentage}</text>
            <text x="50%" y="62%" textAnchor="middle" fill="#A3A3A3"
                fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif"
                textTransform="uppercase" letterSpacing="0.08em">COMPLETE</text>
        </svg>
    );
};

// ATS Score Semi-Ring
const ATSRing = ({ score, size = 100 }) => {
    const r = (size - 10) / 2;
    const circumference = Math.PI * r; // semicircle
    const color = score >= 70 ? '#22C55E' : score >= 50 ? '#F97316' : '#EF4444';
    return (
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
            <path
                d={`M 5 ${size / 2 + 5} A ${r} ${r} 0 0 1 ${size - 5} ${size / 2 + 5}`}
                fill="none" stroke="rgba(42,42,42,0.6)" strokeWidth="8"
            />
            <motion.path
                d={`M 5 ${size / 2 + 5} A ${r} ${r} 0 0 1 ${size - 5} ${size / 2 + 5}`}
                fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (circumference * Math.min(score, 100) / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
            />
        </svg>
    );
};

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════ */
const heroStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
};

const heroItem = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
};

const tabContent = {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 8 },
    transition: { duration: 0.2 }
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Profile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // ── Tab State ──
    const [activeTab, setActiveTab] = useState('overview');

    // ── Profile Info State ──
    const [fullName, setFullName] = useState(user.fullName || '');
    const [department, setDepartment] = useState(user.department || '');
    const [profilePicture, setProfilePicture] = useState(user.profilePicture || null);
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ type: '', text: '' });

    // ── Password State ──
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState({ type: '', text: '' });

    // ── Academic State ──
    const [tenthPercentage, setTenthPercentage] = useState('');
    const [twelfthPercentage, setTwelfthPercentage] = useState('');
    const [collegeCgpa, setCollegeCgpa] = useState('');
    const [amcatScore, setAmcatScore] = useState('');
    const [academicLoading, setAcademicLoading] = useState(false);
    const [academicMessage, setAcademicMessage] = useState({ type: '', text: '' });

    // ── Skills/Resume State ──
    const [skills, setSkills] = useState([]);
    const [resumeSummary, setResumeSummary] = useState('');
    const [atsScore, setAtsScore] = useState(0);
    const [experienceYears, setExperienceYears] = useState(0);
    const [keyAchievements, setKeyAchievements] = useState([]);
    const [projects, setProjects] = useState([]);

    // ── Professional Links State ──
    const [leetcodeUrl, setLeetcodeUrl] = useState('');
    const [codechefUrl, setCodechefUrl] = useState('');
    const [codeforcesUrl, setCodeforcesUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [linksLoading, setLinksLoading] = useState(false);
    const [linksMessage, setLinksMessage] = useState({ type: '', text: '' });

    // ── Fetch State ──
    const [fetching, setFetching] = useState(true);

    // ── Fetch profile on mount ──
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user.email) { setFetching(false); return; }
            try {
                const res = await apiFetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
                const data = await res.json();
                if (res.ok) {
                    setFullName(data.full_name ?? user.fullName);
                    setDepartment(data.department ?? user.department);
                    setProfilePicture(data.profile_picture ?? null);
                    setTenthPercentage(data.tenth_percentage ?? '');
                    setTwelfthPercentage(data.twelfth_percentage ?? '');
                    setCollegeCgpa(data.college_cgpa ?? '');
                    setAmcatScore(data.amcat_score ?? '');
                    setSkills(data.skills ?? []);
                    setResumeSummary(data.resume_summary ?? '');
                    setAtsScore(data.ats_score ?? 0);
                    setExperienceYears(data.experience_years ?? 0);
                    setKeyAchievements(data.key_achievements ?? []);
                    setProjects(data.projects ?? data.key_projects ?? []);
                    setLeetcodeUrl(data.leetcode_url ?? '');
                    setCodechefUrl(data.codechef_url ?? '');
                    setCodeforcesUrl(data.codeforces_url ?? '');
                    setLinkedinUrl(data.linkedin_url ?? '');
                    setResumeUrl(data.resume_url ?? '');
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, []);

    /* ═══ COMPUTED VALUES ═══ */

    // Eligible companies count
    const eligibleCount = useMemo(() => {
        if (!collegeCgpa && !tenthPercentage) return 0;
        return companyList.filter(c => {
            const el = c.eligibility || {};
            const checks = {
                cgpa: !el.min_cgpa || parseFloat(collegeCgpa) >= el.min_cgpa,
                tenth: !el.min_10th || parseFloat(tenthPercentage) >= el.min_10th,
                twelfth: !el.min_12th || parseFloat(twelfthPercentage) >= el.min_12th,
                amcat: !el.min_amcat || el.min_amcat === 0 || parseFloat(amcatScore) >= el.min_amcat,
                branch: !el.allowed_branches || el.allowed_branches.length === 0 || el.allowed_branches.includes(department || 'CE'),
            };
            return Object.values(checks).every(Boolean);
        }).length;
    }, [collegeCgpa, tenthPercentage, twelfthPercentage, amcatScore, department]);

    // Profile completion score
    const profileScore = useMemo(() => {
        let score = 0;
        if (fullName) score += 10;
        if (profilePicture) score += 10;
        if (department) score += 5;
        if (collegeCgpa) score += 15;
        if (tenthPercentage) score += 10;
        if (twelfthPercentage) score += 10;
        if (amcatScore) score += 10;
        if (skills.length > 0) score += 10;
        if (resumeSummary) score += 5;
        if (leetcodeUrl) score += 5;
        if (linkedinUrl) score += 5;
        if (resumeUrl) score += 5;
        return Math.min(score, 100);
    }, [fullName, profilePicture, department, collegeCgpa, tenthPercentage, twelfthPercentage, amcatScore, skills, resumeSummary, leetcodeUrl, linkedinUrl, resumeUrl]);

    // Strength tips
    const strengthTips = useMemo(() => [
        { label: 'Add full name', done: !!fullName },
        { label: 'Add profile picture', done: !!profilePicture },
        { label: 'Fill college CGPA', done: !!collegeCgpa },
        { label: 'Upload resume for AI extraction', done: skills.length > 0 },
        { label: 'Add LeetCode profile', done: !!leetcodeUrl },
        { label: 'Add LinkedIn profile', done: !!linkedinUrl },
        { label: 'Fill AMCAT score', done: !!amcatScore },
    ], [fullName, profilePicture, collegeCgpa, skills, leetcodeUrl, linkedinUrl, amcatScore]);

    // Activity timeline
    const activities = useMemo(() => {
        const items = [];
        items.push({ label: 'Account created', time: 'When you registered', icon: User });
        if (skills.length > 0) items.push({ label: `${skills.length} skills extracted from resume`, time: 'From AI analysis', icon: Award });
        if (collegeCgpa) items.push({ label: `CGPA updated to ${collegeCgpa}`, time: 'Academic records', icon: GraduationCap });
        if (leetcodeUrl) items.push({ label: 'LeetCode profile linked', time: 'Professional links', icon: Link2 });
        if (linkedinUrl) items.push({ label: 'LinkedIn connected', time: 'Professional links', icon: Link2 });
        if (resumeUrl) items.push({ label: 'Resume uploaded', time: 'Available for matching', icon: FileText });
        return items;
    }, [skills, collegeCgpa, leetcodeUrl, linkedinUrl, resumeUrl]);

    /* ═══ HANDLERS ═══ */

    const handleLogout = () => {
        apiLogout();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setInfoMessage({ type: 'error', text: 'Image too large (Max 2MB)' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setProfilePicture(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleInfoSave = async (e) => {
        e.preventDefault();
        setInfoLoading(true);
        setInfoMessage({ type: '', text: '' });
        try {
            const response = await apiFetch('/api/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    email: user.email, full_name: fullName,
                    department, profile_picture: profilePicture
                })
            });
            const data = await response.json();
            if (response.ok) {
                const updatedUser = { ...user, fullName: data.full_name, department: data.department };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setInfoMessage({ type: 'success', text: 'Profile updated!' });
            } else {
                setInfoMessage({ type: 'error', text: data.error || 'Failed to update' });
            }
        } catch (err) {
            setInfoMessage({ type: 'error', text: 'Connection error.' });
        } finally {
            setInfoLoading(false);
        }
    };

    const handleAcademicSave = async (e) => {
        e.preventDefault();
        setAcademicMessage({ type: '', text: '' });
        const errors = [];
        if (tenthPercentage !== '' && (isNaN(tenthPercentage) || tenthPercentage < 0 || tenthPercentage > 100))
            errors.push('10th % must be 0-100');
        if (twelfthPercentage !== '' && (isNaN(twelfthPercentage) || twelfthPercentage < 0 || twelfthPercentage > 100))
            errors.push('12th % must be 0-100');
        if (collegeCgpa !== '' && (isNaN(collegeCgpa) || collegeCgpa < 0 || collegeCgpa > 10))
            errors.push('CGPA must be 0-10');
        if (amcatScore !== '' && (isNaN(amcatScore) || !Number.isInteger(Number(amcatScore)) || Number(amcatScore) < 0))
            errors.push('AMCAT must be a non-negative integer');
        if (errors.length > 0) {
            setAcademicMessage({ type: 'error', text: errors.join('; ') });
            return;
        }
        setAcademicLoading(true);
        try {
            const response = await apiFetch('/api/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    email: user.email,
                    tenth_percentage: tenthPercentage === '' ? null : parseFloat(tenthPercentage),
                    twelfth_percentage: twelfthPercentage === '' ? null : parseFloat(twelfthPercentage),
                    college_cgpa: collegeCgpa === '' ? null : parseFloat(collegeCgpa),
                    amcat_score: amcatScore === '' ? null : parseInt(amcatScore)
                })
            });
            const data = await response.json();
            if (response.ok) {
                setAcademicMessage({ type: 'success', text: 'Academic details saved!' });
            } else {
                setAcademicMessage({ type: 'error', text: data.error || 'Failed to save' });
            }
        } catch (err) {
            setAcademicMessage({ type: 'error', text: 'Connection error.' });
        } finally {
            setAcademicLoading(false);
        }
    };

    const isValidUrl = (url) => !url || /^https?:\/\/.+/i.test(url);

    const handleLinksSave = async (e) => {
        e.preventDefault();
        setLinksMessage({ type: '', text: '' });
        const urlFields = [
            { label: 'LeetCode', value: leetcodeUrl },
            { label: 'CodeChef', value: codechefUrl },
            { label: 'Codeforces', value: codeforcesUrl },
            { label: 'LinkedIn', value: linkedinUrl },
            { label: 'Resume', value: resumeUrl },
        ];
        for (const field of urlFields) {
            if (field.value && !isValidUrl(field.value)) {
                setLinksMessage({ type: 'error', text: `${field.label}: Must be a valid URL` });
                return;
            }
        }
        setLinksLoading(true);
        try {
            const response = await apiFetch('/api/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    email: user.email,
                    leetcode_url: leetcodeUrl || null,
                    codechef_url: codechefUrl || null,
                    codeforces_url: codeforcesUrl || null,
                    linkedin_url: linkedinUrl || null,
                    resume_url: resumeUrl || null,
                })
            });
            const data = await response.json();
            if (response.ok) {
                setLinksMessage({ type: 'success', text: 'Links saved!' });
            } else {
                setLinksMessage({ type: 'error', text: data.detail || data.error || 'Failed to save' });
            }
        } catch (err) {
            setLinksMessage({ type: 'error', text: 'Connection error.' });
        } finally {
            setLinksLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPwMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        setPwLoading(true);
        setPwMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_URL}/api/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email, currentPassword, newPassword, role: user.role
                })
            });
            const data = await response.json();
            if (response.ok) {
                setPwMessage({ type: 'success', text: 'Password updated!' });
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                setPwMessage({ type: 'error', text: data.error || 'Failed to update' });
            }
        } catch (err) {
            setPwMessage({ type: 'error', text: 'Connection error.' });
        } finally {
            setPwLoading(false);
        }
    };

    // Password strength
    const pwStrength = useMemo(() => {
        if (!newPassword) return { level: 0, label: '' };
        let score = 0;
        if (newPassword.length >= 6) score++;
        if (newPassword.length >= 10) score++;
        if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;
        if (score <= 1) return { level: 1, label: 'Weak', cls: 'weak' };
        if (score <= 2) return { level: 2, label: 'Medium', cls: 'medium' };
        return { level: 3, label: 'Strong', cls: 'strong' };
    }, [newPassword]);

    // Academic status helpers
    const getAcademicStatus = (value, max) => {
        const pct = (parseFloat(value) || 0) / max;
        if (pct >= 0.8) return { text: 'Excellent', cls: 'good' };
        if (pct >= 0.6) return { text: 'Good standing', cls: 'average' };
        if (value) return { text: 'Needs improvement', cls: 'low' };
        return null;
    };

    /* ═══ RENDER ═══ */
    if (fetching) {
        return <div className="pf-page"><div className="pf-loading">Loading your profile...</div></div>;
    }

    return (
        <motion.div className="pf-page"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* ═══ HERO SECTION ═══ */}
            <motion.section className="pf-hero"
                variants={heroStagger} initial="hidden" animate="show">
                <HeroOrbs />
                <div className="pf-hero-inner">

                    {/* Avatar */}
                    <motion.div className="pf-avatar-wrap" variants={heroItem}
                        whileHover={{ rotateX: 5, rotateY: -5, transition: { type: 'spring', stiffness: 300 } }}>
                        <AvatarRing />
                        <div className="pf-avatar">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile" />
                            ) : (
                                <span className="pf-avatar-letter">
                                    {fullName?.[0] || user.fullName?.[0] || 'U'}
                                </span>
                            )}
                            <label className="pf-avatar-upload">
                                <UploadCloud size={20} />
                                <input type="file" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <div className="pf-status-dot" />
                    </motion.div>

                    {/* Info */}
                    <motion.div className="pf-hero-info" variants={heroItem}>
                        <h1 className="pf-hero-name">{fullName || user.fullName || 'Student'}</h1>
                        <div className="pf-hero-meta">
                            {department && (
                                <span className="pf-hero-tag">
                                    <GraduationCap size={13} /> {department} Engineering
                                </span>
                            )}
                            <span className="pf-hero-tag">
                                <Hash size={13} /> {user.idNumber || 'N/A'}
                            </span>
                            <span className="pf-hero-tag">
                                <Mail size={13} /> {user.email || 'N/A'}
                            </span>
                        </div>
                        <div className="pf-hero-actions">
                            <button className="pf-hero-btn primary" onClick={() => setActiveTab('overview')}>
                                <User size={13} /> Edit Profile
                            </button>
                            <button className="pf-hero-btn" onClick={() => navigate('/app/resume')}>
                                <FileText size={13} /> Update Resume
                            </button>
                            <button className="pf-hero-btn danger" onClick={handleLogout}>
                                <LogOut size={13} /> Sign Out
                            </button>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div className="pf-hero-stats" variants={heroItem}>
                        <motion.div className="pf-stat-mini orange" whileHover={{ y: -3 }}>
                            <div className="pf-stat-mini-icon"><Target size={16} /></div>
                            <span className="pf-stat-mini-value">{profileScore}%</span>
                            <span className="pf-stat-mini-label">Profile Score</span>
                        </motion.div>
                        <motion.div className="pf-stat-mini green" whileHover={{ y: -3 }}>
                            <div className="pf-stat-mini-icon"><Shield size={16} /></div>
                            <span className="pf-stat-mini-value">{eligibleCount}</span>
                            <span className="pf-stat-mini-label">Eligible Cos</span>
                        </motion.div>
                        <motion.div className="pf-stat-mini blue" whileHover={{ y: -3 }}>
                            <div className="pf-stat-mini-icon"><Zap size={16} /></div>
                            <span className="pf-stat-mini-value">{skills.length}</span>
                            <span className="pf-stat-mini-label">Skills</span>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ═══ MAIN LAYOUT ═══ */}
            <div className="pf-main">

                {/* Sidebar Nav */}
                <nav className="pf-sidebar">
                    {TABS.map(tab => (
                        <button key={tab.id}
                            className={`pf-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}>
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Tab Content */}
                <div className="pf-content">
                    <AnimatePresence mode="wait">
                        {/* ═══ TAB: OVERVIEW ═══ */}
                        {activeTab === 'overview' && (
                            <motion.div key="overview" {...tabContent}>
                                <div className="pf-tab-header">
                                    <Home size={18} />
                                    <h2>Profile Dashboard</h2>
                                </div>

                                {/* Personal Info Quick Edit */}
                                <form onSubmit={handleInfoSave}>
                                    <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                        <div className="pf-card-title"><User size={14} /> Personal Information</div>
                                        <div className="pf-info-row">
                                            <div className="pf-info-field">
                                                <label><User size={12} /> Full Name</label>
                                                <input type="text" value={fullName}
                                                    onChange={e => setFullName(e.target.value)}
                                                    placeholder="Enter your full name" />
                                            </div>
                                            <div className="pf-info-field">
                                                <label><Mail size={12} /> Email</label>
                                                <div className="pf-info-readonly">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="pf-info-row">
                                            <div className="pf-info-field">
                                                <label><Hash size={12} /> ID Number</label>
                                                <div className="pf-info-readonly">{user.idNumber || 'N/A'}</div>
                                            </div>
                                            <div className="pf-info-field">
                                                <label><BookOpen size={12} /> Department</label>
                                                <input type="text" value={department}
                                                    onChange={e => setDepartment(e.target.value)}
                                                    placeholder="e.g. CE, IT" />
                                            </div>
                                        </div>
                                        <div className="pf-save-bar">
                                            {infoMessage.text && (
                                                <div className={`pf-msg ${infoMessage.type}`}>
                                                    {infoMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                                                    {infoMessage.text}
                                                </div>
                                            )}
                                            <button type="submit" className="pf-save-btn" disabled={infoLoading}
                                                style={{ marginLeft: 'auto' }}>
                                                <Save size={14} />
                                                {infoLoading ? 'Saving...' : 'Save Info'}
                                            </button>
                                        </div>
                                    </motion.div>
                                </form>

                                {/* Profile Strength  */}
                                <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                    <div className="pf-card-title"><TrendingUp size={14} /> Profile Strength</div>
                                    <div className="pf-strength-wrap">
                                        <div className="pf-strength-ring-wrap">
                                            <StrengthRing percentage={profileScore} />
                                        </div>
                                        <div className="pf-strength-tips">
                                            <h4>Complete your profile:</h4>
                                            <ul className="pf-tip-list">
                                                {strengthTips.map((tip, i) => (
                                                    <motion.li key={i}
                                                        className={`pf-tip-item ${tip.done ? 'done' : 'pending'}`}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.06 }}>
                                                        <span className="pf-tip-icon">
                                                            {tip.done ? <Check size={10} /> : <Circle size={8} />}
                                                        </span>
                                                        {tip.label}
                                                    </motion.li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Activity Timeline */}
                                <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                    <div className="pf-card-title"><Clock size={14} /> Recent Activity</div>
                                    <div className="pf-timeline">
                                        {activities.map((act, i) => (
                                            <motion.div key={i} className="pf-timeline-item"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}>
                                                <div className="pf-timeline-dot" />
                                                <div className="pf-timeline-label">{act.label}</div>
                                                <div className="pf-timeline-time">{act.time}</div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Quick Actions */}
                                <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                    <div className="pf-card-title"><Zap size={14} /> Quick Actions</div>
                                    <div className="pf-actions-grid">
                                        {[
                                            { label: 'Update Resume', desc: 'AI-powered parsing', path: '/app/resume', icon: FileText },
                                            { label: 'Check Eligibility', desc: 'Company criteria match', path: '/app/eligibility', icon: Shield },
                                            { label: 'Skill Analysis', desc: 'Gap analysis engine', path: '/app/skill-analysis', icon: BarChart3 },
                                            { label: 'View Analytics', desc: 'Placement insights', path: '/app/analytics', icon: TrendingUp },
                                        ].map((action, i) => (
                                            <motion.button key={i} className="pf-action-card"
                                                onClick={() => navigate(action.path)}
                                                whileHover={{ y: -3, transition: { duration: 0.15 } }}>
                                                <div className="pf-action-icon"><action.icon size={16} /></div>
                                                <div>
                                                    <div className="pf-action-label">{action.label}</div>
                                                    <div className="pf-action-desc">{action.desc}</div>
                                                </div>
                                                <ArrowUpRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-light)' }} />
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* ═══ TAB: ACADEMICS ═══ */}
                        {activeTab === 'academics' && (
                            <motion.div key="academics" {...tabContent}>
                                <div className="pf-tab-header">
                                    <GraduationCap size={18} />
                                    <h2>Academic Records</h2>
                                </div>
                                <form onSubmit={handleAcademicSave}>
                                    <div className="pf-card">
                                        <div className="pf-card-title"><BarChart3 size={14} /> Your Scores</div>
                                        <div className="pf-data-cards">
                                            {/* CGPA */}
                                            <div className="pf-data-card">
                                                <div className="pf-data-card-label">
                                                    <GraduationCap size={13} /> College CGPA
                                                </div>
                                                <div className="pf-data-input-wrap">
                                                    <input type="number" className="pf-data-input"
                                                        min="0" max="10" step="0.01"
                                                        value={collegeCgpa}
                                                        onChange={e => setCollegeCgpa(e.target.value)}
                                                        placeholder="e.g. 8.50" />
                                                    <span className="pf-data-suffix">/10</span>
                                                </div>
                                                <div className="pf-data-meter">
                                                    <div className="pf-data-meter-fill" style={{
                                                        width: `${Math.min((parseFloat(collegeCgpa) || 0) / 10 * 100, 100)}%`,
                                                        background: (parseFloat(collegeCgpa) || 0) >= 8 ? '#22C55E' :
                                                            (parseFloat(collegeCgpa) || 0) >= 6 ? '#F59E0B' : '#EF4444'
                                                    }} />
                                                </div>
                                                {collegeCgpa && (() => {
                                                    const s = getAcademicStatus(collegeCgpa, 10);
                                                    return s ? <div className={`pf-data-status ${s.cls}`}>{s.text}</div> : null;
                                                })()}
                                            </div>

                                            {/* 10th */}
                                            <div className="pf-data-card">
                                                <div className="pf-data-card-label">
                                                    <BookOpen size={13} /> 10th Percentage
                                                </div>
                                                <div className="pf-data-input-wrap">
                                                    <input type="number" className="pf-data-input"
                                                        min="0" max="100" step="0.01"
                                                        value={tenthPercentage}
                                                        onChange={e => setTenthPercentage(e.target.value)}
                                                        placeholder="e.g. 85.50" />
                                                    <span className="pf-data-suffix">%</span>
                                                </div>
                                                <div className="pf-data-meter">
                                                    <div className="pf-data-meter-fill" style={{
                                                        width: `${Math.min(parseFloat(tenthPercentage) || 0, 100)}%`,
                                                        background: (parseFloat(tenthPercentage) || 0) >= 80 ? '#22C55E' :
                                                            (parseFloat(tenthPercentage) || 0) >= 60 ? '#F59E0B' : '#EF4444'
                                                    }} />
                                                </div>
                                                {tenthPercentage && (() => {
                                                    const s = getAcademicStatus(tenthPercentage, 100);
                                                    return s ? <div className={`pf-data-status ${s.cls}`}>{s.text}</div> : null;
                                                })()}
                                            </div>

                                            {/* 12th */}
                                            <div className="pf-data-card">
                                                <div className="pf-data-card-label">
                                                    <BookOpen size={13} /> 12th Percentage
                                                </div>
                                                <div className="pf-data-input-wrap">
                                                    <input type="number" className="pf-data-input"
                                                        min="0" max="100" step="0.01"
                                                        value={twelfthPercentage}
                                                        onChange={e => setTwelfthPercentage(e.target.value)}
                                                        placeholder="e.g. 78.25" />
                                                    <span className="pf-data-suffix">%</span>
                                                </div>
                                                <div className="pf-data-meter">
                                                    <div className="pf-data-meter-fill" style={{
                                                        width: `${Math.min(parseFloat(twelfthPercentage) || 0, 100)}%`,
                                                        background: (parseFloat(twelfthPercentage) || 0) >= 80 ? '#22C55E' :
                                                            (parseFloat(twelfthPercentage) || 0) >= 60 ? '#F59E0B' : '#EF4444'
                                                    }} />
                                                </div>
                                                {twelfthPercentage && (() => {
                                                    const s = getAcademicStatus(twelfthPercentage, 100);
                                                    return s ? <div className={`pf-data-status ${s.cls}`}>{s.text}</div> : null;
                                                })()}
                                            </div>

                                            {/* AMCAT */}
                                            <div className="pf-data-card">
                                                <div className="pf-data-card-label">
                                                    <Award size={13} /> AMCAT Score
                                                </div>
                                                <div className="pf-data-input-wrap">
                                                    <input type="number" className="pf-data-input"
                                                        min="0" step="1"
                                                        value={amcatScore}
                                                        onChange={e => setAmcatScore(e.target.value)}
                                                        placeholder="e.g. 450" />
                                                    <span className="pf-data-suffix">pts</span>
                                                </div>
                                                {amcatScore && (
                                                    <div className={`pf-data-status ${parseInt(amcatScore) >= 400 ? 'good' : parseInt(amcatScore) >= 250 ? 'average' : 'low'}`}>
                                                        {parseInt(amcatScore) >= 400 ? 'Excellent' : parseInt(amcatScore) >= 250 ? 'Good' : 'Below average'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pf-save-bar">
                                            {academicMessage.text && (
                                                <div className={`pf-msg ${academicMessage.type}`}>
                                                    {academicMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                                                    {academicMessage.text}
                                                </div>
                                            )}
                                            <button type="submit" className="pf-save-btn" disabled={academicLoading}
                                                style={{ marginLeft: 'auto' }}>
                                                <Save size={14} />
                                                {academicLoading ? 'Saving...' : 'Save Academics'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* ═══ TAB: SKILLS & RESUME ═══ */}
                        {activeTab === 'skills' && (
                            <motion.div key="skills" {...tabContent}>
                                <div className="pf-tab-header">
                                    <Award size={18} />
                                    <h2>Skills & Resume</h2>
                                </div>

                                {/* ATS Score */}
                                {atsScore > 0 && (
                                    <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                        <div className="pf-card-title"><Target size={14} /> ATS Score</div>
                                        <div className="pf-ats-wrap">
                                            <div className="pf-ats-ring-wrap">
                                                <ATSRing score={atsScore} size={120} />
                                            </div>
                                            <div className="pf-ats-details">
                                                <div className="pf-ats-score">{atsScore}<span>/100</span></div>
                                                <div className={`pf-ats-label ${atsScore >= 70 ? 'excellent' : atsScore >= 50 ? 'good' : 'needs-work'}`}>
                                                    {atsScore >= 70 ? '✓ Excellent — ATS Optimized' : atsScore >= 50 ? '◐ Good — Room for improvement' : '✗ Needs Work'}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 6 }}>
                                                    {experienceYears > 0 && `${experienceYears} year${experienceYears !== 1 ? 's' : ''} experience detected`}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Resume Summary */}
                                {resumeSummary && (
                                    <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                        <div className="pf-card-title"><FileText size={14} /> AI-Extracted Summary</div>
                                        <div className="pf-resume-summary">
                                            <p>"{resumeSummary}"</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Skills Cloud */}
                                <motion.div className="pf-card pf-skills-tab" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                    <div className="pf-card-title"><Zap size={14} /> Technical Arsenal ({skills.length})</div>
                                    {skills.length > 0 ? (
                                        <div className="pf-skills-cloud">
                                            {skills.map((skill, i) => (
                                                <motion.span key={skill} className="pf-skill-tag"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 200 }}
                                                    whileHover={{ scale: 1.08, y: -2 }}
                                                    style={{
                                                        fontSize: `${Math.random() * 0.25 + 0.75}rem`,
                                                    }}>
                                                    {skill}
                                                </motion.span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="pf-skills-empty">
                                            <p>No skills extracted yet. Upload your resume to extract skills automatically.</p>
                                            <button className="pf-save-btn" style={{ marginTop: 12 }}
                                                onClick={() => navigate('/app/resume')}>
                                                <FileText size={14} /> Upload Resume
                                            </button>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Key Projects */}
                                {projects.length > 0 && (
                                    <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                        <div className="pf-card-title"><FolderGit2 size={14} /> Key Projects</div>
                                        <ul className="pf-achievements">
                                            {projects.map((proj, i) => (
                                                <motion.li key={i}
                                                    initial={{ opacity: 0, x: -6 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.06 }}>
                                                    {proj}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}

                                {/* Key Achievements */}
                                {keyAchievements.length > 0 && (
                                    <motion.div className="pf-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                                        <div className="pf-card-title"><Award size={14} /> Key Achievements</div>
                                        <ul className="pf-achievements">
                                            {keyAchievements.map((ach, i) => (
                                                <motion.li key={i}
                                                    initial={{ opacity: 0, x: -6 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.06 }}>
                                                    {ach}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* ═══ TAB: PROFESSIONAL LINKS ═══ */}
                        {activeTab === 'links' && (
                            <motion.div key="links" {...tabContent}>
                                <div className="pf-tab-header">
                                    <Link2 size={18} />
                                    <h2>Professional Links</h2>
                                </div>

                                <form onSubmit={handleLinksSave}>
                                    <div className="pf-card">
                                        <div className="pf-card-title"><ExternalLink size={14} /> Platform Connections</div>
                                        <div className="pf-links-grid">
                                            {[
                                                { key: 'leetcode', label: 'LeetCode', icon: 'LC', cls: 'lc', value: leetcodeUrl, setter: setLeetcodeUrl, placeholder: 'https://leetcode.com/yourname' },
                                                { key: 'codechef', label: 'CodeChef', icon: 'CC', cls: 'cc', value: codechefUrl, setter: setCodechefUrl, placeholder: 'https://codechef.com/users/yourname' },
                                                { key: 'codeforces', label: 'Codeforces', icon: 'CF', cls: 'cf', value: codeforcesUrl, setter: setCodeforcesUrl, placeholder: 'https://codeforces.com/profile/yourname' },
                                                { key: 'linkedin', label: 'LinkedIn', icon: 'in', cls: 'li', value: linkedinUrl, setter: setLinkedinUrl, placeholder: 'https://linkedin.com/in/yourname' },
                                                { key: 'resume', label: 'Resume Link', icon: '📄', cls: 'rs', value: resumeUrl, setter: setResumeUrl, placeholder: 'https://drive.google.com/file/d/...' },
                                            ].map(platform => (
                                                <div key={platform.key} className="pf-link-card">
                                                    <div className="pf-link-header">
                                                        <span className={`pf-link-icon ${platform.cls}`}>{platform.icon}</span>
                                                        <span className="pf-link-name">{platform.label}</span>
                                                        <span className={`pf-link-status ${platform.value ? 'connected' : 'not-linked'}`}>
                                                            {platform.value ? '✓ Linked' : '○ Not linked'}
                                                        </span>
                                                    </div>
                                                    <input type="url" className="pf-link-input"
                                                        value={platform.value}
                                                        onChange={e => platform.setter(e.target.value)}
                                                        placeholder={platform.placeholder} />
                                                    {platform.value && isValidUrl(platform.value) && (
                                                        <a href={platform.value} target="_blank" rel="noopener noreferrer"
                                                            className="pf-link-open">
                                                            <ExternalLink size={11} /> Open profile
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pf-save-bar">
                                            {linksMessage.text && (
                                                <div className={`pf-msg ${linksMessage.type}`}>
                                                    {linksMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                                                    {linksMessage.text}
                                                </div>
                                            )}
                                            <button type="submit" className="pf-save-btn" disabled={linksLoading}
                                                style={{ marginLeft: 'auto' }}>
                                                <Save size={14} />
                                                {linksLoading ? 'Saving...' : 'Save Links'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* ═══ TAB: SECURITY ═══ */}
                        {activeTab === 'security' && (
                            <motion.div key="security" {...tabContent}>
                                <div className="pf-tab-header">
                                    <Lock size={18} />
                                    <h2>Security Settings</h2>
                                </div>

                                <div className="pf-card">
                                    <div className="pf-card-title"><Shield size={14} /> Change Password</div>
                                    <form onSubmit={handlePasswordChange} className="pf-security-form">
                                        <div className="pf-form-group">
                                            <label>Current Password</label>
                                            <input type="password" value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                required placeholder="••••••••" />
                                        </div>
                                        <div className="pf-form-group">
                                            <label>New Password</label>
                                            <input type="password" value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                required placeholder="Minimum 6 characters" />
                                            {newPassword && (
                                                <>
                                                    <div className="pf-pw-strength">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className={`pf-pw-bar ${pwStrength.level >= i ? `filled ${pwStrength.cls}` : ''}`} />
                                                        ))}
                                                    </div>
                                                    <span className={`pf-pw-label ${pwStrength.cls}`}>{pwStrength.label}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="pf-form-group">
                                            <label>Confirm New Password</label>
                                            <input type="password" value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                required placeholder="••••••••" />
                                        </div>

                                        {pwMessage.text && (
                                            <div className={`pf-msg ${pwMessage.type}`}>
                                                {pwMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                                                {pwMessage.text}
                                            </div>
                                        )}

                                        <button type="submit" className="pf-save-btn" disabled={pwLoading}>
                                            <Lock size={14} />
                                            {pwLoading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </form>
                                </div>

                                <div className="pf-card">
                                    <div className="pf-card-title"><User size={14} /> Account</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                                        Signed in as <strong style={{ color: 'var(--text-secondary)' }}>{user.email}</strong>
                                    </div>
                                    <div className="pf-logout-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                        <button className="pf-logout-btn" onClick={handleLogout}>
                                            <LogOut size={16} /> Sign Out of All Devices
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default Profile;
