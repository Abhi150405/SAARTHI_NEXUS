import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
import NotificationBar from './NotificationBar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="layout-root">
            <NotificationBar />

            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <button
                            className="mobile-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <Link to="/" className="logo-text-mobile">
                            SAARTHI NEXUS
                        </Link>
                    </div>
                    <Link to="/app/profile" className="mobile-profile-link">
                        <div className="mobile-avatar overflow-hidden">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="" className="object-cover w-full h-full" />
                            ) : (
                                user.fullName?.[0] || 'U'
                            )}
                        </div>
                    </Link>
                </div>
            </header>

            {/*
              sidebar-shell is the hover zone.
              It stays 70px wide (icon-only) and expands to 240px on CSS :hover.
              No JS hover state needed — pure CSS handles the expansion.
            */}
            <div className={`sidebar-shell ${sidebarOpen ? 'mobile-open' : ''}`}>
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isCollapsed={true}
                    onToggleSidebar={() => {}}
                />
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content — offset by 70px (collapsed sidebar width) */}
            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>

            <Chatbot />
        </div>
    );
};

export default Layout;
