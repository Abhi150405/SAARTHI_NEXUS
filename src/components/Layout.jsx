import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
import NotificationBar from './NotificationBar';
import Topbar from './Topbar';

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
                        <div className="logo-text-mobile">
                            SAARTHI NEXUS
                        </div>
                    </div>
                    <Link to="/profile" className="mobile-profile-link">
                        <div className="mobile-avatar">{user.fullName?.[0] || 'U'}</div>
                    </Link>
                </div>
            </header>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <Topbar />
                <div className="container">
                    <Outlet />
                </div>
            </main>
            <Chatbot />
        </div>
    );
};

export default Layout;
