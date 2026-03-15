import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CTASection = ({ isAuthenticated }) => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/app/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <section className="bg-[#0A0A0A] py-32 px-6 relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F97316]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-[600px] mx-auto text-center relative z-10">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-[36px] md:text-[42px] font-bold text-[#F5F5F5] leading-[1.15] tracking-[-0.02em] mb-4"
                >
                    Spreadsheets managed placements.<br/>
                    <span className="text-[#F97316]">SAARTHI Nexus runs them.</span>
                </motion.h2>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-[15px] text-[#A3A3A3] mb-10"
                >
                    Join your institution's centralized placement intelligence platform.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-wrap justify-center gap-4"
                >
                    <button onClick={handleGetStarted} className="btn btn-primary text-[14px]">
                        Get Started <ArrowRight size={15} />
                    </button>
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-outline text-[14px]">
                        Explore Features
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
