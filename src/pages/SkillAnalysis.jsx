import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Target, CheckCircle, AlertTriangle } from 'lucide-react';
import '../styles/SkillAnalysis.css';

const SkillAnalysis = () => {
    const [analysisMode, setAnalysisMode] = useState('role'); // 'role' or 'company'
    const [selectedTarget, setSelectedTarget] = useState('Software Engineer');

    const roles = [
        'Software Engineer',
        'Data Scientist',
        'Product Manager',
        'UI/UX Designer',
    ];

    const companies = [
        'Google',
        'Amazon',
        'Microsoft',
        'TCS',
        'PhonePe'
    ];

    const roleSkills = {
        'Software Engineer': ['React', 'Node.js', 'Python', 'SQL', 'Git', 'AWS'],
        'Data Scientist': ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas'],
        'Product Manager': ['Agile', 'Communication', 'Roadmapping', 'Analytics'],
        'UI/UX Designer': ['Figma', 'Prototyping', 'User Research', 'Wireframing'],
    };

    const companySkills = {
        'Google': ['DSA', 'System Design', 'C++', 'Python', 'Go'],
        'Amazon': ['DSA', 'AWS', 'Java', 'Leadership Principles', 'OOD'],
        'Microsoft': ['DSA', 'Azure', 'C#', 'System Design', 'CoPilot'],
        'TCS': ['Java', 'SQL', 'Aptitude', 'Communication', 'Python'],
        'PhonePe': ['DSA', 'System Design', 'Java', 'Kafka', 'Spring Boot']
    };

    const [studentSkills, setStudentSkills] = useState(['React', 'Git', 'HTML', 'CSS']);

    const getRequiredSkills = () => {
        if (analysisMode === 'role') return roleSkills[selectedTarget] || [];
        return companySkills[selectedTarget] || [];
    };

    const getMissingSkills = () => {
        const required = getRequiredSkills();
        return required.filter(skill => !studentSkills.includes(skill));
    };

    const getMatchPercentage = () => {
        const required = getRequiredSkills();
        if (required.length === 0) return 0;
        const common = required.filter(skill => studentSkills.includes(skill));
        return Math.round((common.length / required.length) * 100);
    };

    const chartData = {
        labels: ['React', 'Python', 'Java', 'SQL', 'AWS', 'Node.js'],
        datasets: [{
            label: 'Demand Frequency (Job Descriptions)',
            data: [85, 70, 60, 55, 45, 40],
            backgroundColor: '#4F46E5',
            borderRadius: 4,
        }]
    };

    return (
        <div className="skill-analysis-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Skill Demand & Gap Analysis</h2>
                    <p className="page-subtitle">Analyze your skills against industry demands</p>
                </div>
            </div>

            <div className="analysis-grid">
                {/* Left Side: Input & Settings */}
                <div className="input-section card">
                    <h3>Configuration</h3>

                    <div className="mode-toggle">
                        <button
                            className={`toggle-btn ${analysisMode === 'role' ? 'active' : ''}`}
                            onClick={() => { setAnalysisMode('role'); setSelectedTarget(roles[0]); }}
                        >
                            By Job Role
                        </button>
                        <button
                            className={`toggle-btn ${analysisMode === 'company' ? 'active' : ''}`}
                            onClick={() => { setAnalysisMode('company'); setSelectedTarget(companies[0]); }}
                        >
                            By Company
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Target {analysisMode === 'role' ? 'Job Role' : 'Company'}</label>
                        <select
                            value={selectedTarget}
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            className="select-input"
                        >
                            {(analysisMode === 'role' ? roles : companies).map(item => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Your Current Skills (Mock Input)</label>
                        <div className="skills-tags">
                            {studentSkills.map(skill => (
                                <span key={skill} className="skill-tag">
                                    {skill}
                                    <button onClick={() => setStudentSkills(studentSkills.filter(s => s !== skill))}>×</button>
                                </span>
                            ))}
                            <div className="add-skill">
                                <input placeholder="Add skill..." onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setStudentSkills([...studentSkills, e.target.value]);
                                        e.target.value = '';
                                    }
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Results */}
                <div className="results-section">
                    {/* Match Score Card */}
                    <div className="card score-card">
                        <h3>Skill Match ({selectedTarget})</h3>
                        <div className="progress-circle">
                            <svg viewBox="0 0 36 36">
                                <path
                                    className="circle-bg"
                                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="circle"
                                    strokeDasharray={`${getMatchPercentage()}, 100`}
                                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <div className="percentage">{getMatchPercentage()}%</div>
                        </div>
                    </div>

                    {/* Missing Skills Card */}
                    <div className="card missing-skills-card">
                        <h3>Missing Skills</h3>
                        <div className="missing-list">
                            {getMissingSkills().length > 0 ? (
                                getMissingSkills().map(skill => (
                                    <div key={skill} className="missing-item">
                                        <AlertTriangle size={16} />
                                        <span>{skill}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="success-message">
                                    <CheckCircle size={20} />
                                    <span>You have all required skills!</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom: Market Trends */}
                <div className="card full-width">
                    <h3>Market Demand for {selectedTarget}</h3>
                    <div className="chart-wrapper">
                        <Bar data={chartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillAnalysis;
