import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    GraduationCap,
    User,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Mail,
    IdCard,
    BookOpen
} from 'lucide-react';
import '../styles/Login.css';

const Signup = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        idNumber: '',
        department: 'CE',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (fieldErrors[e.target.name]) {
            const newFieldErrors = { ...fieldErrors };
            delete newFieldErrors[e.target.name];
            setFieldErrors(newFieldErrors);
        }
        setError('');
    };

    const validateForm = () => {
        const errors = {};
        if (formData.fullName.trim().length < 3) errors.fullName = "Full name must be at least 3 characters";
        if (!formData.email.includes('@')) errors.email = "Invalid email address";
        if (formData.idNumber.trim().length < 5) errors.idNumber = "Incomplete ID number";
        if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!validateForm()) {
            setError("Please correct the highlighted fields");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Account created successfully');
                navigate('/login/student');
            } else {
                const serverReason = data.reason || 'Please check your details and try again.';
                setError(serverReason);

                const lowerReason = serverReason.toLowerCase();
                const newFieldErrors = {};
                if (lowerReason.includes('email')) newFieldErrors.email = serverReason;
                if (lowerReason.includes('id')) newFieldErrors.idNumber = serverReason;
                if (lowerReason.includes('password')) newFieldErrors.password = serverReason;

                setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('Could not connect to the server. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: '500px' }}>
                <div className="login-header">
                    <div className="login-logo">
                        <GraduationCap size={32} />
                    </div>
                    <h1>Join SAARTHI</h1>
                    <p>Create your account to start your placement journey.</p>
                </div>

                <form onSubmit={handleSubmit} className={error ? 'animate-shake' : ''}>
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderLeft: '4px solid #ef4444',
                            padding: '0.85rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem',
                            color: '#ef4444',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <strong style={{ fontWeight: '700' }}>Signup Failed</strong>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <User className={`input-icon ${fieldErrors.fullName ? 'error-text' : ''}`} size={18} />
                                <input
                                    name="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    className={fieldErrors.fullName ? 'error-input' : ''}
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '2.8rem' }}
                                />
                            </div>
                            {fieldErrors.fullName && <p className="error-text">{fieldErrors.fullName}</p>}
                        </div>

                        <div className="form-group">
                            <label>ID Number</label>
                            <div className="input-wrapper">
                                <IdCard className={`input-icon ${fieldErrors.idNumber ? 'error-text' : ''}`} size={18} />
                                <input
                                    name="idNumber"
                                    type="text"
                                    placeholder="C2K2..."
                                    className={fieldErrors.idNumber ? 'error-input' : ''}
                                    value={formData.idNumber}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '2.8rem' }}
                                />
                            </div>
                            {fieldErrors.idNumber && <p className="error-text">{fieldErrors.idNumber}</p>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail className={`input-icon ${fieldErrors.email ? 'error-text' : ''}`} size={18} />
                            <input
                                name="email"
                                type="email"
                                placeholder="name@college.edu"
                                className={fieldErrors.email ? 'error-input' : ''}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {fieldErrors.email && <p className="error-text">{fieldErrors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label>Department</label>
                        <div className="input-wrapper">
                            <BookOpen className="input-icon" size={18} />
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem 0.85rem 3rem',
                                    background: 'var(--bg-body)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '12px',
                                    color: 'var(--text-main)',
                                    appearance: 'none',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="CE">CE</option>
                                <option value="IT">IT</option>
                                <option value="AI&DS">AI&DS</option>
                                <option value="E&CE(Electronics & Computer Engineering)">E&CE(Electronics & Computer Engineering)</option>
                                <option value="E&TC">E&TC</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock className={`input-icon ${fieldErrors.password ? 'error-text' : ''}`} size={18} />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={fieldErrors.password ? 'error-input' : ''}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '2.8rem' }}
                                />
                            </div>
                            {fieldErrors.password && <p className="error-text">{fieldErrors.password}</p>}
                        </div>

                        <div className="form-group">
                            <label>Confirm</label>
                            <div className="input-wrapper">
                                <Lock className={`input-icon ${fieldErrors.confirmPassword ? 'error-text' : ''}`} size={18} />
                                <input
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={fieldErrors.confirmPassword ? 'error-input' : ''}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '2.8rem' }}
                                />
                            </div>
                            {fieldErrors.confirmPassword && <p className="error-text">{fieldErrors.confirmPassword}</p>}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}
                        >
                            {showPassword ? "Hide Passwords" : "Show Passwords"}
                        </button>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <div className="loader-small"></div>
                        ) : (
                            <>
                                Create Account <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Already have an account? <Link to="/login/student">Sign In</Link></p>
                </div>
            </div >
        </div >
    );
};

export default Signup;
