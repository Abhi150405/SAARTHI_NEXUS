import React from 'react';

const Hero1SVG = ({ className }) => (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        {/* Background */}
        <rect width="1440" height="900" fill="#FFFBF0" />

        {/* Grid lines — graph paper feel */}
        <g stroke="#0F0F0F" strokeWidth="1" opacity="0.06">
            {[...Array(19)].map((_, i) => (
                <line key={`v${i}`} x1={(i + 1) * 80} y1="0" x2={(i + 1) * 80} y2="900" />
            ))}
            {[...Array(12)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={(i + 1) * 80} x2="1440" y2={(i + 1) * 80} />
            ))}
        </g>

        {/* Large flat geometric shapes */}
        <rect x="80" y="60" width="220" height="220" fill="#FACC15" opacity="0.18" transform="rotate(12 190 170)" />
        <polygon points="1200,40 1380,200 1020,200" fill="#F97316" opacity="0.12" />
        <circle cx="200" cy="720" r="140" fill="#A3E635" opacity="0.15" />
        <rect x="1100" y="620" width="260" height="180" fill="#FACC15" opacity="0.10" transform="rotate(-8 1230 710)" />

        {/* Floating outlined shapes */}
        <g fill="none" stroke="#0F0F0F" strokeWidth="2" opacity="0.08">
            <circle cx="600" cy="150" r="40" />
            <rect x="900" y="80" width="60" height="60" />
            <circle cx="1300" cy="500" r="30" />
            <rect x="100" y="450" width="50" height="50" />
            {/* X marks */}
            <g>
                <line x1="740" y1="700" x2="770" y2="730" />
                <line x1="770" y1="700" x2="740" y2="730" />
            </g>
            <g>
                <line x1="1100" y1="300" x2="1130" y2="330" />
                <line x1="1130" y1="300" x2="1100" y2="330" />
            </g>
        </g>

        {/* Solid dots */}
        <circle cx="500" cy="400" r="6" fill="#F97316" />
        <circle cx="1050" cy="150" r="6" fill="#F97316" />
        <circle cx="350" cy="780" r="6" fill="#F97316" />
    </svg>
);

export default Hero1SVG;
