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
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section className="bg-[#111111] border-t border-[#1F1F1F] border-b py-32 relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F97316]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-[960px] mx-auto px-6 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="text-[11px] font-[500] text-[#F97316] uppercase tracking-[0.1em] mb-3 block">Platform Overview</span>
                    <h2 className="text-[36px] font-bold text-[#F5F5F5] tracking-[-0.02em] mt-2 mb-4">Everything Your Placement Cell Needs</h2>
                    <p className="text-[16px] text-[#A3A3A3]">One platform. Every tool your T&P cell needs.</p>
                </motion.div>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {features.map((card, idx) => (
                        <motion.div 
                            key={idx} 
                            variants={itemVariants}
                            onClick={() => handleNavigation(card.path)} 
                            className="card group cursor-pointer"
                        >
                            {card.admin && (
                                <div className="absolute top-4 right-4 text-[10px] font-semibold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/25 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    Admin Only
                                </div>
                            )}
                            <div className="mb-6 transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 w-fit p-3 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]">
                                <card.icon size={20} className={card.admin ? "text-[#EF4444]" : "text-[#F97316]"} />
                            </div>
                            <h3 className="text-[16px] font-semibold text-[#F5F5F5] mb-2">{card.title}</h3>
                            <p className="text-[14px] text-[#A3A3A3] leading-relaxed">{card.body}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureGrid;
