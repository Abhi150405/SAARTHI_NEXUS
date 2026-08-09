import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { API_URL } from '../config';
import { apiFetch, getUser } from '../api';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hello! I am Saarthi. Ask me anything about placements, company history, or salary trends.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatMarkdown = (text) => {
        if (!text) return "";
        let html = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        html = html.replace(/__(.*?)__/g, '<b>$1</b>');
        html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #F97316; font-weight: bold; text-decoration: underline;">$1</a>');
        html = html.replace(/^\s*[-*]\s+/gm, '• ');
        return html;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        const user = getUser();
        const userName = user?.fullName || 'Student';

        try {
            const response = await apiFetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ 
                    query: userMsg, 
                    history: messages.slice(-5),
                    user_name: userName 
                })
            });

            if (!response.body) throw new Error('No response body');

            setMessages(prev => [...prev, { type: 'bot', text: '', source: null }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = '';
            let detectedSource = null;
            let sourceMarkerHandled = false;

            setLoading(false);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                let chunk = decoder.decode(value, { stream: true });

                if (!sourceMarkerHandled) {
                    const sourceMatch = chunk.match(/^\[SOURCE:(ollama|groq|nvidia)\]/);
                    if (sourceMatch) {
                        detectedSource = sourceMatch[1];
                        chunk = chunk.replace(/^\[SOURCE:(ollama|groq|nvidia)\]/, '');
                    }
                    sourceMarkerHandled = true;
                }

                accumulatedResponse += chunk;

                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        text: accumulatedResponse,
                        source: detectedSource,
                    };
                    return updated;
                });
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { type: 'bot', text: "Sorry, I'm having trouble connecting to the brain.", source: null }]);
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 lg:bottom-6 lg:right-6">
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-[360px] max-h-[520px] bg-[#FFFBF0] border-[3px] border-[#0F0F0F] shadow-[10px_10px_0px_#0F0F0F] flex flex-col">
                    {/* Header */}
                    <div className="bg-[#F97316] border-b-[3px] border-[#0F0F0F] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#0F0F0F] flex items-center justify-center">
                                <Bot size={16} className="text-[#FACC15]" />
                            </div>
                            <span className="font-black text-[14px] text-white">SAARTHI AI</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-[#0F0F0F] transition-colors duration-100"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-h-[340px]">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <span className="font-black text-[9px] uppercase tracking-widest text-[#888888] mb-1">
                                    {msg.type === 'user' ? 'YOU' : 'SAARTHI AI'}
                                </span>
                                <div className={`max-w-[85%] px-4 py-2.5 text-[13px] font-medium ${
                                    msg.type === 'user'
                                        ? 'bg-[#FACC15] border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] text-[#0F0F0F]'
                                        : 'bg-white border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#F97316] text-[#0F0F0F]'
                                }`}>
                                    {msg.type === 'bot' ? (
                                        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-start gap-2">
                                <div className="bg-[#E5E7EB] border-[2px] border-[#0F0F0F] px-4 py-2 flex gap-1.5">
                                    <div className="w-2 h-2 bg-[#F97316] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-[#F97316] animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-[#F97316] animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t-[3px] border-[#0F0F0F] p-3 flex gap-2">
                        <input
                            type="text"
                            placeholder="Ask about placements..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-white border-[3px] border-[#0F0F0F] px-3 py-2 font-mono text-[13px] text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] focus:outline-none focus:shadow-[2px_2px_0px_#F97316] focus:border-[#F97316] transition-all duration-100 placeholder:text-[#888888]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="w-10 h-10 bg-[#F97316] text-white border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] flex items-center justify-center hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all duration-100 disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-[#F97316] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] flex items-center justify-center text-white hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
};

export default Chatbot;
