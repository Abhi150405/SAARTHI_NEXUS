import React from 'react';

const Hero3SVG = ({ className }) => (
    <svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Shadow card */}
        <rect x="15" y="15" width="260" height="300" fill="#0F0F0F" rx="0" />
        {/* Main card */}
        <rect x="10" y="10" width="260" height="300" fill="#FFFFFF" stroke="#0F0F0F" strokeWidth="3" rx="0" />

        {/* Mock text lines */}
        <rect x="24" y="30" width="180" height="7" fill="#E5E7EB" rx="0" />
        <rect x="24" y="46" width="140" height="7" fill="#E5E7EB" rx="0" />
        <rect x="24" y="62" width="200" height="7" fill="#FEF08A" rx="0" />
        <rect x="24" y="78" width="160" height="7" fill="#E5E7EB" rx="0" />
        <rect x="24" y="94" width="190" height="7" fill="#FEF08A" rx="0" />
        <rect x="24" y="110" width="120" height="7" fill="#E5E7EB" rx="0" />
        <rect x="24" y="126" width="170" height="7" fill="#FEF08A" rx="0" />
        <rect x="24" y="142" width="150" height="7" fill="#E5E7EB" rx="0" />

        {/* ATS ring top-right */}
        <circle cx="230" cy="60" r="28" fill="#FACC15" stroke="#0F0F0F" strokeWidth="3" />
        <text x="230" y="57" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="#0F0F0F" fontWeight="900" fontFamily="Inter, sans-serif">87%</text>
        <text x="230" y="73" textAnchor="middle" fontSize="8" fill="#0F0F0F" fontWeight="600" fontFamily="Inter, sans-serif">ATS</text>

        {/* Keyword tags */}
        {[
            { x: 24, text: 'React' },
            { x: 90, text: 'Node.js' },
            { x: 168, text: 'TS' },
        ].map((tag, i) => (
            <g key={i}>
                <rect x={tag.x} y="170" width={tag.text.length * 9 + 14} height="22" fill="#A3E635" stroke="#0F0F0F" strokeWidth="2" rx="0" />
                <text x={tag.x + (tag.text.length * 9 + 14) / 2} y="184" textAnchor="middle" fontSize="10" fill="#0F0F0F" fontWeight="700" fontFamily="Inter, sans-serif">{tag.text}</text>
            </g>
        ))}

        {/* Bottom badge */}
        <rect x="24" y="210" width="220" height="30" fill="#F97316" stroke="#0F0F0F" strokeWidth="2" rx="0" />
        <text x="134" y="228" textAnchor="middle" fontSize="11" fill="white" fontWeight="800" fontFamily="Inter, sans-serif">ATS Score: 87/100</text>

        {/* Separator line */}
        <line x1="24" y1="256" x2="246" y2="256" stroke="#0F0F0F" strokeWidth="2" />

        {/* Bottom stats */}
        <text x="24" y="275" fontSize="10" fill="#0F0F0F" fontWeight="700" fontFamily="Inter, sans-serif">Keywords: 82%</text>
        <text x="24" y="293" fontSize="10" fill="#0F0F0F" fontWeight="700" fontFamily="Inter, sans-serif">Skills Match: 74%</text>
    </svg>
);

export default Hero3SVG;
