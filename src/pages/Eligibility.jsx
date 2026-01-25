import React, { useState } from 'react';
import { Check, X, BookOpen, ExternalLink } from 'lucide-react';
import '../styles/Eligibility.css';

const Eligibility = () => {
    const [cgpa, setCgpa] = useState(8.5);
    const [tenthScore, setTenthScore] = useState(85);
    const [twelfthScore, setTwelfthScore] = useState(82);
    const [amcatScore, setAmcatScore] = useState(70);
    const [department, setDepartment] = useState('CSE');

    // Mock Data
    const companies = [
        { name: 'Google', minCgpa: 9.0, min10th: 85, min12th: 85, minAmcat: 0, requiredToppings: ['DSA', 'System Design'] },
        { name: 'Microsoft', minCgpa: 8.0, min10th: 80, min12th: 80, minAmcat: 0, requiredToppings: ['DSA', 'Azure'] },
        { name: 'Amazon', minCgpa: 7.5, min10th: 75, min12th: 75, minAmcat: 0, requiredToppings: ['DSA', 'AWS'] },
        { name: 'TCS', minCgpa: 6.0, min10th: 60, min12th: 60, minAmcat: 60, requiredToppings: ['Aptitude'] },
        { name: 'Salesforce', minCgpa: 8.5, min10th: 80, min12th: 80, minAmcat: 0, requiredToppings: ['Java', 'Cloud'] },
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
                            <option>CSE</option>
                            <option>ECE</option>
                            <option>EEE</option>
                            <option>MECH</option>
                        </select>
                    </div>

                    <div className="probability-section">
                        <label>Placement Probability</label>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar"
                                style={{ width: `${Math.min(cgpa * 10 + 10, 100)}%` }}
                            ></div>
                        </div>
                        <p className="prob-text">
                            {Math.min(cgpa * 10 + 10, 100)}% Chance of Placement
                        </p>
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
