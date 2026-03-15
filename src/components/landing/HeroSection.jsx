import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, CheckCircle, BrainCircuit, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Hero1SVG, Hero2SVG, Hero5SVG } from './SVGs';

const HeroSection = ({ isAuthenticated, user }) => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        if (isAuthenticated) {
            // If user is admin and trying to go to general dashboard, send to admin dashboard
            if (user?.role === 'admin' && path === '/app/dashboard') {
                navigate('/admin/dashboard');
            } else {
                navigate(path);
            }
        } else {
            navigate('/signup');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-12">
            <Hero1SVG className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />
            
            <div className="max-w-[1100px] mx-auto px-8 w-full z-10 relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                
                {/* LEFT COLUMN — Text content */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-[560px] mx-auto lg:mx-0"
                >
                    {/* Announcement pill */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <div 
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#111111]/80 backdrop-blur-sm border border-[#2A2A2A] cursor-pointer hover:border-[#F97316]/50 transition-colors duration-200 group"
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <span className="bg-[#F97316] text-black text-[11px] font-bold px-2 py-0.5 rounded tracking-tight">NEW</span>
                            <span className="text-[13px] text-[#A3A3A3]">AI-Powered Placement Intelligence — Now Live</span>
                            <ChevronRight size={14} className="text-[#A3A3A3] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={itemVariants} className="text-[48px] lg:text-[58px] font-bold leading-[1.06] tracking-[-0.03em] text-[#F5F5F5] mb-5">
                        Placement<br />Intelligence,<br />
                        <span className="text-[#F97316]">Built for Your<br />Campus.</span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p variants={itemVariants} className="text-[16px] text-[#A3A3A3] leading-relaxed max-w-[460px] mb-8">
                        SAARTHI Nexus centralizes every part of college placements — from eligibility filtering to AI-guided interview prep.
                    </motion.p>

                    {/* Terminal pill */}
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-[#111111]/80 backdrop-blur-sm border border-[#2A2A2A] font-mono text-[13px] mb-8">
                        <span className="terminal-cursor w-2 h-4 bg-[#F97316] animate-pulse rounded-sm inline-block"></span>
                        <span className="text-[#F97316]">→</span>
                        <span className="text-[#A3A3A3]">Login with your college credentials</span>
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center lg:justify-start">
                        <button onClick={() => handleNavigation('/app/dashboard')} className="btn btn-primary">
                            View Analytics <BarChart2 size={15} />
                        </button>
                        <button onClick={() => handleNavigation('/app/eligibility')} className="btn btn-outline">
                            Check Eligibility <CheckCircle size={15} />
                        </button>
                        <button onClick={() => handleNavigation('/app/skills')} className="btn btn-outline">
                            Analyze Skills <BrainCircuit size={15} />
                        </button>
                    </motion.div>

                    {/* Trust micro-strip below buttons */}
                    <motion.div variants={itemVariants} className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
                            <span className="text-[12px] text-[#525252]">Live placement data</span>
                        </div>
                        <div className="w-px h-4 bg-[#2A2A2A]"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#F97316]"></div>
                            <span className="text-[12px] text-[#525252]">Gemini AI powered</span>
                        </div>
                        <div className="w-px h-4 bg-[#2A2A2A]"></div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                            <span className="text-[12px] text-[#525252]">PICT verified data</span>
                        </div>
                    </motion.div>

                </motion.div>

                {/* RIGHT COLUMN — Node Network SVG */}
                <motion.div 
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                    className="relative flex items-center justify-center"
                >
                    {/* Glow behind the SVG */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[600px] h-[600px] rounded-full bg-[#F97316] opacity-[0.08] blur-[120px]"></div>
                    </div>

                    {/* The node network SVG */}
                    <Hero2SVG className="w-full max-w-[750px] lg:scale-[1.2] xl:scale-[1.35] h-auto relative z-10 drop-shadow-none" />
                </motion.div>

            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer z-20"
                onClick={() => document.getElementById('stat-strip')?.scrollIntoView({ behavior: 'smooth' })}
            >
                <Hero5SVG className="w-8 h-14" />
            </motion.div>
        </div>
    );
};

export default HeroSection;
