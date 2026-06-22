import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-[#0F0F0F] border-t-[3px] border-[#0F0F0F] py-12 px-8">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
                {/* Logo block */}
                <div>
                    <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <span className="font-black text-[24px] text-[#F97316]">SAARTHI</span>
                        <span className="font-black text-[24px] text-[#FACC15] ml-1">NEXUS</span>
                    </div>
                    <p className="font-mono text-[12px] text-white/40 mt-1">Placement Intelligence Platform</p>
                </div>

                {/* Nav links */}
                <div className="flex flex-col gap-3">
                    <span className="font-bold text-[14px] text-white/60 hover:text-white transition-colors duration-100 cursor-pointer">Documentation</span>
                    <span className="font-bold text-[14px] text-white/60 hover:text-white transition-colors duration-100 cursor-pointer">Privacy</span>
                    <span className="font-bold text-[14px] text-white/60 hover:text-white transition-colors duration-100 cursor-pointer">Security</span>
                </div>

                {/* Made-with */}
                <div className="text-right">
                    <p className="font-mono text-[11px] text-white/30">Built for PICT · Gemini AI</p>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="max-w-[1200px] mx-auto mt-10 pt-6 border-t-[2px] border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <span className="font-mono text-[11px] text-white/30">© 2025 SAARTHI Nexus. All rights reserved.</span>
                <span className="font-mono text-[11px] text-white/30">v2.0 — Neubrutalism Edition</span>
            </div>
        </footer>
    );
};

export default Footer;
