import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, XCircle, ChevronRight, X } from 'lucide-react';
import { API_URL } from '../config';

const PlacementDrives = () => {
    const [drives, setDrives] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [selectedDrive, setSelectedDrive] = useState(null);

    const [regForm, setRegForm] = useState({
        name: '', collegeEmail: '', personalEmail: '', mobile: '',
        ssc: '', hsc: '', cgpa: '', amcat: ''
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Fetch student profile
                const profRes = await fetch(`${API_URL}/api/profile?email=${encodeURIComponent(user.email)}`);
                if (profRes.ok) {
                    const profData = await profRes.json();
                    setProfile(profData);
                    setRegForm({
                        name: profData.full_name || user.fullName || '',
                        collegeEmail: user.email || '',
                        personalEmail: '',
                        mobile: '',
                        ssc: profData.tenth_percentage || '',
                        hsc: profData.twelfth_percentage || '',
                        cgpa: profData.college_cgpa || '',
                        amcat: profData.amcat_score || ''
                    });
                }
                
                // Fetch active drives
                const drivesRes = await fetch(`${API_URL}/api/drives/`);
                if (drivesRes.ok) {
                    setDrives(await drivesRes.json());
                }
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const checkEligibility = (drive) => {
        if (!profile) return { isEligible: false, reasons: ['Profile data missing. Please update your profile.'] };
        
        const reasons = [];
        const criteria = drive.criteria;
        const mySsc = parseFloat(profile.tenth_percentage) || 0;
        const myHsc = parseFloat(profile.twelfth_percentage) || 0;
        const myCgpa = parseFloat(profile.college_cgpa) || 0;
        const myAmcat = parseInt(profile.amcat_score) || 0;

        if (mySsc < criteria.ssc) reasons.push(`SSC (${mySsc}%) is below required ${criteria.ssc}%`);
        if (myHsc < criteria.hsc) reasons.push(`HSC (${myHsc}%) is below required ${criteria.hsc}%`);
        if (myCgpa < criteria.cgpa) reasons.push(`CGPA (${myCgpa}) is below required ${criteria.cgpa}`);
        if (myAmcat < criteria.amcat) reasons.push(`AMCAT (${myAmcat}) is below required ${criteria.amcat}`);

        const rawDept = (profile.department || profile.dept || '').toUpperCase();
        const mappedBranch = (rawDept.includes('ELECTRONICS') && rawDept.includes('COMPUTER')) ? 'E&CE' : rawDept;
        
        const allowed = drive.allowedBranches || [];
        if (allowed.length > 0 && !allowed.includes(mappedBranch)) {
            reasons.push(`You are not eligible for this drive (branch criteria not met)`);
        }

        return { isEligible: reasons.length === 0, reasons };
    };

    const handleOpenRegister = (drive) => {
        setSelectedDrive(drive);
        setShowRegisterModal(true);
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                driveId: selectedDrive._id,
                studentEmail: user.email,
                name: regForm.name,
                ssc: parseFloat(regForm.ssc) || 0,
                hsc: parseFloat(regForm.hsc) || 0,
                cgpa: parseFloat(regForm.cgpa) || 0,
                amcat: parseInt(regForm.amcat) || 0,
                collegeEmail: regForm.collegeEmail,
                personalEmail: regForm.personalEmail,
                mobile: regForm.mobile
            };

            const res = await fetch(`${API_URL}/api/drives/${selectedDrive._id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Successfully registered for the drive!');
                setShowRegisterModal(false);
            } else {
                const data = await res.json();
                alert(`Registration failed: ${data.detail || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server.');
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: '#A3A3A3', textAlign: 'center' }}>Evaluating your eligibility...</div>;

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <Briefcase size={28} color="#F97316" />
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Campus Placement Drives</h1>
                        <p style={{ color: '#A3A3A3', fontSize: '14px', marginTop: '4px' }}>View and apply to active placement drives matching your profile.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {drives.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#737373' }}>
                            No active placement drives at the moment.
                        </div>
                    ) : (
                        drives.map(drive => {
                            const { isEligible, reasons } = checkEligibility(drive);
                            
                            return (
                                <div key={drive._id} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#F5F5F5', margin: 0 }}>{drive.companyName}</h2>
                                            <p style={{ fontSize: '15px', color: '#A3A3A3', marginTop: '4px' }}>{drive.role}</p>
                                        </div>
                                        <div style={{ padding: '6px 16px', background: 'rgba(249, 115, 22, 0.1)', color: '#F97316', borderRadius: '100px', fontWeight: 600, fontSize: '14px' }}>
                                            {drive.ctc}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '14px', color: '#D4D4D4', lineHeight: 1.6, marginTop: '8px' }}>
                                        <strong>Requirements:</strong><br/>
                                        {drive.requirements}
                                    </div>

                                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '8px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '12px', color: '#737373', textTransform: 'uppercase' }}>Min SSC</span>
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{drive.criteria.ssc}%</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '12px', color: '#737373', textTransform: 'uppercase' }}>Min HSC</span>
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{drive.criteria.hsc}%</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '12px', color: '#737373', textTransform: 'uppercase' }}>Min CGPA</span>
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{drive.criteria.cgpa}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '12px', color: '#737373', textTransform: 'uppercase' }}>Min AMCAT</span>
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{drive.criteria.amcat}</span>
                                        </div>
                                    </div>
                                    
                                    {drive.allowedBranches && drive.allowedBranches.length > 0 && (
                                        <div style={{ fontSize: '14px', color: '#A3A3A3', marginTop: '4px' }}>
                                            <strong style={{ color: '#D4D4D4' }}>Allowed Branches:</strong> {drive.allowedBranches.join(', ')}
                                        </div>
                                    )}

                                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                        <div style={{ flex: 1 }}>
                                            {isEligible ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '14px', fontWeight: 500 }}>
                                                    <CheckCircle size={18} /> You are eligible for this drive
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '14px', fontWeight: 500 }}>
                                                        <XCircle size={18} /> You are not eligible for this drive
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: '#737373' }}>{reasons[0]} {reasons.length > 1 && `(+${reasons.length - 1} more)`}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleOpenRegister(drive)}
                                            disabled={!isEligible}
                                            style={{
                                                padding: '10px 24px', 
                                                borderRadius: '8px',
                                                border: 'none',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: isEligible ? 'pointer' : 'not-allowed',
                                                backgroundColor: isEligible ? '#F97316' : 'rgba(255,255,255,0.05)',
                                                color: isEligible ? '#FFF' : '#737373',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {isEligible ? 'Apply Now' : 'Not Eligible'}
                                            {isEligible && <ChevronRight size={16} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Registration Modal */}
            {showRegisterModal && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }} onClick={() => setShowRegisterModal(false)}>
                    <div style={{ backgroundColor: '#151515', borderRadius: '12px', width: '100%', maxWidth: '600px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>Register for {selectedDrive?.companyName}</h2>
                            <button onClick={() => setShowRegisterModal(false)} style={{ background: 'transparent', border: 'none', color: '#A3A3A3', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRegisterSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Full Name</label>
                                    <input type="text" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', color: '#A3A3A3' }}>College Email</label>
                                    <input type="email" readOnly style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', color: '#737373', cursor: 'not-allowed' }} value={regForm.collegeEmail} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Personal Email</label>
                                    <input type="email" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} value={regForm.personalEmail} onChange={e => setRegForm({...regForm, personalEmail: e.target.value})} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', color: '#A3A3A3' }}>Mobile Number</label>
                                    <input type="tel" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} value={regForm.mobile} onChange={e => setRegForm({...regForm, mobile: e.target.value})} />
                                </div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                                <p style={{ fontSize: '13px', color: '#A3A3A3', margin: '0 0 12px 0' }}>Academic Verification Data (From Profile)</p>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 40%' }}><span style={{ fontSize: '12px', color: '#737373' }}>SSC:</span> <span style={{ fontSize: '14px', fontWeight: 500 }}>{regForm.ssc}%</span></div>
                                    <div style={{ flex: '1 1 40%' }}><span style={{ fontSize: '12px', color: '#737373' }}>HSC:</span> <span style={{ fontSize: '14px', fontWeight: 500 }}>{regForm.hsc}%</span></div>
                                    <div style={{ flex: '1 1 40%' }}><span style={{ fontSize: '12px', color: '#737373' }}>CGPA:</span> <span style={{ fontSize: '14px', fontWeight: 500 }}>{regForm.cgpa}</span></div>
                                    <div style={{ flex: '1 1 40%' }}><span style={{ fontSize: '12px', color: '#737373' }}>AMCAT:</span> <span style={{ fontSize: '14px', fontWeight: 500 }}>{regForm.amcat}</span></div>
                                </div>
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '14px', background: '#F97316', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '15px', marginTop: '8px', cursor: 'pointer' }}>Confirm Registration</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacementDrives;
