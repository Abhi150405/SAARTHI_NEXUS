import React from 'react';

const Footer = () => {
    return (
        <footer className="border-t border-[#1F1F1F] py-10 px-6 bg-[#0A0A0A] relative z-20">
            <div className="max-w-[960px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-row items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="/logo.svg" alt="SAARTHI Nexus Logo" className="h-[28px] md:h-[32px] w-auto opacity-75 hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex gap-6 text-[13px] text-[#A3A3A3]">
                    <span className="cursor-pointer hover:text-[#F97316] transition-colors">Documentation</span>
                    <span className="cursor-pointer hover:text-[#F97316] transition-colors">Privacy</span>
                    <span className="cursor-pointer hover:text-[#F97316] transition-colors">Security</span>
                </div>
                <div className="text-[13px] text-[#525252]">
                    © 2025 SAARTHI Nexus. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
