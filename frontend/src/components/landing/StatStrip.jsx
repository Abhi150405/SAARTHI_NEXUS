import React from 'react';
import { motion } from 'framer-motion';

const StatStrip = () => {
    const stats = [
        { value: '95%', label: 'Placement Rate', bg: 'bg-[#0F0F0F]', numColor: 'text-[#FACC15]', labelColor: 'text-[#FFFBF0]/60' },
        { value: '50+', label: 'Recruiting Companies', bg: 'bg-[#F97316]', numColor: 'text-[#0F0F0F]', labelColor: 'text-[#0F0F0F]/70' },
        { value: '24/7', label: 'AI Assistance', bg: 'bg-[#0F0F0F]', numColor: 'text-[#FACC15]', labelColor: 'text-[#FFFBF0]/60' },
    ];

    return (
        <div id="stat-strip" className="w-full bg-[#0F0F0F] border-b-[3px] border-[#0F0F0F]">
            <div className="flex flex-col md:flex-row">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.4, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                        className={`flex-1 text-center py-8 px-6 ${stat.bg} ${i < stats.length - 1 ? 'border-b-[3px] md:border-b-0 md:border-r-[3px] border-[#FFFBF0]/20' : ''}`}
                    >
                        <div className={`font-black text-[48px] ${stat.numColor} leading-none mb-2 font-mono`}>{stat.value}</div>
                        <div className={`font-black uppercase tracking-widest text-[12px] ${stat.labelColor}`}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default StatStrip;
