import React, { useState } from 'react';
import { Monitor, Smartphone, Cpu, Brain, Zap, ArrowLeft, LayoutDashboard, TrendingUp, Clock, PlusCircle, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

const branches = [
    { id:'ce', name:'Computer Engineering', short:'CE', icon:Monitor, color:'#3b82f6', description:'Software Development, AI, Systems', stats:['75+ Recruiter Records','2024-25 Cycle Live'] },
    { id:'it', name:'Information Technology', short:'IT', icon:LayoutDashboard, color:'#8b5cf6', description:'Web, Cloud, Data Engineering', stats:['60+ Recruiter Records','High PPO Record'] },
    { id:'entc', name:'Electronics & TC', short:'E&TC', icon:Smartphone, color:'#10b981', description:'VLSI, Embedded, Telecom', stats:['40+ Recruiter Records','Core Industry Focus'] },
    { id:'ece', name:'Electronics & Computer', short:'E&CE', icon:Zap, color:'#f59e0b', description:'IoT, Hardware-Software Sync', stats:['New Branch','Hybrid Role Focus'] },
    { id:'aids', name:'AI & Data Science', short:'AI&DS', icon:Brain, color:'#ec4899', description:'ML, Data Visualization, NLP', stats:['Premium Paymasters','Analytics Focus'] },
];

const pg = { initial:{opacity:0,y:12}, animate:{opacity:1,y:0}, transition:{duration:0.3} };

const Internships = () => {
    const [sel, setSel] = useState(null);

    return (
        <motion.div {...pg}>
            {!sel ? (
                <>
                    <div className="mb-8">
                        <span className="font-black uppercase tracking-widest text-[10px] text-[#F97316]">Career Accelerator</span>
                        <h1 className="font-black text-[36px] text-[#0F0F0F] tracking-[-0.03em]">Internship Intelligence</h1>
                        <p className="font-medium text-[14px] text-[#4B4B4B]">Select your branch to view tailored internship records and trends.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map(b => (
                            <button key={b.id} onClick={() => setSel(b)} className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-6 text-left hover:shadow-[3px_3px_0px_#0F0F0F] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100 group">
                                <div className="w-14 h-14 border-[3px] border-[#0F0F0F] flex items-center justify-center mb-4" style={{backgroundColor: b.color + '20', color: b.color}}>
                                    <b.icon size={28} />
                                </div>
                                <h3 className="font-black text-[18px] text-[#0F0F0F] group-hover:text-[#F97316] transition-colors">{b.name}</h3>
                                <p className="font-medium text-[13px] text-[#4B4B4B] mt-1">{b.description}</p>
                                <div className="flex gap-2 mt-4 flex-wrap">
                                    {b.stats.map((s,i) => <span key={i} className="bg-[#FFFBF0] border-[2px] border-[#0F0F0F] font-black text-[9px] uppercase px-2 py-0.5 text-[#0F0F0F]">{s}</span>)}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <button onClick={() => setSel(null)} className="mb-6 bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-5 py-2 text-[13px] flex items-center gap-2 hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">
                        <ArrowLeft size={16}/> Choose another branch
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 border-[3px] border-[#0F0F0F] flex items-center justify-center" style={{backgroundColor: sel.color + '20', color: sel.color}}>
                            <sel.icon size={22}/>
                        </div>
                        <div>
                            <h1 className="font-black text-[28px] text-[#0F0F0F]">{sel.name} Internships</h1>
                            <p className="font-medium text-[13px] text-[#4B4B4B]">Historical records and current cycle data for {sel.short}.</p>
                        </div>
                    </div>

                    <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-12 text-center">
                        <ClipboardList size={64} className="mx-auto text-[#E5E7EB] mb-4"/>
                        <h3 className="font-black text-[18px] text-[#0F0F0F]">Awaiting T&P Data Feed</h3>
                        <p className="font-medium text-[13px] text-[#4B4B4B] max-w-[500px] mx-auto mt-2">We are integrating official Internship data for {sel.short}.</p>
                        <div className="flex gap-3 justify-center mt-6 flex-wrap">
                            <span className="bg-[#FACC15] border-[3px] border-[#0F0F0F] font-black text-[11px] px-4 py-2 flex items-center gap-2"><Clock size={14}/> 2024-25 Records Incoming</span>
                            <span className="bg-[#FFFBF0] border-[3px] border-[#0F0F0F] font-black text-[11px] px-4 py-2 flex items-center gap-2"><TrendingUp size={14}/> Historical Trends Syncing</span>
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <p className="font-mono text-[12px] text-[#888] mb-4">Help build the community while we wait</p>
                        <button className="text-white font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-6 py-3 text-[13px] flex items-center gap-2 mx-auto hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100" style={{backgroundColor: sel.color}}>
                            <PlusCircle size={18}/> Share Your Internship Experience
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default Internships;
