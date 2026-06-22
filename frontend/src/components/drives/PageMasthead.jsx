import React, { useEffect, useRef } from 'react';
import { animateCountUp, pulseElement } from '../../animations/drivesAnimations';
import gsap from 'gsap';

const PageMasthead = ({ totalDrives, eligibleCount, closingTodayCount }) => {
  const totalRef = useRef(null);
  const eligibleRef = useRef(null);
  const closingRef = useRef(null);
  const titleLine1Ref = useRef(null);
  const titleLine2Ref = useRef(null);
  const eyebrowRef = useRef(null);

  useEffect(() => {
    animateCountUp(totalRef.current, totalDrives, 0, 0.6);
    animateCountUp(eligibleRef.current, eligibleCount, 0, 0.75);
    animateCountUp(closingRef.current, closingTodayCount, 0, 0.9);
  }, [totalDrives, eligibleCount, closingTodayCount]);

  useEffect(() => {
    // Title entrance animation
    gsap.fromTo(eyebrowRef.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.05 });
    gsap.fromTo(titleLine1Ref.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 });
    gsap.fromTo(titleLine2Ref.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.25 });
    // Stat boxes entrance
    gsap.fromTo('.stat-box-drive', { y: -20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out', delay: 0.3 });
  }, []);

  const stats = [
    { ref: totalRef, value: totalDrives, label: 'ACTIVE DRIVES' },
    { ref: eligibleRef, value: eligibleCount, label: 'ELIGIBLE' },
    { ref: closingRef, value: closingTodayCount, label: 'CLOSING TODAY' },
  ];

  return (
    <div className="w-full bg-[#f5f0e8] px-6 lg:px-10 py-8 border-b-[3px] border-[#0a0a0a]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 flex-wrap">
        {/* Left block */}
        <div>
          <p ref={eyebrowRef} className="font-mono-space text-[#FF3B3B] text-[11px] font-bold uppercase tracking-[2px] mb-2">
            CAMPUS PLACEMENT DRIVES — AY 2024–25
          </p>
          <div className="leading-[0.88]">
            <span ref={titleLine1Ref} className="font-bebas text-[52px] lg:text-[72px] text-[#0a0a0a] block">
              DEPARTURE
            </span>
            <span
              ref={titleLine2Ref}
              className="font-bebas text-[52px] lg:text-[72px] text-[#FFE135] bg-[#0a0a0a] inline-block px-4 py-0.5 border-[3px] border-[#0a0a0a]"
              style={{ boxShadow: '10px 10px 0px #0a0a0a' }}
            >
              BOARD
            </span>
          </div>
        </div>

        {/* Right block — stat boxes */}
        <div className="flex gap-3 flex-wrap">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="stat-box-drive bg-white border-[3px] border-[#0a0a0a] px-5 lg:px-6 py-4 min-w-[120px] text-center hover:translate-x-[3px] hover:translate-y-[3px] transition-transform duration-100"
              style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '3px 3px 0px #0a0a0a'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '6px 6px 0px #0a0a0a'; }}
            >
              <div ref={stat.ref} className="font-bebas text-[36px] lg:text-[48px] text-[#0a0a0a] leading-none">
                {stat.value}
              </div>
              <div className="font-mono-space text-[10px] font-bold text-[#888888] uppercase tracking-[2px] mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageMasthead;
