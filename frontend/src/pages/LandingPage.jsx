import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import StatStrip from '../components/landing/StatStrip';
import FeatureRows from '../components/landing/FeatureRows';
import FeatureGrid from '../components/landing/FeatureGrid';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
    // Auth State
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        window.location.reload(); // Force simple reload to reset state
    };

    return (
        <div className="min-h-screen bg-[#FFFBF0] text-[#0F0F0F] font-sans overflow-x-hidden">
            <Navbar isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />
            <HeroSection isAuthenticated={isAuthenticated} user={user} />
            <StatStrip />
            <FeatureRows isAuthenticated={isAuthenticated} user={user} />
            <FeatureGrid isAuthenticated={isAuthenticated} user={user} />
            <CTASection isAuthenticated={isAuthenticated} />
            <Footer />
        </div>
    );
};

export default LandingPage;
