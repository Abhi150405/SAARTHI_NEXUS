import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Edit2, Users, Download, X } from 'lucide-react';
import { API_URL } from '../config';
import { apiFetch } from '../api';

const BRANCH_OPTIONS = ["CE", "IT", "AI&DS", "E&CE", "E&TC"];

const ManagePlacementDrives = () => {
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
    const [selectedDrive, setSelectedDrive] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [pollingIntervalId, setPollingIntervalId] = useState(null);

    const [formData, setFormData] = useState({
        companyName: '',
        role: '',
        ctc: '',
        requirements: '',
        criteria: { ssc: '', hsc: '', cgpa: '', amcat: '' },
        allowedBranches: []
    });

    useEffect(() => {
        fetchDrives();
    }, []);

    const fetchDrives = async () => {
        try {
            setLoading(true);
            const res = await apiFetch('/api/drives/');
            if (res.ok) setDrives(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = selectedDrive ? `/api/drives/${selectedDrive._id}` : `/api/drives/`;
            const method = selectedDrive ? 'PUT' : 'POST';

            const payload = {
                companyName: formData.companyName,
                role: formData.role,
                ctc: formData.ctc,
                requirements: formData.requirements,
                criteria: {
                    ssc: parseFloat(formData.criteria.ssc) || 0,
                    hsc: parseFloat(formData.criteria.hsc) || 0,
                    cgpa: parseFloat(formData.criteria.cgpa) || 0,
                    amcat: parseInt(formData.criteria.amcat) || 0
                },
                allowedBranches: formData.allowedBranches
            };

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowFormModal(false);
                fetchDrives();
            } else {
                alert('Failed to save drive.');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete drive for ${name}?`)) return;
        try {
            const res = await apiFetch(`/api/drives/${id}`, { method: 'DELETE' });
            if (res.ok) fetchDrives();
        } catch (err) {
            console.error(err);
        }
    };

    const openEditForm = (drive) => {
        setSelectedDrive(drive);
        setFormData({
            companyName: drive.companyName,
            role: drive.role,
            ctc: drive.ctc,
            requirements: drive.requirements,
            criteria: {
                ssc: drive.criteria.ssc,
                hsc: drive.criteria.hsc,
                cgpa: drive.criteria.cgpa,
                amcat: drive.criteria.amcat
            },
            allowedBranches: drive.allowedBranches || []
        });
        setShowFormModal(true);
    };

    const toggleBranch = (branch) => {
        setFormData(prev => ({
            ...prev,
            allowedBranches: prev.allowedBranches.includes(branch)
                ? prev.allowedBranches.filter(b => b !== branch)
                : [...prev.allowedBranches, branch]
        }));
    };

    const openCreateForm = () => {
        setSelectedDrive(null);
        setFormData({
            companyName: '', role: '', ctc: '', requirements: '',
            criteria: { ssc: '', hsc: '', cgpa: '', amcat: '' },
            allowedBranches: []
        });
        setShowFormModal(true);
    };

    const openRegistrationsModal = (drive) => {
        setSelectedDrive(drive);
        setRegistrations([]);
        setShowRegistrationsModal(true);
        fetchRegistrations(drive._id);
        
        // Start polling every 10 seconds for real-time updates
        const id = setInterval(() => {
            fetchRegistrations(drive._id);
        }, 10000);
        setPollingIntervalId(id);
    };

    const closeRegistrationsModal = () => {
        setShowRegistrationsModal(false);
        if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
        }
    };

    const fetchRegistrations = async (driveId) => {
        try {
            const res = await apiFetch(`/api/drives/${driveId}/registrations`);
            if (res.ok) setRegistrations(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div className="admin-panel glass">
                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Placement Drives</h2>
                        <p style={{ color: '#A3A3A3', fontSize: '13px', marginTop: '4px' }}>Create drives and manage student applications in real-time.</p>
                    </div>
                    <button className="submit-btn" style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openCreateForm}>
                        <Plus size={16} /> Add Drive
                    </button>
                </div>
                
                <div className="panel-content">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#737373' }}>Loading drives...</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="nexus-table">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Role</th>
                                        <th>CTC</th>
                                        <th>Criteria (CGPA)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {drives.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No drives found.</td></tr>
                                    ) : (
                                        drives.map(drive => (
                                            <tr key={drive._id}>
                                                <td><strong style={{ color: '#F5F5F5' }}>{drive.companyName}</strong></td>
                                                <td>{drive.role}</td>
                                                <td><span style={{ color: '#F97316', fontWeight: 600 }}>{drive.ctc}</span></td>
                                                <td>{drive.criteria.cgpa}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button title="View Students" className="btn-icon" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }} onClick={() => openRegistrationsModal(drive)}>
                                                            <Users size={16} />
                                                        </button>
                                                        <button title="Edit" className="btn-icon" onClick={() => openEditForm(drive)}>
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button title="Delete" className="btn-icon danger" onClick={() => handleDelete(drive._id, drive.companyName)}>
                                                            <Trash2 size={16} color="#ef4444" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showFormModal && (
                <div className="student-modal-overlay" onClick={() => setShowFormModal(false)}>
                    <div className="student-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="student-modal-header">
                            <h2>{selectedDrive ? 'Edit Drive' : 'Create Placement Drive'}</h2>
                            <button className="modal-close-btn" onClick={() => setShowFormModal(false)}><X size={20} /></button>
                        </div>
                        <div className="student-modal-body" style={{ padding: '20px' }}>
                            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Company Name</label>
                                        <input className="doc-input" required value={formData.companyName} onChange={e => setFormData({...formData, companyName:e.target.value})} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Role</label>
                                        <input className="doc-input" required value={formData.role} onChange={e => setFormData({...formData, role:e.target.value})} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#A3A3A3' }}>CTC Details (e.g. 12 LPA)</label>
                                        <input className="doc-input" required value={formData.ctc} onChange={e => setFormData({...formData, ctc:e.target.value})} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Requirements / JD</label>
                                    <textarea className="doc-textarea" required rows="3" value={formData.requirements} onChange={e => setFormData({...formData, requirements:e.target.value})}></textarea>
                                </div>
                                <h3 style={{ fontSize: '15px', marginTop: '8px', color: '#F5F5F5', borderBottom: '1px solid #333', paddingBottom: '8px' }}>Allowed Branches</h3>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {BRANCH_OPTIONS.map(branch => (
                                        <label key={branch} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#FFF', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.allowedBranches.includes(branch)}
                                                onChange={() => toggleBranch(branch)}
                                                style={{ accentColor: '#F97316', width: '16px', height: '16px' }}
                                            />
                                            {branch}
                                        </label>
                                    ))}
                                </div>
                                <h3 style={{ fontSize: '15px', marginTop: '8px', color: '#F5F5F5', borderBottom: '1px solid #333', paddingBottom: '8px' }}>Eligibility Criteria</h3>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Min SSC %</label>
                                        <input type="number" step="0.01" className="doc-input" required value={formData.criteria.ssc} onChange={e => setFormData({...formData, criteria: {...formData.criteria, ssc: e.target.value}})} />
                                    </div>
                                    <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Min HSC %</label>
                                        <input type="number" step="0.01" className="doc-input" required value={formData.criteria.hsc} onChange={e => setFormData({...formData, criteria: {...formData.criteria, hsc: e.target.value}})} />
                                    </div>
                                    <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Min College CGPA</label>
                                        <input type="number" step="0.01" className="doc-input" required value={formData.criteria.cgpa} onChange={e => setFormData({...formData, criteria: {...formData.criteria, cgpa: e.target.value}})} />
                                    </div>
                                    <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Min AMCAT Score</label>
                                        <input type="number" className="doc-input" required value={formData.criteria.amcat} onChange={e => setFormData({...formData, criteria: {...formData.criteria, amcat: e.target.value}})} />
                                    </div>
                                </div>
                                <button type="submit" className="submit-btn" style={{ marginTop: '16px' }}>{selectedDrive ? 'Update Drive' : 'Create Drive'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Registrations Modal */}
            {showRegistrationsModal && (
                <div className="student-modal-overlay" onClick={closeRegistrationsModal}>
                    <div className="student-modal student-modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="student-modal-header" style={{ flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <h2>{selectedDrive?.companyName} Registrations <span style={{ fontSize: '13px', background: 'rgba(249, 115, 22, 0.2)', color: '#F97316', padding: '4px 10px', borderRadius: '12px', marginLeft: '12px', verticalAlign: 'middle' }}>{registrations.length} Students</span></h2>
                                <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}><div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite running' }}></div> Live</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <a href={`${API_URL}/api/drives/${selectedDrive?._id}/export`} target="_blank" rel="noopener noreferrer" className="btn-primary-dash" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', textDecoration: 'none' }}>
                                    <Download size={16} /> Export CSV
                                </a>
                                <button className="modal-close-btn" onClick={closeRegistrationsModal}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="student-modal-body" style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                            <table className="nexus-table" style={{ margin: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#151515' }}>
                                    <tr>
                                        <th>Name</th>
                                        <th>College Email</th>
                                        <th>Mobile</th>
                                        <th>CGPA</th>
                                        <th>AMCAT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#737373' }}>Wait for students to register...</td></tr>
                                    ) : (
                                        registrations.map(r => (
                                            <tr key={r._id}>
                                                <td><strong style={{ color: '#F5F5F5' }}>{r.name}</strong></td>
                                                <td>{r.collegeEmail}</td>
                                                <td>{r.mobile}</td>
                                                <td><span style={{ color: r.cgpa >= 8.0 ? '#10b981' : '#F5F5F5' }}>{r.cgpa}</span></td>
                                                <td>{r.amcat}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePlacementDrives;
