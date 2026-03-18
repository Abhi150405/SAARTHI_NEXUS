import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Shield, ChevronDown } from 'lucide-react';
import '../styles/Topbar.css';

const Topbar = () => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

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
        navigate('/');
    };

    // Don't show the topbar at all for unauthenticated users (public dashboard)
    if (!isAuthenticated) return null;

    return (
        <div className="topbar">
            <div></div>
            <div className="topbar-right">
                <div className="profile-wrapper" ref={dropdownRef}>
                    <button
                        className={`profile-trigger ${dropdownOpen ? 'active' : ''}`}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="user-avatar overflow-hidden">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="" className="object-cover w-full h-full" />
                            ) : (
                                user.fullName?.[0] || 'U'
                            )}
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
                            <Link to="/app/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
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


