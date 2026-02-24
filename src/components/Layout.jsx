import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
import NotificationBar from './NotificationBar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    return (
        <div className="layout-root">
            <NotificationBar />
            {/* Mobile Header */}
            <header className="mobile-header">
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
                <div className="container">
                    <Outlet />
                </div>
            </main>
            <Chatbot />
        </div>
    );
};

export default Layout;
