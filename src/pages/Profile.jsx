import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Hash, BookOpen, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
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
            </div>
        </div>
    );
};

export default Profile;
