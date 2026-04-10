import React, { useState, useEffect, useRef } from 'react';
import { Target, Users, Clock, Send, ShieldCheck, Upload, FileText, X, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';
import '../styles/AdminDashboard.css';

const AttendanceControlPanel = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvError, setCsvError] = useState('');
    const fileInputRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch(`${API_URL}/api/companies`);
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data);
                }
            } catch (err) {
                console.error('Failed to fetch companies', err);
            }
        };
        fetchCompanies();
        fetchActiveSessions();
    }, []);

    const fetchActiveSessions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/attendance/sessions`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        }
    };

    const handleCsvChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.csv')) {
            setCsvError('Please upload a .csv file.');
            setCsvFile(null);
            setCsvPreview([]);
            return;
        }
        setCsvError('');
        setCsvFile(file);

        // Client-side preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) {
                setCsvError('CSV file appears empty.');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const emailIdx = headers.findIndex(h => h.includes('email'));
            const nameIdx = headers.findIndex(h => h.includes('name'));

            if (emailIdx === -1) {
                setCsvError('CSV must have an "email" column.');
                setCsvFile(null);
                return;
            }

            const preview = lines.slice(1, 6).map(line => {
                const cols = line.split(',').map(c => c.trim());
                return {
                    email: cols[emailIdx] || '',
                    name: nameIdx !== -1 ? (cols[nameIdx] || '') : ''
                };
            }).filter(r => r.email);

            setCsvPreview(preview);
        };
        reader.readAsText(file);
    };

    const handleClearCsv = () => {
        setCsvFile(null);
        setCsvPreview([]);
        setCsvError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreateSession = async () => {
        if (!selectedCompanyId || !startTime || !endTime) {
            alert('Please select a company and define a time slot.');
            return;
        }

        const comp = companies.find(c => c._id === selectedCompanyId || c.id === selectedCompanyId || c.company === selectedCompanyId);
        const compName = comp ? comp.company : selectedCompanyId;

        const startIso = new Date(startTime).toISOString();
        const endIso = new Date(endTime).toISOString();

        try {
            setLoading(true);
            let res;

            if (csvFile) {
                // Use multipart form with CSV
                const formData = new FormData();
                formData.append('company_id', selectedCompanyId);
                formData.append('company_name', compName);
                formData.append('start_time', startIso);
                formData.append('end_time', endIso);
                formData.append('admin_name', user.fullName || 'Admin');
                formData.append('csv_file', csvFile);

                res = await fetch(`${API_URL}/api/attendance/sessions/upload-csv`, {
                    method: 'POST',
                    body: formData   // No Content-Type header — browser sets multipart boundary
                });
            } else {
                // No CSV — broadcast to all
                res = await fetch(`${API_URL}/api/attendance/sessions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_id: selectedCompanyId,
                        company_name: compName,
                        start_time: startIso,
                        end_time: endIso,
                        admin_name: user.fullName || 'Admin',
                        eligible_emails: []
                    })
                });
            }

            if (res.ok) {
                const data = await res.json();
                const msg = csvFile
                    ? `Session created! Notified ${data.eligible_count} eligible students from CSV.`
                    : 'Attendance session created & broadcasted to all students!';
                alert(msg);
                setStartTime('');
                setEndTime('');
                setSelectedCompanyId('');
                handleClearCsv();
                fetchActiveSessions();
            } else {
                const err = await res.json();
                alert(`Failed: ${err.detail || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error creating session');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecords = async (sessionId) => {
        setSelectedSessionId(sessionId);
        try {
            const res = await fetch(`${API_URL}/api/attendance/sessions/${sessionId}/records`);
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (err) {
            console.error('Failed to fetch records', err);
        }
    };

    return (
        <div className="admin-panel glass full-width" style={{ marginTop: '1rem' }}>
            <div className="panel-header">
                <h2>Attendance Control Panel</h2>
            </div>
            <div className="panel-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Create Session Form */}
                    <div className="doc-form">
                        <div className="doc-section-title">Host New Attendance Session</div>

                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A3A3A3' }}>Select Company/Drive <Users size={14} /></label>
                        <select
                            className="doc-input"
                            style={{ marginBottom: '1.5rem' }}
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">-- Choose Company --</option>
                            {companies.map(c => (
                                <option key={c._id || c.id || c.company} value={c._id || c.id || c.company}>
                                    {c.company}
                                </option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A3A3A3' }}>Start Time <Clock size={14} /></label>
                                <input
                                    type="datetime-local"
                                    className="doc-input"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A3A3A3' }}>End Time <Clock size={14} /></label>
                                <input
                                    type="datetime-local"
                                    className="doc-input"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* CSV Upload Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#A3A3A3' }}>
                                <Upload size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                Student List (CSV) — <em style={{ fontSize: '0.8rem' }}>Optional. If not uploaded, all students receive the notification.</em>
                            </label>

                            {!csvFile ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed rgba(249,115,22,0.3)',
                                        borderRadius: '8px',
                                        padding: '1.5rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: 'rgba(249,115,22,0.03)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#F97316'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'}
                                >
                                    <FileText size={28} color="#F97316" style={{ marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0, color: '#A3A3A3', fontSize: '0.9rem' }}>Click to upload CSV</p>
                                    <p style={{ margin: '4px 0 0 0', color: '#525252', fontSize: '0.75rem' }}>Required columns: <code>email</code>, <code>name</code> (optional)</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        style={{ display: 'none' }}
                                        onChange={handleCsvChange}
                                    />
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <CheckCircle size={16} color="#22c55e" />
                                            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>{csvFile.name}</span>
                                        </div>
                                        <button onClick={handleClearCsv} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {csvPreview.length > 0 && (
                                        <div>
                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#A3A3A3' }}>Preview (first 5 rows):</p>
                                            {csvPreview.map((row, i) => (
                                                <div key={i} style={{ fontSize: '0.8rem', color: '#F5F5F5', padding: '2px 0', display: 'flex', gap: '1rem' }}>
                                                    <span style={{ color: '#A3A3A3', minWidth: '160px' }}>{row.email}</span>
                                                    {row.name && <span>{row.name}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {csvError && (
                                <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.4rem' }}>{csvError}</p>
                            )}
                        </div>

                        <button
                            className="submit-btn"
                            onClick={handleCreateSession}
                            disabled={loading || !!csvError}
                            style={{ width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            <Send size={18} />
                            {loading ? 'Processing...' : csvFile ? `Broadcast to ${csvPreview.length > 0 ? 'CSV Students' : 'Uploaded List'}` : 'Generate & Broadcast Attendance'}
                        </button>
                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#737373' }}>
                            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Geo-fence validation is mandatory (Student must be within 200m of campus).
                        </p>
                    </div>

                    {/* Active Sessions & Records */}
                    <div>
                        <div className="doc-section-title">Active Sessions</div>
                        {sessions.length === 0 ? (
                            <p style={{ color: '#737373', fontSize: '0.9rem' }}>No active attendance sessions.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                {sessions.map(s => (
                                    <div
                                        key={s._id}
                                        style={{
                                            padding: '1rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            border: selectedSessionId === s._id ? '1px solid var(--admin-accent)' : '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        onClick={() => handleViewRecords(s._id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>{s.company_name}</h4>
                                            {s.eligible_emails?.length > 0 && (
                                                <span style={{ fontSize: '0.75rem', background: 'rgba(249,115,22,0.15)', color: '#F97316', padding: '2px 8px', borderRadius: '999px' }}>
                                                    {s.eligible_emails.length} eligible
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#A3A3A3' }}>
                                            {new Date(s.start_time).toLocaleTimeString()} - {new Date(s.end_time).toLocaleTimeString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedSessionId && (
                            <>
                                <div className="doc-section-title">Live Attendance List</div>
                                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <table className="nexus-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Status</th>
                                                <th>Dist. (m)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {records.length > 0 ? records.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{r.student_name}</td>
                                                    <td>
                                                        <span className={`status-pill ${r.status.includes('Valid') ? 'success' : 'danger'}`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td>{r.distance ? Math.round(r.distance) : '-'}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="3" style={{ textAlign: 'center', color: '#737373' }}>No attendance records yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceControlPanel;
