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

    const handleAsk = async (q) => {
        const text = q || query;
        if (!text.trim()) return;

        setHistory(prev => [...prev, { type: 'user', text }]);
        setQuery('');
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });

            if (!response.body) throw new Error('No response body');

            // Add placeholder for bot message
            setHistory(prev => [...prev, { type: 'bot', text: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = '';

            setIsTyping(false); // Stop showing typing once streaming starts

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedResponse += chunk;

                // Update the last message (the bot placeholder) with new text
                setHistory(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].text = accumulatedResponse;
                    return updated;
                });
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setHistory(prev => [...prev, { type: 'bot', text: "Service is temporarily unavailable. Please try again later." }]);
            setIsTyping(false);
        }
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
                            <div className="message-bubble">
                                {msg.type === 'bot' ? (
                                    <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                                ) : (
                                    msg.text
                                )}
                            </div>
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
