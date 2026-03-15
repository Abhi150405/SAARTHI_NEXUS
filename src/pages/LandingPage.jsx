import React from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import StatStrip from '../components/landing/StatStrip';
import FeatureRows from '../components/landing/FeatureRows';
import FeatureGrid from '../components/landing/FeatureGrid';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import '../styles/LandingPage.css';

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
        <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] overflow-x-hidden">
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
