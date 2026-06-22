import React from 'react';

const Hero6SVG = ({ className }) => (
    <svg viewBox="0 0 40 160" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        {/* Dashed vertical line */}
        <line x1="20" y1="0" x2="20" y2="160" stroke="#0F0F0F" strokeWidth="2" strokeDasharray="6 5" opacity="0.25" />

        {/* Diamond shapes (rotated squares) */}
        <rect x="16" y="36" width="8" height="8" fill="#F97316" stroke="#0F0F0F" strokeWidth="2" transform="rotate(45 20 40)" />
        <rect x="16" y="76" width="8" height="8" fill="#F97316" stroke="#0F0F0F" strokeWidth="2" transform="rotate(45 20 80)" />
        <rect x="16" y="116" width="8" height="8" fill="#F97316" stroke="#0F0F0F" strokeWidth="2" transform="rotate(45 20 120)" />
    </svg>
);

export default Hero6SVG;
