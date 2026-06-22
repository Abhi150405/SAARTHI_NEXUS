import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MessageSquare, User, Calendar, Search, TrendingUp,
    Quote, BarChart3, ClipboardList, ArrowUpDown
} from 'lucide-react';
import { API_URL } from '../config';

const pageAnim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } };

const Experiences = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('interview');
    const [companies, setCompanies] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [feedbackSearch, setFeedbackSearch] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [selectedCompany, setSelectedCompany] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedBranch, setSelectedBranch] = useState('All');

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        try {
            const compRes = await fetch(`${API_URL}/api/companies`);
            const compData = await compRes.json();
            setCompanies(compData);
            const expRes = await fetch(`${API_URL}/api/interview-experience`);
            const expData = await expRes.json();
            setExperiences(expData);
            const fbRes = await fetch(`${API_URL}/api/company-feedback`);
            const fbData = await fbRes.json();
            setFeedbacks(fbData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const filteredExperiences = experiences.filter(exp => {
        const matchesSearch = (exp.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               exp.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               exp.student_name?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCompany = selectedCompany === 'All' || exp.company_name === selectedCompany;
        const matchesYear = selectedYear === 'All' || String(exp.year) === selectedYear;
        const matchesBranch = selectedBranch === 'All' || exp.branch === selectedBranch;
        return matchesSearch && matchesCompany && matchesYear && matchesBranch;
    });

    const uniqueCompanies = ['All', ...new Set(experiences.map(exp => exp.company_name).filter(Boolean))].sort();
    const uniqueYears = ['All', ...new Set(experiences.map(exp => String(exp.year)).filter(Boolean))].sort((a,b) => b.localeCompare(a));
    const uniqueBranches = ['All', ...new Set(experiences.map(exp => exp.branch).filter(Boolean))].sort();

    const sortedExperiences = [...filteredExperiences].sort((a, b) => {
        if (sortBy === 'latest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        if (sortBy === 'year') return String(b.year || '').localeCompare(String(a.year || ''));
        if (sortBy === 'company') return (a.company_name || '').localeCompare(b.company_name || '');
        if (sortBy === 'branch') return (a.branch || '').localeCompare(b.branch || '');
        return 0;
    });

    const filteredFeedbacks = feedbacks.filter(fb =>
        fb.company_name.toLowerCase().includes(feedbackSearch.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="w-10 h-10 border-[3px] border-[#0F0F0F] border-t-[#F97316] animate-spin mx-auto" />
                <p className="font-mono text-[13px] text-[#888888] mt-4">Gathering Community Insights...</p>
            </div>
        </div>
    );

    return (
        <motion.div {...pageAnim}>
            {/* MASTHEAD */}
            <div className="bg-[#0F0F0F] -mx-4 lg:-mx-8 -mt-4 lg:-mt-8 px-6 lg:px-8 py-8 border-b-[3px] border-[#0F0F0F] mb-8">
                <span className="font-black uppercase tracking-widest text-[10px] text-[#F97316]">Community</span>
                <h1 className="font-black text-[36px] lg:text-[48px] text-[#FACC15] tracking-[-0.04em] leading-tight">INTERVIEW VAULT</h1>
                <p className="font-mono text-[13px] text-white/40 mt-1">Peer-sourced · Verified · Brutally Honest</p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-0 border-[3px] border-[#0F0F0F] mb-8">
                {[
                    { icon: MessageSquare, value: experiences.length, label: 'Total Journeys', bg: 'bg-[#FACC15]' },
                    { icon: TrendingUp, value: experiences.filter(e => e.status === 'Selected').length, label: 'Success Stories', bg: 'bg-[#A3E635]' },
                    { icon: ClipboardList, value: feedbacks.length, label: 'Industry Reports', bg: 'bg-[#F97316]' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-5 flex items-center gap-3 ${i < 2 ? 'border-r-[3px] border-[#0F0F0F]' : ''}`}>
                        <div className="w-10 h-10 bg-[#0F0F0F] flex items-center justify-center flex-shrink-0">
                            <stat.icon size={18} className="text-[#FACC15]" />
                        </div>
                        <div>
                            <div className="font-black text-[24px] text-[#0F0F0F] leading-none">{stat.value}</div>
                            <div className="font-black text-[10px] uppercase tracking-widest text-[#0F0F0F]">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TABS */}
            <div className="flex gap-0 mb-6 border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F]">
                {[
                    { key: 'interview', label: 'Interview Experiences', icon: Quote },
                    { key: 'feedback', label: 'Feedback from Industry', icon: BarChart3 },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-3 font-black text-[13px] uppercase tracking-wide flex items-center justify-center gap-2 transition-colors duration-75 ${
                            tab.key === 'interview' ? 'border-r-[3px] border-[#0F0F0F]' : ''
                        } ${activeTab === tab.key ? 'bg-[#F97316] text-white' : 'bg-white hover:bg-[#FEF08A] text-[#0F0F0F]'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'interview' ? (
                <>
                    {/* SEARCH + FILTER ROW */}
                    <div className="bg-[#FFFBF0] border-[3px] border-[#0F0F0F] p-4 mb-6 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                        <div className="relative flex-1 max-w-[360px]">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
                            <input
                                type="text"
                                placeholder="Search by company, role or student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white border-[3px] border-[#0F0F0F] pl-9 pr-4 py-2 font-mono text-[13px] text-[#0F0F0F] w-full shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100 placeholder:text-[#888888]"
                            />
                        </div>
                        {[
                            { value: selectedCompany, onChange: setSelectedCompany, options: uniqueCompanies, label: 'Company' },
                            { value: selectedYear, onChange: setSelectedYear, options: uniqueYears, label: 'Batch' },
                            { value: selectedBranch, onChange: setSelectedBranch, options: uniqueBranches, label: 'Branch' },
                        ].map((f, i) => (
                            <select
                                key={i}
                                value={f.value}
                                onChange={(e) => f.onChange(e.target.value)}
                                className="bg-white border-[3px] border-[#0F0F0F] px-3 py-2 font-mono text-[13px] text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100"
                            >
                                {f.options.map(o => <option key={o} value={o}>{o === 'All' ? `All ${f.label}` : o}</option>)}
                            </select>
                        ))}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-[#FACC15] border-[3px] border-[#0F0F0F] px-3 py-2 font-black text-[12px] text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none"
                        >
                            <option value="latest">Latest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="year">Sort by Year</option>
                            <option value="company">Sort by Company</option>
                            <option value="branch">Sort by Branch</option>
                        </select>
                    </div>

                    {/* EXPERIENCE CARDS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {sortedExperiences.length > 0 ? sortedExperiences.map((exp, i) => {
                            const initial = exp.student_name ? exp.student_name.charAt(0).toUpperCase() : 'U';
                            const isSelected = exp.status?.toLowerCase() === 'selected';
                            const displayDate = exp.formatted_date || (exp.created_at ? new Intl.DateTimeFormat('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            }).format(new Date(exp.created_at)) : '');

                            return (
                                <div key={i} className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F]">
                                    {/* Header band */}
                                    <div className="bg-[#FACC15] border-b-[3px] border-[#0F0F0F] px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-black text-[20px] text-[#0F0F0F]">{exp.company_name}</div>
                                            <div className="font-mono text-[13px] text-[#4B4B4B]">{exp.role}</div>
                                        </div>
                                        <span className={`inline-block font-black uppercase text-[11px] border-[2px] border-[#0F0F0F] px-3 py-1 ${
                                            isSelected ? 'bg-[#A3E635] text-[#0F0F0F]' : 'bg-[#FCA5A5] text-[#0F0F0F]'
                                        }`}>
                                            {exp.status || 'Selected'}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="px-6 py-5">
                                        {/* Tags */}
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            {[
                                                `Batch: ${exp.year || '2024'}`,
                                                `Branch: ${exp.branch || 'CE'}`,
                                                `Rounds: ${exp.rounds || '2'}`,
                                            ].map((tag, j) => (
                                                <span key={j} className="bg-[#FFFBF0] border-[2px] border-[#0F0F0F] font-black text-[10px] uppercase px-2 py-0.5 text-[#0F0F0F]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Experience text */}
                                        <p className="font-medium text-[14px] text-[#4B4B4B] leading-relaxed">
                                            {exp.experience?.length > 200 ? exp.experience.substring(0, 200) + '...' : exp.experience}
                                        </p>
                                        <button
                                            onClick={() => navigate(`/app/experience/${exp._id}`)}
                                            className="mt-3 font-black text-[12px] text-[#F97316] uppercase tracking-wide hover:text-[#0F0F0F] transition-colors"
                                        >
                                            Read More →
                                        </button>
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t-[3px] border-[#0F0F0F] px-6 py-3 flex justify-between items-center">
                                        <div className="bg-[#0F0F0F] text-[#FACC15] font-black text-[11px] px-3 py-1 border-[2px] border-[#0F0F0F] flex items-center gap-2">
                                            <span className="w-5 h-5 bg-[#FACC15] text-[#0F0F0F] flex items-center justify-center text-[10px] font-black">{initial}</span>
                                            {exp.student_name || 'Anonymous'}
                                        </div>
                                        <span className="font-mono text-[11px] text-[#888888]">{displayDate}</span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-2 bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-12 text-center">
                                <p className="font-mono text-[14px] text-[#888888]">No experiences match your search.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* FEEDBACK TAB */
                <>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="font-black text-[20px] text-[#0F0F0F] flex items-center gap-2"><BarChart3 size={20} /> Feedback from Industry</h2>
                            <p className="font-medium text-[13px] text-[#4B4B4B]">Performance assessments published by the T&P Cell</p>
                        </div>
                        <div className="relative max-w-[300px] w-full">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
                            <input
                                type="text"
                                placeholder="Search by company name..."
                                value={feedbackSearch}
                                onChange={(e) => setFeedbackSearch(e.target.value)}
                                className="bg-white border-[3px] border-[#0F0F0F] pl-9 pr-4 py-2 font-mono text-[13px] text-[#0F0F0F] w-full shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100 placeholder:text-[#888888]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredFeedbacks.length > 0 ? filteredFeedbacks.map((fb, i) => {
                            const appeared = fb.students_appeared || {};
                            const observations = fb.overall_observation || {};
                            const observationLabelsMap = {
                                aptitude: 'Aptitude', soft_skills: 'Soft Skills', communication_skills: 'Communication',
                                basic_concepts: 'Basic Concepts', programming: 'Programming', problem_solving: 'Problem Solving',
                                tech_trends_awareness: 'Tech Trends'
                            };
                            const ratingLabels = ['Poor', 'Average', 'Good', 'Very Good', 'Excellent'];

                            return (
                                <div key={i} className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F]">
                                    {/* Header */}
                                    <div className="bg-[#F97316] border-b-[3px] border-[#0F0F0F] px-6 py-4">
                                        <h3 className="font-black text-[20px] text-white">{fb.company_name}</h3>
                                        <div className="flex gap-3 mt-1">
                                            <span className="bg-[#0F0F0F] text-[#FACC15] font-black text-[10px] uppercase px-2 py-0.5 flex items-center gap-1">
                                                <User size={10} /> {fb.admin_name || 'TNP Admin'}
                                            </span>
                                            <span className="bg-[#0F0F0F] text-[#FACC15] font-black text-[10px] uppercase px-2 py-0.5 flex items-center gap-1">
                                                <Calendar size={10} /> {fb.date ? new Date(fb.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-5">
                                        {/* Students Appeared */}
                                        <div>
                                            <h4 className="font-black text-[11px] uppercase tracking-widest text-[#888888] border-b-[2px] border-[#0F0F0F] pb-2 mb-3">Students Appeared</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { label: 'Aptitude Test', val: appeared.aptitude_test },
                                                    { label: 'Technical Test', val: appeared.technical_test },
                                                    { label: 'Technical Interview', val: appeared.technical_interview },
                                                    { label: 'HR Interview', val: appeared.hr_interview }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="flex justify-between bg-[#FFFBF0] border-[2px] border-[#0F0F0F] px-3 py-2">
                                                        <span className="font-mono text-[11px] text-[#4B4B4B]">{item.label}</span>
                                                        <span className="font-black text-[13px] text-[#0F0F0F]">{item.val || 0}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Observations */}
                                        <div>
                                            <h4 className="font-black text-[11px] uppercase tracking-widest text-[#888888] border-b-[2px] border-[#0F0F0F] pb-2 mb-3">Overall Observation</h4>
                                            {Object.entries(observationLabelsMap).map(([key, label]) => {
                                                const rating = observations[key] || 0;
                                                return (
                                                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-[#E5E7EB]">
                                                        <span className="font-medium text-[12px] text-[#4B4B4B]">{label}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <div key={n} className={`w-3 h-3 border-[1.5px] border-[#0F0F0F] ${n <= rating ? 'bg-[#F97316]' : 'bg-[#F5F5F5]'}`} />
                                                            ))}
                                                            <span className="font-mono text-[10px] text-[#888888] ml-1 w-16">{rating > 0 ? ratingLabels[rating - 1] : '—'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Remarks */}
                                        {fb.training_suggestions && (
                                            <div className="bg-[#FEF08A] border-[2px] border-[#0F0F0F] p-3">
                                                <span className="font-black text-[10px] uppercase tracking-widest text-[#0F0F0F]">Training Suggestions</span>
                                                <p className="font-medium text-[13px] text-[#4B4B4B] mt-1">{fb.training_suggestions}</p>
                                            </div>
                                        )}
                                        {fb.industry_institute_remarks && (
                                            <div className="bg-[#FFFBF0] border-[2px] border-[#0F0F0F] p-3">
                                                <span className="font-black text-[10px] uppercase tracking-widest text-[#0F0F0F]">Industry-Institute Gap Remark</span>
                                                <p className="font-medium text-[13px] text-[#4B4B4B] mt-1">{fb.industry_institute_remarks}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-2 bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-12 text-center">
                                <ClipboardList size={40} className="mx-auto text-[#888888] mb-3" />
                                <h3 className="font-black text-[16px] text-[#0F0F0F]">{feedbackSearch ? 'No reports match your search' : 'No industry feedback published yet'}</h3>
                                <p className="font-medium text-[13px] text-[#888888] mt-1">The T&P Cell will publish company feedback reports here after each placement drive.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default Experiences;
