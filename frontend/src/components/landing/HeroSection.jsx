import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, CheckCircle, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero1SVG from '../../assets/svgs/Hero1SVG';
import Hero2SVG from '../../assets/svgs/Hero2SVG';
import Hero5SVG from '../../assets/svgs/Hero5SVG';

const HeroSection = ({ isAuthenticated, user }) => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        if (isAuthenticated) {
            if (user?.role === 'admin' && path === '/app/dashboard') {
                navigate('/admin/dashboard');
            } else {
                navigate(path);
            }
        } else {
            navigate('/signup');
        }
    };

    const handleViewAnalytics = () => {
        if (user?.role === 'admin') {
            navigate('/admin/dashboard');
        } else {
            navigate('/app/dashboard');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
    };

    return (
        <div className="w-full min-h-screen pt-16 relative overflow-hidden">
            <Hero1SVG className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
                {/* LEFT COLUMN — Yellow text side */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-[#FACC15] border-r-0 lg:border-r-[3px] border-b-[3px] lg:border-b-0 border-[#0F0F0F] px-8 lg:px-12 py-16 lg:py-20 flex flex-col justify-center"
                >
                    {/* Stamp tag */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <span className="inline-block bg-[#F97316] text-white font-black uppercase tracking-widest text-[11px] px-3 py-1 border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] w-fit">
                            ✦ AI-Powered Placement
                        </span>
                    </motion.div>

                    {/* H1 */}
                    <motion.h1 variants={itemVariants} className="font-black text-[48px] lg:text-[72px] leading-[0.95] tracking-[-0.04em] text-[#0F0F0F] mb-6">
                        Placement{'\n'}Intelligence{'\n'}for Your{' '}
                        <span className="text-[#F97316]">Campus.</span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p variants={itemVariants} className="font-medium text-[18px] text-[#1a1a1a] leading-relaxed mb-10 max-w-[440px]">
                        SAARTHI Nexus centralizes every part of college placements — from eligibility filtering to AI-guided interview prep.
                    </motion.p>

                    {/* Terminal-style login prompt */}
                    <motion.div
                        variants={itemVariants}
                        onClick={() => navigate('/login')}
                        className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-5 py-3 mb-10 font-mono text-[13px] text-[#0F0F0F] flex items-center gap-3 cursor-pointer hover:bg-[#FEF08A] transition-colors duration-100 w-fit"
                    >
                        <span className="w-2 h-5 bg-[#F97316] animate-pulse inline-block"></span>
                        <span>$ login --college-credentials</span>
                    </motion.div>

                    {/* CTA row */}
                    <motion.div variants={itemVariants} className="flex gap-4 flex-wrap">
                        <button
                            onClick={handleViewAnalytics}
                            className="bg-[#F97316] text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 px-6 py-3 text-[15px] inline-flex items-center gap-2"
                        >
                            View Analytics <BarChart2 size={15} />
                        </button>
                        <button
                            onClick={() => handleNavigation('/app/eligibility')}
                            className="bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FEF08A] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 px-6 py-3 text-[15px] inline-flex items-center gap-2"
                        >
                            Check Eligibility <CheckCircle size={15} />
                        </button>
                        <button
                            onClick={() => handleNavigation('/app/skills')}
                            className="bg-[#FACC15] text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 px-6 py-3 text-[15px] inline-flex items-center gap-2"
                        >
                            Analyze Skills <BrainCircuit size={15} />
                        </button>
                    </motion.div>

                    {/* Trust strip */}
                    <motion.div variants={itemVariants} className="mt-8 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#0F0F0F]"></div>
                            <span className="font-mono text-[12px] text-[#0F0F0F]">Live placement data</span>
                        </div>
                        <div className="w-[2px] h-5 bg-[#0F0F0F] opacity-20"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#0F0F0F]"></div>
                            <span className="font-mono text-[12px] text-[#0F0F0F]">Gemini AI powered</span>
                        </div>
                        <div className="w-[2px] h-5 bg-[#0F0F0F] opacity-20"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#0F0F0F]"></div>
                            <span className="font-mono text-[12px] text-[#0F0F0F]">PICT verified data</span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* RIGHT COLUMN — Visual side */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="bg-[#FFFBF0] px-8 py-16 flex items-center justify-center relative"
                >
                    {/* Decorative label */}
                    <div className="absolute top-8 right-8 font-black text-[11px] uppercase tracking-widest bg-[#A3E635] border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] px-3 py-1 rotate-3">
                        NODE GRAPH
                    </div>

                    {/* Hero2SVG */}
                    <Hero2SVG className="w-full max-w-[480px] h-auto" />

                    {/* Floating data chips */}
                    <div className="absolute bottom-12 left-8 bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-4 py-2 font-mono font-bold text-[13px]">
                        ↑ 95% Placed This Year
                    </div>
                    <div className="absolute top-20 left-6 bg-[#F97316] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-4 py-2 font-mono font-bold text-[13px] text-white">
                        ⚡ 3 Drives Live Now
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer z-20"
                onClick={() => document.getElementById('stat-strip')?.scrollIntoView({ behavior: 'smooth' })}
            >
                <Hero5SVG className="w-8 h-14" />
            </motion.div>
        </div>
    );
};

export default HeroSection;
