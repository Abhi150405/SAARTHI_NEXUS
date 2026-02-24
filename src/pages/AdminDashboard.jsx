import React, { useState, useEffect } from 'react';
import {
    Users,
    ShieldCheck,
    FileText,
    TrendingUp,
    Settings,
    Bell,
    Search,
    Database,
    Briefcase,
    Activity,
    LogOut
} from 'lucide-react';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCompanies: 0,
        averagePackage: '0 LPA',
        activeOpportunities: 0
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Recent registrations state - starts empty and fetches real data
    const [recentUsers, setRecentUsers] = useState([]);

    useEffect(() => {
        // Fetch real stats from API
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/placement-stats');
                if (response.ok) {
                    const data = await response.json();
                    const currentYear = Object.keys(data)[0];
                    if (currentYear) {
                        setStats({
                            totalStudents: data[currentYear].totalPlaced,
                            totalCompanies: data[currentYear].topCompanies.labels.length,
                            averagePackage: data[currentYear].avgPackage,
                            activeOpportunities: 12 // Mock
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch stats', err);
            }
        };

        const fetchStudents = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/admin/students');
                if (response.ok) {
                    const data = await response.json();
                    setRecentUsers(data);
                }
            } catch (err) {
                console.error('Failed to fetch students', err);
            }
        };

        fetchStats();
        fetchStudents();
    }, []);

    const handleBroadcast = async () => {
        const message = prompt("Enter the notification message to broadcast to all students:");
        if (!message) return;

        try {
            const response = await fetch('http://localhost:5000/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    adminName: user.fullName || 'TNP Admin'
                })
            });

            if (response.ok) {
                alert("Notification broadcasted successfully!");
            } else {
                alert("Failed to broadcast notification.");
            }
        } catch (err) {
            console.error("Broadcast error:", err);
            alert("Error connecting to server.");
        }
    };

    return (
        <div className="admin-dashboard-root">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <div className="admin-logo-box">
                        <ShieldCheck size={24} />
                    </div>
                    <span>Nexus Admin</span>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <Activity size={20} />
                        <span>Overview</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveTab('students')}
                    >
                        <Users size={20} />
                        <span>Student Records</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'companies' ? 'active' : ''}`}
                        onClick={() => setActiveTab('companies')}
                    >
                        <Briefcase size={20} />
                        <span>Company Master</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        <FileText size={20} />
                        <span>Reports</span>
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-nav-item settings">
                        <Settings size={20} />
                        <span>Settings</span>
                    </div>
                    <button
                        className="admin-nav-item logout-red"
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = '/#/login/admin';
                        }}
                        style={{ marginTop: '0.5rem', color: '#f87171' }}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-top-bar">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input type="text" placeholder="Search records, students, or companies..." />
                    </div>

                    <div className="admin-user-actions">
                        <div className="notification-bell">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </div>
                        <div className="admin-user-profile">
                            <div className="admin-avatar">{user.fullName?.[0] || 'A'}</div>
                            <div className="admin-user-info">
                                <span className="admin-user-name">{user.fullName || 'System Admin'}</span>
                                <span className="admin-user-role">Administrator</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="admin-welcome-section">
                        <h1>Command Center</h1>
                        <p>Welcome back, Administrator. System status is normal.</p>
                    </div>

                    <div className="admin-stats-grid">
                        <div className="admin-stat-card primary">
                            <div className="stat-icon-wrap">
                                <Users size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-value">{stats.totalStudents}</span>
                                <span className="stat-label">Total Placed</span>
                            </div>
                        </div>
                        <div className="admin-stat-card success">
                            <div className="stat-icon-wrap">
                                <Briefcase size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-value">{stats.totalCompanies}</span>
                                <span className="stat-label">Companies Visited</span>
                            </div>
                        </div>
                        <div className="admin-stat-card info">
                            <div className="stat-icon-wrap">
                                <TrendingUp size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-value">{stats.averagePackage}</span>
                                <span className="stat-label">Avg. CTC</span>
                            </div>
                        </div>
                        <div className="admin-stat-card warning">
                            <div className="stat-icon-wrap">
                                <Database size={24} />
                            </div>
                            <div className="stat-data">
                                <span className="stat-value">{stats.activeOpportunities}</span>
                                <span className="stat-label">Active Drives</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-main-grid">
                        <div className="admin-panel glass">
                            <div className="panel-header">
                                <h2>Recent Registrations</h2>
                                <button className="btn-text">View All</button>
                            </div>
                            <div className="panel-content">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Joined Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentUsers.map(u => (
                                            <tr key={u.id}>
                                                <td><span className="student-pill">{u.name}</span></td>
                                                <td>{u.email}</td>
                                                <td>{u.dept}</td>
                                                <td>{u.joined}</td>
                                                <td><button className="btn-icon">Manage</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="admin-panel glass compact">
                            <div className="panel-header">
                                <h2>Quick Actions</h2>
                            </div>
                            <div className="panel-content actions-grid">
                                <button className="quick-action-btn">
                                    <Database size={20} />
                                    <span>Sync DB</span>
                                </button>
                                <button className="quick-action-btn">
                                    <FileText size={20} />
                                    <span>Export Report</span>
                                </button>
                                <button className="quick-action-btn" onClick={handleBroadcast}>
                                    <Bell size={20} />
                                    <span>Broadcast</span>
                                </button>
                                <button className="quick-action-btn logout" onClick={() => {
                                    localStorage.clear();
                                    window.location.href = '/#/login/admin';
                                }}>
                                    <LogOut size={20} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
