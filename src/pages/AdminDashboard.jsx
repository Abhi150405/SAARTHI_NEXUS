import React, { useState, useEffect, useMemo } from 'react';
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
    LogOut,
    ClipboardList,
    Send,
    Edit2,
    Trash2,
    X,
    ArrowUpDown,
    Eye,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import '../styles/AdminDashboard.css';
import { API_URL } from '../config';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCompanies: 0,
        averagePackage: '0 LPA',
        activeOpportunities: 0
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Company Feedback state — Institutional Form
    const [companies, setCompanies] = useState([]);
    const [feedbackForm, setFeedbackForm] = useState({
        company_name: '',
        date: new Date().toISOString().split('T')[0],
        students_appeared: {
            aptitude_test: '',
            technical_test: '',
            technical_interview: '',
            hr_interview: ''
        },
        overall_observation: {
            aptitude: 0,
            soft_skills: 0,
            communication_skills: 0,
            basic_concepts: 0,
            programming: 0,
            problem_solving: 0,
            tech_trends_awareness: 0
        },
        training_suggestions: '',
        industry_institute_remarks: ''
    });
    const [feedbackSuccess, setFeedbackSuccess] = useState('');
    const [manualCompany, setManualCompany] = useState(false);
    const [existingFeedbacks, setExistingFeedbacks] = useState([]);
    const [editingFeedbackId, setEditingFeedbackId] = useState(null);

    // Recent registrations state
    const [recentUsers, setRecentUsers] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [broadcastedNotifications, setBroadcastedNotifications] = useState([]);
    const [editingNotificationId, setEditingNotificationId] = useState(null);

    // Student Records state
    const [studentSortKey, setStudentSortKey] = useState('');
    const [studentSortDir, setStudentSortDir] = useState('desc');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');

    // Sorted & filtered students
    const sortedStudents = useMemo(() => {
        let list = [...recentUsers];
        // Filter by search
        if (studentSearch.trim()) {
            const q = studentSearch.toLowerCase();
            list = list.filter(s =>
                (s.name || '').toLowerCase().includes(q) ||
                (s.email || '').toLowerCase().includes(q) ||
                (s.dept || '').toLowerCase().includes(q)
            );
        }
        // Sort
        if (studentSortKey) {
            list.sort((a, b) => {
                const aVal = parseFloat(a[studentSortKey]) || 0;
                const bVal = parseFloat(b[studentSortKey]) || 0;
                return studentSortDir === 'asc' ? aVal - bVal : bVal - aVal;
            });
        }
        return list;
    }, [recentUsers, studentSortKey, studentSortDir, studentSearch]);

    const handleStudentSort = (key) => {
        if (studentSortKey === key) {
            setStudentSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setStudentSortKey(key);
            setStudentSortDir('desc');
        }
    };

    const SortIcon = ({ colKey }) => {
        if (studentSortKey !== colKey) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
        return studentSortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/api/placement-stats`);
                if (response.ok) {
                    const data = await response.json();
                    const currentYear = Object.keys(data)[0];
                    if (currentYear) {
                        setStats({
                            totalStudents: data[currentYear].totalPlaced,
                            totalCompanies: data[currentYear].topCompanies.labels.length,
                            averagePackage: data[currentYear].avgPackage,
                            activeOpportunities: 12
                        });
                    }
                }
            } catch (err) { console.error('Failed to fetch stats', err); }
        };

        const fetchStudents = async () => {
            try {
                const response = await fetch(`${API_URL}/api/admin/students`);
                if (response.ok) { setRecentUsers(await response.json()); }
            } catch (err) { console.error('Failed to fetch students', err); }
        };

        const fetchCompanies = async () => {
            try {
                const response = await fetch(`${API_URL}/api/companies`);
                if (response.ok) { setCompanies(await response.json()); }
            } catch (err) { console.error('Failed to fetch companies', err); }
        };

        const fetchFeedbacks = async () => {
            try {
                const response = await fetch(`${API_URL}/api/company-feedback`);
                if (response.ok) {
                    setExistingFeedbacks(await response.json());
                }
            } catch (err) { console.error('Failed to fetch feedbacks', err); }
        };

        const fetchBroadcasts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/notifications/all`);
                if (response.ok) {
                    setBroadcastedNotifications(await response.json());
                }
            } catch (err) { console.error('Failed to fetch broadcasts', err); }
        };

        fetchStats();
        fetchStudents();
        fetchCompanies();
        fetchFeedbacks();
        fetchBroadcasts();
    }, []);

    const observationLabels = {
        aptitude: 'Aptitude',
        soft_skills: 'Soft Skills',
        communication_skills: 'Communication Skills',
        basic_concepts: 'Basic Concepts',
        programming: 'Programming',
        problem_solving: 'Problem Solving',
        tech_trends_awareness: 'Awareness about Technological Trends'
    };

    const updateAppeared = (field, value) => {
        setFeedbackForm({
            ...feedbackForm,
            students_appeared: { ...feedbackForm.students_appeared, [field]: value }
        });
    };

    const updateObservation = (field, value) => {
        setFeedbackForm({
            ...feedbackForm,
            overall_observation: { ...feedbackForm.overall_observation, [field]: parseInt(value) }
        });
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();

        // Validate all observations are filled
        const allRated = Object.values(feedbackForm.overall_observation).every(v => v > 0);
        if (!allRated) {
            alert('Please rate all observation categories.');
            return;
        }

        try {
            const payload = {
                ...feedbackForm,
                students_appeared: {
                    aptitude_test: parseInt(feedbackForm.students_appeared.aptitude_test) || 0,
                    technical_test: parseInt(feedbackForm.students_appeared.technical_test) || 0,
                    technical_interview: parseInt(feedbackForm.students_appeared.technical_interview) || 0,
                    hr_interview: parseInt(feedbackForm.students_appeared.hr_interview) || 0
                },
                admin_name: user.fullName || 'TNP Admin'
            };

            const url = editingFeedbackId
                ? `${API_URL}/api/company-feedback/${editingFeedbackId}`
                : `${API_URL}/api/company-feedback`;

            const method = editingFeedbackId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setFeedbackSuccess(editingFeedbackId ? 'Feedback updated successfully!' : 'Feedback from Industry published successfully!');
                setFeedbackForm({
                    company_name: '',
                    date: new Date().toISOString().split('T')[0],
                    students_appeared: { aptitude_test: '', technical_test: '', technical_interview: '', hr_interview: '' },
                    overall_observation: { aptitude: 0, soft_skills: 0, communication_skills: 0, basic_concepts: 0, programming: 0, problem_solving: 0, tech_trends_awareness: 0 },
                    training_suggestions: '',
                    industry_institute_remarks: ''
                });
                setManualCompany(false);
                setEditingFeedbackId(null);

                // Refresh feedbacks
                const fbRes = await fetch(`${API_URL}/api/company-feedback`);
                if (fbRes.ok) setExistingFeedbacks(await fbRes.json());

                setTimeout(() => setFeedbackSuccess(''), 4000);
            } else {
                alert('Failed to save feedback.');
            }
        } catch (err) {
            console.error('Feedback error:', err);
            alert('Error connecting to server.');
        }
    };

    const handleEditFeedback = (fb) => {
        setEditingFeedbackId(fb._id);

        // Ensure company is in list, otherwise select 'Other'
        const isCompanyInList = companies.some(c => c.company === fb.company_name);
        setManualCompany(!isCompanyInList);

        setFeedbackForm({
            company_name: fb.company_name || '',
            date: fb.date ? fb.date.split('T')[0] : new Date().toISOString().split('T')[0],
            students_appeared: {
                aptitude_test: fb.students_appeared?.aptitude_test !== undefined ? fb.students_appeared.aptitude_test : '',
                technical_test: fb.students_appeared?.technical_test !== undefined ? fb.students_appeared.technical_test : '',
                technical_interview: fb.students_appeared?.technical_interview !== undefined ? fb.students_appeared.technical_interview : '',
                hr_interview: fb.students_appeared?.hr_interview !== undefined ? fb.students_appeared.hr_interview : ''
            },
            overall_observation: {
                aptitude: fb.overall_observation?.aptitude || 0,
                soft_skills: fb.overall_observation?.soft_skills || 0,
                communication_skills: fb.overall_observation?.communication_skills || 0,
                basic_concepts: fb.overall_observation?.basic_concepts || 0,
                programming: fb.overall_observation?.programming || 0,
                problem_solving: fb.overall_observation?.problem_solving || 0,
                tech_trends_awareness: fb.overall_observation?.tech_trends_awareness || 0
            },
            training_suggestions: fb.training_suggestions || '',
            industry_institute_remarks: fb.industry_institute_remarks || ''
        });

        // Scroll to form smoothly
        setTimeout(() => {
            document.querySelector('.industry-feedback-document').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleDeleteFeedback = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback report?')) return;

        try {
            const response = await fetch(`${API_URL}/api/company-feedback/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setExistingFeedbacks(existingFeedbacks.filter(fb => fb._id !== id));
                if (editingFeedbackId === id) cancelEdit();
            } else {
                alert('Failed to delete feedback');
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const cancelEdit = () => {
        setEditingFeedbackId(null);
        setManualCompany(false);
        setFeedbackForm({
            company_name: '',
            date: new Date().toISOString().split('T')[0],
            students_appeared: { aptitude_test: '', technical_test: '', technical_interview: '', hr_interview: '' },
            overall_observation: { aptitude: 0, soft_skills: 0, communication_skills: 0, basic_concepts: 0, programming: 0, problem_solving: 0, tech_trends_awareness: 0 },
            training_suggestions: '',
            industry_institute_remarks: ''
        });
    };

    const handleBroadcast = async () => {
        const message = prompt("Enter the notification message to broadcast to all students:");
        if (!message) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    adminName: user.fullName || 'TNP Admin'
                })
            });

            if (response.ok) {
                alert("Notification broadcasted successfully!");
                // Refresh broadcasts list
                const bcRes = await fetch(`${API_URL}/api/notifications/all`);
                if (bcRes.ok) setBroadcastedNotifications(await bcRes.json());
            } else {
                alert("Failed to broadcast notification.");
            }
        } catch (err) {
            console.error("Broadcast error:", err);
            alert("Error connecting to server.");
        }
    };

    const handleDeleteNotification = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) return;
        try {
            const response = await fetch(`${API_URL}/api/notifications/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setBroadcastedNotifications(broadcastedNotifications.filter(n => n._id !== id));
            } else {
                alert('Failed to delete notification');
            }
        } catch (err) {
            console.error('Delete notification error:', err);
        }
    };

    const handleEditNotification = async (notif) => {
        const newMessage = prompt("Edit notification message:", notif.message);
        if (!newMessage || newMessage === notif.message) return;

        try {
            const response = await fetch(`${API_URL}/api/notifications/${notif._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage })
            });

            if (response.ok) {
                setBroadcastedNotifications(broadcastedNotifications.map(n =>
                    n._id === notif._id ? { ...n, message: newMessage } : n
                ));
            } else {
                alert('Failed to update notification');
            }
        } catch (err) {
            console.error('Update notification error:', err);
        }
    };

    return (
        <div className={`admin-dashboard-root ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-logo-box">
                        <ShieldCheck size={24} />
                    </div>
                    <span>Nexus Admin</span>
                    <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
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
                        className={`admin-nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
                        onClick={() => setActiveTab('feedback')}
                    >
                        <ClipboardList size={20} />
                        <span>Company Feedback</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'broadcasts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('broadcasts')}
                    >
                        <Bell size={20} />
                        <span>Manage Broadcasts</span>
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
                    <button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)}>
                        <Activity size={24} strokeWidth={2.5} />
                    </button>
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

                    {activeTab === 'overview' && (
                        <>
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
                        </>
                    )}

                    {/* Student Records Tab */}
                    {activeTab === 'students' && (
                        <div className="admin-panel glass">
                            <div className="panel-header">
                                <h2>Student Records</h2>
                                <div className="student-search-box">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or department..."
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="panel-content">
                                <div className="table-responsive">
                                    <table className="nexus-table student-records-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Department</th>
                                                <th className="sortable-th" onClick={() => handleStudentSort('tenth_percentage')}>
                                                    10th % <SortIcon colKey="tenth_percentage" />
                                                </th>
                                                <th className="sortable-th" onClick={() => handleStudentSort('twelfth_percentage')}>
                                                    12th % <SortIcon colKey="twelfth_percentage" />
                                                </th>
                                                <th className="sortable-th" onClick={() => handleStudentSort('college_cgpa')}>
                                                    CGPA <SortIcon colKey="college_cgpa" />
                                                </th>
                                                <th className="sortable-th" onClick={() => handleStudentSort('amcat_score')}>
                                                    AMCAT <SortIcon colKey="amcat_score" />
                                                </th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedStudents.length > 0 ? sortedStudents.map((s, i) => (
                                                <tr key={s.id || i}>
                                                    <td>{i + 1}</td>
                                                    <td>
                                                        <span
                                                            className="student-name-link"
                                                            onClick={() => setSelectedStudent(s)}
                                                        >
                                                            {s.name}
                                                        </span>
                                                    </td>
                                                    <td>{s.email}</td>
                                                    <td>{s.dept}</td>
                                                    <td>{s.tenth_percentage !== '' ? s.tenth_percentage : '—'}</td>
                                                    <td>{s.twelfth_percentage !== '' ? s.twelfth_percentage : '—'}</td>
                                                    <td>{s.college_cgpa !== '' ? s.college_cgpa : '—'}</td>
                                                    <td>{s.amcat_score !== '' ? s.amcat_score : '—'}</td>
                                                    <td>
                                                        <button
                                                            className="btn-icon view-btn"
                                                            title="View Details"
                                                            onClick={() => setSelectedStudent(s)}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                                                        {studentSearch ? 'No students match your search.' : 'No students found.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="student-count-footer">
                                    Showing {sortedStudents.length} of {recentUsers.length} students
                                    {studentSortKey && (
                                        <button className="clear-sort-btn" onClick={() => { setStudentSortKey(''); setStudentSortDir('desc'); }}>
                                            Clear Sort
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Student Detail Modal */}
                            {selectedStudent && (
                                <div className="student-modal-overlay" onClick={() => setSelectedStudent(null)}>
                                    <div className="student-modal" onClick={(e) => e.stopPropagation()}>
                                        <div className="student-modal-header">
                                            <h2>Student Profile</h2>
                                            <button className="modal-close-btn" onClick={() => setSelectedStudent(null)}>
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="student-modal-body">
                                            <div className="modal-avatar">
                                                {selectedStudent.name?.[0] || 'S'}
                                            </div>
                                            <h3 className="modal-student-name">{selectedStudent.name}</h3>
                                            <div className="modal-detail-grid">
                                                <div className="modal-detail-item">
                                                    <span className="modal-label">Email</span>
                                                    <span className="modal-value">{selectedStudent.email}</span>
                                                </div>
                                                <div className="modal-detail-item">
                                                    <span className="modal-label">ID Number</span>
                                                    <span className="modal-value">{selectedStudent.idNumber || '—'}</span>
                                                </div>
                                                <div className="modal-detail-item">
                                                    <span className="modal-label">Department</span>
                                                    <span className="modal-value">{selectedStudent.dept}</span>
                                                </div>
                                                <div className="modal-detail-item">
                                                    <span className="modal-label">Joined</span>
                                                    <span className="modal-value">{selectedStudent.joined || '—'}</span>
                                                </div>
                                            </div>
                                            <div className="modal-section-title">Academic Details</div>
                                            <div className="modal-detail-grid">
                                                <div className="modal-detail-item academic">
                                                    <span className="modal-label">10th Percentage</span>
                                                    <span className="modal-value highlight">{selectedStudent.tenth_percentage !== '' ? `${selectedStudent.tenth_percentage}%` : '—'}</span>
                                                </div>
                                                <div className="modal-detail-item academic">
                                                    <span className="modal-label">12th Percentage</span>
                                                    <span className="modal-value highlight">{selectedStudent.twelfth_percentage !== '' ? `${selectedStudent.twelfth_percentage}%` : '—'}</span>
                                                </div>
                                                <div className="modal-detail-item academic">
                                                    <span className="modal-label">College CGPA</span>
                                                    <span className="modal-value highlight">{selectedStudent.college_cgpa !== '' ? selectedStudent.college_cgpa : '—'}</span>
                                                </div>
                                                <div className="modal-detail-item academic">
                                                    <span className="modal-label">AMCAT Score</span>
                                                    <span className="modal-value highlight">{selectedStudent.amcat_score !== '' ? selectedStudent.amcat_score : '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Company Feedback Panel — Institutional Form */}
                    {activeTab === 'feedback' && (
                        <div className="feedback-container">

                            {/* Existing Feedbacks List */}
                            <div className="existing-feedbacks-list admin-panel glass compact" style={{ marginBottom: '2rem' }}>
                                <div className="panel-header">
                                    <h2>Manage Published Feedback</h2>
                                </div>
                                <div className="panel-content">
                                    <div className="table-responsive">
                                        <table className="nexus-table">
                                            <thead>
                                                <tr>
                                                    <th>Company</th>
                                                    <th>Published Date</th>
                                                    <th>Admin Name</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {existingFeedbacks.length > 0 ? existingFeedbacks.map(fb => (
                                                    <tr key={fb._id}>
                                                        <td><strong>{fb.company_name}</strong></td>
                                                        <td>{new Date(fb.date).toLocaleDateString()}</td>
                                                        <td>{fb.admin_name}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button title="Edit" className="btn-icon" onClick={() => handleEditFeedback(fb)}>
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button title="Delete" className="btn-icon danger" onClick={() => handleDeleteFeedback(fb._id)}>
                                                                    <Trash2 size={16} color="#ef4444" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'center', opacity: 0.5, padding: '1.5rem' }}>No feedback published yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="industry-feedback-document">
                                <div className="doc-header">
                                    <h1>{editingFeedbackId ? `Edit ${feedbackForm.company_name} Feedback` : 'Feedback from Industry'}</h1>
                                    <p className="doc-subtitle">Training & Placement Cell — PICT, Pune</p>
                                </div>

                                {feedbackSuccess && (
                                    <div className="doc-success-banner">{feedbackSuccess}</div>
                                )}

                                <form onSubmit={handleFeedbackSubmit} className="doc-form">
                                    {/* Section 1: Company Name */}
                                    <table className="doc-table">
                                        <tbody>
                                            <tr>
                                                <td className="doc-label-cell" style={{ width: '35%' }}>Name of the Company</td>
                                                <td>
                                                    <select
                                                        value={manualCompany ? '__other__' : feedbackForm.company_name}
                                                        onChange={(e) => {
                                                            if (e.target.value === '__other__') {
                                                                setManualCompany(true);
                                                                setFeedbackForm({ ...feedbackForm, company_name: '' });
                                                            } else {
                                                                setManualCompany(false);
                                                                setFeedbackForm({ ...feedbackForm, company_name: e.target.value });
                                                            }
                                                        }}
                                                        className="doc-input"
                                                    >
                                                        <option value="">Select company...</option>
                                                        {companies.map((c, i) => (
                                                            <option key={i} value={c.company}>{c.company}</option>
                                                        ))}
                                                        <option value="__other__">✏️ Other (Type manually)</option>
                                                    </select>
                                                </td>
                                            </tr>
                                            {manualCompany && (
                                                <tr>
                                                    <td className="doc-label-cell">Enter Company Name</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="doc-input"
                                                            placeholder="Type the company name..."
                                                            value={feedbackForm.company_name}
                                                            onChange={(e) => setFeedbackForm({ ...feedbackForm, company_name: e.target.value })}
                                                            autoFocus
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td className="doc-label-cell">Date of Visit/Drive</td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        required
                                                        className="doc-input"
                                                        value={feedbackForm.date}
                                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, date: e.target.value })}
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Section 2: Students Appeared */}
                                    <div className="doc-section-title">Number of Students Appeared For</div>
                                    <table className="doc-table">
                                        <thead>
                                            <tr>
                                                <th>Stage</th>
                                                <th>No. of Students</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="doc-label-cell">Aptitude Test</td>
                                                <td>
                                                    <input type="number" className="doc-input" placeholder="—"
                                                        value={feedbackForm.students_appeared.aptitude_test}
                                                        onChange={(e) => updateAppeared('aptitude_test', e.target.value)} required />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="doc-label-cell">Technical Test</td>
                                                <td>
                                                    <input type="number" className="doc-input" placeholder="—"
                                                        value={feedbackForm.students_appeared.technical_test}
                                                        onChange={(e) => updateAppeared('technical_test', e.target.value)} required />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="doc-label-cell">Technical Interview</td>
                                                <td>
                                                    <input type="number" className="doc-input" placeholder="—"
                                                        value={feedbackForm.students_appeared.technical_interview}
                                                        onChange={(e) => updateAppeared('technical_interview', e.target.value)} required />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="doc-label-cell">HR Interview</td>
                                                <td>
                                                    <input type="number" className="doc-input" placeholder="—"
                                                        value={feedbackForm.students_appeared.hr_interview}
                                                        onChange={(e) => updateAppeared('hr_interview', e.target.value)} required />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Section 3: Overall Observation */}
                                    <div className="doc-section-title">Overall Observation of Students</div>
                                    <div className="rating-scale-legend">
                                        <span><strong>1</strong> = Poor</span>
                                        <span><strong>2</strong> = Average</span>
                                        <span><strong>3</strong> = Good</span>
                                        <span><strong>4</strong> = Very Good</span>
                                        <span><strong>5</strong> = Excellent</span>
                                    </div>
                                    <table className="doc-table rating-matrix-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '45%' }}>Parameter</th>
                                                <th>1</th>
                                                <th>2</th>
                                                <th>3</th>
                                                <th>4</th>
                                                <th>5</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(observationLabels).map(([key, label], idx) => (
                                                <tr key={key}>
                                                    <td className="doc-label-cell">{String.fromCharCode(97 + idx)}) {label}</td>
                                                    {[1, 2, 3, 4, 5].map(num => (
                                                        <td key={num} className="radio-cell">
                                                            <label className="radio-label">
                                                                <input
                                                                    type="radio"
                                                                    name={`observation_${key}`}
                                                                    value={num}
                                                                    checked={feedbackForm.overall_observation[key] === num}
                                                                    onChange={() => updateObservation(key, num)}
                                                                />
                                                                <span className="radio-circle"></span>
                                                            </label>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Section 4: Training Suggestions */}
                                    <div className="doc-section-title">Areas wherein Training Programs be Conducted to Improve Employability</div>
                                    <table className="doc-table">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <textarea
                                                        className="doc-textarea"
                                                        rows="4"
                                                        required
                                                        value={feedbackForm.training_suggestions}
                                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, training_suggestions: e.target.value })}
                                                        placeholder="Mention specific areas like DSA, aptitude training, communication workshops, etc."
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Section 5: Industry-Institute Gap */}
                                    <div className="doc-section-title">Any Other Remark to Bridge Industry-Institute Gap</div>
                                    <table className="doc-table">
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <textarea
                                                        className="doc-textarea"
                                                        rows="4"
                                                        value={feedbackForm.industry_institute_remarks}
                                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, industry_institute_remarks: e.target.value })}
                                                        placeholder="Suggestions for curriculum, projects, industry exposure, internship programs, etc."
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button type="submit" className="doc-submit-btn">
                                            {editingFeedbackId ? <><Edit2 size={18} /> Update Feedback</> : <><Send size={18} /> Submit Feedback</>}
                                        </button>
                                        {editingFeedbackId && (
                                            <button type="button" className="doc-cancel-btn" onClick={cancelEdit}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Broadcast Notifications Management */}
                    {activeTab === 'broadcasts' && (
                        <div className="admin-panel glass">
                            <div className="panel-header">
                                <h2>Broadcast History</h2>
                                <button className="submit-btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleBroadcast}>
                                    <Send size={16} /> New Broadcast
                                </button>
                            </div>
                            <div className="panel-content">
                                <div className="table-responsive">
                                    <table className="nexus-table">
                                        <thead>
                                            <tr>
                                                <th>Serial</th>
                                                <th>Message</th>
                                                <th>Admin</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {broadcastedNotifications.length > 0 ? broadcastedNotifications.map((notif, index) => (
                                                <tr key={notif._id}>
                                                    <td>{index + 1}</td>
                                                    <td style={{ maxWidth: '400px' }}>{notif.message}</td>
                                                    <td>{notif.admin_name}</td>
                                                    <td>{new Date(notif.created_at).toLocaleString()}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button title="Edit" className="btn-icon" onClick={() => handleEditNotification(notif)}>
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button title="Delete" className="btn-icon danger" onClick={() => handleDeleteNotification(notif._id)}>
                                                                <Trash2 size={16} color="#ef4444" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No broadcasts found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
