import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Send, Paperclip, Plus, User, Bot,
    Code, Briefcase, FileText, Target
} from 'lucide-react';
import { API_URL } from '../config';
import '../styles/Help.css';

/* ═══════════════════════════════════════════════════════════
   AUTO-RESIZE TEXTAREA HOOK
   ═══════════════════════════════════════════════════════════ */
const useAutoResize = (minHeight = 56, maxHeight = 200) => {
    const ref = useRef(null);

    const adjust = useCallback((reset) => {
        const el = ref.current;
        if (!el) return;
        if (reset) { el.style.height = `${minHeight}px`; return; }
        el.style.height = `${minHeight}px`;
        const h = Math.max(minHeight, Math.min(el.scrollHeight, maxHeight));
        el.style.height = `${h}px`;
    }, [minHeight, maxHeight]);

    useEffect(() => {
        if (ref.current) ref.current.style.height = `${minHeight}px`;
    }, [minHeight]);

    return { ref, adjust };
};

/* ═══════════════════════════════════════════════════════════
   BACKGROUND ORBS
   ═══════════════════════════════════════════════════════════ */
const HelpOrbs = () => (
    <div className="help-orbs">
        <svg width="100%" height="100%">
            <defs>
                <radialGradient id="helpOrb1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="helpOrb2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="75%" cy="15%" r="240" fill="url(#helpOrb1)">
                <animate attributeName="cy" values="15%;20%;15%" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="20%" cy="80%" r="180" fill="url(#helpOrb2)">
                <animate attributeName="cx" values="20%;25%;20%" dur="10s" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

/* ═══════════════════════════════════════════════════════════
   PREDEFINED QUESTIONS
   ═══════════════════════════════════════════════════════════ */
const SUGGESTIONS = [
    { text: "Which companies require DSA?", icon: Code },
    { text: "What is the eligibility for PhonePe?", icon: Target },
    { text: "How to prepare for Amazon interview?", icon: Briefcase },
    { text: "Resume tips for Freshers", icon: FileText },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Help = () => {
    const [value, setValue] = useState('');
    const [history, setHistory] = useState([
        { type: 'bot', text: 'Hello! I\'m SAARTHI AI — your placement intelligence assistant. Ask me anything about companies, eligibility criteria, skills, or interview preparation.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { ref: textareaRef, adjust: adjustHeight } = useAutoResize(56, 200);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isTyping]);

    const hasConversation = history.length > 1;

    /* ═══ STREAMING SEND ═══ */
    const handleSend = async (overrideText) => {
        const text = (overrideText || value).trim();
        if (!text || isTyping) return;

        // Add user message
        setHistory(prev => [...prev, { type: 'user', text }]);
        setValue('');
        adjustHeight(true);
        setIsTyping(true);

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });

            if (!response.body) throw new Error('No response body');

            // Add placeholder for bot message
            setHistory(prev => [...prev, { type: 'bot', text: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';

            setIsTyping(false); // Stop typing indicator, streaming begins

            while (true) {
                const { value: chunk, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(chunk, { stream: true });
                accumulated += text;

                // Update last message with streamed content
                setHistory(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { type: 'bot', text: accumulated };
                    return updated;
                });
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setHistory(prev => [...prev, {
                type: 'bot',
                text: 'Service is temporarily unavailable. Please try again later.'
            }]);
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /* ═══ RENDER ═══ */
    return (
        <div className="help-v0">
            <HelpOrbs />
            <div className="help-v0-inner">

                {/* ═══ WELCOME STATE (no conversation yet) ═══ */}
                {!hasConversation && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}>

                        <div className="help-welcome">
                            <div className="help-welcome-icon">
                                <Sparkles size={24} />
                            </div>
                            <h1>What can I help you with?</h1>
                            <p>Ask me anything about placements, companies, or interview prep</p>
                        </div>

                        {/* Suggestion Cards Grid */}
                        <div className="help-suggestions-grid">
                            {SUGGESTIONS.map(({ text, icon: Icon }) => (
                                <button key={text} className="help-suggestion-card"
                                    onClick={() => handleSend(text)}>
                                    <div className="help-suggestion-icon">
                                        <Icon size={15} />
                                    </div>
                                    {text}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ═══ COMPACT HEADER (conversation started) ═══ */}
                {hasConversation && (
                    <div className="help-header-compact">
                        <div className="help-header-compact-icon">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h2>SAARTHI AI</h2>
                            <span>Placement intelligence assistant</span>
                        </div>
                    </div>
                )}

                {/* ═══ MESSAGES ═══ */}
                {hasConversation && (
                    <div className="help-messages">
                        {history.map((msg, i) => (
                            <div key={i} className={`help-msg-row ${msg.type}`}>
                                <div className="help-msg-avatar">
                                    {msg.type === 'bot'
                                        ? <Sparkles size={14} />
                                        : <User size={14} />
                                    }
                                </div>
                                <div className="help-msg-bubble">
                                    {msg.type === 'bot' ? (
                                        <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="help-typing">
                                <div className="help-msg-avatar" style={{
                                    background: 'rgba(249,115,22,0.12)',
                                    color: 'var(--primary)'
                                }}>
                                    <Sparkles size={14} />
                                </div>
                                <div className="help-typing-dots">
                                    <span className="help-typing-dot" />
                                    <span className="help-typing-dot" />
                                    <span className="help-typing-dot" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* ═══ COMPOSER — v0 Style Input ═══ */}
                <div className="help-composer">
                    <div className="help-composer-box">
                        <textarea
                            ref={textareaRef}
                            className="help-composer-textarea"
                            value={value}
                            onChange={e => { setValue(e.target.value); adjustHeight(); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask SAARTHI a question..."
                            rows={1}
                        />
                        <div className="help-composer-footer">
                            <div className="help-composer-left">
                                <button type="button" className="help-attach-btn">
                                    <Paperclip size={14} />
                                    <span>Attach</span>
                                </button>
                            </div>
                            <div className="help-composer-right">
                                <button type="button" className="help-context-btn">
                                    <Plus size={14} />
                                    <span>Context</span>
                                </button>
                                <button type="button"
                                    className={`help-send-btn ${value.trim() && !isTyping ? 'active' : ''}`}
                                    onClick={() => handleSend()}
                                    disabled={!value.trim() || isTyping}>
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Pills — show only at start of conversation */}
                    {hasConversation && history.length <= 3 && (
                        <div className="help-quick-pills">
                            {SUGGESTIONS.map(({ text }) => (
                                <button key={text} className="help-quick-pill"
                                    onClick={() => handleSend(text)}>
                                    {text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Help;
