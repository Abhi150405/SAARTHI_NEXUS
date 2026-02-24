import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    GraduationCap,
    User,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    Mail
} from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
    const [role, setRole] = useState('student'); // 'student' or 'admin'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    // Load remembered email on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldErrors({});

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                // Store user session
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isAuthenticated', 'true');

                // Handle Remember Me
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                console.log(`Logged in as ${role}:`, email);
                navigate('/');
            } else {
                const serverError = data.error || 'Invalid credentials';
                setError(serverError);

                // Highlight fields based on error message
                if (serverError.toLowerCase().includes('email')) setFieldErrors({ email: true });
                if (serverError.toLowerCase().includes('password') || serverError.toLowerCase().includes('credentials')) {
                    setFieldErrors({ password: true, email: true });
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <GraduationCap size={32} />
                    </div>
                    <h1>SAARTHI Nexus</h1>
                    <p>Welcome back! Please login to continue.</p>
                </div>

                <div className="role-switcher">
                    <button
                        className={`role-btn ${role === 'student' ? 'active' : ''}`}
                        onClick={() => { setRole('student'); setFieldErrors({}); setError(''); }}
                    >
                        <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Student
                    </button>
                    <button
                        className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                        onClick={() => { setRole('admin'); setFieldErrors({}); setError(''); }}
                    >
                        <ShieldCheck size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Admin
                    </button>
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
                            <strong style={{ fontWeight: '700' }}>Login Failed</strong>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail className={`input-icon ${fieldErrors.email ? 'error-text' : ''}`} size={18} />
                            <input
                                type="email"
                                placeholder="name@college.edu"
                                className={fieldErrors.email ? 'error-input' : ''}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({}); setError(''); }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock className={`input-icon ${fieldErrors.password ? 'error-text' : ''}`} size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={fieldErrors.password ? 'error-input' : ''}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({}); setError(''); }}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember Me</span>
                        </label>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <div className="loader-small"></div>
                        ) : (
                            <>
                                Sign In <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    {role === 'student' ? (
                        <p>Don't have an account? <Link to="/signup">Create Account</Link></p>
                    ) : (
                        <p>Forgot admin credentials? <a href="mailto:support@saarthi.nexus">Contact IT Support</a></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
