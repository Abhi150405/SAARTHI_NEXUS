import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  FileText,
  HelpCircle,
  Home,
  GraduationCap,
  Building,
  MessageSquare,
  LogOut,
  Bell,
  X
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "User", "department": "Student", "role": "student"}');

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Analytics', icon: LayoutDashboard },
    { path: '/skills', label: 'Skill Analysis', icon: BookOpen },
    { path: '/eligibility', label: 'Eligibility', icon: UserCheck },
    { path: '/records', label: 'Placement Records', icon: Building },
    { path: '/experiences', label: 'Community', icon: MessageSquare },
    { path: '/resume', label: 'Resume Match', icon: FileText },
    { path: '/help', label: 'AI Help', icon: HelpCircle },
    { path: '/notifications', label: 'Alerts', icon: Bell },
    { path: '/about', label: 'About Us', icon: UserCheck },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-section">
          <GraduationCap className="logo-icon" size={32} />
          <div className="logo-text">
            <h1>SAARTHI</h1>
            <span>Nexus</span>
          </div>
        </div>
        <button className="mobile-close" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user.fullName.charAt(0)}</div>
          <div>
            <p className="user-name">{user.fullName}</p>
            <p className="user-role">{user.role === 'admin' ? 'Administrator' : user.department}</p>
          </div>
        </div>
        <button
          className="nav-item logout-btn"
          onClick={() => {
            localStorage.removeItem('user');
            localStorage.removeItem('isAuthenticated');
            navigate('/login');
          }}
          style={{ marginTop: '1rem', width: '100%', justifyContent: 'flex-start', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem' }}
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
