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
        <section className="bg-[#F97316] border-t-[3px] border-[#0F0F0F] py-28 px-6">
            <div className="max-w-[900px] mx-auto text-center relative">
                {/* Giant decorative symbol */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-[200px] text-[#0F0F0F] opacity-[0.04] leading-none select-none pointer-events-none">
                    ∞
                </div>

                {/* Content box */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="relative z-10 bg-[#FACC15] border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] px-8 md:px-12 py-16"
                >
                    {/* Stamp */}
                    <div className="bg-[#0F0F0F] text-[#FACC15] font-black uppercase tracking-widest text-[11px] px-3 py-1 border-[2px] border-[#0F0F0F] mb-8 inline-block -rotate-1">
                        Stop Guessing. Start Placing.
                    </div>

                    <h2 className="font-black text-[40px] md:text-[52px] text-[#0F0F0F] leading-[1.0] tracking-[-0.03em] mb-4">
                        Spreadsheets are dead.<br />
                        <span className="text-[#F97316]">SAARTHI runs it.</span>
                    </h2>

                    <p className="font-medium text-[17px] text-[#0F0F0F]/70 mb-10">
                        Join your institution's centralized placement intelligence platform.
                    </p>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <button
                            onClick={handleGetStarted}
                            className="bg-[#F97316] text-white font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 px-6 py-3 text-[15px] inline-flex items-center gap-2"
                        >
                            Get Started <ArrowRight size={15} />
                        </button>
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:bg-[#FEF08A] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 px-6 py-3 text-[15px]"
                        >
                            See Features
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
