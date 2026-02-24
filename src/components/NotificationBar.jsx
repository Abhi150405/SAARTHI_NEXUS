import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Info } from 'lucide-react';
import './NotificationBar.css';

const NotificationBar = () => {
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/notifications');
                if (response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        setNotifications(data);
                        setIsVisible(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };

        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!isVisible || notifications.length === 0) return null;

    const currentNote = notifications[currentIndex];

    return (
        <div className="notification-bar-container">
            <div className="notification-bar">
                <div className="notif-badge">
                    <Bell size={16} />
                    <span>TNP Alert</span>
                </div>

                <div className="notif-content">
                    <p className="notif-text">
                        <span className="notif-admin">{currentNote.admin_name}:</span> {currentNote.message}
                    </p>
                </div>

                <div className="notif-controls">
                    <Link to="/notifications" className="notif-history-link" onClick={() => setIsVisible(false)}>
                        View History
                    </Link>
                    {notifications.length > 1 && (
                        <div className="notif-pagination">
                            <span>{currentIndex + 1} of {notifications.length}</span>
                            <button onClick={() => setCurrentIndex((prev) => (prev + 1) % notifications.length)}>Next</button>
                        </div>
                    )}
                    <button className="notif-close" onClick={() => setIsVisible(false)}>
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationBar;
