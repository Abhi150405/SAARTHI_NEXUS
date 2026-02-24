import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    GraduationCap,
    User,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Mail
} from 'lucide-react';
import '../styles/Login.css';

const StudentLogin = () => {
    const role = 'student';
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
        const savedEmail = localStorage.getItem('rememberedEmail_student');
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
                    localStorage.setItem('rememberedEmail_student', email);
                } else {
                    localStorage.removeItem('rememberedEmail_student');
                }

                navigate('/');
            } else {
                const serverError = data.error || 'Invalid student credentials';
                setError(serverError);
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
        <div className="login-container student-theme">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo student-logo">
                        <User size={32} />
                    </div>
                    <h1>Student Portal</h1>
                    <p>Access your placement resources and analytics.</p>
                </div>

                <form onSubmit={handleSubmit} className={error ? 'animate-shake' : ''}>
                    {isAlreadyAuthenticated && !error && (
                        <div className="session-warning-banner">
                            <AlertTriangle size={18} className="warning-icon" />
                            <div className="warning-content">
                                <strong>Active Session Detected</strong>
                                <p>You are currently logged in as {activeUser.fullName}. Logging in here will end your current session.</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="error-banner">
                            <strong>Login Failed</strong>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Student Email</label>
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

                    <button type="submit" className="login-btn student-btn" disabled={loading}>
                        {loading ? <div className="loader-small"></div> : <>Sign In <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Don't have an account? <Link to="/signup">Create Account</Link></p>
                    <p className="mt-2 text-sm"><Link to="/login/admin" className="text-muted">Are you an Admin? Login here</Link></p>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
