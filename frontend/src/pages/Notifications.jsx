import React, { useState, useEffect } from 'react';
import { Bell, Calendar, User, ArrowLeft, RefreshCw, Volume2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch, getUser } from '../api';

const pageAnim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } };

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [marking, setMarking] = useState({});
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await apiFetch('/api/notifications/all');
            if (res.ok) {
                const data = await res.json();
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
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const handleMarkAttendance = (notif) => {
        const user = getUser() || {};
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
                    const data = await apiFetch('/api/attendance/mark', {
                        method: 'POST',
                        body: JSON.stringify({
                            session_id: notif.session_id,
                            student_id: user.studentId || user.email,
                            student_email: user.email,
                            student_name: user.fullName || user.name,
                            latitude, longitude
                        })
                    });
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
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const filters = ['all', 'announcement', 'attendance'];
    const filteredNotifs = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

    const priorityColor = (notif) => {
        if (notif.type === 'attendance') return 'bg-[#F97316]';
        return 'bg-[#FACC15]';
    };

    return (
        <motion.div {...pageAnim}>
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-center hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <span className="font-black uppercase tracking-widest text-[10px] text-[#888888]">Bulletin Board</span>
                    <h1 className="font-black text-[28px] tracking-[-0.03em] text-[#0F0F0F]">TNP Broadcast History</h1>
                    <p className="font-medium text-[13px] text-[#4B4B4B]">Official announcements from the Training & Placement Cell.</p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchNotifications(); }}
                    disabled={loading}
                    className="w-10 h-10 bg-[#FACC15] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-center hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* FILTER TABS */}
            <div className="flex gap-0 mb-8 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F]">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 text-center py-3 font-black text-[13px] uppercase tracking-wide transition-colors duration-75 ${
                            f !== 'attendance' ? 'border-r-[3px] border-[#0F0F0F]' : ''
                        } ${
                            filter === f
                                ? 'bg-[#F97316] text-white'
                                : 'bg-white hover:bg-[#FEF08A] text-[#0F0F0F]'
                        }`}
                    >
                        {f === 'all' ? 'All' : f === 'announcement' ? 'Announcements' : 'Attendance'}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="text-center">
                        <div className="w-10 h-10 border-[3px] border-[#0F0F0F] border-t-[#F97316] animate-spin mx-auto" />
                        <p className="font-mono text-[13px] text-[#888888] mt-4">Synchronizing with TNP Server...</p>
                    </div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-16 text-center">
                    <Volume2 size={48} className="mx-auto text-[#888888] mb-4" />
                    <h2 className="font-black text-[20px] text-[#0F0F0F]">No Broadcasts Yet</h2>
                    <p className="font-medium text-[13px] text-[#888888] mt-2">All official announcements will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredNotifs.map((notif, index) => (
                        <div key={index} className="bg-white border-[3px] border-[#0F0F0F] shadow-[5px_5px_0px_#0F0F0F] relative">
                            {/* Pin dot */}
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#F97316] border-[2px] border-[#0F0F0F] z-10" />

                            {/* Priority strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityColor(notif)}`} />

                            {/* Card header */}
                            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-[#FACC15] border-[1.5px] border-[#0F0F0F] flex items-center justify-center">
                                        <User size={12} />
                                    </div>
                                    <span className="font-black text-[11px] uppercase tracking-widest text-[#0F0F0F]">
                                        {notif.type === 'attendance' ? 'System' : (notif.admin_name || 'Admin')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#888888]">
                                    <Calendar size={10} />
                                    <span>{formatTime(notif.created_at || notif.timestamp)}</span>
                                </div>
                            </div>

                            {/* Card body */}
                            <div className="px-5 pb-4">
                                <p className={`font-medium text-[13px] text-[#4B4B4B] leading-relaxed ${notif.type === 'attendance' ? 'font-bold' : ''}`}>
                                    {notif.message}
                                </p>

                                {/* Attendance section */}
                                {notif.type === 'attendance' && (
                                    <div className="mt-4 bg-[#FFFBF0] border-[2px] border-[#0F0F0F] p-4">
                                        <div className="font-mono text-[11px] text-[#888888] mb-3">
                                            Window: {formatTime(notif.start_time)} to {formatTime(notif.end_time)}
                                        </div>

                                        {(() => {
                                            const isExpired = notif.end_time && new Date() > new Date(notif.end_time);

                                            if (attendanceStatus[notif._id]) {
                                                return (
                                                    <div className={`p-3 text-center font-black text-[13px] border-[2px] border-[#0F0F0F] ${
                                                        attendanceStatus[notif._id].success
                                                            ? 'bg-[#A3E635] text-[#0F0F0F]'
                                                            : 'bg-[#FCA5A5] text-[#0F0F0F]'
                                                    }`}>
                                                        {attendanceStatus[notif._id].success ? '✅ Attendance Logged' : `❌ ${attendanceStatus[notif._id].status}`}
                                                    </div>
                                                );
                                            }

                                            if (isExpired) {
                                                return (
                                                    <button
                                                        disabled
                                                        className="w-full py-2.5 bg-[#FCA5A5] border-[3px] border-[#0F0F0F] font-black text-[12px] text-[#0F0F0F] opacity-60 cursor-not-allowed"
                                                    >
                                                        Session Expired
                                                    </button>
                                                );
                                            }

                                            return (
                                                <button
                                                    onClick={() => handleMarkAttendance(notif)}
                                                    disabled={marking[notif._id]}
                                                    className="w-full py-2.5 bg-[#F97316] text-white font-black text-[12px] border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center justify-center gap-2 hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                                                >
                                                    <MapPin size={14} />
                                                    {marking[notif._id] ? 'Getting GPS Location...' : 'Mark Attendance Now'}
                                                </button>
                                            );
                                        })()}

                                        <p className="mt-2 font-mono text-[10px] text-[#888888] text-center">
                                            Requires GPS Location within campus.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Card footer */}
                            <div className="border-t-[2px] border-[#0F0F0F] px-5 py-3">
                                <span className="inline-block bg-[#FACC15] border-[2px] border-[#0F0F0F] font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 text-[#0F0F0F]">
                                    {notif.type === 'attendance' ? 'Important Request' : 'Official Announcement'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default Notifications;
