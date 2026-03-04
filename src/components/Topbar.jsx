import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';
import '../styles/Topbar.css';

const Topbar = () => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "User"}');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <div className="topbar">
            <div className="topbar-right">
                <div className="profile-wrapper" ref={dropdownRef}>
                    <button
                        className={`profile-trigger ${dropdownOpen ? 'active' : ''}`}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="user-avatar">
                            {user.fullName?.[0] || 'U'}
                        </div>
                        <div className="user-details-desktop">
                            <span className="user-name">{user.fullName}</span>
                            <span className="user-role">{user.role === 'admin' ? 'Administrator' : 'Student'}</span>
                        </div>
                        <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'rotate' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="profile-dropdown glass-premium">
                            <div className="dropdown-header">
                                <p className="signed-in-as">Signed in as</p>
                                <p className="dropdown-email">{user.email}</p>
                            </div>
                            <div className="dropdown-divider"></div>
                            <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                <User size={16} />
                                <span>My Profile</span>
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    <Shield size={16} />
                                    <span>Admin Panel</span>
                                </Link>
                            )}
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item logout" onClick={handleLogout}>
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Topbar;
