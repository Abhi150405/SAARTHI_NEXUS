import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Send,
    Building,
    User,
    Calendar,
    Award,
    Search,
    PlusCircle,
    TrendingUp,
    Quote,
    BarChart3,
    ClipboardList
} from 'lucide-react';
import '../styles/Experiences.css';
import { API_URL } from '../config';

const Experiences = () => {
    const [activeTab, setActiveTab] = useState('interview');
    const [companies, setCompanies] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [feedbackSearch, setFeedbackSearch] = useState('');

    // Form states (only for interview experiences - students can submit these)
    const [interviewForm, setInterviewForm] = useState({
        student_name: '',
        company_name: '',
        role: '',
        year: '2024-25',
        experience: '',
        suggestions: '',
        status: 'Selected'
    });

    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const compRes = await fetch(`${API_URL}/api/companies`);
            const compData = await compRes.json();
            setCompanies(compData);

            const expRes = await fetch(`${API_URL}/api/interview-experience`);
            const expData = await expRes.json();
            setExperiences(expData);

            // Fetch all company feedback (admin-published)
            const fbRes = await fetch(`${API_URL}/api/company-feedback`);
            const fbData = await fbRes.json();
            setFeedbacks(fbData);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleInterviewSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/interview-experience`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(interviewForm)
            });
            if (response.ok) {
                setSuccessMessage('Experience shared successfully!');
                setInterviewForm({
                    student_name: '',
                    company_name: '',
                    role: '',
                    year: '2024-25',
                    experience: '',
                    suggestions: '',
                    status: 'Selected'
                });
                fetchInitialData();
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error submitting experience:', error);
        }
    };

    const filteredExperiences = experiences.filter(exp =>
        exp.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.student_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFeedbacks = feedbacks.filter(fb =>
        fb.company_name.toLowerCase().includes(feedbackSearch.toLowerCase())
    );

    if (loading) return (
        <div className="loading-container">
            <div className="loader"></div>
            <p>Gathering Community Insights...</p>
        </div>
    );

    return (
        <div className="experiences-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Community Insights</h1>
                    <p className="page-subtitle">Harness the collective wisdom of PICT students</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="insights-stats">
                <div className="stat-mini-card">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <MessageSquare size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{experiences.length}</span>
                        <span className="stat-label">Total Journeys</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{experiences.filter(e => e.status === 'Selected').length}</span>
                        <span className="stat-label">Success Stories</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <ClipboardList size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{feedbacks.length}</span>
                        <span className="stat-label">Industry Reports</span>
                    </div>
                </div>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'interview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('interview')}
                >
                    <Quote size={18} /> Interview Experiences
                </button>
                <button
                    className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                >
                    <BarChart3 size={18} /> Feedback from Industry
                </button>
            </div>

            {successMessage && <div className="success-banner animate-bounce-in">{successMessage}</div>}

            {activeTab === 'interview' ? (
                /* ========== INTERVIEW EXPERIENCES TAB ========== */
                <div className="content-layout">
                    <aside className="form-section card">
                        <form onSubmit={handleInterviewSubmit}>
                            <h3><PlusCircle className="icon-primary" /> Share Your Steps</h3>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label><User size={14} /> Name</label>
                                    <input
                                        type="text"
                                        value={interviewForm.student_name}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, student_name: e.target.value })}
                                        placeholder="Anonymous"
                                    />
                                </div>
                                <div className="input-group">
                                    <label><Building size={14} /> Company</label>
                                    <select
                                        required
                                        value={interviewForm.company_name}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, company_name: e.target.value })}
                                    >
                                        <option value="">Choose...</option>
                                        {companies.map((c, i) => (
                                            <option key={i} value={c.company}>{c.company}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label><Award size={14} /> Target Role</label>
                                    <input
                                        type="text"
                                        value={interviewForm.role}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, role: e.target.value })}
                                        placeholder="e.g. SDE"
                                    />
                                </div>
                                <div className="input-group">
                                    <label><Calendar size={14} /> Outcome</label>
                                    <select
                                        value={interviewForm.status}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })}
                                    >
                                        <option value="Selected">Selected ✅</option>
                                        <option value="Rejected">Rejected ❌</option>
                                        <option value="In Progress">In Progress ⏳</option>
                                    </select>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>The Interview Experience</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={interviewForm.experience}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, experience: e.target.value })}
                                    placeholder="Rounds, coding questions, difficulty..."
                                />
                            </div>
                            <div className="input-group">
                                <label>Golden Advice for Juniors</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={interviewForm.suggestions}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, suggestions: e.target.value })}
                                    placeholder="What should they focus on?"
                                />
                            </div>
                            <button type="submit" className="submit-btn">
                                <Send size={18} /> Share Wisdom
                            </button>
                        </form>
                    </aside>

                    <main className="display-section">
                        <div className="search-controls">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by company, role or student..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="list-container">
                            {filteredExperiences.length > 0 ? filteredExperiences.map((exp, i) => (
                                <div key={i} className={`experience-card ${exp.status === 'Rejected' ? 'rejected' : ''} animate-fade-in`}>
                                    <div className="card-top">
                                        <div className="company-meta">
                                            <h4>{exp.company_name}</h4>
                                            <div className="chips-row">
                                                <div className="chip"><User size={14} /> {exp.student_name || 'Anonymous'}</div>
                                                <div className="chip"><Award size={14} /> {exp.role}</div>
                                                <div className="chip"><Calendar size={14} /> {exp.year}</div>
                                            </div>
                                        </div>
                                        <span className={`status-badge ${exp.status.toLowerCase().replace(' ', '')}`}>
                                            {exp.status}
                                        </span>
                                    </div>
                                    <div className="card-content">
                                        <h5>The Journey</h5>
                                        <p>{exp.experience}</p>

                                        <div className="suggestion-box">
                                            <strong><TrendingUp size={14} /> Pro-Tip:</strong>
                                            <p>{exp.suggestions}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="empty-msg">No experiences match your search.</div>}
                        </div>
                    </main>
                </div>
            ) : (
                /* ========== FEEDBACK FROM INDUSTRY TAB (Read-Only for Students) ========== */
                <div className="feedback-section">
                    <div className="feedback-header-bar">
                        <div className="feedback-info">
                            <h2><BarChart3 size={22} /> Feedback from Industry</h2>
                            <p>Performance assessments published by the T&P Cell</p>
                        </div>
                        <div className="search-input-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search by company name..."
                                value={feedbackSearch}
                                onChange={(e) => setFeedbackSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="feedback-grid">
                        {filteredFeedbacks.length > 0 ? filteredFeedbacks.map((fb, i) => {
                            const appeared = fb.students_appeared || {};
                            const observations = fb.overall_observation || {};
                            const observationLabelsMap = {
                                aptitude: 'Aptitude',
                                soft_skills: 'Soft Skills',
                                communication_skills: 'Communication',
                                basic_concepts: 'Basic Concepts',
                                programming: 'Programming',
                                problem_solving: 'Problem Solving',
                                tech_trends_awareness: 'Tech Trends'
                            };
                            const ratingLabels = ['Poor', 'Average', 'Good', 'Very Good', 'Excellent'];

                            return (
                                <div key={i} className="feedback-report-card animate-fade-in">
                                    <div className="report-card-header">
                                        <div>
                                            <h3>{fb.company_name}</h3>
                                            <div className="report-meta">
                                                <span className="chip"><User size={14} /> {fb.admin_name || 'TNP Admin'}</span>
                                                <span className="chip"><Calendar size={14} /> {fb.date ? new Date(fb.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Students Appeared Stats */}
                                    <div className="report-sub-section">
                                        <h4 className="report-sub-title">Students Appeared</h4>
                                        <div className="appeared-grid">
                                            {[
                                                { label: 'Aptitude Test', val: appeared.aptitude_test },
                                                { label: 'Technical Test', val: appeared.technical_test },
                                                { label: 'Technical Interview', val: appeared.technical_interview },
                                                { label: 'HR Interview', val: appeared.hr_interview }
                                            ].map((item, idx) => (
                                                <div key={idx} className="appeared-item">
                                                    <span className="appeared-label">{item.label}</span>
                                                    <span className="appeared-value">{item.val || 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Overall Observations */}
                                    <div className="report-sub-section">
                                        <h4 className="report-sub-title">Overall Observation</h4>
                                        <div className="observations-list">
                                            {Object.entries(observationLabelsMap).map(([key, label]) => {
                                                const rating = observations[key] || 0;
                                                return (
                                                    <div key={key} className="observation-row">
                                                        <span className="observation-name">{label}</span>
                                                        <div className="observation-rating">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <span key={n} className={`rating-dot ${n <= rating ? 'filled' : ''}`}></span>
                                                            ))}
                                                            <span className="rating-word">{rating > 0 ? ratingLabels[rating - 1] : '—'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {fb.training_suggestions && (
                                        <div className="remarks-section">
                                            <strong>Training Suggestions:</strong>
                                            <p>{fb.training_suggestions}</p>
                                        </div>
                                    )}

                                    {fb.industry_institute_remarks && (
                                        <div className="remarks-section" style={{ marginTop: '0.5rem' }}>
                                            <strong>Industry-Institute Gap Remark:</strong>
                                            <p>{fb.industry_institute_remarks}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="empty-msg full-width">
                                <ClipboardList size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <h3>{feedbackSearch ? 'No reports match your search' : 'No industry feedback published yet'}</h3>
                                <p>The T&P Cell will publish company feedback reports here after each placement drive.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Experiences;
