import React, { useState } from 'react';
import { 
    Monitor, 
    Smartphone, 
    Cpu, 
    Brain, 
    Zap, 
    ArrowLeft, 
    LayoutDashboard,
    TrendingUp,
    Users,
    Clock,
    PlusCircle,
    ClipboardList
} from 'lucide-react';
import '../styles/Internships.css';

const branches = [
    { 
        id: 'ce', 
        name: 'Computer Engineering', 
        short: 'CE', 
        icon: Monitor, 
        color: '#3b82f6',
        description: 'Software Development, AI, Systems',
        stats: ['75+ Recruiter Records', '2024-25 Cycle Live']
    },
    { 
        id: 'it', 
        name: 'Information Technology', 
        short: 'IT', 
        icon: LayoutDashboard, 
        color: '#8b5cf6',
        description: 'Web, Cloud, Data Engineering',
        stats: ['60+ Recruiter Records', 'High PPO Record']
    },
    { 
        id: 'entc', 
        name: 'Electronics & TC', 
        short: 'E&TC', 
        icon: Smartphone, 
        color: '#10b981',
        description: 'VLSI, Embedded, Telecom',
        stats: ['40+ Recruiter Records', 'Core Industry Focus']
    },
    { 
        id: 'ece', 
        name: 'Electronics & Computer', 
        short: 'E&CE', 
        icon: Zap, 
        color: '#f59e0b',
        description: 'IoT, Hardware-Software Sync',
        stats: ['New Branch', 'Hybrid Role Focus']
    },
    { 
        id: 'aids', 
        name: 'AI & Data Science', 
        short: 'AI&DS', 
        icon: Brain, 
        color: '#ec4899',
        description: 'ML, Data Visualization, NLP',
        stats: ['Premium Paymasters', 'Analytics Focus']
    }
];

const Internships = () => {
    const [selectedBranch, setSelectedBranch] = useState(null);

    const handleSelectBranch = (branch) => {
        setSelectedBranch(branch);
    };

    const handleBack = () => {
        setSelectedBranch(null);
    };

    return (
        <div className="internships-page">
            {!selectedBranch ? (
                /* === BRANCH SELECTION SCREEN === */
                <div className="selection-view animate-fade-in">
                    <div className="page-header">
                        <span className="cr-overline" style={{ color: '#818cf8', letterSpacing: '2px', fontWeight: '600' }}>
                            CAREER ACCELERATOR
                        </span>
                        <h1 className="page-title">Internship Intelligence</h1>
                        <p className="page-subtitle">Select your branch to view tailored internship records and trends.</p>
                    </div>

                    <div className="branch-grid">
                        {branches.map((branch) => (
                            <div 
                                key={branch.id} 
                                className="branch-card" 
                                onClick={() => handleSelectBranch(branch)}
                                style={{ '--hover-color': branch.color }}
                            >
                                <div className="branch-icon-wrapper" style={{ background: `${branch.color}15`, color: branch.color }}>
                                    <branch.icon size={32} />
                                </div>
                                <h3 className="branch-name" style={{ color: '#fff' }}>{branch.name}</h3>
                                <p className="branch-description">{branch.description}</p>
                                
                                <div className="branch-stats">
                                    {branch.stats.map((stat, i) => (
                                        <span key={i} className="stat-tag">{stat}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* === BRANCH DATA SCREEN (PRE-DATA PLACEHOLDER) === */
                <div className="data-view">
                    <button className="back-btn" onClick={handleBack}>
                        <ArrowLeft size={18} />
                        Choose another branch
                    </button>

                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div className="branch-icon-mini" style={{ color: selectedBranch.color }}>
                                    <selectedBranch.icon size={24} />
                                </div>
                                <h1 className="page-title" style={{ fontSize: '2rem', margin: 0 }}>
                                    {selectedBranch.name} Internships
                                </h1>
                            </div>
                            <p className="page-subtitle">Historical records and current cycle data for {selectedBranch.short}.</p>
                        </div>
                    </div>

                    {/* Placeholder for Data Grid / Charts */}
                    <div className="placeholder-container">
                        <div className="placeholder-icon">
                            <ClipboardList size={64} style={{ opacity: 0.2 }} />
                        </div>
                        <div className="placeholder-text">
                            <h3>Awaiting T&P Data Feed</h3>
                            <p style={{ maxWidth: '600px', margin: '0.5rem auto 2rem' }}>
                                We are currently integrating the official Internship data (Stipends, PPO conversion rates, and company lists) for the {selectedBranch.short} branch.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <div className="badge-neutral" style={{ padding: '0.75rem 1.5rem', background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
                                    <Clock size={16} /> 2024-25 Records Incoming
                                </div>
                                <div className="badge-neutral" style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 255, 255, 0.05)', color: '#a3a3a3' }}>
                                    <TrendingUp size={16} /> Historical Trends Syncing
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Temporary Crowdsource Feature */}
                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <p style={{ color: '#737373', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Help build the community while we wait for T&P data</p>
                        <button className="submit-btn" style={{ padding: '0.8rem 2rem', background: selectedBranch.color }}>
                            <PlusCircle size={18} /> Share Your Internship Experience
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Internships;
