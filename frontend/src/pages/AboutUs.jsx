import React from 'react';
import { GraduationCap, Github, Linkedin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import AbhijitPhoto from '../assets/Abhijit_Khole.jpeg';
import AryaPhoto from '../assets/Arya_Kadi.jpeg';
import PratikPhoto from '../assets/Pratik_Kochare.jpg';

const pg = { initial:{opacity:0,y:12}, animate:{opacity:1,y:0}, transition:{duration:0.3} };

const AboutUs = () => {
    const team = [
        { name:'Abhijit Khole', dept:'E&CE Department', college:'PICT, Pune', batch:'Class of 2027', photo:AbhijitPhoto, github:'https://github.com/Abhi150405', email:'abhijitkhole15@gmail.com' },
        { name:'Pratik Kochare', dept:'E&CE Department', college:'PICT, Pune', batch:'Class of 2027', photo:PratikPhoto, github:'https://github.com/thepratikpk', email:'pratikkocharetnp@gmail.com' },
        { name:'Arya Kadi', dept:'E&CE Department', college:'PICT, Pune', batch:'Class of 2027', photo:AryaPhoto, github:'https://github.com/aryakadi', email:'pictarya11@gmail.com' },
    ];

    return (
        <motion.div {...pg}>
            <div className="mb-8">
                <span className="font-black uppercase tracking-widest text-[10px] text-[#F97316]">The Team</span>
                <h1 className="font-black text-[36px] text-[#0F0F0F] tracking-[-0.03em]">About SAARTHI Nexus</h1>
                <p className="font-medium text-[14px] text-[#4B4B4B]">The minds behind the platform</p>
            </div>

            <div className="bg-[#FACC15] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-6 mb-8">
                <div className="flex items-center gap-2 mb-2"><GraduationCap size={20} className="text-[#0F0F0F]"/><h3 className="font-black text-[18px] text-[#0F0F0F]">SAARTHI Nexus</h3></div>
                <p className="font-medium text-[14px] text-[#4B4B4B] leading-relaxed">
                    Developed by students of <strong>Pune Institute of Computer Technology (PICT)</strong>.
                    Our mission is to bridge the gap between academic learning and industry standards using AI-driven intelligence.
                </p>
            </div>

            <h3 className="font-black text-[11px] uppercase tracking-widest text-[#888] border-b-[3px] border-[#0F0F0F] pb-3 mb-6">Meet the Developers</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {team.map((m, i) => (
                    <div key={i} className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F]">
                        <div className="aspect-square overflow-hidden border-b-[3px] border-[#0F0F0F]">
                            <img src={m.photo} alt={m.name} className="w-full h-full object-cover"/>
                        </div>
                        <div className="p-5">
                            <h3 className="font-black text-[18px] text-[#0F0F0F]">{m.name}</h3>
                            <div className="space-y-0.5 mt-2">
                                <p className="font-medium text-[13px] text-[#4B4B4B]">{m.dept}</p>
                                <p className="font-mono text-[11px] text-[#888]">{m.batch}</p>
                                <p className="font-mono text-[11px] text-[#888]">{m.college}</p>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <a href={m.github} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-[#0F0F0F] text-[#FACC15] border-[2px] border-[#0F0F0F] flex items-center justify-center hover:bg-[#F97316] hover:text-white transition-colors"><Github size={16}/></a>
                                <button className="w-9 h-9 bg-[#0F0F0F] text-[#FACC15] border-[2px] border-[#0F0F0F] flex items-center justify-center hover:bg-[#F97316] hover:text-white transition-colors"><Linkedin size={16}/></button>
                                <a href={`mailto:${m.email}`} className="w-9 h-9 bg-[#0F0F0F] text-[#FACC15] border-[2px] border-[#0F0F0F] flex items-center justify-center hover:bg-[#F97316] hover:text-white transition-colors"><Mail size={16}/></a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default AboutUs;
