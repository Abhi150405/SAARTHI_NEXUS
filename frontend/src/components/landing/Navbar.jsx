import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const Navbar = ({ isAuthenticated, user, handleLogout }) => {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBF0] border-b-[3px] border-[#0F0F0F]">
            <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo stamp */}
                <div
                    className="border-[2px] border-[#0F0F0F] px-3 py-1 bg-[#FACC15] shadow-[3px_3px_0px_#0F0F0F] cursor-pointer select-none"
                    onClick={() => navigate('/')}
                >
                    <span className="font-black text-[22px] text-[#F97316] tracking-tight">SAARTHI</span>
                    <span className="font-black text-[22px] text-[#0F0F0F] tracking-tight ml-1">NEXUS</span>
                </div>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-8">
                    <span
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="font-black text-[14px] text-[#0F0F0F] uppercase tracking-wide hover:text-[#F97316] transition-colors duration-100 cursor-pointer"
                    >
                        Features
                    </span>
                    <span
                        onClick={() => document.getElementById('stat-strip')?.scrollIntoView({ behavior: 'smooth' })}
                        className="font-black text-[14px] text-[#0F0F0F] uppercase tracking-wide hover:text-[#F97316] transition-colors duration-100 cursor-pointer"
                    >
                        Stats
                    </span>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <div className="w-[32px] h-[32px] bg-[#F97316] border-[2px] border-[#0F0F0F] flex items-center justify-center font-black text-[14px] text-white">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 px-4 py-1.5 text-sm inline-flex items-center gap-1.5"
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-[#F97316] text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 px-5 py-1.5 text-sm"
                            >
                                Login →
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="bg-[#FACC15] text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 px-5 py-1.5 text-sm hidden sm:block"
                            >
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
