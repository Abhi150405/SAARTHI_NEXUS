import React from 'react';
import { motion } from 'framer-motion';

const Hero2SVG = ({ className }) => {
    const cx = 250;
    const cy = 240;
    const radius = 160;

    const nodeData = [
        { label: 'CGPA', angle: -90 },
        { label: 'Drives', angle: -45 },
        { label: 'Resume', angle: 0 },
        { label: 'AI', angle: 45 },
        { label: 'Skills', angle: 90 },
        { label: 'Eligibility', angle: 135 },
        { label: 'Alerts', angle: 180 },
        { label: 'Analytics', angle: -135 },
    ];

    // Calculate node positions from angle
    const nodes = nodeData.map((n) => {
        const rad = (n.angle * Math.PI) / 180;
        return {
            ...n,
            x: cx + radius * Math.cos(rad),
            y: cy + radius * Math.sin(rad),
        };
    });

    const chips = [
        { x: 30, y: 28, text: 'ATS: 87%', bg: '#A3E635' },
        { x: 355, y: 440, text: '3 Live Drives', bg: '#A3E635' },
        { x: 390, y: 28, text: 'AI Ready', bg: '#FACC15' },
    ];

    // Animation variants
    const lineVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: (i) => ({
            pathLength: 1,
            opacity: 1,
            transition: { duration: 0.6, delay: 0.3 + i * 0.07, ease: [0.23, 1, 0.32, 1] },
        }),
    };

    const nodeVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: (i) => ({
            scale: 1,
            opacity: 1,
            transition: { duration: 0.35, delay: 0.6 + i * 0.08, ease: [0.23, 1, 0.32, 1] },
        }),
    };

    const centerVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.4, delay: 0.15, ease: [0.23, 1, 0.32, 1] },
        },
    };

    const chipVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: (i) => ({
            scale: 1,
            opacity: 1,
            transition: { duration: 0.3, delay: 1.5 + i * 0.15, ease: [0.23, 1, 0.32, 1] },
        }),
    };

    const pulseVariants = {
        animate: {
            scale: [1, 1.08, 1],
            transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        },
    };

    const nodeSize = 44;
    const halfNode = nodeSize / 2;

    return (
        <motion.svg
            viewBox="0 0 500 500"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
        >
            {/* Connecting lines — drawn in with pathLength */}
            {nodes.map((n, i) => (
                <motion.line
                    key={`line-${i}`}
                    x1={cx}
                    y1={cy}
                    x2={n.x}
                    y2={n.y}
                    stroke="#0F0F0F"
                    strokeWidth="2"
                    strokeDasharray={i % 2 === 0 ? undefined : '8 5'}
                    fill="none"
                    custom={i}
                    variants={lineVariants}
                />
            ))}

            {/* Animated data packets traveling along lines */}
            {[0, 2, 5].map((nodeIdx) => {
                const n = nodes[nodeIdx];
                return (
                    <motion.rect
                        key={`packet-${nodeIdx}`}
                        width="8"
                        height="8"
                        fill="#F97316"
                        stroke="#0F0F0F"
                        strokeWidth="1.5"
                        animate={{
                            x: [cx - 4, n.x - 4, cx - 4],
                            y: [cy - 4, n.y - 4, cy - 4],
                        }}
                        transition={{
                            duration: 3,
                            delay: nodeIdx * 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                );
            })}

            {/* Center node — SAARTHI with pulse */}
            <motion.g variants={centerVariants}>
                <motion.g variants={pulseVariants} animate="animate">
                    {/* Shadow */}
                    <rect x={cx - 28} y={cy - 28} width="64" height="64" fill="#0F0F0F" />
                    {/* Orange block */}
                    <rect x={cx - 32} y={cy - 32} width="64" height="64" fill="#F97316" stroke="#0F0F0F" strokeWidth="3" />
                    <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="11"
                        fill="white"
                        fontWeight="900"
                        fontFamily="Inter, sans-serif"
                    >
                        SAARTHI
                    </text>
                </motion.g>
            </motion.g>

            {/* Satellite nodes — pop in staggered */}
            {nodes.map((n, i) => (
                <motion.g key={`node-${i}`} custom={i} variants={nodeVariants}>
                    {/* Shadow */}
                    <rect
                        x={n.x - halfNode + 4}
                        y={n.y - halfNode + 4}
                        width={nodeSize}
                        height={nodeSize}
                        fill="#0F0F0F"
                    />
                    {/* Yellow block */}
                    <rect
                        x={n.x - halfNode}
                        y={n.y - halfNode}
                        width={nodeSize}
                        height={nodeSize}
                        fill="#FACC15"
                        stroke="#0F0F0F"
                        strokeWidth="2.5"
                    />
                    {/* Label below */}
                    <text
                        x={n.x}
                        y={n.y + halfNode + 14}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#0F0F0F"
                        fontWeight="700"
                        fontFamily="Inter, sans-serif"
                    >
                        {n.label}
                    </text>
                </motion.g>
            ))}

            {/* Data chips — pop in last */}
            {chips.map((chip, i) => {
                const w = chip.text.length * 7.5 + 20;
                return (
                    <motion.g key={`chip-${i}`} custom={i} variants={chipVariants}>
                        {/* Shadow */}
                        <rect x={chip.x + 3} y={chip.y + 3} width={w} height="24" fill="#0F0F0F" />
                        {/* Chip */}
                        <rect
                            x={chip.x}
                            y={chip.y}
                            width={w}
                            height="24"
                            fill={chip.bg}
                            stroke="#0F0F0F"
                            strokeWidth="2"
                        />
                        <text
                            x={chip.x + w / 2}
                            y={chip.y + 15}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#0F0F0F"
                            fontWeight="800"
                            fontFamily="Inter, sans-serif"
                        >
                            {chip.text}
                        </text>
                    </motion.g>
                );
            })}
        </motion.svg>
    );
};

export default Hero2SVG;
