import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, TrendingUp, Bell, BarChart2, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureGrid = ({ isAuthenticated, user }) => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        if (isAuthenticated) {
            if (user?.role === 'admin' && path.startsWith('/app/')) {
                navigate('/admin/dashboard');
            } else {
                navigate(path);
            }
        } else {
            navigate('/signup');
        }
    };

    const features = [
        { icon: LayoutDashboard, title: "Live Drive Dashboard", body: "All active drives in one real-time view.", path: "/app/dashboard" },
        { icon: BookOpen, title: "Interview Vault", body: "Peer-reviewed notes from past interview rounds.", path: "/app/experiences" },
        { icon: TrendingUp, title: "Skill Gap Map", body: "Compare your skills against market demand.", path: "/app/skills" },
        { icon: Bell, title: "Smart Alerts", body: "Deadline reminders and drive updates instantly.", path: "/app/notifications" },
        { icon: BarChart2, title: "Placement Analytics", body: "Year-over-year placement stats and trends.", path: "/app/records" },
        { icon: Shield, title: "Admin Control Center", body: "Full CRUD for drives, students, companies.", path: "/admin/dashboard", admin: true }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
    };

    return (
        <section className="bg-[#FACC15] border-t-[3px] border-b-[3px] border-[#0F0F0F] py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-8 relative z-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="text-center mb-16"
                >
                    <span className="inline-block bg-[#0F0F0F] text-[#FACC15] border-[2px] border-[#0F0F0F] font-black uppercase tracking-widest text-[11px] px-3 py-1 mb-6">Platform Overview</span>
                    <h2 className="font-black text-[44px] text-[#0F0F0F] tracking-[-0.03em]">Everything Your Placement Cell Needs</h2>
                    <p className="font-medium text-[17px] text-[#0F0F0F]/60 mt-3">One platform. Every tool your T&P cell needs.</p>
                </motion.div>

                {/* Grid — no gap, shared borders */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid grid-cols-1 md:grid-cols-3"
                >
                    {features.map((card, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            onClick={() => handleNavigation(card.path)}
                            className="bg-white border-[3px] border-[#0F0F0F] -ml-[3px] -mt-[3px] first:ml-0 p-8 cursor-pointer group relative hover:bg-[#F97316] transition-colors duration-100"
                        >
                            {/* Admin badge */}
                            {card.admin && (
                                <div className="absolute top-4 right-4 font-black text-[10px] uppercase tracking-widest text-[#0F0F0F] bg-[#FCA5A5] border-[2px] border-[#0F0F0F] px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                                    Admin Only
                                </div>
                            )}

                            {/* Icon wrapper */}
                            <div className={`w-12 h-12 ${card.admin ? 'bg-[#FCA5A5]' : 'bg-[#FACC15]'} border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center justify-center mb-6 group-hover:bg-white group-hover:shadow-none transition-all duration-100`}>
                                <card.icon size={20} className="text-[#0F0F0F]" />
                            </div>

                            <h3 className="font-black text-[18px] mb-3 text-[#0F0F0F] group-hover:text-white transition-colors duration-100">{card.title}</h3>
                            <p className="font-medium text-[14px] text-[#0F0F0F] opacity-70 group-hover:text-white group-hover:opacity-90 transition-colors duration-100">{card.body}</p>

                            {/* Arrow */}
                            <span className="absolute bottom-6 right-6 font-black text-[20px] text-[#0F0F0F] opacity-0 group-hover:opacity-100 group-hover:text-white transition-all duration-100">→</span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureGrid;
