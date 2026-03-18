import React, { useState, useEffect, useRef } from 'react';
import { User, Building, Award, Calendar, Send, PlusCircle } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { API_URL } from '../config';
import DOMPurify from 'dompurify';
import '../styles/Experiences.css';

const AddExperience = () => {
    const [companies, setCompanies] = useState([]);
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [filteredCompaniesSuggestions, setFilteredCompaniesSuggestions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const suggestionsRef = useRef(null);

    const [interviewForm, setInterviewForm] = useState({
        student_name: '',
        company_name: '',
        role: '',
        year: '2024-25',
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
            const sanitizedExperience = DOMPurify.sanitize(interviewForm.experience);
            const payload = { ...interviewForm, experience: sanitizedExperience };

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
                    experience: '',
                    suggestions: '',
                    status: 'Selected'
                });
                setShowCompanySuggestions(false);
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
                            <label>The Interview / OA Experience</label>
                            <RichTextEditor
                                value={interviewForm.experience}
                                onChange={(html) => setInterviewForm({ ...interviewForm, experience: html })}
                                placeholder="Describe the rounds, coding questions asked, and overall difficulty..."
                                className="exp-rte"
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
