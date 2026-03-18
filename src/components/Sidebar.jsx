import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  UserCheck,
  Building2,
  MessageSquare,
  FileText,
  HelpCircle,
  Bell,
  Info,
  LogOut,
  X,
  PlusCircle
} from 'lucide-react';
import './Sidebar.css';

const mainNav = [
  { path: '/app/dashboard', label: 'Analytics', icon: LayoutDashboard },
  { path: '/app/skills', label: 'Skill Analysis', icon: BookOpen },
  { path: '/app/eligibility', label: 'Eligibility', icon: UserCheck },
  { path: '/app/records', label: 'Placement Records', icon: Building2 },
  { path: '/app/experiences', label: 'Community', icon: MessageSquare },
  { path: '/app/add-experience', label: 'Add Experience', icon: PlusCircle },
];

const secondaryNav = [
  { path: '/app/profile', label: 'My Profile', icon: UserCheck },
  { path: '/app/resume', label: 'Resume Match', icon: FileText },
  { path: '/app/help', label: 'AI Help', icon: HelpCircle },
  { path: '/app/notifications', label: 'Alerts', icon: Bell },
  { path: '/app/about', label: 'About Us', icon: Info },
];

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "User", "department": "Student", "role": "student"}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>

      {/* HEADER */}
      <div className="sidebar-header">
        <div className="logo-section cursor-pointer" onClick={() => { navigate('/'); onClose(); }}>
          <img src="/logo.svg" alt="SAARTHI Nexus Logo" className="brand-logo" />
        </div>
        <button className="mobile-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {/* Group 1 — Main */}
        {mainNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Divider */}
        <div className="nav-divider"></div>

        {/* Group 2 — Tools */}
        {secondaryNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user.fullName?.charAt(0) || 'U'}</div>
          <div className="user-details">
            <p className="user-name">{user.fullName}</p>
            <p className="user-role">{user.role === 'admin' ? 'Administrator' : user.department}</p>
          </div>
          <button
            className="logout-icon-btn"
            title="Sign out"
            onClick={handleLogout}
          >
            <LogOut />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
