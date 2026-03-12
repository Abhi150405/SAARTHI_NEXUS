import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Hash, BookOpen, AlertCircle, CheckCircle2, LogOut, GraduationCap, Save } from 'lucide-react';
import { API_URL } from '../config';
import '../styles/Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Academic fields state
    const [tenthPercentage, setTenthPercentage] = useState('');
    const [twelfthPercentage, setTwelfthPercentage] = useState('');
    const [collegeCgpa, setCollegeCgpa] = useState('');
    const [amcatScore, setAmcatScore] = useState('');
    const [academicLoading, setAcademicLoading] = useState(false);
    const [academicMessage, setAcademicMessage] = useState({ type: '', text: '' });
    const [fetchingAcademic, setFetchingAcademic] = useState(true);

    // Fetch academic data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user.email) {
                setFetchingAcademic(false);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/profile?email=${encodeURIComponent(user.email)}`);
                const data = await res.json();
                if (res.ok) {
                    setTenthPercentage(data.tenth_percentage ?? '');
                    setTwelfthPercentage(data.twelfth_percentage ?? '');
                    setCollegeCgpa(data.college_cgpa ?? '');
                    setAmcatScore(data.amcat_score ?? '');
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setFetchingAcademic(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_URL}/api/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    currentPassword,
                    newPassword,
                    role: user.role
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update password' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Connection error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleAcademicSave = async (e) => {
        e.preventDefault();
        setAcademicMessage({ type: '', text: '' });

        // Client-side validation
        const errors = [];
        if (tenthPercentage !== '' && (isNaN(tenthPercentage) || tenthPercentage < 0 || tenthPercentage > 100)) {
            errors.push('10th Percentage must be between 0 and 100');
        }
        if (twelfthPercentage !== '' && (isNaN(twelfthPercentage) || twelfthPercentage < 0 || twelfthPercentage > 100)) {
            errors.push('12th Percentage must be between 0 and 100');
        }
        if (collegeCgpa !== '' && (isNaN(collegeCgpa) || collegeCgpa < 0 || collegeCgpa > 10)) {
            errors.push('College CGPA must be between 0 and 10');
        }
        if (amcatScore !== '' && (isNaN(amcatScore) || !Number.isInteger(Number(amcatScore)) || Number(amcatScore) < 0)) {
            errors.push('AMCAT Score must be a non-negative integer');
        }

        if (errors.length > 0) {
            setAcademicMessage({ type: 'error', text: errors.join('; ') });
            return;
        }

        setAcademicLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    tenth_percentage: tenthPercentage,
                    twelfth_percentage: twelfthPercentage,
                    college_cgpa: collegeCgpa,
                    amcat_score: amcatScore
                })
            });

            const data = await response.json();

            if (response.ok) {
                setAcademicMessage({ type: 'success', text: 'Academic details saved successfully!' });
            } else {
                setAcademicMessage({ type: 'error', text: data.error || 'Failed to save academic details' });
            }
        } catch (err) {
            setAcademicMessage({ type: 'error', text: 'Connection error. Please try again.' });
        } finally {
            setAcademicLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-header-content">
                    <div>
                        <h1>Student Profile</h1>
                        <p>Manage your account information and security</p>
                    </div>
                    <button className="profile-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            <div className="profile-grid">
                {/* Info Section */}
                <div className="profile-card info-card glass">
                    <div className="card-header">
                        <User size={20} />
                        <h2>Personal Information</h2>
                    </div>
                    <div className="info-grid">
                        <div className="info-item">
                            <label><User size={14} /> Full Name</label>
                            <div className="info-value">{user.fullName}</div>
                        </div>
                        <div className="info-item">
                            <label><Mail size={14} /> Email Address</label>
                            <div className="info-value">{user.email}</div>
                        </div>
                        <div className="info-item">
                            <label><Hash size={14} /> ID Number</label>
                            <div className="info-value">{user.idNumber}</div>
                        </div>
                        <div className="info-item">
                            <label><BookOpen size={14} /> Department</label>
                            <div className="info-value">{user.department}</div>
                        </div>
                    </div>
                    <div className="info-footer">
                        <AlertCircle size={14} />
                        <span>Contact Admin to update personal information</span>
                    </div>
                </div>

                {/* Password Section */}
                <div className="profile-card password-card glass">
                    <div className="card-header">
                        <Lock size={20} />
                        <h2>Security Settings</h2>
                    </div>
                    <form onSubmit={handlePasswordChange} className="password-form">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="Minimum 6 characters"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        {message.text && (
                            <div className={`message-banner ${message.type}`}>
                                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Academic Details Section */}
                <div className="profile-card academic-card glass">
                    <div className="card-header">
                        <GraduationCap size={20} />
                        <h2>Academic Details</h2>
                    </div>

                    {fetchingAcademic ? (
                        <div className="academic-loading">Loading academic data...</div>
                    ) : (
                        <form onSubmit={handleAcademicSave} className="academic-form">
                            <div className="academic-grid">
                                <div className="form-group">
                                    <label>10th Percentage</label>
                                    <input
                                        id="tenth-percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={tenthPercentage}
                                        onChange={(e) => setTenthPercentage(e.target.value)}
                                        placeholder="e.g. 85.50"
                                    />
                                    <span className="input-hint">Between 0 and 100</span>
                                </div>
                                <div className="form-group">
                                    <label>12th Percentage</label>
                                    <input
                                        id="twelfth-percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={twelfthPercentage}
                                        onChange={(e) => setTwelfthPercentage(e.target.value)}
                                        placeholder="e.g. 78.25"
                                    />
                                    <span className="input-hint">Between 0 and 100</span>
                                </div>
                                <div className="form-group">
                                    <label>College CGPA</label>
                                    <input
                                        id="college-cgpa"
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.01"
                                        value={collegeCgpa}
                                        onChange={(e) => setCollegeCgpa(e.target.value)}
                                        placeholder="e.g. 8.50"
                                    />
                                    <span className="input-hint">Between 0 and 10</span>
                                </div>
                                <div className="form-group">
                                    <label>AMCAT Exam Score</label>
                                    <input
                                        id="amcat-score"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={amcatScore}
                                        onChange={(e) => setAmcatScore(e.target.value)}
                                        placeholder="e.g. 450"
                                    />
                                    <span className="input-hint">Non-negative integer</span>
                                </div>
                            </div>

                            {academicMessage.text && (
                                <div className={`message-banner ${academicMessage.type}`}>
                                    {academicMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    <span>{academicMessage.text}</span>
                                </div>
                            )}

                            <button type="submit" className="submit-btn academic-save-btn" disabled={academicLoading}>
                                {academicLoading ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Save Academic Details</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
