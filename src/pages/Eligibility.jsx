import React, { useState } from 'react';
import { Check, X, BookOpen, ExternalLink } from 'lucide-react';
import '../styles/Eligibility.css';

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
    // Real Data from Placement Reports
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
            const response = await fetch('http://localhost:5000/predict_placement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cgpa: parseFloat(cgpa),
                    tenth_score: parseFloat(tenthScore),
                    twelfth_score: parseFloat(twelfthScore),
                    amcat_score: parseFloat(amcatScore),
                    internships: parseInt(internships),
                    backlogs: parseInt(backlogs),
                    projects: parseInt(projects)
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

    return (
        <div className="eligibility-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Eligibility & Recommendations</h2>
                    <p className="page-subtitle">Check your eligibility and get AI-driven recommendations</p>
                </div>
            </div>

            <div className="eligibility-container">
                <div className="input-panel card">
                    <h3>Your Profile</h3>

                    <div className="form-group">
                        <label>CGPA</label>
                        <input
                            type="number"
                            step="0.1"
                            value={cgpa}
                            onChange={e => setCgpa(e.target.value)}
                            className="text-input"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="form-group flex-1">
                            <label>10th (%)</label>
                            <input
                                type="number"
                                value={tenthScore}
                                onChange={e => setTenthScore(e.target.value)}
                                className="text-input"
                            />
                        </div>
                        <div className="form-group flex-1">
                            <label>12th (%)</label>
                            <input
                                type="number"
                                value={twelfthScore}
                                onChange={e => setTwelfthScore(e.target.value)}
                                className="text-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>AMCAT Score (%)</label>
                        <input
                            type="number"
                            value={amcatScore}
                            onChange={e => setAmcatScore(e.target.value)}
                            className="text-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            className="select-input"
                        >
                            <option value="CE">CE</option>
                            <option value="IT">IT</option>
                            <option value="AI&DS">AI&DS</option>
                            <option value="E&CE(Electronics & Computer Engineering)">E&CE(Electronics & Computer Engineering)</option>
                            <option value="E&TC">E&TC</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="form-group flex-1">
                            <label>Internships</label>
                            <input
                                type="number"
                                value={internships}
                                onChange={e => setInternships(e.target.value)}
                                className="text-input"
                            />
                        </div>
                        <div className="form-group flex-1">
                            <label>Projects</label>
                            <input
                                type="number"
                                value={projects}
                                onChange={e => setProjects(e.target.value)}
                                className="text-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Backlogs</label>
                        <input
                            type="number"
                            value={backlogs}
                            onChange={e => setBacklogs(e.target.value)}
                            className="text-input"
                        />
                    </div>

                    <div className="probability-section">
                        <label>Placement Probability {aiProbability !== null && '(AI Predicted)'}</label>
                        <div className="progress-bar-container">
                            <div
                                className={`progress-bar ${aiProbability !== null ? 'ai-active' : ''}`}
                                style={{ width: `${aiProbability !== null ? aiProbability : Math.min(cgpa * 10 + 10, 100)}%` }}
                            ></div>
                        </div>
                        <p className="prob-text">
                            {aiProbability !== null ? aiProbability : Math.min(cgpa * 10 + 10, 100)}% Chance of Placement
                        </p>
                        <button
                            className="btn-primary mt-3 w-full"
                            onClick={predictPlacement}
                            disabled={loading}
                        >
                            {loading ? 'Analyzing...' : 'Analyze with AI'}
                        </button>
                    </div>
                </div>

                <div className="output-panel">
                    <h3>Eligible Companies ({eligibleCompanies.length})</h3>
                    <div className="companies-grid">
                        {getEligibilityStatus().map(company => (
                            <div key={company.name} className={`company-card ${company.eligible ? 'eligible' : 'not-eligible'}`}>
                                <div className="company-header">
                                    <h4>{company.name}</h4>
                                    {company.eligible ? <Check size={18} /> : <X size={18} />}
                                </div>
                                <div className="criteria-list">
                                    <span className="badge">Min CGPA: {company.minCgpa}</span>
                                    <span className="badge">10th: {company.min10th}%</span>
                                    <span className="badge">12th: {company.min12th}%</span>
                                    {company.minAmcat > 0 && <span className="badge">AMCAT: {company.minAmcat}%</span>}
                                </div>
                                {!company.eligible && (
                                    <div className="gap-msg">
                                        Critera failed: {company.reasons.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="recommendations card mt-4">
                        <h3>Recommended Study Materials</h3>
                        <div className="study-list">
                            <div className="study-item">
                                <BookOpen size={20} className="icon-blue" />
                                <div>
                                    <h4>Advanced Data Structures</h4>
                                    <p>Recommended for Google, Microsoft</p>
                                </div>
                                <button className="btn-icon"><ExternalLink size={16} /></button>
                            </div>
                            <div className="study-item">
                                <BookOpen size={20} className="icon-blue" />
                                <div>
                                    <h4>System Design Patterns</h4>
                                    <p> Essential for Product Companies</p>
                                </div>
                                <button className="btn-icon"><ExternalLink size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Eligibility;
