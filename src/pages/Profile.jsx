import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Hash, BookOpen, AlertCircle, CheckCircle2, LogOut, GraduationCap, Save, Award, FileText, UploadCloud } from 'lucide-react';
import { API_URL } from '../config';
import '../styles/Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [fullName, setFullName] = useState(user.fullName || '');
    const [department, setDepartment] = useState(user.department || '');
    const [profilePicture, setProfilePicture] = useState(user.profilePicture || null);
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ type: '', text: '' });

    // AI/Resume fields state (from Resume Extraction)
    const [skills, setSkills] = useState([]);
    const [resumeSummary, setResumeSummary] = useState('');
    const [atsScore, setAtsScore] = useState(0);
    const [experienceYears, setExperienceYears] = useState(0);
    const [keyAchievements, setKeyAchievements] = useState([]);

    // Academic fields state
    const [tenthPercentage, setTenthPercentage] = useState('');
    const [twelfthPercentage, setTwelfthPercentage] = useState('');
    const [collegeCgpa, setCollegeCgpa] = useState('');
    const [amcatScore, setAmcatScore] = useState('');
    const [academicLoading, setAcademicLoading] = useState(false);
    const [academicMessage, setAcademicMessage] = useState({ type: '', text: '' });
    const [fetchingAcademic, setFetchingAcademic] = useState(true);

    // Fetch academic data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user.email) {
                setFetchingAcademic(false);
                return;
            }
            try {
                const res = await fetch(`${API_URL}/api/profile?email=${encodeURIComponent(user.email)}`);
                const data = await res.json();
                if (res.ok) {
                    setFullName(data.full_name ?? user.fullName);
                    setDepartment(data.department ?? user.department);
                    setProfilePicture(data.profile_picture ?? null);
                    setTenthPercentage(data.tenth_percentage ?? '');
                    setTwelfthPercentage(data.twelfth_percentage ?? '');
                    setCollegeCgpa(data.college_cgpa ?? '');
                    setAmcatScore(data.amcat_score ?? '');
                    setSkills(data.skills ?? []);
                    setResumeSummary(data.resume_summary ?? '');
                    setAtsScore(data.ats_score ?? 0);
                    setExperienceYears(data.experience_years ?? 0);
                    setKeyAchievements(data.key_achievements ?? []);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setFetchingAcademic(false);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_URL}/api/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    currentPassword,
                    newPassword,
                    role: user.role
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update password' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Connection error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleInfoSave = async (e) => {
        e.preventDefault();
        setInfoLoading(true);
        setInfoMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_URL}/api/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    full_name: fullName,
                    department: department,
                    profile_picture: profilePicture
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update localStorage
                const updatedUser = { ...user, fullName, department, profilePicture };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setInfoMessage({ type: 'success', text: 'Personal info updated!' });
            } else {
                setInfoMessage({ type: 'error', text: data.error || 'Failed to update info' });
            }
        } catch (err) {
            setInfoMessage({ type: 'error', text: 'Connection error.' });
        } finally {
            setInfoLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setInfoMessage({ type: 'error', text: 'Image too large (Max 2MB)' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAcademicSave = async (e) => {
        e.preventDefault();
        setAcademicMessage({ type: '', text: '' });

        // Client-side validation
        const errors = [];
        if (tenthPercentage !== '' && (isNaN(tenthPercentage) || tenthPercentage < 0 || tenthPercentage > 100)) {
            errors.push('10th Percentage must be between 0 and 100');
        }
        if (twelfthPercentage !== '' && (isNaN(twelfthPercentage) || twelfthPercentage < 0 || twelfthPercentage > 100)) {
            errors.push('12th Percentage must be between 0 and 100');
        }
        if (collegeCgpa !== '' && (isNaN(collegeCgpa) || collegeCgpa < 0 || collegeCgpa > 10)) {
            errors.push('College CGPA must be between 0 and 10');
        }
        if (amcatScore !== '' && (isNaN(amcatScore) || !Number.isInteger(Number(amcatScore)) || Number(amcatScore) < 0)) {
            errors.push('AMCAT Score must be a non-negative integer');
        }

        if (errors.length > 0) {
            setAcademicMessage({ type: 'error', text: errors.join('; ') });
            return;
        }

        setAcademicLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    tenth_percentage: tenthPercentage === '' ? null : parseFloat(tenthPercentage),
                    twelfth_percentage: twelfthPercentage === '' ? null : parseFloat(twelfthPercentage),
                    college_cgpa: collegeCgpa === '' ? null : parseFloat(collegeCgpa),
                    amcat_score: amcatScore === '' ? null : parseInt(amcatScore)
                })
            });

            const data = await response.json();

            if (response.ok) {
                setAcademicMessage({ type: 'success', text: 'Academic details saved successfully!' });
            } else {
                setAcademicMessage({ type: 'error', text: data.error || 'Failed to save academic details' });
            }
        } catch (err) {
            setAcademicMessage({ type: 'error', text: 'Connection error. Please try again.' });
        } finally {
            setAcademicLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-header-content">
                    <div>
                        <h1>Student Profile</h1>
                        <p>Manage your account information and security</p>
                    </div>
                    <button className="profile-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            <div className="profile-grid">
                {/* Info Section */}
                <div className="profile-card info-card glass">
                    <div className="card-header">
                        <User size={20} />
                        <h2>Personal Information</h2>
                    </div>
                    
                    <div className="avatar-upload-section">
                        <div className="avatar-preview-lg">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile" className="object-cover w-full h-full" />
                            ) : (
                                <div className="avatar-placeholder-lg">
                                    {fullName?.[0] || user.fullName?.[0] || 'U'}
                                </div>
                            )}
                            <label className="avatar-edit-overlay">
                                <UploadCloud size={20} />
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>
                        <div className="avatar-info">
                            <h3>Profile Picture</h3>
                            <p>Recommended: Square JPG or PNG, max 2MB</p>
                        </div>
                    </div>

                    <form onSubmit={handleInfoSave} className="info-form">
                        <div className="info-grid">
                            <div className="info-item">
                                <label><User size={14} /> Full Name</label>
                                <input 
                                    type="text" 
                                    value={fullName} 
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter full name"
                                    className="info-input"
                                />
                            </div>
                            <div className="info-item">
                                <label><Mail size={14} /> Email Address</label>
                                <div className="info-value readonly">{user.email}</div>
                            </div>
                            <div className="info-item">
                                <label><Hash size={14} /> ID Number</label>
                                <div className="info-value readonly">{user.idNumber}</div>
                            </div>
                            <div className="info-item">
                                <label><BookOpen size={14} /> Department</label>
                                <input 
                                    type="text" 
                                    value={department} 
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="Enter department"
                                    className="info-input"
                                />
                            </div>
                        </div>
                        {infoMessage.text && (
                            <div className={`message-banner ${infoMessage.type} small`}>
                                {infoMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                <span>{infoMessage.text}</span>
                            </div>
                        )}
                        <button type="submit" className="submit-btn info-save-btn" disabled={infoLoading}>
                            {infoLoading ? 'Saving...' : 'Save Info'}
                        </button>
                    </form>
                </div>

                {/* Password Section */}
                <div className="profile-card password-card glass">
                    <div className="card-header">
                        <Lock size={20} />
                        <h2>Security Settings</h2>
                    </div>
                    <form onSubmit={handlePasswordChange} className="password-form">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="Minimum 6 characters"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        {message.text && (
                            <div className={`message-banner ${message.type}`}>
                                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Skills & AI Highlights Card */}
                <div className="profile-card skills-highlight-card glass">
                    <div className="card-header">
                        <Award size={20} className="text-[#F97316]" />
                        <h2>Skills & AI Highlights</h2>
                    </div>
                    <div className="skills-content">
                        {fetchingAcademic ? (
                            <div className="academic-loading">Loading skills and summary...</div>
                        ) : (
                            <>
                                {resumeSummary && (
                                    <div className="resume-summary-box mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Extracted Summary</label>
                                            {atsScore > 0 && (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${atsScore >= 75 ? 'text-green-500 bg-green-500/10' : atsScore >= 50 ? 'text-orange-500 bg-orange-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                                    ATS Score: {atsScore}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 italic leading-relaxed">"{resumeSummary}"</p>
                                        <p className="text-xs text-gray-500 mt-2"><strong>{experienceYears} Year{experienceYears !== 1 ? 's' : ''}</strong> of Working Experience noted.</p>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-3 block">Technical Arsenal ({skills.length})</label>
                                    <div className="profile-skills-tags">
                                        {skills.length > 0 ? (
                                            skills.map((skill, i) => (
                                                <span key={i} className="profile-skill-tag">{skill}</span>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">No skills extracted yet.</p>
                                        )}
                                    </div>
                                </div>

                                {keyAchievements.length > 0 && (
                                    <div className="mb-6">
                                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2 block">Key Achievements & Projects</label>
                                        <ul className="list-disc pl-4 text-sm text-gray-400 space-y-1">
                                            {keyAchievements.map((ach, i) => (
                                                <li key={i}>{ach}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    className="mt-6 w-full py-2.5 rounded-xl border border-[#2A2A2A] hover:bg-[#1A1A1A] text-gray-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                                    onClick={() => navigate('/app/resume')}
                                >
                                    <FileText size={14} />
                                    Update from Resume
                                </button>
                            </>

                        )}
                    </div>
                </div>

                {/* Academic Details Section */}
                <div className="profile-card academic-card glass">
                    <div className="card-header">
                        <GraduationCap size={20} />
                        <h2>Academic Details</h2>
                    </div>

                    {fetchingAcademic ? (
                        <div className="academic-loading">Loading academic data...</div>
                    ) : (
                        <form onSubmit={handleAcademicSave} className="academic-form">
                            <div className="academic-grid">
                                <div className="form-group">
                                    <label>10th Percentage</label>
                                    <input
                                        id="tenth-percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={tenthPercentage}
                                        onChange={(e) => setTenthPercentage(e.target.value)}
                                        placeholder="e.g. 85.50"
                                    />
                                    <span className="input-hint">Between 0 and 100</span>
                                </div>
                                <div className="form-group">
                                    <label>12th Percentage</label>
                                    <input
                                        id="twelfth-percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={twelfthPercentage}
                                        onChange={(e) => setTwelfthPercentage(e.target.value)}
                                        placeholder="e.g. 78.25"
                                    />
                                    <span className="input-hint">Between 0 and 100</span>
                                </div>
                                <div className="form-group">
                                    <label>College CGPA</label>
                                    <input
                                        id="college-cgpa"
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.01"
                                        value={collegeCgpa}
                                        onChange={(e) => setCollegeCgpa(e.target.value)}
                                        placeholder="e.g. 8.50"
                                    />
                                    <span className="input-hint">Between 0 and 10</span>
                                </div>
                                <div className="form-group">
                                    <label>AMCAT Exam Score</label>
                                    <input
                                        id="amcat-score"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={amcatScore}
                                        onChange={(e) => setAmcatScore(e.target.value)}
                                        placeholder="e.g. 450"
                                    />
                                    <span className="input-hint">Non-negative integer</span>
                                </div>
                            </div>

                            {academicMessage.text && (
                                <div className={`message-banner ${academicMessage.type}`}>
                                    {academicMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    <span>{academicMessage.text}</span>
                                </div>
                            )}

                            <button type="submit" className="submit-btn academic-save-btn" disabled={academicLoading}>
                                {academicLoading ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Save Academic Details</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
