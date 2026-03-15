import React from 'react';

// SVG 1 — HERO BACKGROUND GRID
export const Hero1SVG = ({ className }) => (
    <svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <defs>
            <pattern id="grid36" width="36" height="36" patternUnits="userSpaceOnUse">
                <circle cx="18" cy="18" r="2" fill="#1A1A1A"/>
            </pattern>
        </defs>

        <rect width="1200" height="600" fill="url(#grid36)"/>

        <g stroke="#F97316" strokeWidth="0.5" opacity="0.12" strokeDasharray="4 8" fill="none">
            <line x1="0" y1="150" x2="400" y2="0"/>
            <line x1="800" y1="0" x2="1200" y2="300"/>
            <line x1="0" y1="400" x2="600" y2="600"/>
            <line x1="600" y1="200" x2="1200" y2="500"/>
        </g>

        <g>
            <circle cx="400" cy="0" r="4" fill="#F97316" opacity="0.6"/>
            <circle cx="400" cy="0" r="10" fill="none" stroke="#F97316" strokeWidth="0.5" opacity="0.25"/>

            <circle cx="800" cy="300" r="4" fill="#F97316" opacity="0.6"/>
            <circle cx="800" cy="300" r="10" fill="none" stroke="#F97316" strokeWidth="0.5" opacity="0.25"/>

            <circle cx="600" cy="200" r="4" fill="#F97316" opacity="0.6"/>
            <circle cx="600" cy="200" r="10" fill="none" stroke="#F97316" strokeWidth="0.5" opacity="0.25"/>
        </g>
    </svg>
);

// SVG 2 — ANIMATED NODE NETWORK
export const Hero2SVG = ({ className }) => (
    <svg viewBox="0 0 480 380" xmlns="http://www.w3.org/2000/svg" className={className}>
        <style>
            {`
            @keyframes flowDash { to { stroke-dashoffset:-20; } }
            @keyframes pulse { 0%{r:28;opacity:.4;}100%{r:50;opacity:0;} }
            .flow { stroke:#F97316; stroke-width:1.5; opacity:.6; stroke-dasharray:6 4; animation:flowDash 2s linear infinite; }
            `}
        </style>

        {/* connectors */}
        <g stroke="#2A2A2A" strokeWidth="1" fill="none">
            <line x1="80" y1="190" x2="240" y2="120"/>
            <line x1="80" y1="190" x2="160" y2="60"/>
            <line x1="80" y1="190" x2="120" y2="300"/>
            <line x1="240" y1="120" x2="400" y2="190"/>
            <line x1="240" y1="120" x2="160" y2="60"/>
            <line x1="240" y1="120" x2="320" y2="60"/>
            <line x1="240" y1="120" x2="240" y2="280"/>
            <line x1="400" y1="190" x2="320" y2="60"/>
            <line x1="400" y1="190" x2="360" y2="300"/>
            <line x1="160" y1="60" x2="100" y2="80"/>
            <line x1="240" y1="280" x2="120" y2="300"/>
            <line x1="240" y1="280" x2="360" y2="300"/>
        </g>

        {/* animated main flows */}
        <line x1="80" y1="190" x2="240" y2="120" className="flow"/>
        <line x1="240" y1="120" x2="400" y2="190" className="flow"/>

        {/* nodes */}
        <circle cx="80" cy="190" r="28" fill="#111111" stroke="#F97316" strokeWidth="1.5"/>
        <text x="80" y="190" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#F97316">Student</text>

        <circle cx="240" cy="120" r="28" fill="#F97316" opacity="0.12" stroke="#F97316" strokeWidth="2"/>
        <circle cx="240" cy="120" r="40" fill="none" stroke="#F97316" strokeWidth="1" opacity="0" style={{ animation: 'pulse 2.5s ease-out infinite' }}/>
        <text x="240" y="120" textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#F97316" fontWeight="700">SAARTHI</text>

        <circle cx="400" cy="190" r="28" fill="#111111" stroke="#2A2A2A" strokeWidth="1.5"/>
        <text x="400" y="190" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#A3A3A3">Company</text>

        <circle cx="160" cy="60" r="16" fill="#111111" stroke="#2A2A2A"/>
        <circle cx="320" cy="60" r="16" fill="#111111" stroke="#2A2A2A"/>
        <circle cx="240" cy="280" r="16" fill="#111111" stroke="#2A2A2A"/>

        <circle cx="120" cy="300" r="8" fill="#1A1A1A" stroke="#2A2A2A"/>
        <circle cx="360" cy="300" r="8" fill="#1A1A1A" stroke="#2A2A2A"/>
        <circle cx="100" cy="80" r="8" fill="#1A1A1A" stroke="#2A2A2A"/>

        {/* packets */}
        <circle r="3" fill="#F97316">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M80,190 L240,120"/>
        </circle>

        <circle r="3" fill="#F97316">
            <animateMotion dur="2.5s" begin="1.2s" repeatCount="indefinite" path="M240,120 L400,190"/>
        </circle>
    </svg>
);

// SVG 3 — ATS SCORE RING
export const Hero3SVG = ({ className }) => (
    <svg viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg" className={className}>
        <style>
            {`
            @keyframes drawRing{
            from{stroke-dasharray:0 427;}
            to{stroke-dasharray:316 111;}
            }
            @keyframes appearRing{
            from{opacity:0;transform:translateY(4px);}
            to{opacity:1;transform:translateY(0);}
            }
            `}
        </style>

        <circle cx="110" cy="100" r="84" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 9"/>
        <circle cx="110" cy="100" r="68" fill="none" stroke="#1A1A1A" strokeWidth="12"/>

        <circle cx="110" cy="100" r="68" fill="none" stroke="#F97316" strokeWidth="12"
            strokeLinecap="round"
            transform="rotate(-90 110 100)"
            style={{ strokeDasharray: '0 427', animation: 'drawRing 2s cubic-bezier(0.4,0,0.2,1) .4s forwards' }}/>

        <text x="110" y="94" fontSize="36" fontWeight="700" fill="#F5F5F5"
            textAnchor="middle" dominantBaseline="central"
            style={{ opacity: 0, animation: 'appearRing .5s ease 2s forwards' }}>74%</text>

        <text x="110" y="116" fontSize="11" fill="#A3A3A3"
            textAnchor="middle"
            style={{ opacity: 0, animation: 'appearRing .5s ease 2.2s forwards' }}>ATS Score</text>

        <line x1="20" y1="176" x2="200" y2="176" stroke="#2A2A2A" strokeWidth="1"/>

        <g style={{ opacity: 0, animation: 'appearRing .4s ease 2.4s forwards' }}>
            <text x="20" y="195" fontSize="11" fill="#525252">Keywords</text>
            <rect x="95" y="190" width="110" height="5" rx="2.5" fill="#1A1A1A"/>
            <rect x="95" y="190" width="90" height="5" rx="2.5" fill="#F97316"/>
            <text x="210" y="195" fontSize="10" fill="#A3A3A3" textAnchor="end">82%</text>

            <text x="20" y="215" fontSize="11" fill="#525252">Skills Match</text>
            <rect x="95" y="210" width="110" height="5" rx="2.5" fill="#1A1A1A"/>
            <rect x="95" y="210" width="81" height="5" rx="2.5" fill="#F97316"/>
            <text x="210" y="215" fontSize="10" fill="#A3A3A3" textAnchor="end">74%</text>

            <text x="20" y="235" fontSize="11" fill="#525252">Format</text>
            <rect x="95" y="230" width="110" height="5" rx="2.5" fill="#1A1A1A"/>
            <rect x="95" y="230" width="67" height="5" rx="2.5" fill="#F97316"/>
            <text x="210" y="235" fontSize="10" fill="#A3A3A3" textAnchor="end">61%</text>
        </g>
    </svg>
);

// SVG 4 — CHAT INTERFACE
export const Hero4SVG = ({ className, style }) => (
    <svg viewBox="0 0 400 290" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <style>
            {`
            @keyframes slideInRightState{from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:translateX(0);}}
            @keyframes slideInLeftState{from{opacity:0;transform:translateX(-16px);}to{opacity:1;transform:translateX(0);}}
            @keyframes typingBounceState{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}
            @keyframes appearV{to{opacity:1;}}
            @keyframes vanishV{to{opacity:0;}}
            `}
        </style>

        <g style={{ animation: 'slideInRightState .45s ease .15s both', transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x="80" y="20" width="296" height="60" rx="14" fill="#F97316"/>
            <polygon points="376,68 394,76 376,80" fill="#F97316"/>
            <text x="96" y="38" fontSize="10" fill="#525252" fontWeight="600">You</text>
            <text x="96" y="56" fontSize="13" fill="#000000" fontWeight="500">CGPA cutoff for PhonePe?</text>
        </g>

        <g style={{ animation: 'slideInLeftState .45s ease .75s both', transformBox: 'fill-box', transformOrigin: 'center' }}>
            <rect x="10" y="98" width="310" height="80" rx="14" fill="#111111" stroke="#2A2A2A"/>
            <polygon points="10,110 -6,118 10,126" fill="#111111"/>
            <rect x="22" y="110" width="40" height="16" rx="8" fill="#F97316" opacity="0.15"/>
            <text x="42" y="118" fontSize="9" fill="#F97316" fontWeight="700" textAnchor="middle" dominantBaseline="central">AI</text>
            <text x="22" y="136" fontSize="12" fill="#F5F5F5">PhonePe: CGPA 8.0+, no backlogs.</text>
            <text x="22" y="154" fontSize="12" fill="#A3A3A3">Open for CSE &amp; IT branches.</text>
        </g>

        <rect x="10" y="190" width="148" height="20" rx="10" fill="#1A1A1A" stroke="#2A2A2A"
            style={{ opacity: 0, animation: 'appearV .4s ease 1.4s forwards' }}/>
        <circle cx="24" cy="200" r="4" fill="#F97316"/>
        <text x="34" y="200" fontSize="9" fill="#525252" dominantBaseline="central">Powered by Gemini + RAG</text>

        <g style={{ animation: 'appearV .3s ease 0s forwards, vanishV .2s ease .7s forwards' }}>
            <rect x="10" y="222" width="76" height="32" rx="16" fill="#111111" stroke="#2A2A2A"/>
            <circle cx="30" cy="238" r="4.5" fill="#525252"
                style={{ animation: 'typingBounceState 1.2s ease infinite', transformBox: 'fill-box', transformOrigin: 'center' }}/>
            <circle cx="45" cy="238" r="4.5" fill="#525252"
                style={{ animation: 'typingBounceState 1.2s ease .2s infinite', transformBox: 'fill-box', transformOrigin: 'center' }}/>
            <circle cx="60" cy="238" r="4.5" fill="#525252"
                style={{ animation: 'typingBounceState 1.2s ease .4s infinite', transformBox: 'fill-box', transformOrigin: 'center' }}/>
        </g>
    </svg>
);

// SVG 5 — SCROLL INDICATOR
export const Hero5SVG = ({ className }) => (
    <svg viewBox="0 0 32 52" xmlns="http://www.w3.org/2000/svg" className={className}>
        <style>
            {`
            @keyframes scrollWheelState{
            0%,100%{transform:translateY(0);opacity:1;}
            50%{transform:translateY(6px);opacity:0;}
            }
            @keyframes chevronFadeState{
            0%,100%{opacity:.3;transform:translateY(0);}
            50%{opacity:.9;transform:translateY(2px);}
            }
            `}
        </style>

        <rect x="9" y="4" width="14" height="22" rx="7" fill="none" stroke="#525252" strokeWidth="1.2"/>

        <circle cx="16" cy="12" r="2" fill="#F97316"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'scrollWheelState 1.8s ease-in-out infinite' }}/>

        <path d="M10 34 L16 40 L22 34" fill="none" stroke="#F97316" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'chevronFadeState 1.8s ease-in-out infinite' }}/>

        <path d="M10 42 L16 48 L22 42" fill="none" stroke="#F97316" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.3"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'chevronFadeState 1.8s ease-in-out .3s infinite' }}/>
    </svg>
);

// SVG 6 — DIAMOND CONNECTOR
export const Hero6SVG = ({ className }) => (
    <svg viewBox="0 0 40 160" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <style>
            {`
            @keyframes diamondPulseState{
            0%,100%{opacity:.5;transform:scale(1);}
            50%{opacity:.9;transform:scale(1.15);}
            }
            `}
        </style>

        <line x1="20" y1="0" x2="20" y2="160" stroke="#2A2A2A" strokeWidth="1" strokeDasharray="4 8"/>

        <circle cx="20" cy="40" r="2" fill="#2A2A2A"/>
        <circle cx="20" cy="120" r="2" fill="#2A2A2A"/>

        <polygon points="20,64 30,80 20,96 10,80"
            fill="#F97316" opacity="0.5"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'diamondPulseState 2.5s ease-in-out infinite' }}/>
    </svg>
);
