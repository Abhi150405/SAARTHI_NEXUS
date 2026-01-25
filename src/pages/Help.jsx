import React, { useState } from 'react';
import { Send, MessageSquare, Sparkles } from 'lucide-react';
import '../styles/Help.css';

const Help = () => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState([
        { type: 'bot', text: 'Hello! I am SAARTHI AI. Ask me anything about placements, companies, or skills.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const predefinedQuestions = [
        "Which companies require DSA?",
        "What is the eligibility for PhonePe?",
        "How to prepare for Amazon interview?",
        "Resume tips for Freshers"
    ];

    const handleAsk = (q) => {
        const text = q || query;
        if (!text.trim()) return;

        setHistory([...history, { type: 'user', text }]);
        setQuery('');
        setIsTyping(true);

        // Mock response
        setTimeout(() => {
            let response = "I don't have specific data on that yet, but generally...";
            if (text.includes('DSA')) response = "Top companies like Google, Microsoft, Amazon, and Adobe prioritize Data Structures and Algorithms (DSA). Key topics include Arrays, Trees, Graphs, and DP.";
            if (text.includes('PhonePe')) response = "PhonePe typically requires a minimum CGPA of 8.0 for CSE/ECE branches. Strong problem-solving skills and proficiency in C++/Java are mandatory.";
            if (text.includes('Amazon')) response = "For Amazon, focus on Leadership Principles and DSA. Practice medium-hard LeetCode problems and System Design basics.";

            setHistory(prev => [...prev, { type: 'bot', text: response }]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="help-page">
            <div className="chat-container card">
                <div className="chat-header">
                    <div className="ai-avatar"> <Sparkles size={20} /> </div>
                    <div>
                        <h3>SAARTHI Assistant</h3>
                        <p>Always here to help</p>
                    </div>
                </div>

                <div className="chat-body">
                    {history.map((msg, i) => (
                        <div key={i} className={`message ${msg.type}`}>
                            <div className="message-bubble">{msg.text}</div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message bot">
                            <div className="message-bubble typing">...</div>
                        </div>
                    )}
                </div>

                <div className="suggestions">
                    {predefinedQuestions.map(q => (
                        <button key={q} className="suggestion-pill" onClick={() => handleAsk(q)}>
                            {q}
                        </button>
                    ))}
                </div>

                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    />
                    <button className="send-btn" onClick={() => handleAsk()}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Help;
