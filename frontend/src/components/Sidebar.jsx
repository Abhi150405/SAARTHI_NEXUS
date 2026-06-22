import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  Building2,
  MessageSquare,
  Briefcase,
  PlusCircle,
  Zap,
  HelpCircle,
  Bell,
  Info,
  LogOut,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Newspaper,
  X
} from 'lucide-react';

/* ── Navigation Sections ────────────────────────────── */
const sections = [
  {
    label: 'COMMAND CENTER',
    color: '#F97316',
    items: [
      { path: '/app/dashboard', label: 'Analytics', icon: LayoutDashboard, desc: 'Stats & Charts' },
      { path: '/app/skills', label: 'Skill Gap', icon: BookOpen, desc: 'AI Analysis' },
      { path: '/app/eligibility', label: 'Eligibility', icon: UserCheck, desc: 'Company Check' },
    ],
  },
  {
    label: 'PLACEMENT HUB',
    color: '#FACC15',
    items: [
      { path: '/app/records', label: 'Records', icon: Building2, desc: 'Past Data' },
      { path: '/app/drives', label: 'Drives', icon: Briefcase, desc: 'Active Drives' },
      { path: '/app/internships', label: 'Internships', icon: GraduationCap, desc: 'Opportunities' },
    ],
  },
  {
    label: 'COMMUNITY',
    color: '#A3E635',
    items: [
      { path: '/app/experiences', label: 'Interview Vault', icon: Newspaper, desc: 'Read Stories' },
      { path: '/app/add-experience', label: 'Write', icon: PlusCircle, desc: 'Share Yours' },
    ],
  },
  {
    label: 'TOOLS',
    color: '#60A5FA',
    items: [
      { path: '/app/resume', label: 'AI Profiler', icon: Sparkles, desc: 'Resume Match' },
      { path: '/app/help', label: 'Ask SAARTHI', icon: HelpCircle, desc: 'AI Assistant' },
      { path: '/app/notifications', label: 'Alerts', icon: Bell, desc: 'TNP Updates' },
      { path: '/app/about', label: 'About', icon: Info, desc: 'Our Team' },
    ],
  },
];

const allItems = sections.flatMap(s => s.items);

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{"fullName": "User", "department": "Student", "role": "student"}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  // Which section is the current route in?
  const activeSection = sections.findIndex(s =>
    s.items.some(i => location.pathname.startsWith(i.path))
  );

  return (
    <>
      {/* ─── DESKTOP: Wide labeled sidebar ─── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[240px] bg-white border-r-[3px] border-[#0F0F0F] z-40 flex-col overflow-hidden">
        
        {/* ── Brand Header ── */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-5 h-[64px] border-b-[3px] border-[#0F0F0F] cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 bg-[#F97316] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] flex items-center justify-center font-black text-white text-[14px] group-hover:shadow-[1px_1px_0px_#0F0F0F] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all duration-100">
            SN
          </div>
          <div className="leading-none">
            <span className="font-black text-[15px] text-[#0F0F0F] tracking-tight">SAARTHI</span>
            <span className="font-black text-[15px] text-[#F97316] tracking-tight ml-1">NEXUS</span>
          </div>
        </div>

        {/* ── Scrollable Nav ── */}
        <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1 scrollbar-none">
          {sections.map((section, si) => (
            <div key={section.label}>
              {/* Section header */}
              <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
                <div className="w-2 h-2 border-[1.5px] border-[#0F0F0F]" style={{ background: section.color }} />
                <span className="font-black text-[9px] tracking-[0.15em] text-[#888888] select-none">
                  {section.label}
                </span>
                <div className="flex-1 h-[1.5px] bg-[#E5E7EB] ml-1" />
              </div>

              {/* Nav items */}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 mb-0.5 relative group transition-all duration-75 ${
                      isActive
                        ? 'bg-[#FACC15] border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] font-black'
                        : 'border-[2px] border-transparent hover:border-[#0F0F0F] hover:bg-[#FFFBF0]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={16} className={isActive ? 'text-[#0F0F0F]' : 'text-[#888888] group-hover:text-[#F97316]'} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] leading-tight truncate ${isActive ? 'text-[#0F0F0F]' : 'text-[#0F0F0F] font-bold'}`}>
                          {item.label}
                        </div>
                        <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-[#0F0F0F]/60' : 'text-[#888888]'}`}>
                          {item.desc}
                        </div>
                      </div>
                      {isActive && (
                        <ChevronRight size={14} className="text-[#0F0F0F] shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* ── Bottom: User card ── */}
        <div className="shrink-0 border-t-[3px] border-[#0F0F0F] p-3">
          <NavLink
            to="/app/profile"
            className="flex items-center gap-3 px-3 py-2.5 bg-[#FFFBF0] border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 group"
          >
            <div className="w-8 h-8 bg-[#F97316] border-[2px] border-[#0F0F0F] flex items-center justify-center font-black text-white text-[13px] shrink-0 overflow-hidden">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="" className="object-cover w-full h-full" />
              ) : (
                user.fullName?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-[12px] text-[#0F0F0F] truncate">{user.fullName || 'User'}</div>
              <div className="text-[10px] text-[#888888] font-bold truncate">{user.department || 'Student'}</div>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-2 px-3 py-2 w-full text-[#888888] hover:text-[#EF4444] hover:bg-[#FEE2E2] border-[2px] border-transparent hover:border-[#EF4444] font-bold text-[12px] transition-all duration-75"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE: Bottom tab bar ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-[3px] border-[#0F0F0F] h-[60px] flex items-center justify-around px-1">
        {[
          sections[0].items[0],  // Analytics
          sections[1].items[1],  // Drives
          sections[2].items[0],  // Vault
          sections[3].items[1],  // AI Help
          { path: '/app/profile', label: 'Profile', icon: UserCheck },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 transition-all duration-75 ${
                isActive
                  ? 'text-[#0F0F0F]'
                  : 'text-[#888888]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-9 h-9 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#FACC15] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F]'
                    : ''
                }`}>
                  <item.icon size={18} />
                </div>
                <span className={`text-[9px] font-bold ${isActive ? 'text-[#0F0F0F]' : 'text-[#888888]'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ─── MOBILE: Slide-over panel ─── */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-[#0F0F0F]/60 z-40"
            onClick={onClose}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-white border-r-[3px] border-[#0F0F0F] z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b-[3px] border-[#0F0F0F] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#F97316] border-[2px] border-[#0F0F0F] flex items-center justify-center font-black text-white text-[13px]">
                  SN
                </div>
                <span className="font-black text-[14px]">SAARTHI <span className="text-[#F97316]">NEXUS</span></span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-[#FFFBF0] border-[2px] border-[#0F0F0F] flex items-center justify-center hover:bg-[#FCA5A5] transition-colors duration-75"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable nav */}
            <div className="flex-1 overflow-y-auto p-3">
              {sections.map((section) => (
                <div key={section.label} className="mb-2">
                  <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                    <div className="w-2 h-2 border-[1.5px] border-[#0F0F0F]" style={{ background: section.color }} />
                    <span className="font-black text-[9px] tracking-[0.15em] text-[#888888]">{section.label}</span>
                    <div className="flex-1 h-[1.5px] bg-[#E5E7EB]" />
                  </div>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 mb-0.5 transition-all duration-75 ${
                          isActive
                            ? 'bg-[#FACC15] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] font-black'
                            : 'border-[2px] border-transparent hover:bg-[#FFFBF0] text-[#4B4B4B]'
                        }`
                      }
                    >
                      <item.icon size={16} />
                      <div className="flex-1">
                        <div className="text-[13px] font-bold">{item.label}</div>
                        <div className="text-[10px] text-[#888888]">{item.desc}</div>
                      </div>
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom */}
            <div className="shrink-0 border-t-[3px] border-[#0F0F0F] p-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-[#EF4444] hover:bg-[#FEE2E2] font-bold text-[13px] border-[2px] border-transparent hover:border-[#EF4444] transition-all duration-75"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
