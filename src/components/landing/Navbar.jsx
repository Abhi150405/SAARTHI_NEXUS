import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Navbar = ({ isAuthenticated, user, handleLogout }) => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    
    // Smooth background opacity based on scroll position (0 to 60px)
    const backgroundFallback = useTransform(
        scrollY,
        [0, 60],
        ['rgba(10, 10, 10, 0)', 'rgba(10, 10, 10, 0.9)']
    );

    const borderOpacity = useTransform(
        scrollY,
        [0, 60],
        ['rgba(31, 31, 31, 0)', 'rgba(31, 31, 31, 1)']
    );

    const blurFilter = useTransform(
        scrollY,
        [0, 60],
        ['blur(0px)', 'blur(8px)']
    );

    return (
        <motion.nav 
            style={{ 
                backgroundColor: backgroundFallback,
                borderBottomColor: borderOpacity,
                backdropFilter: blurFilter,
                WebkitBackdropFilter: blurFilter
            }}
            className="fixed top-0 right-0 w-full z-50 flex justify-between items-center px-8 py-4 border-b transition-colors duration-300"
        >
            <div className="flex flex-row items-center cursor-pointer" onClick={() => navigate('/')}>
                <img src="/logo.svg" alt="SAARTHI Nexus Logo" className="h-[28px] md:h-[32px] w-auto" />
            </div>

            <div className="flex flex-row items-center gap-3">
                {isAuthenticated ? (
                    <>
                        <div className="w-[30px] h-[30px] rounded-full bg-[#F97316] text-black flex items-center justify-center font-bold text-[14px]">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline text-[13px] px-4 py-2">
                            <LogOut size={14} /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => navigate('/login')} className="text-[13px] font-medium text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors px-4 py-2">
                            Login
                        </button>
                        <button onClick={() => navigate('/signup')} className="bg-[#F97316] text-black text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-[0_4px_14px_0_rgba(249,115,22,0.25)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 transition-all duration-200">
                            Sign Up
                        </button>
                    </>
                )}
            </div>
        </motion.nav>
    );
};

export default Navbar;
