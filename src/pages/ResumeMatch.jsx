import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCheck, AlertCircle, Briefcase, Zap, Star, Layout, BookOpen, Clock } from 'lucide-react';
import { API_URL } from '../config';
import '../styles/ResumeMatch.css';

const ResumeMatch = () => {
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) setFile(droppedFile);
    };

    const handleFileUpload = async () => {
        if (!file || !user.email) return;

        setAnalyzing(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('email', user.email);

        try {
            const response = await fetch(`${API_URL}/api/upload-resume`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data.analysis);
                // Also update local storage with new skills if needed, 
                // but better to let profile page fetch it
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
        <div className="resume-match-page animate-fade-in">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20">
                        <Zap size={24} className="text-[#F97316]" />
                    </div>
                    <div>
                        <h2 className="page-title">AI Skill Extractor</h2>
                        <p className="page-subtitle">Upload your resume to automatically extract skills and update your profile</p>
                    </div>
                </div>
            </div>

            <div className="match-container mt-8">
                <div className="upload-section">
                    <div className="card full-height glass-premium">
                        <div className="flex items-center gap-2 mb-6">
                            <UploadCloud size={20} className="text-[#F97316]" />
                            <h3 className="text-lg font-bold">Resume Upload</h3>
                        </div>

                        <div
                            className={`dropzone ${file ? 'has-file' : ''}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            {file ? (
                                <div className="file-preview">
                                    <div className="relative">
                                        <FileText size={64} className="text-[#F97316]" />
                                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-[#111]">
                                            <CheckCheck size={12} className="text-white" />
                                        </div>
                                    </div>
                                    <p className="file-name font-mono">{file.name}</p>
                                    <button className="btn-text hover:text-red-500" onClick={() => { setFile(null); setResult(null); setError(null); }}>
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-placeholder flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-4">
                                        <UploadCloud size={32} className="text-[#F97316]" />
                                    </div>
                                    <p className="text-gray-200 font-semibold mb-1">Drag & drop your resume here</p>
                                    <p className="text-gray-500 text-sm mb-4">Supports PDF, DOCX or TXT (Max 5MB)</p>
                                    
                                    <div className="px-6 py-2.5 rounded-xl bg-[#F97316] text-black text-sm font-bold shadow-lg shadow-[#F97316]/20 transition-all">
                                        Browse from Device
                                    </div>
                                </div>
                            )}
                            {!file && (
                                <input
                                    type="file"
                                    className="file-input"
                                    accept=".pdf,.docx,.txt"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            className="btn btn-primary full-width-btn mt-6"
                            onClick={handleFileUpload}
                            disabled={!file || analyzing}
                        >
                            {analyzing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
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
                </div>

                <div className="result-section">
                    {result ? (
                        <div className="analysis-results space-y-6">
                            <div className="card glass-premium animate-fade-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <Star size={20} className="text-[#F97316]" />
                                    <h3 className="text-lg font-bold">Extracted Skills</h3>
                                </div>
                                <div className="keywords-list">
                                    {result.skills.map((kw, i) => (
                                        <span key={i} className="keyword-tag">{kw}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="card glass-premium animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Layout size={20} className="text-[#3B82F6]" />
                                    <h3 className="text-lg font-bold">Profile Summary</h3>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed italic">
                                    "{result.summary}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="card glass-premium animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={16} className="text-[#F97316]" />
                                        <h4 className="font-bold text-sm">Experience</h4>
                                    </div>
                                    <p className="text-2xl font-bold text-[#F97316]">{result.experience_years} <span className="text-xs uppercase text-gray-500">Years</span></p>
                                </div>
                                <div className="card glass-premium animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen size={16} className="text-[#22C55E]" />
                                        <h4 className="font-bold text-sm">Education</h4>
                                    </div>
                                    <p className="text-sm font-medium text-white truncate">{result.education}</p>
                                </div>
                            </div>

                            <div className="card glass-premium animate-fade-in" style={{ animationDelay: '0.4s' }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Briefcase size={20} className="text-yellow-500" />
                                    <h3 className="text-lg font-bold">Key Achievements</h3>
                                </div>
                                <ul className="space-y-3">
                                    {result.key_achievements.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-1.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state card glass-premium center-content min-h-[400px]">
                            <div className="p-6 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] mb-6">
                                <FileText size={48} className="text-[#2A2A2A]" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">AI Analysis Ready</h3>
                            <p className="max-w-[280px] mx-auto text-gray-500 text-sm">
                                Upload your resume to see the power of AI extraction. Your technical skills, experience and achievements will be automatically populated.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeMatch;
