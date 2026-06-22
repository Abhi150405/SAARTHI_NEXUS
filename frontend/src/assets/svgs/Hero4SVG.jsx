import React from 'react';

const Hero4SVG = ({ className }) => (
    <svg viewBox="0 0 300 280" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Header */}
        <text x="16" y="20" fontSize="10" fill="#0F0F0F" fontWeight="900" letterSpacing="3" fontFamily="Inter, sans-serif">SAARTHI AI</text>
        <line x1="0" y1="30" x2="300" y2="30" stroke="#0F0F0F" strokeWidth="2" />

        {/* User bubble */}
        <rect x="103" y="48" width="190" height="44" fill="#0F0F0F" rx="0" />
        <rect x="100" y="45" width="190" height="44" fill="#A3E635" stroke="#0F0F0F" strokeWidth="2" rx="0" />
        <text x="112" y="62" fontSize="9" fill="#0F0F0F" fontWeight="700" fontFamily="Inter, sans-serif">You</text>
        <text x="112" y="78" fontSize="12" fill="#0F0F0F" fontWeight="600" fontFamily="Inter, sans-serif">CGPA cutoff for PhonePe?</text>

        {/* AI avatar */}
        <rect x="19" y="113" width="28" height="28" fill="#0F0F0F" rx="0" />
        <rect x="16" y="110" width="28" height="28" fill="#F97316" stroke="#0F0F0F" strokeWidth="2" rx="0" />
        <text x="30" y="127" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="white" fontWeight="900" fontFamily="Inter, sans-serif">S</text>

        {/* AI bubble */}
        <rect x="55" y="108" width="234" height="64" fill="#0F0F0F" rx="0" />
        <rect x="52" y="105" width="234" height="64" fill="#FACC15" stroke="#0F0F0F" strokeWidth="2" rx="0" />
        <text x="64" y="122" fontSize="9" fill="#0F0F0F" fontWeight="700" fontFamily="Inter, sans-serif">SAARTHI AI</text>
        <text x="64" y="139" fontSize="11" fill="#0F0F0F" fontWeight="600" fontFamily="Inter, sans-serif">PhonePe: CGPA 8.0+, no backlogs.</text>
        <text x="64" y="156" fontSize="11" fill="#0F0F0F" fontWeight="500" fontFamily="Inter, sans-serif" opacity="0.7">Open for CSE &amp; IT branches.</text>

        {/* Typing indicator */}
        <rect x="19" y="192" width="80" height="28" fill="#0F0F0F" rx="0" />
        <rect x="16" y="189" width="80" height="28" fill="#E5E7EB" stroke="#0F0F0F" strokeWidth="2" rx="0" />
        <circle cx="36" cy="203" r="3" fill="#0F0F0F" />
        <circle cx="52" cy="203" r="3" fill="#0F0F0F" />
        <circle cx="68" cy="203" r="3" fill="#0F0F0F" />

        {/* Bottom label */}
        <rect x="16" y="236" width="140" height="22" fill="#F97316" stroke="#0F0F0F" strokeWidth="2" rx="0" />
        <text x="86" y="250" textAnchor="middle" fontSize="9" fill="white" fontWeight="800" fontFamily="Inter, sans-serif">Powered by Gemini + RAG</text>
    </svg>
);

export default Hero4SVG;
