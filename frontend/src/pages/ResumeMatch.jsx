import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCcw, Sparkles, Briefcase, Zap, Star, Layout, BookOpen, Clock, FolderGit2, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_URL } from '../config';
import { apiFetch, getUser } from '../api';
import '../styles/ResumeMatch.css';

const pageAnim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } };

const ResumeMatch = () => {
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    };

    const handleFileUpload = async () => {
        const user = getUser();
        if (!user || !user.email) {
            setError('User session not found.');
            return;
        }

        if (!file) return;

        setAnalyzing(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', user.email);

        try {
            const response = await apiFetch('/api/upload-resume', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data.analysis);
            } else {
                setError(data.detail || 'Analysis failed. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please check if backend is running.');
            console.error('Resume upload error:', err);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <motion.div {...pageAnim}>
            {/* HEADER */}
            <div className="mb-8">
                <span className="font-black uppercase tracking-widest text-[10px] text-[#888888]">AI Profiler</span>
                <h1 className="font-black text-[32px] tracking-[-0.03em] text-[#0F0F0F]">AI Skill Extractor</h1>
                <p className="font-medium text-[14px] text-[#4B4B4B]">Upload your resume to automatically extract skills and update your profile.</p>
            </div>

            {/* MAIN 2-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-[3px] border-[#0F0F0F]">
                {/* LEFT — DROP ZONE */}
                <div className="bg-[#FFFBF0] border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-[#0F0F0F] p-8 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-[#F97316] border-[2px] border-[#0F0F0F] flex items-center justify-center">
                            <UploadCloud size={16} className="text-white" />
                        </div>
                        <h3 className="font-black text-[16px] text-[#0F0F0F]">Resume Upload</h3>
                    </div>

                    <div
                        className={`relative flex-1 min-h-[300px] border-[3px] border-dashed border-[#0F0F0F] p-12 flex flex-col items-center justify-center transition-colors duration-100 ${
                            file ? 'bg-[#A3E635]/10' : 'hover:bg-[#FEF08A]'
                        }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="flex flex-col items-center text-center">
                                {/* File name stamp */}
                                <div className="bg-[#A3E635] border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] px-4 py-2 mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-[#0F0F0F]" />
                                    <span className="font-black text-[13px] text-[#0F0F0F]">{file.name}</span>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setResult(null); setError(null); }}
                                    className="font-bold text-[12px] text-[#EF4444] hover:text-[#B91C1C] transition-colors"
                                >
                                    Remove File
                                </button>

                                {/* Progress bar (when analyzing) */}
                                {analyzing && (
                                    <div className="w-full mt-6">
                                        <div className="bg-[#F5F5F5] border-[2px] border-[#0F0F0F] h-6 w-full relative overflow-hidden">
                                            <div className="bg-[#F97316] h-full animate-pulse" style={{ width: '87%' }} />
                                            <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-[11px] text-[#0F0F0F]">
                                                ANALYZING...
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <UploadCloud size={48} className="text-[#0F0F0F] mb-4" />
                                <p className="font-black text-[20px] text-[#0F0F0F] mb-1">DRAG YOUR RESUME</p>
                                <p className="font-mono text-[13px] text-[#888888] mb-6">PDF or DOCX · Max 5MB</p>
                                <label className="bg-[#FACC15] text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-5 py-2.5 text-[14px] cursor-pointer hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100">
                                    Browse from Device
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx,.txt"
                                        onChange={(e) => setFile(e.target.files[0])}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 bg-[#FCA5A5] border-[2px] border-[#0F0F0F] px-4 py-3 flex items-center gap-3">
                            <AlertCircle size={16} className="text-[#0F0F0F]" />
                            <span className="font-bold text-[13px] text-[#0F0F0F]">{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleFileUpload}
                        disabled={!file || analyzing}
                        className="mt-6 w-full bg-[#F97316] text-white font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-5 py-3 text-[14px] flex items-center justify-center gap-2 hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {analyzing ? (
                            <>
                                <div className="w-4 h-4 border-[2px] border-white/30 border-t-white animate-spin" />
                                Extracting Skills...
                            </>
                        ) : (
                            <>
                                <Zap size={18} />
                                Start AI Extraction
                            </>
                        )}
                    </button>
                </div>

                {/* RIGHT — SCORE BOARD */}
                <div className="bg-[#0F0F0F] p-8 min-h-[400px]">
                    {result ? (
                        <div className="space-y-6">
                            {/* Extracted Skills */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Star size={16} className="text-[#F97316]" />
                                    <h3 className="font-black text-[16px] text-white">Extracted Skills</h3>
                                </div>
                                <div className="flex gap-2 overflow-x-auto border-t border-b border-[#333333] py-3 flex-wrap">
                                    {result.skills.map((kw, i) => (
                                        <span key={i} className="bg-[#A3E635] border-[2px] border-[#FACC15] font-black text-[11px] uppercase text-[#0F0F0F] px-3 py-1 flex-shrink-0">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Profile Summary */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Layout size={16} className="text-[#60A5FA]" />
                                    <h3 className="font-black text-[16px] text-white">Profile Summary</h3>
                                </div>
                                <p className="font-medium text-[13px] text-[#A3A3A3] leading-relaxed italic border-l-[3px] border-[#F97316] pl-4">
                                    "{result.summary}"
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-0 border-[2px] border-[#333333]">
                                <div className="p-4 border-r-[2px] border-[#333333]">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Clock size={12} className="text-[#F97316]" />
                                        <span className="font-black text-[10px] uppercase tracking-widest text-[#888888]">Experience</span>
                                    </div>
                                    <p className="font-black text-[28px] text-[#F97316]">{result.experience_years} <span className="text-[11px] uppercase text-[#888888]">Years</span></p>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <BookOpen size={12} className="text-[#A3E635]" />
                                        <span className="font-black text-[10px] uppercase tracking-widest text-[#888888]">Education</span>
                                    </div>
                                    <p className="font-bold text-[13px] text-white truncate">{result.education}</p>
                                </div>
                            </div>

                            {/* Key Projects */}
                            {((result.projects && result.projects.length > 0) || (result.key_projects && result.key_projects.length > 0)) && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <FolderGit2 size={16} className="text-[#A3E635]" />
                                        <span className="font-black uppercase tracking-widest text-[12px] text-[#A3E635]">Key Projects</span>
                                    </div>
                                    <div className="space-y-2">
                                        {(result.projects || result.key_projects || []).map((item, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-[#A3E635] border border-[#0F0F0F] mt-1.5 flex-shrink-0" />
                                                <span className="font-mono text-[13px] text-[#D4D4D4]">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Key Achievements */}
                            {result.key_achievements && result.key_achievements.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Trophy size={16} className="text-[#FACC15]" />
                                        <span className="font-black uppercase tracking-widest text-[12px] text-[#F97316]">Key Achievements</span>
                                    </div>
                                    <div className="space-y-2">
                                        {result.key_achievements.map((item, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-[#F97316] border border-[#0F0F0F] mt-1.5 flex-shrink-0" />
                                                <span className="font-mono text-[13px] text-[#A3A3A3]">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[350px]">
                            <div className="w-16 h-16 bg-[#1A1A1A] border-[2px] border-[#333333] flex items-center justify-center mb-6">
                                <FileText size={32} className="text-[#333333]" />
                            </div>
                            <h3 className="font-black text-[18px] text-[#F5F5F5] mb-2">AI Analysis Ready</h3>
                            <p className="font-mono text-[13px] text-[#888888] text-center max-w-[280px]">
                                Upload your resume to see the power of AI extraction. Skills, experience and achievements will be automatically populated.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ResumeMatch;
