
import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Star,
    Send,
    Building,
    User,
    Calendar,
    Award,
    Search,
    Filter as FilterIcon,
    PlusCircle,
    TrendingUp,
    Users as UsersIcon,
    Quote
} from 'lucide-react';
import '../styles/Experiences.css';

const Experiences = () => {
    const [activeTab, setActiveTab] = useState('interview');
    const [companies, setCompanies] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Form states
    const [interviewForm, setInterviewForm] = useState({
        student_name: '',
        company_name: '',
        role: '',
        year: '2024-25',
        experience: '',
        suggestions: '',
        status: 'Selected'
    });

    const [feedbackForm, setFeedbackForm] = useState({
        company_name: '',
        feedback: '',
        rating: 5
    });

    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const compRes = await fetch('http://localhost:5000/api/companies');
            const compData = await compRes.json();
            setCompanies(compData);

            const expRes = await fetch('http://localhost:5000/api/interview-experience');
            const expData = await expRes.json();
            setExperiences(expData);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const fetchFeedbacks = async (companyName) => {
        if (!companyName) return;
        try {
            const res = await fetch(`http://localhost:5000/api/company-feedback/${encodeURIComponent(companyName)}`);
            const data = await res.json();
            setFeedbacks(data);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        }
    };

    const handleInterviewSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/interview-experience', {
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

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/company-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackForm)
            });
            if (response.ok) {
                setSuccessMessage('Feedback submitted successfully!');
                const companyName = feedbackForm.company_name;
                setFeedbackForm({
                    company_name: '',
                    feedback: '',
                    rating: 5
                });
                fetchFeedbacks(companyName);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    const filteredExperiences = experiences.filter(exp =>
        exp.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.student_name.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <div className="stat-icon-wrapper bg-blue-light" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <MessageSquare size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{experiences.length}</span>
                        <span className="stat-label">Total Journeys</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="stat-icon-wrapper bg-green-light" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{experiences.filter(e => e.status === 'Selected').length}</span>
                        <span className="stat-label">Success Stories</span>
                    </div>
                </div>
                <div className="stat-mini-card">
                    <div className="stat-icon-wrapper bg-purple-light" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <UsersIcon size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{companies.length}</span>
                        <span className="stat-label">Companies</span>
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
                    <Star size={18} /> Company Feedback
                </button>
            </div>

            {successMessage && <div className="success-banner animate-bounce-in">{successMessage}</div>}

            <div className="content-layout">
                <aside className="form-section card">
                    {activeTab === 'interview' ? (
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
                    ) : (
                        <form onSubmit={handleFeedbackSubmit}>
                            <h3><Star className="icon-primary" /> Rate Recruitment</h3>
                            <div className="input-group">
                                <label><Building size={14} /> Select Company</label>
                                <select
                                    required
                                    value={feedbackForm.company_name}
                                    onChange={(e) => {
                                        setFeedbackForm({ ...feedbackForm, company_name: e.target.value });
                                        fetchFeedbacks(e.target.value);
                                    }}
                                >
                                    <option value="">Choose a company...</option>
                                    {companies.map((c, i) => (
                                        <option key={i} value={c.company}>{c.company}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Process Rating</label>
                                <div className="rating-selector">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <button
                                            key={num}
                                            type="button"
                                            className={feedbackForm.rating >= num ? 'active' : ''}
                                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: num })}
                                        >
                                            <Star size={24} fill={feedbackForm.rating >= num ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Your Honest Thoughts</label>
                                <textarea
                                    required
                                    rows="6"
                                    value={feedbackForm.feedback}
                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                                    placeholder="Transparency, behavior, timing..."
                                />
                            </div>
                            <button type="submit" className="submit-btn">
                                <Send size={18} /> Submit Review
                            </button>
                        </form>
                    )}
                </aside>

                <main className="display-section">
                    {activeTab === 'interview' && (
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
                    )}

                    <div className="list-container">
                        {activeTab === 'interview' ? (
                            filteredExperiences.length > 0 ? filteredExperiences.map((exp, i) => (
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
                            )) : <div className="empty-msg">No experiences match your search.</div>
                        ) : (
                            feedbackForm.company_name ? (
                                feedbacks.length > 0 ? feedbacks.map((fb, i) => (
                                    <div key={i} className="feedback-card animate-fade-in">
                                        <div className="feedback-header">
                                            <div className="stars-wrapper">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={16}
                                                        fill={i < fb.rating ? "#f59e0b" : "none"}
                                                        color={i < fb.rating ? "#f59e0b" : "var(--text-light)"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="date-label">{new Date(fb.date).toLocaleDateString()}</span>
                                        </div>
                                        <p>{fb.feedback}</p>
                                    </div>
                                )) : <div className="empty-msg">No feedback for this company yet.</div>
                            ) : (
                                <div className="empty-msg">
                                    <FilterIcon size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <h3>Select a company to see what others are saying</h3>
                                </div>
                            )
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Experiences;
