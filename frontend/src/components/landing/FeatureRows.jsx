import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero3SVG from '../../assets/svgs/Hero3SVG';
import Hero4SVG from '../../assets/svgs/Hero4SVG';
import Hero6SVG from '../../assets/svgs/Hero6SVG';

const FeatureRows = ({ isAuthenticated, user }) => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        if (isAuthenticated) {
            if (user?.role === 'admin' && path.startsWith('/app/')) {
                navigate('/admin/dashboard');
            } else {
                navigate(path);
            }
        } else {
            navigate('/signup');
        }
    };

    const textVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
    };

    const textRightVariants = {
        hidden: { opacity: 0, x: 30 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.15, ease: [0.23, 1, 0.32, 1] } }
    };

    return (
        <section id="features" className="bg-[#FFFBF0] relative">

            {/* Row 1 — Eligibility */}
            <div className="border-b-[3px] border-[#0F0F0F]">
                <div className="max-w-[1200px] mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={textVariants}>
                        <span className="inline-block font-black uppercase tracking-widest text-[11px] border-[2px] border-[#0F0F0F] px-3 py-1 mb-6 w-fit bg-[#FACC15]">CORE FEATURE</span>
                        <h2 className="font-black text-[40px] leading-[1.0] tracking-[-0.03em] text-[#0F0F0F] mb-4">See Only What You Qualify For</h2>
                        <p className="font-medium text-[17px] text-[#4B4B4B] leading-[1.7] mb-6">
                            Our matching engine cross-references your CGPA and branch against every active drive in real time — no manual filtering required.
                        </p>
                        <div onClick={() => handleNavigation('/app/eligibility')} className="inline-flex items-center gap-2 font-black text-[14px] text-[#F97316] uppercase tracking-wide border-b-[2px] border-[#F97316] pb-0.5 hover:gap-4 transition-all duration-100 cursor-pointer">
                            Explore Eligibility <ChevronRight size={14} />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={cardVariants}
                        className="bg-white border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] p-6"
                    >
                        <div className="flex flex-col w-full">
                            <div className="py-4 border-b-[2px] border-[#0F0F0F] flex items-center justify-between">
                                <span className="font-bold text-[#0F0F0F]">Google SDE Intern</span>
                                <span className="bg-[#A3E635] border-[2px] border-[#0F0F0F] font-black text-[11px] uppercase px-3 py-1">Eligible</span>
                            </div>
                            <div className="py-4 border-b-[2px] border-[#0F0F0F] flex items-center justify-between">
                                <span className="font-bold text-[#0F0F0F]">Amazon AWS Cloud</span>
                                <span className="bg-[#A3E635] border-[2px] border-[#0F0F0F] font-black text-[11px] uppercase px-3 py-1">Eligible</span>
                            </div>
                            <div className="py-4 flex items-center justify-between">
                                <span className="font-bold text-[#0F0F0F]">Microsoft Research</span>
                                <span className="bg-[#FCA5A5] border-[2px] border-[#0F0F0F] font-black text-[11px] uppercase px-3 py-1 text-[#0F0F0F]">Ineligible</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center py-4">
                <Hero6SVG className="w-10 h-40 mx-auto block" />
            </div>

            {/* Row 2 — Resume */}
            <div className="border-b-[3px] border-[#0F0F0F]">
                <div className="max-w-[1200px] mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={cardVariants}
                        className="order-2 md:order-1 bg-white border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] p-6 flex justify-center items-center min-h-[320px]"
                    >
                        <Hero3SVG className="w-[240px] h-[280px]" />
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={textRightVariants} className="order-1 md:order-2">
                        <span className="inline-block font-black uppercase tracking-widest text-[11px] border-[2px] border-[#0F0F0F] px-3 py-1 mb-6 w-fit bg-[#A3E635]">AI RESUME TOOL</span>
                        <h2 className="font-black text-[40px] leading-[1.0] tracking-[-0.03em] text-[#0F0F0F] mb-4">Know Your ATS Score Before You Apply</h2>
                        <p className="font-medium text-[17px] text-[#4B4B4B] leading-[1.7] mb-6">
                            Upload your resume and get an instant keyword match score against the exact role requirements posted by recruiting companies.
                        </p>
                        <div onClick={() => handleNavigation('/app/resume')} className="inline-flex items-center gap-2 font-black text-[14px] text-[#F97316] uppercase tracking-wide border-b-[2px] border-[#F97316] pb-0.5 hover:gap-4 transition-all duration-100 cursor-pointer">
                            Try Resume Analyzer <ChevronRight size={14} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center py-4">
                <Hero6SVG className="w-10 h-40 mx-auto block" />
            </div>

            {/* Row 3 — AI Chatbot */}
            <div className="border-b-[3px] border-[#0F0F0F]">
                <div className="max-w-[1200px] mx-auto px-8 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={textVariants}>
                        <span className="inline-block font-black uppercase tracking-widest text-[11px] border-[2px] border-[#0F0F0F] px-3 py-1 mb-6 w-fit bg-[#F97316] text-white">AI ASSISTANT</span>
                        <h2 className="font-black text-[40px] leading-[1.0] tracking-[-0.03em] text-[#0F0F0F] mb-4">Ask Anything, Get Campus-Specific Answers</h2>
                        <p className="font-medium text-[17px] text-[#4B4B4B] leading-[1.7] mb-6">
                            Powered by Gemini with RAG — our chatbot retrieves real placement data from your institution to answer questions that generic AI tools simply cannot.
                        </p>
                        <div onClick={() => handleNavigation('/app/help')} className="inline-flex items-center gap-2 font-black text-[14px] text-[#F97316] uppercase tracking-wide border-b-[2px] border-[#F97316] pb-0.5 hover:gap-4 transition-all duration-100 cursor-pointer">
                            Talk to SAARTHI AI <ChevronRight size={14} />
                        </div>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={cardVariants}
                        className="bg-white border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] p-6 flex justify-center items-center min-h-[320px]"
                    >
                        <Hero4SVG className="w-full max-w-[300px]" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default FeatureRows;
