import React, { useState, useEffect } from 'react';
import { Bell, Calendar, User, ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/notifications/all');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notification history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-title">
                    <h1>TNP Broadcast History</h1>
                    <p>Official announcements and drive updates from the Training & Placement Cell.</p>
                </div>
                <button className="refresh-btn" onClick={fetchNotifications} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="notifications-list-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Synchronizing with TNP Server...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <Volume2 size={48} />
                        </div>
                        <h2>No Broadcasts Yet</h2>
                        <p>All official announcements from the placement cell will appear here.</p>
                    </div>
                ) : (
                    <div className="notifications-grid">
                        {notifications.map((notif, index) => (
                            <div key={index} className="notif-card-history">
                                <div className="notif-card-header">
                                    <div className="admin-badge">
                                        <User size={14} />
                                        <span>{notif.admin_name}</span>
                                    </div>
                                    <div className="notif-time">
                                        <Calendar size={14} />
                                        <span>{formatTime(notif.created_at)}</span>
                                    </div>
                                </div>
                                <div className="notif-card-body">
                                    <Bell className="body-icon" size={24} />
                                    <p className="notif-message">{notif.message}</p>
                                </div>
                                <div className="notif-card-footer">
                                    <span className="notif-tag">Official Announcement</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
