import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Send, User, ArrowRight,
    Code, Briefcase, FileText, Target
} from 'lucide-react';
import { API_URL } from '../config';

/* ═══ AUTO-RESIZE TEXTAREA HOOK ═══ */
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

/* ═══ PREDEFINED QUESTIONS ═══ */
const SUGGESTIONS = [
    { text: "Which companies require DSA?", icon: Code },
    { text: "What is the eligibility for PhonePe?", icon: Target },
    { text: "How to prepare for Amazon interview?", icon: Briefcase },
    { text: "Resume tips for Freshers", icon: FileText },
];

/* ═══ MAIN COMPONENT ═══ */
const Help = () => {
    const [value, setValue] = useState('');
    const [history, setHistory] = useState([
        { type: 'bot', text: 'Hello! I\'m SAARTHI AI — your placement intelligence assistant. Ask me anything about companies, eligibility criteria, skills, or interview preparation.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const { ref: textareaRef, adjust: adjustHeight } = useAutoResize(48, 200);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isTyping]);

    const hasConversation = history.length > 1;

    /* ═══ STREAMING SEND ═══ */
    const handleSend = async (overrideText) => {
        const text = (overrideText || value).trim();
        if (!text || isTyping) return;

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

            setHistory(prev => [...prev, { type: 'bot', text: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';

            setIsTyping(false);

            let sourceHandled = false;

            while (true) {
                const { value: chunk, done } = await reader.read();
                if (done) break;

                let text = decoder.decode(chunk, { stream: true });

                if (!sourceHandled) {
                    const sourceMatch = text.match(/^\[SOURCE:(ollama|nvidia)\]/);
                    if (sourceMatch) {
                        text = text.replace(/^\[SOURCE:(ollama|nvidia)\]/, '');
                    }
                    sourceHandled = true;
                }

                accumulated += text;

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

    return (
        <div className="bg-[#0F0F0F] -m-4 lg:-m-8 min-h-screen flex flex-col">
            {/* HEADER STRIP */}
            <div className="bg-[#FACC15] border-b-[3px] border-[#0F0F0F] px-6 lg:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="font-black text-[20px] text-[#0F0F0F]">SAARTHI AI</h1>
                    <div className="bg-[#A3E635] border-[2px] border-[#0F0F0F] px-2 py-0.5 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#0F0F0F] animate-pulse" />
                        <span className="font-black text-[10px] uppercase tracking-widest text-[#0F0F0F]">Online</span>
                    </div>
                </div>
                <button
                    onClick={() => setHistory([{ type: 'bot', text: 'Hello! I\'m SAARTHI AI — your placement intelligence assistant.' }])}
                    className="bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] px-4 py-1.5 text-[12px] hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
                >
                    CLEAR CHAT
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ═══ WELCOME STATE ═══ */}
                {!hasConversation && (
                    <motion.div
                        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-16 h-16 bg-[#F97316] border-[3px] border-[#FACC15] flex items-center justify-center mb-6 shadow-[4px_4px_0px_#FACC15]">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h1 className="font-black text-[28px] text-[#FACC15] mb-2 text-center">What can I help you with?</h1>
                        <p className="font-mono text-[13px] text-[#888888] text-center mb-8">Ask about placements, companies, or interview prep</p>

                        {/* Suggestion Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[500px] w-full">
                            {SUGGESTIONS.map(({ text, icon: Icon }) => (
                                <button
                                    key={text}
                                    onClick={() => handleSend(text)}
                                    className="bg-[#1A1A1A] border-[3px] border-[#333333] px-4 py-3 text-left font-bold text-[13px] text-[#F5F5F5] flex items-center gap-3 hover:border-[#F97316] hover:bg-[#F97316]/10 transition-all duration-100"
                                >
                                    <div className="w-8 h-8 bg-[#FACC15] border-[2px] border-[#0F0F0F] flex items-center justify-center flex-shrink-0">
                                        <Icon size={14} className="text-[#0F0F0F]" />
                                    </div>
                                    {text}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ═══ MESSAGES ═══ */}
                {hasConversation && (
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                        {history.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-[70%] ${msg.type === 'user' ? 'self-end' : 'self-start'}`}>
                                <span className={`font-black text-[10px] uppercase tracking-widest mb-1 ${
                                    msg.type === 'user' ? 'text-[#888888]' : 'text-[#F97316]'
                                }`}>
                                    {msg.type === 'user' ? 'YOU' : 'SAARTHI AI'}
                                </span>
                                <div className={`px-5 py-3 font-medium text-[14px] ${
                                    msg.type === 'user'
                                        ? 'bg-[#FACC15] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] text-[#0F0F0F]'
                                        : 'bg-[#FFFBF0] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#F97316] text-[#0F0F0F]'
                                }`}>
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
                            <div className="self-start">
                                <div className="bg-[#111111] border-[2px] border-[#333333] px-4 py-2 flex gap-1.5">
                                    <div className="w-2 h-2 bg-[#F97316] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-[#F97316] animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-[#F97316] animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* ═══ SUGGESTION CHIPS (above input) ═══ */}
                {hasConversation && history.length <= 3 && (
                    <div className="flex gap-2 overflow-x-auto px-6 pb-3">
                        {SUGGESTIONS.map(({ text }) => (
                            <button
                                key={text}
                                onClick={() => handleSend(text)}
                                className="bg-[#1A1A1A] text-[#F5F5F5] font-bold border-[2px] border-[#333333] px-3 py-1.5 text-[12px] flex-shrink-0 hover:border-[#F97316] hover:text-[#F97316] transition-all duration-100 whitespace-nowrap"
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                )}

                {/* ═══ INPUT BAR ═══ */}
                <div className="bg-[#111111] border-t-[3px] border-[#F97316] p-4 flex gap-3 items-end">
                    <textarea
                        ref={textareaRef}
                        className="flex-1 bg-[#0F0F0F] border-[3px] border-[#333333] focus:border-[#F97316] transition-all duration-100 font-mono text-[14px] text-[#F5F5F5] px-4 py-3 placeholder:text-[#444444] focus:outline-none resize-none"
                        value={value}
                        onChange={e => { setValue(e.target.value); adjustHeight(); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your placement..."
                        rows={1}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!value.trim() || isTyping}
                        className="w-11 h-11 bg-[#F97316] text-white border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center justify-center flex-shrink-0 hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-100 disabled:opacity-40"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Help;
