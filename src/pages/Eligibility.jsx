import React, { useState } from 'react';
import { Check, X, BookOpen, ExternalLink, ChevronRight, Sparkles, AlertTriangle, GraduationCap, Target, TrendingUp } from 'lucide-react';
import '../styles/Eligibility.css';
import { API_URL } from '../config';

const Eligibility = () => {
    const [cgpa, setCgpa] = useState(8.5);
    const [tenthScore, setTenthScore] = useState(85);
    const [twelfthScore, setTwelfthScore] = useState(82);
    const [amcatScore, setAmcatScore] = useState(70);
    const [department, setDepartment] = useState('CE');
    const [internships, setInternships] = useState(1);
    const [backlogs, setBacklogs] = useState(0);
    const [projects, setProjects] = useState(2);
    const [aiProbability, setAiProbability] = useState(null);
    const [loading, setLoading] = useState(false);

    // Mock Data
    const companies = [
        { name: 'TCS (Mass Only)', minCgpa: 6.0, min10th: 60, min12th: 60, minAmcat: 60, requiredToppings: ['Aptitude', 'Java Basics'] },
        { name: 'Accenture', minCgpa: 6.5, min10th: 65, min12th: 65, minAmcat: 60, requiredToppings: ['Problem Solving', 'Communication'] },
        { name: 'Barclays', minCgpa: 7.0, min10th: 75, min12th: 75, minAmcat: 0, requiredToppings: ['SQL', 'Banking Domain'] },
        { name: 'Deutsche Bank', minCgpa: 8.0, min10th: 80, min12th: 80, minAmcat: 0, requiredToppings: ['Operating Systems', 'System Design'] },
        { name: 'PhonePe', minCgpa: 8.5, min10th: 85, min12th: 85, minAmcat: 0, requiredToppings: ['Advanced DSA', 'System Design'] },
        { name: 'Goldman Sachs', minCgpa: 7.5, min10th: 80, min12th: 80, minAmcat: 0, requiredToppings: ['DSA', 'Quant'] },
        { name: 'Veritas', minCgpa: 6.82, min10th: 65, min12th: 65, minAmcat: 0, requiredToppings: ['C++', 'Testing'] },
        { name: 'Oracle', minCgpa: 7.0, min10th: 70, min12th: 70, minAmcat: 0, requiredToppings: ['Database Management', 'Java'] }
    ];

    const getEligibilityStatus = () => {
        return companies.map(c => {
            const reasons = [];
            if (cgpa < c.minCgpa) reasons.push(`CGPA < ${c.minCgpa}`);
            if (tenthScore < c.min10th) reasons.push(`10th < ${c.min10th}%`);
            if (twelfthScore < c.min12th) reasons.push(`12th < ${c.min12th}%`);
            if (c.minAmcat > 0 && amcatScore < c.minAmcat) reasons.push(`AMCAT < ${c.minAmcat}%`);

            return {
                ...c,
                eligible: reasons.length === 0,
                reasons
            };
        });
    };

    const predictPlacement = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/predict_placement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cgpa: parseFloat(cgpa) || 0,
                    tenth_score: parseFloat(tenthScore) || 0,
                    twelfth_score: parseFloat(twelfthScore) || 0,
                    amcat_score: parseFloat(amcatScore) || 0,
                    internships: parseInt(internships) || 0,
                    backlogs: parseInt(backlogs) || 0,
                    projects: parseInt(projects) || 0
                })
            });
            const data = await response.json();
            if (data.placement_probability !== undefined) {
                setAiProbability(Math.round(data.placement_probability * 100));
            }
        } catch (e) {
            console.error("ML Backend not reachable", e);
            alert("Could not connect to ML Backend. Please run 'python backend/app.py'");
        }
        setLoading(false);
    };

    const eligibleCompanies = getEligibilityStatus().filter(c => c.eligible);
    const probValue = aiProbability !== null ? aiProbability : Math.min((parseFloat(cgpa) || 0) * 10 + 10, 100);
    const probColor = probValue >= 70 ? '#22C55E' : (probValue >= 40 ? '#F97316' : '#EF4444');
    
    // For CGPA meter
    const cgpaVal = parseFloat(cgpa) || 0;
    const cgpaColor = cgpaVal >= 8.0 ? '#22C55E' : (cgpaVal >= 7.0 ? '#F97316' : '#EF4444');

    return (
        <div className="el-page">
            <div className="el-container">
                
                {/* SECTION 1 — PAGE HEADER */}
                <div className="el-header">
                    <div>
                        <span className="el-overline">Placement Engine</span>
                        <h2 className="el-title">Eligibility & Recommendations</h2>
                        <p className="el-subtitle">Check your profile against company requirements and get AI-driven placement predictions.</p>
                    </div>
                    <div className="el-header-right">
                        <div className="pill-green">
                            <span className="dot-green"></span>
                            {eligibleCompanies.length} Companies Eligible
                        </div>
                        <div className="pill-neutral">
                            {companies.length} Total Tracked
                        </div>
                    </div>
                </div>

                {/* SECTION 2 — MAIN TWO-COLUMN LAYOUT */}
                <div className="el-grid">
                    
                    {/* LEFT COLUMN — PROFILE INPUT PANEL */}
                    <div className="el-card profile-panel">
                        <div className="card-header">
                            <Target size={16} color="#F97316" />
                            <h3>Your Profile</h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label">CGPA</label>
                            <input
                                type="number"
                                step="0.1"
                                value={cgpa}
                                onChange={e => setCgpa(e.target.value)}
                                className="form-input"
                                placeholder="E.g. 8.5"
                            />
                            <div className="inline-meter">
                                <div 
                                    className="inline-meter-fill" 
                                    style={{ width: `${Math.min((cgpaVal / 10) * 100, 100)}%`, background: cgpaColor }}
                                ></div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">10th (%)</label>
                                <input
                                    type="number"
                                    value={tenthScore}
                                    onChange={e => setTenthScore(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">12th (%)</label>
                                <input
                                    type="number"
                                    value={twelfthScore}
                                    onChange={e => setTwelfthScore(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">AMCAT Score (%)</label>
                            <input
                                type="number"
                                value={amcatScore}
                                onChange={e => setAmcatScore(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <div className="select-wrapper">
                                <select
                                    value={department}
                                    onChange={e => setDepartment(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="CE">CE</option>
                                    <option value="IT">IT</option>
                                    <option value="AI&DS">AI&DS</option>
                                    <option value="E&CE(Electronics & Computer Engineering)">E&CE(Electronics & Computer Engineering)</option>
                                    <option value="E&TC">E&TC</option>
                                </select>
                                <ChevronRight className="select-arrow" size={14} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Internships</label>
                                <input
                                    type="number"
                                    value={internships}
                                    onChange={e => setInternships(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Projects</label>
                                <input
                                    type="number"
                                    value={projects}
                                    onChange={e => setProjects(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Active Backlogs</label>
                            <input
                                type="number"
                                value={backlogs}
                                onChange={e => setBacklogs(e.target.value)}
                                className="form-input"
                            />
                            {parseInt(backlogs) > 0 && (
                                <div className="warning-text">
                                    <AlertTriangle size={12} />
                                    <span>May affect eligibility for some companies</span>
                                </div>
                            )}
                        </div>

                        {/* PLACEMENT PROBABILITY SECTION */}
                        <div className="prob-section">
                            <div className="prob-header">
                                <div className="prob-label-wrap">
                                    <Sparkles size={13} color="#F97316" />
                                    <span className="prob-label">AI Placement Probability</span>
                                </div>
                                {aiProbability !== null && (
                                    <div className="ai-active-pill">AI Active</div>
                                )}
                            </div>
                            
                            <div className="prob-value" style={{ color: aiProbability !== null ? probColor : '#F5F5F5' }}>
                                {probValue}%
                            </div>
                            
                            <div className="prob-bar-track">
                                <div 
                                    className="prob-bar-fill" 
                                    style={{ width: `${probValue}%`, background: probColor }}
                                ></div>
                            </div>
                            <p className="prob-sub">{probValue}% estimated chance of placement</p>

                            <button className="btn-primary" onClick={predictPlacement} disabled={loading}>
                                <Sparkles size={14} color="#000" />
                                {loading ? "Analyzing..." : "Predict with AI"}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN — OUTPUT PANEL */}
                    <div className="output-panel">
                        
                        {/* RESULTS HEADER */}
                        <div className="results-header">
                            <div>
                                <div className="res-overline">Live Results</div>
                                <h3 className="res-title">Company Eligibility Check</h3>
                            </div>
                            <div className="el-header-right">
                                <div className="pill-green">
                                    <span className="dot-green"></span>
                                    {eligibleCompanies.length} Eligible
                                </div>
                                <div className="pill-red">
                                    <span className="dot-red"></span>
                                    {companies.length - eligibleCompanies.length} Not Eligible
                                </div>
                            </div>
                        </div>

                        {/* COMPANIES GRID */}
                        <div className="el-card comp-wrapper">
                            <div className="comp-grid">
                                {getEligibilityStatus().map((company, index) => {
                                    const isLastRow = index >= companies.length - (companies.length % 2 === 0 ? 2 : 1);
                                    return (
                                        <div 
                                            key={company.name} 
                                            className={`comp-card ${company.eligible ? 'eligible' : 'ineligible'}`}
                                            style={isLastRow ? { borderBottom: 'none' } : {}}
                                        >
                                            <div className="comp-name-row">
                                                <h4 className="comp-name">{company.name}</h4>
                                                <div className={`status-badge ${company.eligible ? 'pass' : 'fail'}`}>
                                                    {company.eligible ? 
                                                        <Check size={12} color="#22C55E" strokeWidth={2.5} /> : 
                                                        <X size={12} color="#EF4444" strokeWidth={2.5} />
                                                    }
                                                </div>
                                            </div>

                                            <div className="crit-row">
                                                <span className="crit-pill">CGPA {company.minCgpa}+</span>
                                                <span className="crit-pill">10th {company.min10th}%</span>
                                                <span className="crit-pill">12th {company.min12th}%</span>
                                                {company.minAmcat > 0 && <span className="crit-pill">AMCAT {company.minAmcat}%</span>}
                                            </div>

                                            <div className="skill-row">
                                                {company.requiredToppings.map(skill => (
                                                    <span key={skill} className="skill-tag">{skill}</span>
                                                ))}
                                            </div>

                                            {!company.eligible && (
                                                <div className="fail-row">
                                                    <AlertTriangle size={12} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                    <p className="fail-text">Failed: {company.reasons.join(' · ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* STUDY RECOMMENDATIONS */}
                        <div className="el-card study-panel">
                            <div className="study-header">
                                <GraduationCap size={16} color="#F97316" />
                                <div>
                                    <p className="study-ov">Personalized</p>
                                    <h3 className="study-title">Recommended Study Materials</h3>
                                </div>
                            </div>
                            <div className="study-list">
                                <div className="study-item">
                                    <div className="study-icon-wrap">
                                        <BookOpen size={16} color="#F97316" />
                                    </div>
                                    <div className="study-text">
                                        <h4 className="study-item-title">Advanced Data Structures</h4>
                                        <p className="study-item-sub">Recommended for Google, Microsoft</p>
                                    </div>
                                    <button className="btn-external">
                                        <ExternalLink size={13} color="#A3A3A3" />
                                    </button>
                                </div>
                                <div className="study-item">
                                    <div className="study-icon-wrap">
                                        <BookOpen size={16} color="#F97316" />
                                    </div>
                                    <div className="study-text">
                                        <h4 className="study-item-title">System Design Patterns</h4>
                                        <p className="study-item-sub">Essential for Product Companies</p>
                                    </div>
                                    <button className="btn-external">
                                        <ExternalLink size={13} color="#A3A3A3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Eligibility;
