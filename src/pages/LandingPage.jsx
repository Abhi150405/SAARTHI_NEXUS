import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, CheckCircle, BrainCircuit } from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <header className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="gradient-text">SAARTHI Nexus</span>
                    </h1>
                    <h2 className="hero-subtitle">
                        AI-Powered Training and Placement Intelligence Platform
                    </h2>
                    <p className="hero-description">
                        Empowering students with AI-driven insights to bridge the gap between academic preparation and industry demands.
                        Prepare early, analyze skills, and secure your dream career.
                    </p>

                    <div className="hero-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                            <AreaChart size={20} />
                            View Analytics
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/eligibility')}>
                            <CheckCircle size={20} />
                            Check Eligibility
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/skills')}>
                            <BrainCircuit size={20} />
                            Analyze Skills
                        </button>
                    </div>
                </div>

                <div className="hero-stats">
                    <div className="stat-card glass">
                        <h3>95%</h3>
                        <p>Placement Rate</p>
                    </div>
                    <div className="stat-card glass">
                        <h3>50+</h3>
                        <p>Top Recruiters</p>
                    </div>
                    <div className="stat-card glass">
                        <h3>24/7</h3>
                        <p>AI Support</p>
                    </div>
                </div>
            </header>

            <section className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon bg-blue">
                        <AreaChart size={24} />
                    </div>
                    <h3>Real-time Analytics</h3>
                    <p>Track year-wise trends and company hiring statistics.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon bg-indigo">
                        <BrainCircuit size={24} />
                    </div>
                    <h3>Skill Gap Analysis</h3>
                    <p>Identify missing skills and get AI-driven recommendations.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon bg-purple">
                        <CheckCircle size={24} />
                    </div>
                    <h3>Eligibility Checker</h3>
                    <p>Instantly check your eligibility for top tier companies.</p>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
