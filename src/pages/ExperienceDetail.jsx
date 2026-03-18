import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Award, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_URL } from '../config';
import '../styles/ExperienceDetail.css';

const statusConfig = {
    Selected:    { icon: CheckCircle, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', label: 'Selected' },
    Rejected:    { icon: XCircle,     color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  label: 'Rejected' },
    'In Progress': { icon: Clock,     color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'In Progress' },
};

const avatarColors = [
    '#5B6BC8', '#E67E22', '#1ABC9C', '#9B59B6',
    '#E74C3C', '#2980B9', '#27AE60', '#F39C12',
];

const ExperienceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exp, setExp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`${API_URL}/api/interview-experience/${id}`);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();
                setExp(data);
            } catch (err) {
                setError('Could not load this experience. It may have been removed.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return (
        <div className="exp-detail-loading">
            <div className="exp-detail-spinner"></div>
            <p>Loading experience...</p>
        </div>
    );

    if (error) return (
        <div className="exp-detail-error">
            <p>⚠️ {error}</p>
            <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
        </div>
    );

    const initial = exp.student_name ? exp.student_name.charAt(0).toLowerCase() : 'u';
    const avatarColor = avatarColors[exp.student_name?.charCodeAt(0) % avatarColors.length] || '#5B6BC8';
    const StatusIcon = statusConfig[exp.status]?.icon || CheckCircle;
    const statusColor = statusConfig[exp.status]?.color || '#22C55E';
    const statusBg = statusConfig[exp.status]?.bg || 'rgba(34,197,94,0.1)';
    const statusLabel = statusConfig[exp.status]?.label || exp.status;

    const displayDate = exp.formatted_date || (exp.created_at
        ? new Intl.DateTimeFormat('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
          }).format(new Date(exp.created_at))
        : 'Date not recorded');

    return (
        <div className="exp-detail-page">
            {/* Back Button */}
            <button className="exp-back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Back to Community
            </button>

            {/* Hero Card */}
            <div className="exp-detail-hero">
                <div className="exp-hero-top">
                    <div className="exp-hero-avatar" style={{ background: avatarColor }}>
                        {initial}
                    </div>
                    <div className="exp-hero-meta">
                        <h1 className="exp-hero-name">{exp.student_name || 'Anonymous'}</h1>
                        <div className="exp-hero-sub">
                            <span>🎓 {exp.branch || 'CE'} {exp.graduation_year || exp.year || '2025'}</span>
                            <span className="meta-dot">•</span>
                            <span>🏢 {exp.company_name}</span>
                            <span className="meta-dot">•</span>
                            <span>💼 {exp.role}</span>
                        </div>
                    </div>
                    <div className="exp-hero-status" style={{ background: statusBg, color: statusColor }}>
                        <StatusIcon size={14} />
                        {statusLabel}
                    </div>
                </div>

                {/* Meta badges */}
                <div className="exp-badges-row">
                    <div className="exp-badge">
                        <Building2 size={14} />
                        {exp.company_name}
                    </div>
                    <div className="exp-badge">
                        <Award size={14} />
                        {exp.role}
                    </div>
                    <div className="exp-badge">
                        <Calendar size={14} />
                        Batch {exp.year || '2024'}
                    </div>
                    {exp.rounds && (
                        <div className="exp-badge">
                            <RefreshCw size={14} />
                            {exp.rounds} Round{exp.rounds > 1 ? 's' : ''}
                        </div>
                    )}
                    {exp.branch && (
                        <div className="exp-badge">
                            <User size={14} />
                            {exp.branch}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Experience Section */}
            <div className="exp-detail-body">
                <div className="exp-section">
                    <div className="exp-section-label">📝 Interview Experience</div>
                    <div className="exp-content-markdown markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {exp.experience || '_No experience details provided._'}
                        </ReactMarkdown>
                    </div>
                </div>

                {exp.suggestions && (
                    <div className="exp-section exp-pro-tip">
                        <div className="exp-section-label">💡 Pro-Tip for Juniors</div>
                        <p className="exp-pro-tip-text">{exp.suggestions}</p>
                    </div>
                )}
            </div>

            {/* Footer timestamp */}
            <div className="exp-detail-footer">
                <span>🕐 {displayDate}</span>
            </div>
        </div>
    );
};

export default ExperienceDetail;
