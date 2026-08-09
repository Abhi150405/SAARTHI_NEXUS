import React, { useState, useEffect, useRef } from 'react';
import { Send, Building, Award, Calendar, PlusCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import { Editor } from '@toast-ui/react-editor';
import { apiFetch, getUser } from '../api';

const pageAnim = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } };

const AddExperience = () => {
    const [companies, setCompanies] = useState([]);
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [filteredCompaniesSuggestions, setFilteredCompaniesSuggestions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const suggestionsRef = useRef(null);
    const editorRef = useRef(null);

    const [interviewForm, setInterviewForm] = useState({
        student_name: '', company_name: '', role: '',
        year: '2024-25', branch: 'CE', graduation_year: '2025',
        rounds: '3', experience: '', suggestions: '', status: 'Selected'
    });

    useEffect(() => {
        fetchInitialData();
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowCompanySuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchInitialData = async () => {
        try {
            const compData = await apiFetch('/api/companies');
            setCompanies(compData);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const handleInterviewSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...interviewForm,
                created_at: new Date().toISOString(),
                formatted_date: new Intl.DateTimeFormat('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long',
                    day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
                }).format(new Date())
            };
            const response = await apiFetch('/api/interview-experience', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (response) {
                setSuccessMessage('Your experience was shared successfully!');
                setInterviewForm({
                    student_name: '', company_name: '', role: '',
                    year: '2024-25', branch: 'CE', graduation_year: '2025',
                    rounds: '3', experience: '', suggestions: '', status: 'Selected'
                });
                setShowCompanySuggestions(false);
                if (editorRef.current) editorRef.current.getInstance().setMarkdown('');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error submitting experience:', error);
        }
    };

    const handleCompanyInputChange = (e) => {
        const val = e.target.value;
        setInterviewForm({ ...interviewForm, company_name: val });
        if (val.trim() === '') {
            setFilteredCompaniesSuggestions([]);
            setShowCompanySuggestions(false);
        } else {
            const filtered = companies.filter(c => c.company.toLowerCase().includes(val.toLowerCase()));
            setFilteredCompaniesSuggestions(filtered);
            setShowCompanySuggestions(true);
        }
    };

    const selectCompanySuggestion = (companyName) => {
        setInterviewForm({ ...interviewForm, company_name: companyName });
        setShowCompanySuggestions(false);
    };

    const inputClass = "w-full bg-white border-[3px] border-[#0F0F0F] px-4 py-3 font-mono text-[14px] text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100 placeholder:text-[#888888]";
    const selectClass = "bg-white border-[3px] border-[#0F0F0F] px-4 py-3 font-mono text-[14px] text-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:outline-none focus:shadow-[3px_3px_0px_#F97316] focus:border-[#F97316] transition-all duration-100";
    const labelClass = "font-black text-[11px] uppercase tracking-widest text-[#0F0F0F] flex items-center gap-2 mb-2";

    return (
        <motion.div {...pageAnim}>
            {/* HEADER */}
            <div className="mb-6">
                <span className="font-black uppercase tracking-widest text-[10px] text-[#888888]">Community Contribution</span>
                <h1 className="font-black text-[32px] tracking-[-0.03em] text-[#0F0F0F]">Share Your Journey</h1>
                <p className="font-medium text-[14px] text-[#4B4B4B]">Help your juniors by documenting your interview or OA experience.</p>
            </div>

            {/* SUCCESS BANNER */}
            {successMessage && (
                <div className="bg-[#A3E635] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-6 py-4 mb-6 font-black text-[14px] text-[#0F0F0F]">
                    ✅ {successMessage}
                </div>
            )}

            {/* FORM */}
            <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[8px_8px_0px_#0F0F0F]">
                <div className="bg-[#FACC15] border-b-[3px] border-[#0F0F0F] px-6 py-4 flex items-center gap-2">
                    <PlusCircle size={18} className="text-[#0F0F0F]" />
                    <h3 className="font-black text-[16px] text-[#0F0F0F]">Post Your Experience</h3>
                </div>

                <form onSubmit={handleInterviewSubmit} className="p-6 lg:p-8 space-y-6">
                    {/* ROW 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}><User size={12} /> Name (Optional)</label>
                            <input type="text" value={interviewForm.student_name}
                                onChange={(e) => setInterviewForm({ ...interviewForm, student_name: e.target.value })}
                                placeholder="Anonymous" className={inputClass}
                            />
                        </div>
                        <div className="relative" ref={suggestionsRef}>
                            <label className={labelClass}><Building size={12} /> Company</label>
                            <input type="text" required value={interviewForm.company_name}
                                onChange={handleCompanyInputChange}
                                onFocus={() => { if (interviewForm.company_name.trim() !== '') setShowCompanySuggestions(true); }}
                                placeholder="Type company name..." autoComplete="off" className={inputClass}
                            />
                            {showCompanySuggestions && filteredCompaniesSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] z-20 max-h-[200px] overflow-y-auto mt-1">
                                    {filteredCompaniesSuggestions.map((c, i) => (
                                        <div key={i} onClick={() => selectCompanySuggestion(c.company)}
                                            className="px-4 py-2.5 font-bold text-[13px] text-[#0F0F0F] hover:bg-[#FACC15] cursor-pointer border-b-[2px] border-[#0F0F0F] last:border-b-0 transition-colors duration-75"
                                        >
                                            {c.company}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ROW 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}><Award size={12} /> Target Role</label>
                            <input type="text" required value={interviewForm.role}
                                onChange={(e) => setInterviewForm({ ...interviewForm, role: e.target.value })}
                                placeholder="e.g. Software Development Engineer" className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}><Calendar size={12} /> Branch & Batch</label>
                            <div className="flex gap-3">
                                <select value={interviewForm.branch}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, branch: e.target.value })}
                                    className={`${selectClass} flex-1`}
                                >
                                    <option value="CE">CE</option>
                                    <option value="IT">IT</option>
                                    <option value="EnTC">EnTC</option>
                                    <option value="AIDS">AI&DS</option>
                                </select>
                                <input type="text" value={interviewForm.graduation_year}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, graduation_year: e.target.value })}
                                    placeholder="2025" className={`${inputClass} flex-1`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ROW 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}><PlusCircle size={12} /> Interview Rounds</label>
                            <input type="number" required value={interviewForm.rounds}
                                onChange={(e) => setInterviewForm({ ...interviewForm, rounds: e.target.value })}
                                placeholder="3" className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}><Calendar size={12} /> Outcome</label>
                            <select value={interviewForm.status}
                                onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })}
                                className={`${selectClass} w-full`}
                            >
                                <option value="Selected">Selected ✅</option>
                                <option value="Rejected">Rejected ❌</option>
                                <option value="In Progress">In Progress ⏳</option>
                            </select>
                        </div>
                    </div>

                    {/* EDITOR */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={labelClass}>The Interview / OA Experience</label>
                            <a href="#/app/template" target="_blank" rel="noopener noreferrer"
                                className="font-black text-[12px] text-[#F97316] hover:text-[#0F0F0F] transition-colors"
                            >
                                Short on ideas? →
                            </a>
                        </div>
                        <div className="border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] overflow-hidden">
                            <Editor
                                ref={editorRef}
                                initialValue={interviewForm.experience}
                                previewStyle="vertical"
                                height="400px"
                                initialEditType="markdown"
                                useCommandShortcut={true}
                                hideModeSwitch={true}
                                theme="dark"
                                onChange={() => {
                                    if (editorRef.current) {
                                        setInterviewForm({ ...interviewForm, experience: editorRef.current.getInstance().getMarkdown() });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* SUGGESTIONS */}
                    <div>
                        <label className={labelClass}>Golden Advice for Juniors</label>
                        <textarea required rows="3" value={interviewForm.suggestions}
                            onChange={(e) => setInterviewForm({ ...interviewForm, suggestions: e.target.value })}
                            placeholder="What core topics should they focus on?"
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* SUBMIT */}
                    <div className="flex justify-end">
                        <button type="submit"
                            className="bg-[#F97316] text-white font-black border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] px-8 py-3 text-[14px] flex items-center gap-2 hover:shadow-[3px_3px_0px_#0F0F0F] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-100"
                        >
                            <Send size={18} /> Publish Experience
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AddExperience;
