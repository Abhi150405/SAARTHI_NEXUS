import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Mail,
    AlertTriangle
} from 'lucide-react';
import '../styles/Login.css';

const AdminLogin = () => {
    const role = 'admin';
    const isAlreadyAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const activeUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail_admin');
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
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('isAuthenticated', 'true');

                if (rememberMe) {
                    localStorage.setItem('rememberedEmail_admin', email);
                } else {
                    localStorage.removeItem('rememberedEmail_admin');
                }

                navigate('/');
            } else {
                const serverError = data.error || 'Invalid admin credentials';
                setError(serverError);
                if (serverError.toLowerCase().includes('email')) setFieldErrors({ email: true });
                if (serverError.toLowerCase().includes('password') || serverError.toLowerCase().includes('credentials')) {
                    setFieldErrors({ password: true, email: true });
                }
            }
        } catch (err) {
            console.error('Admin Login error:', err);
            setError('Could not connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container admin-theme">
            <div className="admin-grid-pattern"></div>
            <div className="login-card admin-card glass-premium">
                <div className="login-header">
                    <div className="login-logo admin-logo">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-white">Nexus Intelligence</h1>
                    <p className="text-admin-muted">Administrative Protocol Access</p>
                </div>

                <div className="admin-sec-line">
                    <div className="sec-dot animate-pulse"></div>
                    <span>Secure Encrypted Connection</span>
                </div>

                <form onSubmit={handleSubmit} className={error ? 'animate-shake' : ''}>
                    {isAlreadyAuthenticated && !error && (
                        <div className="session-warning-banner admin-session-warning">
                            <AlertTriangle size={18} className="warning-icon" />
                            <div className="warning-content">
                                <strong className="text-white">Active Session Detected</strong>
                                <p className="text-admin-muted">System is already logged in as {activeUser.fullName}. Continuing will terminate the previous session.</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="error-banner admin-error">
                            <strong>Access Denied</strong>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Administrator Email</label>
                        <div className="input-wrapper">
                            <Mail className={`input-icon ${fieldErrors.email ? 'error-text' : ''}`} size={18} />
                            <input
                                type="email"
                                placeholder="admin@college.edu"
                                className={fieldErrors.email ? 'error-input' : ''}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({}); setError(''); }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Master Password</label>
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

                    <button type="submit" className="login-btn admin-btn" disabled={loading}>
                        {loading ? <div className="loader-small"></div> : <>Authenticate <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Issues signing in? <a href="mailto:support@saarthi.nexus">Contact IT Team</a></p>
                    <p className="mt-2 text-sm"><Link to="/login/student" className="text-muted">Not an admin? Use Student Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
