import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  FileText,
  HelpCircle,
  Home,
  GraduationCap
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Analytics', icon: LayoutDashboard },
    { path: '/skills', label: 'Skill Analysis', icon: BookOpen },
    { path: '/eligibility', label: 'Eligibility', icon: UserCheck },
    { path: '/resume', label: 'Resume Match', icon: FileText },
    { path: '/help', label: 'AI Help', icon: HelpCircle },
    { path: '/about', label: 'About Us', icon: UserCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <GraduationCap className="logo-icon" size={32} />
        <div className="logo-text">
          <h1>SAARTHI</h1>
          <span>Nexus</span>
        </div>
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
          <div className="avatar">S</div>
          <div>
            <p className="user-name">Student User</p>
            <p className="user-role">Computer Science</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
