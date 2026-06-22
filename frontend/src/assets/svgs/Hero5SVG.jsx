import React from 'react';

const Hero5SVG = ({ className }) => (
    <svg viewBox="0 0 32 56" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Shadow rect */}
        <rect x="5" y="6" width="28" height="50" fill="#0F0F0F" rx="0" />
        {/* Outer rect */}
        <rect x="2" y="3" width="28" height="50" fill="white" stroke="#0F0F0F" strokeWidth="3" rx="0" />
        {/* Scroll dot (square) */}
        <rect x="12" y="12" width="8" height="8" fill="#F97316" stroke="#0F0F0F" strokeWidth="1.5" rx="0">
            <animate attributeName="y" values="12;32;12" dur="2s" repeatCount="indefinite" />
        </rect>
    </svg>
);

export default Hero5SVG;
