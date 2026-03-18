import React, { useState, useEffect, useRef } from 'react';
import { User, Building, Award, Calendar, Send, PlusCircle } from 'lucide-react';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import { Editor } from '@toast-ui/react-editor';
import { API_URL } from '../config';
import '../styles/Experiences.css';

const AddExperience = () => {
    const [companies, setCompanies] = useState([]);
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [filteredCompaniesSuggestions, setFilteredCompaniesSuggestions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const suggestionsRef = useRef(null);
    const editorRef = useRef(null);

    const [interviewForm, setInterviewForm] = useState({
        student_name: '',
        company_name: '',
        role: '',
        year: '2024-25',
        branch: 'CE',
        graduation_year: '2025',
        rounds: '3',
        experience: '',
        suggestions: '',
        status: 'Selected'
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
            const compRes = await fetch(`${API_URL}/api/companies`);
            const compData = await compRes.json();
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
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                }).format(new Date())
            };

            const response = await fetch(`${API_URL}/api/interview-experience`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                setSuccessMessage('Your experience was shared successfully!');
                setInterviewForm({
                    student_name: '',
                    company_name: '',
                    role: '',
                    year: '2024-25',
                    branch: 'CE',
                    graduation_year: '2025',
                    rounds: '3',
                    experience: '',
                    suggestions: '',
                    status: 'Selected'
                });
                setShowCompanySuggestions(false);
                if (editorRef.current) {
                    editorRef.current.getInstance().setMarkdown('');
                }
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
            const filtered = companies.filter(c => 
                c.company.toLowerCase().includes(val.toLowerCase())
            );
            setFilteredCompaniesSuggestions(filtered);
            setShowCompanySuggestions(true);
        }
    };

    const selectCompanySuggestion = (companyName) => {
        setInterviewForm({ ...interviewForm, company_name: companyName });
        setShowCompanySuggestions(false);
    };

    return (
        <div className="experiences-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Share Your Journey</h1>
                    <p className="page-subtitle">Help your juniors by documenting your interview or OA experience.</p>
                </div>
            </div>

            {successMessage && <div className="success-banner animate-bounce-in">{successMessage}</div>}

            <div className="content-layout add-experience-layout">
                <main className="form-section card full-width-form">
                    <form onSubmit={handleInterviewSubmit}>
                        <h3><PlusCircle className="icon-primary" /> Post Your Experience</h3>
                        
                        <div className="form-grid">
                            <div className="input-group">
                                <label><User size={14} /> Name (Optional)</label>
                                <input
                                    type="text"
                                    value={interviewForm.student_name}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, student_name: e.target.value })}
                                    placeholder="Anonymous"
                                />
                            </div>
                            <div className="input-group" ref={suggestionsRef}>
                                <label><Building size={14} /> Company</label>
                                <input
                                    type="text"
                                    required
                                    value={interviewForm.company_name}
                                    onChange={handleCompanyInputChange}
                                    onFocus={() => {
                                        if (interviewForm.company_name.trim() !== '') {
                                            setShowCompanySuggestions(true);
                                        }
                                    }}
                                    placeholder="Type company name..."
                                    autoComplete="off"
                                />
                                {showCompanySuggestions && filteredCompaniesSuggestions.length > 0 && (
                                    <div className="suggestions-list">
                                        {filteredCompaniesSuggestions.map((c, i) => (
                                            <div 
                                                key={i} 
                                                className="suggestion-item"
                                                onClick={() => selectCompanySuggestion(c.company)}
                                            >
                                                {c.company}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="input-group">
                                <label><Award size={14} /> Target Role</label>
                                <input
                                    type="text"
                                    required
                                    value={interviewForm.role}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, role: e.target.value })}
                                    placeholder="e.g. Software Development Engineer"
                                />
                            </div>
                            <div className="input-group">
                                <label><Calendar size={14} /> Branch & Batch</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        style={{ flex: 1 }}
                                        value={interviewForm.branch}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, branch: e.target.value })}
                                    >
                                        <option value="CE">CE</option>
                                        <option value="IT">IT</option>
                                        <option value="EnTC">EnTC</option>
                                        <option value="AIDS">AI&DS</option>
                                    </select>
                                    <input
                                        type="text"
                                        style={{ flex: 1 }}
                                        value={interviewForm.graduation_year}
                                        onChange={(e) => setInterviewForm({ ...interviewForm, graduation_year: e.target.value })}
                                        placeholder="Grad. Year (e.g. 2025)"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="input-group">
                                <label><PlusCircle size={14} /> Interview Rounds</label>
                                <input
                                    type="number"
                                    required
                                    value={interviewForm.rounds}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, rounds: e.target.value })}
                                    placeholder="Number of rounds (e.g. 3)"
                                />
                            </div>
                            <div className="input-group">
                                <label><Calendar size={14} /> Outcome</label>
                                <select
                                    value={interviewForm.status}
                                    onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })}
                                >
                                    <option value="Selected">Selected ✅</option>
                                    <option value="Rejected">Rejected ❌</option>
                                    <option value="In Progress">In Progress ⏳</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group quill-input-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ margin: 0 }}>The Interview / OA Experience</label>
                                <a 
                                    href="#/app/template" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}
                                >
                                    Short on ideas?
                                </a>
                            </div>
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

                        <div className="input-group">
                            <label>Golden Advice for Juniors</label>
                            <textarea
                                required
                                rows="3"
                                value={interviewForm.suggestions}
                                onChange={(e) => setInterviewForm({ ...interviewForm, suggestions: e.target.value })}
                                placeholder="What core topics should they focus on?"
                            />
                        </div>

                        <div className="form-submit-row">
                            <button type="submit" className="submit-btn primary-btn large-btn">
                                <Send size={18} /> Publish Experience
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default AddExperience;
