import React from 'react';
import { motion } from 'framer-motion';

const StatStrip = () => {
    return (
        <div id="stat-strip" className="w-full bg-[#111111] border-t border-b border-[#1F1F1F] py-5">
            <div className="max-w-[960px] mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-0">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: 0 }}
                    className="px-12 text-center"
                >
                    <div className="text-[32px] font-bold text-[#F97316] leading-none mb-1">95%</div>
                    <div className="text-[13px] text-[#A3A3A3]">Placement Rate</div>
                </motion.div>
                
                <div className="w-px h-10 bg-[#2A2A2A] hidden md:block"></div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="px-12 text-center"
                >
                    <div className="text-[32px] font-bold text-[#F97316] leading-none mb-1">50+</div>
                    <div className="text-[13px] text-[#A3A3A3]">Recruiting Companies</div>
                </motion.div>

                <div className="w-px h-10 bg-[#2A2A2A] hidden md:block"></div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="px-12 text-center"
                >
                    <div className="text-[32px] font-bold text-[#F97316] leading-none mb-1">24/7</div>
                    <div className="text-[13px] text-[#A3A3A3]">AI Assistance</div>
                </motion.div>
            </div>
        </div>
    );
};

export default StatStrip;
