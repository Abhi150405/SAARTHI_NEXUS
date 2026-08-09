import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    Mail,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import '../styles/Login.css';
import { API_URL } from '../config';
import { apiFetch, login as apiLogin, setAccessToken, setUser } from '../api';

// ─── Inline SVG Components ────────────────────────────────────────────────────

/** Subtle dot-cross grid placed behind the left panel */
const AuthBgLeft = ({ className = '' }) => (
    <svg
        viewBox="0 0 720 900"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
    >
        <defs>
            <pattern id="cross-l" width="48" height="48" patternUnits="userSpaceOnUse">
                <line x1="24" y1="20" x2="24" y2="28" stroke="#1F1F1F" strokeWidth="0.8" />
                <line x1="20" y1="24" x2="28" y2="24" stroke="#1F1F1F" strokeWidth="0.8" />
            </pattern>
            <radialGradient id="xfade-l" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="xmask-l">
                <rect width="720" height="900" fill="url(#xfade-l)" />
            </mask>
        </defs>
        <rect width="720" height="900" fill="url(#cross-l)" mask="url(#xmask-l)" />
        <circle cx="620" cy="120" r="180" fill="#F97316" opacity="0.02" />
        <circle cx="100" cy="780" r="150" fill="#3B82F6" opacity="0.015" />
    </svg>
);

/** Same grid pattern for the right background panel */
const AuthBgRight = ({ className = '' }) => (
    <svg
        viewBox="0 0 720 900"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
    >
        <defs>
            <pattern id="cross-r" width="48" height="48" patternUnits="userSpaceOnUse">
                <line x1="24" y1="20" x2="24" y2="28" stroke="#1F1F1F" strokeWidth="0.8" />
                <line x1="20" y1="24" x2="28" y2="24" stroke="#1F1F1F" strokeWidth="0.8" />
            </pattern>
            <radialGradient id="xfade-r" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="xmask-r">
                <rect width="720" height="900" fill="url(#xfade-r)" />
            </mask>
        </defs>
        <rect width="720" height="900" fill="url(#cross-r)" mask="url(#xmask-r)" />
        <circle cx="620" cy="120" r="180" fill="#F97316" opacity="0.02" />
        <circle cx="100" cy="780" r="150" fill="#3B82F6" opacity="0.015" />
    </svg>
);

/** Animated SAARTHI Nexus dashboard illustration */
const AuthIllustration = () => (
    <svg
        viewBox="-10 -10 420 340"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
        aria-label="SAARTHI Nexus Dashboard Preview"
    >
        <style>{`
            @keyframes cardAppear {
                from { opacity:0; transform:translateY(12px); }
                to   { opacity:1; transform:translateY(0); }
            }
            @keyframes countUp {
                from { opacity:0; transform:translateY(4px); }
                to   { opacity:1; transform:translateY(0); }
            }
            @keyframes growBar {
                from { transform:scaleX(0); }
                to   { transform:scaleX(1); }
            }
            @keyframes badgeFloat {
                0%,100% { transform:translateY(0); }
                50%     { transform:translateY(-4px); }
            }
        `}</style>

        <g style={{ animation:'cardAppear .7s ease .2s both', transformBox:'fill-box', transformOrigin:'center' }}>
            <rect x="20" y="10" width="360" height="295" rx="16" fill="#111111" stroke="#2A2A2A" />
            <rect x="20" y="10" width="360" height="44" rx="16" fill="#111111" stroke="#2A2A2A" />
            <line x1="20" y1="54" x2="380" y2="54" stroke="#1F1F1F" />
            <circle cx="44" cy="32" r="5" fill="#EF4444" opacity="0.7" />
            <circle cx="60" cy="32" r="5" fill="#F97316" opacity="0.7" />
            <circle cx="76" cy="32" r="5" fill="#22C55E" opacity="0.7" />
            <text x="96" y="32" fontSize="11" fill="#525252" dominantBaseline="central">SAARTHI Nexus — Live Dashboard</text>

            <rect x="34" y="70" width="96" height="52" rx="8" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="0.5" />
            <text x="82" y="82" fontSize="8" fill="#525252" textAnchor="middle">Placement Rate</text>
            <text x="82" y="104" fontSize="18" fontWeight="700" fill="#F97316" textAnchor="middle"
                style={{ animation:'countUp .5s ease .8s both', transformBox:'fill-box', transformOrigin:'center' }}>95%</text>

            <rect x="142" y="70" width="96" height="52" rx="8" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="0.5" />
            <text x="190" y="82" fontSize="8" fill="#525252" textAnchor="middle">Active Drives</text>
            <text x="190" y="104" fontSize="18" fontWeight="700" fill="#22C55E" textAnchor="middle"
                style={{ animation:'countUp .5s ease 1s both', transformBox:'fill-box', transformOrigin:'center' }}>34</text>

            <rect x="250" y="70" width="96" height="52" rx="8" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="0.5" />
            <text x="298" y="82" fontSize="8" fill="#525252" textAnchor="middle">Avg Package</text>
            <text x="298" y="104" fontSize="18" fontWeight="700" fill="#F5F5F5" textAnchor="middle"
                style={{ animation:'countUp .5s ease 1.2s both', transformBox:'fill-box', transformOrigin:'center' }}>₹8.4L</text>

            <text x="34" y="148" fontSize="9" fill="#525252">BRANCH-WISE PLACEMENT RATE</text>
            {[
                { label:'CSE', y:166, width:209, pct:'95%', delay:'1.4s' },
                { label:'IT',  y:180, width:194, pct:'88%', delay:'1.5s' },
                { label:'ECE', y:194, width:163, pct:'74%', delay:'1.6s' },
                { label:'ME',  y:208, width:134, pct:'61%', delay:'1.7s' },
                { label:'CE',  y:222, width:121, pct:'55%', delay:'1.8s' },
            ].map(({ label, y, width, pct, delay }) => (
                <g key={label}>
                    <text x="34" y={y} fontSize="8" fill="#525252">{label}</text>
                    <rect x="70" y={y - 8} width="220" height="8" rx="4" fill="#1A1A1A" />
                    <rect x="70" y={y - 8} width={width} height="8" rx="4" fill="#F97316"
                        style={{ transformBox:'fill-box', transformOrigin:'left center', animation:`growBar .8s ease ${delay} forwards` }} />
                    <text x="300" y={y} fontSize="8" fill="#A3A3A3">{pct}</text>
                </g>
            ))}

            <text x="34" y="244" fontSize="9" fill="#525252">RECENT ACTIVITY</text>
            <circle cx="34" cy="258" r="3" fill="#22C55E" />
            <text x="44" y="258" fontSize="9" fill="#A3A3A3" dominantBaseline="central">Infosys drive posted · 2h ago</text>
            <circle cx="34" cy="274" r="3" fill="#F97316" />
            <text x="44" y="274" fontSize="9" fill="#525252" dominantBaseline="central">TCS shortlist published · 5h ago</text>
        </g>

        {/* Floating badge moved to bottom to render on top (Z-index fix) */}
        <g style={{ animation:'badgeFloat 3s ease-in-out infinite', transformBox:'fill-box', transformOrigin:'center' }}>
            <rect x="280" y="0" width="120" height="24" rx="12" fill="#22C55E" opacity="0.12" stroke="#22C55E" strokeWidth="0.5" />
            <circle cx="294" cy="12" r="4" fill="#22C55E" />
            <text x="304" y="12" fontSize="9" fill="#22C55E" dominantBaseline="central" fontWeight="600">Live Placement Data</text>
        </g>
    </svg>
);

/** Animated success checkmark */
const AuthSuccess = () => (
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" aria-label="Success">
        <style>{`
            @keyframes outerPulse {
                0%   { transform:scale(1);    opacity:.5; }
                100% { transform:scale(1.45); opacity:0; }
            }
            @keyframes circleGrow {
                from { stroke-dasharray:0 176; }
                to   { stroke-dasharray:176 0; }
            }
            @keyframes checkDraw {
                from { stroke-dashoffset:40; }
                to   { stroke-dashoffset:0; }
            }
            @keyframes bgFill {
                from { opacity:0; }
                to   { opacity:.08; }
            }
        `}</style>
        <circle cx="40" cy="40" r="36" fill="none" stroke="#22C55E" strokeWidth="1" opacity="0"
            style={{ animation:'outerPulse 1.5s ease-out .6s infinite', transformBox:'fill-box', transformOrigin:'center' }} />
        <circle cx="40" cy="40" r="28" fill="none" stroke="#1A1A1A" strokeWidth="3" />
        <circle cx="40" cy="40" r="28" fill="#22C55E" opacity="0"
            style={{ animation:'bgFill .3s ease .9s forwards' }} />
        <circle cx="40" cy="40" r="28" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"
            transform="rotate(-90 40 40)"
            style={{ strokeDasharray:'0 176', animation:'circleGrow .6s cubic-bezier(.4,0,.2,1) .1s forwards' }} />
        <path d="M26 40 L36 50 L54 30" fill="none" stroke="#22C55E" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="40 40"
            style={{ strokeDashoffset:40, animation:'checkDraw .4s ease .7s forwards' }} />
    </svg>
);

/** Actual SAARTHI Nexus Logo */
const LogoSVG = ({ className = "" }) => (
    <svg width="220" height="48" viewBox="0 0 220 48" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g stroke="#F97316" strokeWidth="2" fill="#F97316">
            <line x1="20" y1="32" x2="30" y2="16" />
            <line x1="30" y1="16" x2="40" y2="32" />
            <circle cx="20" cy="32" r="2.8"/>
            <circle cx="30" cy="16" r="2.8"/>
            <circle cx="40" cy="32" r="2.8"/>
        </g>
        <text x="56" y="26" fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize="16" fontWeight="700" fill="#F5F5F5" letterSpacing="1">SAARTHI</text>
        <text x="56" y="40" fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize="12" fontWeight="300" fill="#A3A3A3" letterSpacing="0.5">Nexus</text>
    </svg>
);

// ─── Animation Variants ───────────────────────────────────────────────────────

const pageVariant = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 90, damping: 18, delay: 0.08 },
    },
};

const successVariant = {
    hidden: { opacity: 0, scale: 0.88, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 120, damping: 16 },
    },
    exit: { opacity: 0, scale: 0.92, y: -8, transition: { duration: 0.2 } },
};

const formVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit:   { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Google Sign-In Button ────────────────────────────────────────────────────

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const GoogleSignInButton = ({ setLoading, setError, setSuccess, navigate, loading }) => {
    const [googleLoading, setGoogleLoading] = useState(false);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setError('');
            try {
                // Get user info from Google using the access token
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();

                // Send to our backend for verification/account creation
                const res = await apiFetch('/api/google-auth', {
                    method: 'POST',
                    body: JSON.stringify({
                        credential: tokenResponse.access_token,
                        email: userInfo.email,
                        name: userInfo.name,
                        picture: userInfo.picture,
                    }),
                });
                const data = await res.json();

                if (res.ok) {
                    setAccessToken(data.access_token);
                    setUser(data.user);
                    localStorage.setItem('isAuthenticated', 'true');
                    setSuccess(true);
                    await new Promise(r => setTimeout(r, 1400));
                    navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard');
                } else {
                    setError(data.detail || 'Google sign-in failed');
                }
            } catch {
                setError('Google sign-in failed. Please try again.');
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setError('Google sign-in was cancelled or failed.');
        },
    });

    return (
        <motion.button
            type="button"
            disabled={loading || googleLoading}
            onClick={() => googleLogin()}
            whileHover={!(loading || googleLoading) ? { scale: 1.015 } : {}}
            whileTap={!(loading || googleLoading) ? { scale: 0.975 } : {}}
            className="w-full font-medium text-[13px] py-3 rounded-xl border flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-white/[0.04]"
            style={{
                backgroundColor: 'transparent',
                borderColor: '#2A2A2A',
                color: '#A3A3A3',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
            {googleLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                </>
            )}
        </motion.button>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Login = ({ defaultRole = 'student' }) => {
    const [role, setRole]               = useState(defaultRole);
    const [email, setEmail]             = useState('');
    const [password, setPassword]       = useState('');
    const [rememberMe, setRememberMe]   = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess]         = useState(false);

    const navigate = useNavigate();

    // Load remembered email on mount
    useEffect(() => {
        const saved = localStorage.getItem('rememberedEmail');
        if (saved) { setEmail(saved); setRememberMe(true); }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldErrors({});

        try {
            const { res, data } = await apiLogin(email, password, role);

            if (res.ok) {
                if (rememberMe) localStorage.setItem('rememberedEmail', email);
                else            localStorage.removeItem('rememberedEmail');

                setSuccess(true);
                await new Promise(r => setTimeout(r, 1400));
                navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/app/dashboard');
            } else {
                const msg = data.error || 'Invalid credentials';
                setError(msg);
                const low = msg.toLowerCase();
                if (low.includes('email'))    setFieldErrors({ email: true });
                if (low.includes('password') || low.includes('credentials'))
                    setFieldErrors({ email: true, password: true });
            }
        } catch {
            setError('Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    // ── Shared input class builder ──────────────────────────────────────────
    const inputCls = (hasError) =>
        `w-full rounded-xl pl-10 pr-4 py-3 text-[13px] outline-none transition-all duration-150 ` +
        (hasError
            ? 'bg-red-500/5 border border-red-500/40 text-[#F5F5F5] placeholder:text-[#3A3A3A] focus:ring-1 focus:ring-red-500/60'
            : 'bg-black/20 border border-white/8 text-[#F5F5F5] placeholder:text-[#3A3A3A] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]');

    return (
        <div
            className="min-h-screen flex overflow-hidden relative"
            style={{ 
                '--bg-body': '#050505', 
                '--text-main': '#F5F5F5',
                backgroundColor: 'var(--bg-body)', 
                color: 'var(--text-main)', 
                fontFamily: 'var(--font-sans)' 
            }}
        >
            {/* ── Full-page background (right panel grid) ─────────────────── */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <AuthBgRight className="absolute inset-0 w-full h-full" />
            </div>

            {/* ══════════════════ LEFT BRAND PANEL ═══════════════════════════ */}
            <div
                className="hidden lg:flex relative w-[48%] flex-shrink-0 flex-col min-h-screen px-16 py-12 overflow-hidden border-r"
                style={{ backgroundColor: '#0D0D0D', borderColor: '#1A1A1A' }}
            >
                {/* Panel background grid */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <AuthBgLeft className="absolute inset-0 w-full h-full" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <LogoSVG className="w-auto h-12" />
                    </Link>

                    {/* Headline + Illustration */}
                    <div className="flex-1 flex flex-col justify-center py-12">
                        <p
                            className="text-[11px] font-semibold uppercase tracking-widest mb-6"
                            style={{ color: 'var(--primary)' }}
                        >
                            Placement Intelligence Platform
                        </p>
                        <h2
                            className="text-[44px] font-bold leading-[1.05] tracking-tighter mb-6"
                            style={{ color: 'var(--text-main)' }}
                        >
                            Your campus.<br />
                            Your placements.<br />
                            <span style={{ color: 'var(--primary)' }}>Centralized.</span>
                        </h2>
                        <p className="text-[15px] leading-relaxed mb-12 max-w-[340px]" style={{ color: '#525252' }}>
                            SAARTHI Nexus is the all-in-one placement platform built for PICT — eligibility filtering, AI guidance, and live analytics.
                        </p>

                        {/* Illustration card - Enlarged and Centered */}
                        <div
                            className="rounded-2xl w-full max-w-[500px] mx-auto p-4 relative mt-4 border"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: '#2A2A2A' }}
                        >
                            <AuthIllustration />
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="flex-shrink-0 flex items-center pt-6 border-t" style={{ borderColor: '#1A1A1A' }}>
                        {[
                            { num: '1000+', label: 'Students Placed/yr' },
                            { num: '150+',  label: 'Companies Visited' },
                            { num: '90%+',  label: 'Placement Rate'    },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className={`flex-1 ${i < 2 ? 'border-r pr-4 mr-4' : ''}`}
                                style={{ borderColor: '#1A1A1A' }}
                            >
                                <div
                                    className="text-[22px] font-bold leading-none mb-1 tracking-tight"
                                    style={{ color: 'var(--primary)' }}
                                >
                                    {s.num}
                                </div>
                                <div className="text-[11px]" style={{ color: '#525252' }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════════ RIGHT FORM PANEL ═══════════════════════════ */}
            <div className="flex-1 relative z-10 flex items-start lg:items-center justify-center px-6 py-12 overflow-y-auto">

                {/* Animated form card */}
                <motion.div
                    className="w-full max-w-[400px]"
                    variants={pageVariant}
                    initial="hidden"
                    animate="visible"
                >
                    <AnimatePresence mode="wait">

                        {/* ── SUCCESS STATE ─────────────────────────────── */}
                        {success ? (
                            <motion.div
                                key="success"
                                variants={successVariant}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex flex-col items-center justify-center py-16 text-center"
                            >
                                <AuthSuccess />
                                <h2 className="text-[22px] font-bold mt-6 mb-2 tracking-tighter" style={{ color: 'var(--text-main)' }}>
                                    You're in!
                                </h2>
                                <p className="text-[14px]" style={{ color: '#525252' }}>
                                    Redirecting to your dashboard…
                                </p>
                                <div className="mt-6 w-32 h-[2px] rounded-full overflow-hidden" style={{ background: '#1A1A1A' }}>
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: 'var(--success)' }}
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1.2, ease: 'linear' }}
                                    />
                                </div>
                            </motion.div>

                        ) : (

                        /* ── FORM STATE ───────────────────────────────── */
                        <motion.div
                            key="form"
                            variants={formVariant}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="w-full"
                        >
                            {/* Mobile logo */}
                            <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity">
                                <div
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-black"
                                    style={{ backgroundColor: 'var(--primary)' }}
                                >
                                    SN
                                </div>
                                <span className="text-[13px] font-semibold tracking-tight" style={{ color: '#A3A3A3' }}>
                                    SAARTHI Nexus
                                </span>
                            </Link>

                            {/* Heading */}
                            <h1
                                className="text-[30px] font-bold tracking-tighter leading-tight mb-1"
                                style={{ color: 'var(--text-main)' }}
                            >
                                Welcome back
                            </h1>
                            <p className="text-[14px] mb-8 leading-relaxed" style={{ color: '#525252' }}>
                                Sign in to access your placement portal.
                            </p>

                            {/* ── Role Switcher (layoutId sliding pill) ── */}
                            <div
                                className="relative flex rounded-xl p-1 mb-7 border"
                                style={{ backgroundColor: '#0D0D0D', borderColor: '#2A2A2A' }}
                            >
                                {(['student', 'admin']).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => { setRole(r); setFieldErrors({}); setError(''); }}
                                        className="relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[13px] font-medium z-10 transition-colors duration-150 border-none cursor-pointer"
                                        style={{
                                            background: 'transparent',
                                            color: role === r ? 'var(--text-main)' : '#525252',
                                        }}
                                    >
                                        {/* Sliding pill background */}
                                        {role === r && (
                                            <motion.div
                                                layoutId="role-pill"
                                                className="absolute inset-0 rounded-lg"
                                                style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {r === 'student' ? <User size={14} /> : <ShieldCheck size={14} />}
                                            <span className="capitalize">{r}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* ── Form ──────────────────────────────────── */}
                            <form onSubmit={handleSubmit}>
                                {/* Error banner */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            key="err"
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 border"
                                            style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.22)' }}
                                        >
                                            <div className="w-[3px] self-stretch rounded-full flex-shrink-0" style={{ background: '#EF4444', minHeight: 16 }} />
                                            <div>
                                                <p className="text-[12px] font-semibold mb-0.5" style={{ color: '#EF4444' }}>Login failed</p>
                                                <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(239,68,68,0.75)' }}>{error}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email */}
                                <div className="mb-4">
                                    <label
                                        className="block text-[10px] font-semibold uppercase tracking-widest mb-2"
                                        style={{ color: '#A3A3A3' }}
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={15}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                                            style={{ color: fieldErrors.email ? '#EF4444' : '#525252' }}
                                        />
                                        <input
                                            type="email"
                                            placeholder="name@college.edu"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({}); setError(''); }}
                                            required
                                            className={inputCls(!!fieldErrors.email)}
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="mb-5">
                                    <label
                                        className="block text-[10px] font-semibold uppercase tracking-widest mb-2"
                                        style={{ color: '#A3A3A3' }}
                                    >
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            size={15}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                                            style={{ color: fieldErrors.password ? '#EF4444' : '#525252' }}
                                        />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({}); setError(''); }}
                                            required
                                            className={inputCls(!!fieldErrors.password) + ' pr-11'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150 bg-transparent border-none cursor-pointer p-0.5"
                                            style={{ color: '#525252' }}
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember me */}
                                <div className="flex items-center justify-between mb-7">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <div className="relative flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div
                                                className="w-9 h-5 rounded-full border transition-all duration-200 peer-checked:border-orange-500/60"
                                                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
                                            />
                                            <div
                                                className="absolute top-[3px] left-[3px] w-[14px] h-[14px] rounded-full shadow-sm transition-all duration-200 peer-checked:translate-x-4"
                                                style={{ backgroundColor: '#525252' }}
                                                // Framer can't easily reach peer-checked here, CSS peer handles it
                                            />
                                        </div>
                                        <span className="text-[12px]" style={{ color: '#525252' }}>Remember me</span>
                                    </label>
                                </div>

                                {/* Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={!loading ? { scale: 1.015 } : {}}
                                    whileTap={!loading ? { scale: 0.975 } : {}}
                                    className="w-full font-semibold text-[14px] py-3 rounded-xl border-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: 'var(--primary)', color: '#000' }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    {loading
                                        ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        : <><span>Sign In</span><ArrowRight size={15} /></>
                                    }
                                </motion.button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px" style={{ backgroundColor: '#1A1A1A' }} />
                                <span className="text-[11px]" style={{ color: '#3A3A3A' }}>or continue with</span>
                                <div className="flex-1 h-px" style={{ backgroundColor: '#1A1A1A' }} />
                            </div>

                            {/* Google Sign-In Button */}
                            <GoogleSignInButton
                                setLoading={setLoading}
                                setError={setError}
                                setSuccess={setSuccess}
                                navigate={navigate}
                                loading={loading}
                            />

                            {/* Footer */}
                            <p className="text-[13px] text-center mt-6" style={{ color: '#525252' }}>
                                {role === 'student' ? (
                                    <>Don't have an account?{' '}
                                        <Link to="/signup" className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--primary)' }}>
                                            Create Account
                                        </Link>
                                    </>
                                ) : (
                                    <>Forgot admin credentials?{' '}
                                        <a href="mailto:support@saarthi.nexus" className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--primary)' }}>
                                            Contact IT Support
                                        </a>
                                    </>
                                )}
                            </p>

                        </motion.div>
                        )}

                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
