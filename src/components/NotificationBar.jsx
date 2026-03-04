import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Info } from 'lucide-react';
import './NotificationBar.css';
import { API_URL } from '../config';

const NotificationBar = () => {
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${API_URL}/api/notifications`);
                if (response.ok) {
                    const data = await response.json();

                    // Filter out notifications that user has already closed
                    const closedIds = JSON.parse(localStorage.getItem('closed_notifications') || '[]');
                    const newNotifications = data.filter(n => !closedIds.includes(n._id));

                    if (newNotifications.length > 0) {
                        setNotifications(newNotifications);
                        setIsVisible(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };

        fetchNotifications();
        // Poll for new notifications every 60 seconds (increased to reduce overhead)
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Auto-close logic: Close after 10 seconds of being visible
    useEffect(() => {
        if (isVisible && notifications.length > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, notifications, currentIndex]);

    const handleClose = () => {
        if (notifications.length > 0) {
            const currentId = notifications[currentIndex]._id;
            const closedIds = JSON.parse(localStorage.getItem('closed_notifications') || '[]');
            if (!closedIds.includes(currentId)) {
                closedIds.push(currentId);
                localStorage.setItem('closed_notifications', JSON.stringify(closedIds));
            }
        }
        setIsVisible(false);
    };

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
                    <Link to="/notifications" className="notif-history-link" onClick={handleClose}>
                        View History
                    </Link>
                    {notifications.length > 1 && (
                        <div className="notif-pagination">
                            <span>{currentIndex + 1} of {notifications.length}</span>
                            <button onClick={() => setCurrentIndex((prev) => (prev + 1) % notifications.length)}>Next</button>
                        </div>
                    )}
                    <button className="notif-close" onClick={handleClose}>
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationBar;
