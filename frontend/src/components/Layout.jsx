import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';
import NotificationBar from './NotificationBar';
import Topbar from './Topbar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const location = useLocation();

    // Determine page title from path
    const getPageTitle = () => {
        const path = location.pathname.split('/').pop();
        const titles = {
            dashboard: 'Analytics Dashboard',
            skills: 'Skill Analysis',
            eligibility: 'Eligibility Checker',
            records: 'Placement Records',
            drives: 'Campus Drives',
            internships: 'Internships',
            experiences: 'Interview Vault',
            'add-experience': 'Share Experience',
            template: 'Experience Template',
            resume: 'AI Resume Profiler',
            help: 'SAARTHI AI',
            notifications: 'TNP Alerts',
            about: 'About Us',
            profile: 'My Profile',
        };
        return titles[path] || 'SAARTHI Nexus';
    };

    return (
        <div className="min-h-screen bg-[#FFFBF0] text-[#0F0F0F] font-sans">
            <NotificationBar />
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main content — offset by sidebar on desktop, bottom dock on mobile */}
            <main className="lg:ml-[240px] pb-20 lg:pb-0 min-h-screen">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center justify-between bg-[#FFFBF0] border-b-[3px] border-[#0F0F0F] px-4 h-14">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-10 h-10 flex items-center justify-center bg-white border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px] transition-all duration-100"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="font-black text-[16px] text-[#0F0F0F]">
                        <span className="text-[#F97316]">S</span>AARTHI
                    </span>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Desktop top bar */}
                <Topbar pageTitle={getPageTitle()} />

                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>

            <Chatbot />
        </div>
    );
};

export default Layout;
