import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { apiFetch } from '../api';

const NotificationBar = () => {
    const [notifications, setNotifications] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await apiFetch('/api/notifications');
                if (response.ok) {
                    const data = await response.json();
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
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

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
        <div className="fixed top-0 left-0 right-0 z-[60]">
            <div className="w-full bg-[#0F0F0F] border-b-[3px] border-[#F97316] px-4 lg:px-8 py-2.5 flex items-center gap-4">
                {/* Badge */}
                <div className="bg-[#F97316] border-[2px] border-[#FACC15] px-2.5 py-0.5 flex items-center gap-1.5 flex-shrink-0">
                    <Bell size={12} className="text-white" />
                    <span className="font-black text-[10px] uppercase tracking-widest text-white">TNP Alert</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-mono text-[13px] text-[#FACC15] truncate">
                        <span className="font-black text-[#F97316]">{currentNote.admin_name}:</span>{' '}
                        {currentNote.message}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <Link
                        to="/app/notifications"
                        className="hidden sm:block font-black text-[11px] uppercase tracking-wide text-[#888888] hover:text-[#FACC15] transition-colors duration-100"
                        onClick={handleClose}
                    >
                        History
                    </Link>
                    {notifications.length > 1 && (
                        <button
                            onClick={() => setCurrentIndex((prev) => (prev + 1) % notifications.length)}
                            className="font-black text-[11px] text-[#FACC15] hover:text-white transition-colors duration-100"
                        >
                            {currentIndex + 1}/{notifications.length} →
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="text-[#888888] hover:text-white transition-colors duration-100"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationBar;
