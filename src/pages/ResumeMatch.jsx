import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCheck, AlertCircle, Briefcase } from 'lucide-react';
import '../styles/ResumeMatch.css';

const ResumeMatch = () => {
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    };

    const analyzeResume = () => {
        if (!file) return;
        setAnalyzing(true);
        // Mock analysis delay
        setTimeout(() => {
            setAnalyzing(false);
            setResult({
                score: 78,
                matchPercentage: 82,
                missingKeywords: ['Kubernetes', 'Microservices', 'GraphQL'],
                tips: [
                    'Add more quantifiable achievements in your experience.',
                    'Include "Kubernetes" in your skills section.',
                    'Format your education section more clearly.'
                ],
                recommendedCompanies: [
                    { name: 'TCS', role: 'System Engineer', match: 92 },
                    { name: 'Accenture', role: 'App Developer', match: 88 },
                    { name: 'Capgemini', role: 'Analyst', match: 85 }
                ]
            });
        }, 2000);
    };

    return (
        <div className="resume-match-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Resume & JD Matcher</h2>
                    <p className="page-subtitle">Optimize your resume for Applicant Tracking Systems (ATS)</p>
                </div>
            </div>

            <div className="match-container">
                <div className="upload-section">
                    <div className="card full-height">
                        <h3>Upload Resume</h3>

                        <div
                            className={`dropzone ${file ? 'has-file' : ''}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            {file ? (
                                <div className="file-preview">
                                    <FileText size={48} className="icon-primary" />
                                    <p className="file-name">{file.name}</p>
                                    <button className="btn-text" onClick={() => { setFile(null); setResult(null); }}>Remove</button>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <UploadCloud size={48} className="icon-muted" />
                                    <p>Drag & drop your resume here</p>
                                    <span className="small-text">or click to browse (PDF, DOCX)</span>
                                    <input
                                        type="file"
                                        className="file-input"
                                        onChange={(e) => setFile(e.target.files[0])}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group mt-4">
                            <label>Target Company / Job Description</label>
                            <select className="select-input">
                                <option>Google - Software Engineer</option>
                                <option>Amazon - SDE I</option>
                                <option>Microsoft - Data Scientist</option>
                            </select>
                        </div>

                        <button
                            className="btn btn-primary full-width-btn"
                            onClick={analyzeResume}
                            disabled={!file || analyzing}
                        >
                            {analyzing ? 'Analyzing...' : 'Analyze Resume'}
                        </button>
                    </div>
                </div>

                <div className="result-section">
                    {result ? (
                        <div className="analysis-results">
                            <div className="score-overview">
                                <div className="card score-box">
                                    <h4>ATS Score</h4>
                                    <div className={`score-circle ${result.score > 75 ? 'good' : 'average'}`}>
                                        <span>{result.score}</span>
                                    </div>
                                </div>
                                <div className="card score-box">
                                    <h4>Match %</h4>
                                    <div className="score-circle">
                                        <span>{result.matchPercentage}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card mt-4">
                                <h3><Briefcase size={20} className="icon-blue" /> Target Companies for You</h3>
                                <div className="companies-list">
                                    {result.recommendedCompanies.map((c, i) => (
                                        <div key={i} className="company-match-item">
                                            <div className="company-info">
                                                <h4>{c.name}</h4>
                                                <p>{c.role}</p>
                                            </div>
                                            <div className="match-tag">{c.match}% Match</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="card mt-4">
                                <h3><AlertCircle size={20} className="icon-warn" /> Missing Keywords</h3>
                                <div className="keywords-list">
                                    {result.missingKeywords.map(kw => (
                                        <span key={kw} className="keyword-tag">{kw}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="card mt-4">
                                <h3><CheckCheck size={20} className="icon-success" /> Improvement Tips</h3>
                                <ul className="tips-list">
                                    {result.tips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state card center-content">
                            <FileText size={64} className="icon-muted" />
                            <h3>Ready to Optimize?</h3>
                            <p>Upload your resume and select a job description to see how well you match.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeMatch;
