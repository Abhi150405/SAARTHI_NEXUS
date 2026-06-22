import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Shield, ChevronDown, Search, Bell } from 'lucide-react';

const Topbar = ({ pageTitle }) => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        navigate('/');
    };

    return (
        <div className="hidden lg:flex w-full bg-[#FFFBF0] border-b-[3px] border-[#0F0F0F] px-8 py-4 items-center justify-between">
            {/* Left: Page title */}
            <div>
                <div className="font-black uppercase tracking-widest text-[10px] text-[#888888] mb-0.5">SAARTHI NEXUS</div>
                <h1 className="font-black text-[24px] text-[#0F0F0F] tracking-[-0.03em] leading-tight">{pageTitle || 'Dashboard'}</h1>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative max-w-[240px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-white border-[3px] border-[#0F0F0F] pl-9 pr-4 py-2 font-mono text-[13px] text-[#0F0F0F] w-[200px] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100 placeholder:text-[#888888]"
                    />
                </div>

                {/* Notification bell */}
                <Link
                    to="/app/notifications"
                    className="w-10 h-10 bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-center relative hover:bg-[#FEF08A] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                >
                    <Bell size={16} />
                    <div className="w-2 h-2 bg-[#F97316] absolute top-1 right-1 border border-[#0F0F0F]" />
                </Link>

                {/* User chip */}
                {isAuthenticated && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="bg-[#FACC15] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] px-3 py-1 font-black text-[12px] flex items-center gap-2 hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100"
                        >
                            <div className="w-6 h-6 bg-[#F97316] border-[1.5px] border-[#0F0F0F] flex items-center justify-center font-black text-[11px] text-white overflow-hidden">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt="" className="object-cover w-full h-full" />
                                ) : (
                                    user.fullName?.[0] || 'U'
                                )}
                            </div>
                            <span className="hidden xl:inline">{user.fullName || 'User'}</span>
                            <ChevronDown size={14} className={`transition-transform duration-100 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 bg-[#FFFBF0] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] w-[220px] z-50">
                                <div className="px-4 py-3 border-b-[2px] border-[#0F0F0F]">
                                    <p className="font-mono text-[10px] text-[#888888] uppercase tracking-widest">Signed in as</p>
                                    <p className="font-bold text-[13px] text-[#0F0F0F] truncate mt-0.5">{user.email}</p>
                                </div>
                                <Link
                                    to="/app/profile"
                                    className="flex items-center gap-3 px-4 py-3 font-bold text-[13px] text-[#0F0F0F] hover:bg-[#FACC15] transition-colors duration-75 border-b-[2px] border-[#0F0F0F]"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    <User size={14} />
                                    My Profile
                                </Link>
                                {user.role === 'admin' && (
                                    <Link
                                        to="/admin/dashboard"
                                        className="flex items-center gap-3 px-4 py-3 font-bold text-[13px] text-[#0F0F0F] hover:bg-[#FACC15] transition-colors duration-75 border-b-[2px] border-[#0F0F0F]"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <Shield size={14} />
                                        Admin Panel
                                    </Link>
                                )}
                                <button
                                    className="flex items-center gap-3 px-4 py-3 font-bold text-[13px] text-[#EF4444] hover:bg-[#FCA5A5] transition-colors duration-75 w-full text-left"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={14} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Topbar;
