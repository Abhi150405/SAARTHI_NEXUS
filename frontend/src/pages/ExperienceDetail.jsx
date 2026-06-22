import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Award, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_URL } from '../config';

const pageAnim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } };

const ExperienceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exp, setExp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const hasViewed = sessionStorage.getItem(`viewed_exp_${id}`);
                let fetchUrl = `${API_URL}/api/interview-experience/${id}`;
                if (!hasViewed) {
                    fetchUrl += `?increment=true`;
                    sessionStorage.setItem(`viewed_exp_${id}`, 'true');
                }
                const res = await fetch(fetchUrl);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();
                setExp(data);
            } catch (err) {
                setError('Could not load this experience. It may have been removed.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <div className="w-10 h-10 border-[3px] border-[#0F0F0F] border-t-[#F97316] animate-spin mx-auto" />
                <p className="font-mono text-[13px] text-[#888888] mt-4">Loading experience...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="bg-[#FCA5A5] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-8 text-center">
                <p className="font-black text-[16px] text-[#0F0F0F]">⚠️ {error}</p>
            </div>
            <button onClick={() => navigate(-1)} className="bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-5 py-2 text-[13px] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">
                <ArrowLeft size={14} className="inline mr-2" /> Go Back
            </button>
        </div>
    );

    const initial = exp.student_name ? exp.student_name.charAt(0).toUpperCase() : 'U';
    const isSelected = exp.status?.toLowerCase() === 'selected';
    const displayDate = exp.formatted_date || (exp.created_at
        ? new Intl.DateTimeFormat('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
          }).format(new Date(exp.created_at))
        : 'Date not recorded');

    return (
        <motion.div {...pageAnim}>
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-5 py-2 text-[13px] flex items-center gap-2 hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
            >
                <ArrowLeft size={16} /> Back to Community
            </button>

            {/* HERO CARD */}
            <div className="bg-[#FACC15] border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F] mb-8">
                <div className="p-6 lg:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-[#F97316] border-[3px] border-[#0F0F0F] flex items-center justify-center font-black text-[22px] text-white flex-shrink-0 shadow-[3px_3px_0px_#0F0F0F]">
                            {initial}
                        </div>
                        <div className="flex-1">
                            <h1 className="font-black text-[28px] text-[#0F0F0F] leading-tight">{exp.student_name || 'Anonymous'}</h1>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[12px] text-[#4B4B4B] mt-1">
                                <span>🎓 {exp.branch || 'CE'} {exp.graduation_year || exp.year || '2025'}</span>
                                <span>🏢 {exp.company_name}</span>
                                <span>💼 {exp.role}</span>
                                <span>👁️ {exp.reads || 0} Reads</span>
                            </div>
                        </div>
                        <span className={`inline-block font-black uppercase text-[12px] border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] px-4 py-1.5 flex-shrink-0 ${
                            isSelected ? 'bg-[#A3E635] text-[#0F0F0F]' : 'bg-[#FCA5A5] text-[#0F0F0F]'
                        }`}>
                            {exp.status || 'Selected'}
                        </span>
                    </div>

                    {/* Meta badges */}
                    <div className="flex flex-wrap gap-2 mt-5">
                        {[
                            { icon: Building2, text: exp.company_name },
                            { icon: Award, text: exp.role },
                            { icon: Calendar, text: `Batch ${exp.year || '2024'}` },
                            exp.rounds && { icon: RefreshCw, text: `${exp.rounds} Round${exp.rounds > 1 ? 's' : ''}` },
                            exp.branch && { icon: User, text: exp.branch },
                        ].filter(Boolean).map((badge, i) => (
                            <span key={i} className="bg-[#0F0F0F] text-[#FACC15] font-black text-[10px] uppercase tracking-wide px-3 py-1 flex items-center gap-1.5 border-[2px] border-[#0F0F0F]">
                                <badge.icon size={12} /> {badge.text}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN BODY */}
            <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] mb-6">
                <div className="bg-[#F97316] border-b-[3px] border-[#0F0F0F] px-6 py-3">
                    <span className="font-black text-[14px] text-white">📝 Interview Experience</span>
                </div>
                <div className="p-6 lg:p-8 prose prose-sm max-w-none text-[#4B4B4B]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {exp.experience || '_No experience details provided._'}
                    </ReactMarkdown>
                </div>
            </div>

            {/* PRO TIP */}
            {exp.suggestions && (
                <div className="bg-[#A3E635] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] mb-6">
                    <div className="bg-[#0F0F0F] border-b-[3px] border-[#0F0F0F] px-6 py-3">
                        <span className="font-black text-[14px] text-[#A3E635]">💡 Pro-Tip for Juniors</span>
                    </div>
                    <div className="p-6">
                        <p className="font-medium text-[14px] text-[#0F0F0F] leading-relaxed">{exp.suggestions}</p>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="bg-[#FFFBF0] border-[3px] border-[#0F0F0F] px-6 py-4 flex items-center justify-between">
                <span className="font-mono text-[12px] text-[#888888]">🕐 {displayDate}</span>
                <button
                    onClick={() => navigate('/app/experiences')}
                    className="bg-[#FACC15] text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] px-4 py-1.5 text-[12px] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                >
                    Back to Vault
                </button>
            </div>
        </motion.div>
    );
};

export default ExperienceDetail;
