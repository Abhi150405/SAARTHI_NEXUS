import React, { useState, useEffect } from 'react';
import { Bell, Calendar, User, ArrowLeft, RefreshCw, Volume2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Notifications.css';
import { API_URL } from '../config';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [marking, setMarking] = useState({});
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/all`);
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
        // Polling loop for real-time notifications
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
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

    const handleMarkAttendance = (notif) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.email) {
            alert("Student details not found. Please log in.");
            return;
        }

        setMarking(prev => ({ ...prev, [notif._id]: true }));

        if (!navigator.geolocation) {
            setMarking(prev => ({ ...prev, [notif._id]: false }));
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`${API_URL}/api/attendance/mark`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            session_id: notif.session_id,
                            student_id: user.studentId || user.email, 
                            student_email: user.email,
                            student_name: user.fullName || user.name,
                            latitude,
                            longitude
                        })
                    });
                    
                    const data = await res.json();
                    
                    setAttendanceStatus(prev => ({
                        ...prev, 
                        [notif._id]: { status: data.status, success: data.success }
                    }));
                } catch (err) {
                    console.error("Attendance API error:", err);
                    alert("Error marking attendance.");
                } finally {
                    setMarking(prev => ({ ...prev, [notif._id]: false }));
                }
            },
            (error) => {
                console.error("Location error:", error);
                setMarking(prev => ({ ...prev, [notif._id]: false }));
                alert("Please grant location permission to mark attendance.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
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
                <button className="refresh-btn" onClick={() => { setLoading(true); fetchNotifications(); }} disabled={loading}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="notifications-list-container">
                {loading && notifications.length === 0 ? (
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
                                        <span>{notif.type === 'attendance' ? 'System' : (notif.admin_name || 'Admin')}</span>
                                    </div>
                                    <div className="notif-time">
                                        <Calendar size={14} />
                                        <span>{formatTime(notif.created_at || notif.timestamp)}</span>
                                    </div>
                                </div>
                                <div className="notif-card-body">
                                    <Bell className="body-icon" size={24} />
                                    <div style={{ flex: 1 }}>
                                        <p className="notif-message" style={{ fontWeight: notif.type === 'attendance' ? '600' : 'normal' }}>
                                            {notif.message}
                                        </p>
                                        
                                        {notif.type === 'attendance' && (
                                            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#A3A3A3' }}>Window: {formatTime(notif.start_time)} to {formatTime(notif.end_time)}</span>
                                                </div>
                                                
                                                {!attendanceStatus[notif._id] ? (
                                                    <button 
                                                        className="submit-btn" 
                                                        style={{ width: '100%', padding: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: '#F97316', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        onClick={() => handleMarkAttendance(notif)}
                                                        disabled={marking[notif._id]}
                                                    >
                                                        <MapPin size={16} />
                                                        {marking[notif._id] ? 'Getting GPS Location...' : 'Mark Attendance Now'}
                                                    </button>
                                                ) : (
                                                    <div style={{ 
                                                        padding: '0.75rem', 
                                                        textAlign: 'center', 
                                                        borderRadius: '6px', 
                                                        fontWeight: 600,
                                                        background: attendanceStatus[notif._id].success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                        color: attendanceStatus[notif._id].success ? '#22c55e' : '#ef4444'
                                                    }}>
                                                        {attendanceStatus[notif._id].success ? '✅ Attendance Logged' : `❌ ${attendanceStatus[notif._id].status}`}
                                                    </div>
                                                )}
                                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#737373', textAlign: 'center' }}>
                                                    Requires GPS Location within campus.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="notif-card-footer">
                                    <span className="notif-tag">{notif.type === 'attendance' ? 'Important Request' : 'Official Announcement'}</span>
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
