import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Hero3SVG, Hero4SVG, Hero6SVG } from './SVGs';

const FeatureRows = ({ isAuthenticated }) => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            navigate('/signup');
        }
    };

    const textVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } }
    };

    const textRightVariants = {
        hidden: { opacity: 0, x: 30 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2, ease: "easeOut" } }
    };

    return (
        <section id="features" className="relative">
            {/* Background glow for the section */}
            <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-[#F97316]/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-3/4 right-0 w-[400px] h-[400px] bg-[#F97316]/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

            {/* Row 1 */}
            <div className="max-w-[960px] mx-auto px-6 py-[90px] grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={textVariants}
                >
                    <span className="text-[11px] font-[500] text-[#F97316] uppercase tracking-[0.1em] mb-3 block">CORE FEATURE</span>
                    <h2 className="text-[32px] font-bold text-[#F5F5F5] leading-[1.2] tracking-[-0.02em] mb-4">See Only What You Qualify For</h2>
                    <p className="text-[15px] text-[#A3A3A3] leading-[1.7] mb-5">
                        Our matching engine cross-references your CGPA and branch against every active drive in real time — no manual filtering required.
                    </p>
                    <div onClick={() => handleNavigation('/eligibility')} className="inline-flex items-center gap-1 text-[14px] text-[#F97316] cursor-pointer hover:opacity-75 transition-opacity duration-150">
                        Explore Eligibility <ChevronRight size={14} />
                    </div>
                </motion.div>
                
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={cardVariants}
                    className="card min-h-[260px] flex flex-col justify-center border border-[#2A2A2A] rounded-xl p-6 relative overflow-hidden group"
                >
                    <div className="scan-line"></div>
                    <div className="flex flex-col relative z-10 w-full gap-2">
                        <div className="py-3 border-b border-[#1F1F1F] flex items-center justify-between">
                            <span className="text-[14px] font-medium text-[#F5F5F5]">Google SDE Intern</span>
                            <span className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Eligible</span>
                        </div>
                        <div className="py-3 border-b border-[#1F1F1F] flex items-center justify-between">
                            <span className="text-[14px] font-medium text-[#F5F5F5]">Amazon AWS Cloud</span>
                            <span className="bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Eligible</span>
                        </div>
                        <div className="py-3 flex items-center justify-between">
                            <span className="text-[14px] font-medium text-[#F5F5F5]">Microsoft Research</span>
                            <span className="bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">Ineligible</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="flex justify-center items-center py-0">
                <Hero6SVG className="w-10 h-40 mx-auto block" />
            </div>

            {/* Row 2 */}
            <div className="max-w-[960px] mx-auto px-6 py-[90px] grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={cardVariants}
                    className="order-2 md:order-1 card border border-[#2A2A2A] rounded-xl p-6 min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden group"
                >
                    <Hero3SVG className="w-[220px] h-[260px] mx-auto z-10" />
                </motion.div>
                
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={textRightVariants}
                    className="order-1 md:order-2"
                >
                    <span className="text-[11px] font-[500] text-[#F97316] uppercase tracking-[0.1em] mb-3 block">AI RESUME TOOL</span>
                    <h2 className="text-[32px] font-bold text-[#F5F5F5] leading-[1.2] tracking-[-0.02em] mb-4">Know Your ATS Score Before You Apply</h2>
                    <p className="text-[15px] text-[#A3A3A3] leading-[1.7] mb-5">
                        Upload your resume and get an instant keyword match score against the exact role requirements posted by recruiting companies.
                    </p>
                    <div onClick={() => handleNavigation('/resume')} className="inline-flex items-center gap-1 text-[14px] text-[#F97316] cursor-pointer hover:opacity-75 transition-opacity duration-150">
                        Try Resume Analyzer <ChevronRight size={14} />
                    </div>
                </motion.div>
            </div>

            <div className="flex justify-center items-center py-0">
                <Hero6SVG className="w-10 h-40 mx-auto block" />
            </div>

            {/* Row 3 */}
            <div className="max-w-[960px] mx-auto px-6 py-[90px] grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={textVariants}
                >
                    <span className="text-[11px] font-[500] text-[#F97316] uppercase tracking-[0.1em] mb-3 block">AI ASSISTANT</span>
                    <h2 className="text-[32px] font-bold text-[#F5F5F5] leading-[1.2] tracking-[-0.02em] mb-4">Ask Anything, Get Campus-Specific Answers</h2>
                    <p className="text-[15px] text-[#A3A3A3] leading-[1.7] mb-5">
                        Powered by Gemini with RAG — our chatbot retrieves real placement data from your institution to answer questions that generic AI tools simply cannot.
                    </p>
                    <div onClick={() => handleNavigation('/help')} className="inline-flex items-center gap-1 text-[14px] text-[#F97316] cursor-pointer hover:opacity-75 transition-opacity duration-150">
                        Talk to SAARTHI AI <ChevronRight size={14} />
                    </div>
                </motion.div>
                
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={cardVariants}
                    className="card border border-[#2A2A2A] rounded-xl p-5 min-h-[320px] flex flex-col justify-center items-center relative overflow-hidden group"
                >
                    <Hero4SVG />
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureRows;
