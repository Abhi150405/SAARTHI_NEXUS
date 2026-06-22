import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { scrambleText } from '../../animations/drivesAnimations';

const BoardRow = ({ drive, onClick, isAnimating }) => {
  const companyRef = useRef(null);
  const roleRef = useRef(null);
  const rowRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (!isMobile && !isAnimating) {
      const c1 = scrambleText(companyRef.current, drive.companyName, 350);
      const c2 = scrambleText(roleRef.current, drive.role, 350);
      return () => { c1?.(); c2?.(); };
    }
  }, [drive.companyName, drive.role, isAnimating, isMobile]);

  const initials = (drive.companyName || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const branches = drive.allowedBranches || [];
  const daysLeft = drive.daysLeft ?? 5;
  const isUrgent = daysLeft <= 2;

  const getStatusBadge = () => {
    if (drive.isApplied) {
      return (
        <span
          className="bg-[#0a0a0a] text-[#FFE135] border-[3px] border-[#0a0a0a] font-mono-space font-bold text-[11px] uppercase tracking-[1px] px-4 py-2 inline-block"
          style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
        >
          ● APPLIED
        </span>
      );
    }
    if (drive.isEligible) {
      return (
        <button
          className="bg-[#0a0a0a] text-[#FFE135] border-[3px] border-[#0a0a0a] font-mono-space font-bold text-[11px] uppercase tracking-[1px] px-4 py-2 cursor-pointer transition-all duration-100 hover:translate-x-[3px] hover:translate-y-[3px]"
          style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '3px 3px 0px #0a0a0a'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '6px 6px 0px #0a0a0a'; }}
          onClick={(e) => { e.stopPropagation(); onClick(drive); }}
        >
          APPLY NOW →
        </button>
      );
    }
    return (
      <span className="bg-[#f5f0e8] text-[#0a0a0a] border-[3px] border-[#0a0a0a] font-mono-space font-bold text-[11px] uppercase tracking-[1px] px-4 py-2 inline-block">
        ✗ LOCKED
      </span>
    );
  };

  return (
    <div
      ref={rowRef}
      onClick={() => onClick(drive)}
      className={`grid grid-cols-[2fr_1.4fr_1fr_0.8fr_1.3fr_0.9fr_1.1fr] px-6 lg:px-10 py-5 items-center cursor-pointer bg-white transition-colors duration-150 hover:bg-[#FFE135] ${
        isUrgent ? 'border-l-[4px] border-l-[#FF3B3B]' : ''
      }`}
      style={{ borderBottom: '2px solid #e8e3d9' }}
    >
      {/* COMPANY */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-[#FF6B00] border-[3px] border-[#0a0a0a] font-bebas text-[16px] text-white flex items-center justify-center shrink-0">
          {initials}
        </div>
        <span ref={companyRef} className="font-bold text-[15px] text-[#0a0a0a] truncate">
          {drive.companyName}
        </span>
      </div>

      {/* ROLE */}
      <div className="min-w-0">
        <span ref={roleRef} className="text-[14px] text-[#666666] truncate block">
          {drive.role}
        </span>
      </div>

      {/* PACKAGE */}
      <div className="flex items-baseline gap-1">
        <span className="font-bebas text-[22px] text-[#00C86F] leading-none">{drive.ctc}</span>
        <span className="font-mono-space text-[10px] text-[#888888] uppercase">LPA</span>
      </div>

      {/* MIN CGPA */}
      <div className="hidden lg:block">
        <span className="font-mono-space text-[14px] text-[#0a0a0a]">
          {drive.criteria?.cgpa || '—'}
        </span>
      </div>

      {/* BRANCHES */}
      <div className="hidden lg:flex items-center gap-1 flex-wrap">
        {branches.slice(0, 3).map((b) => (
          <span key={b} className="border-[2px] border-[#0a0a0a] font-mono-space text-[10px] font-bold text-[#0a0a0a] px-2 py-0.5 uppercase bg-[#f5f0e8]">
            {b}
          </span>
        ))}
        {branches.length > 3 && (
          <span className="bg-[#0a0a0a] text-[#FFE135] font-mono-space text-[10px] font-bold px-2 py-0.5 uppercase border-[2px] border-[#0a0a0a]">
            +{branches.length - 3}
          </span>
        )}
      </div>

      {/* DEADLINE */}
      <div className="flex items-center gap-1.5">
        {isUrgent && (
          <span className="w-1.5 h-1.5 bg-[#FF3B3B] inline-block animate-pulse" />
        )}
        <span className={`font-mono-space text-[12px] font-bold uppercase ${isUrgent ? 'text-[#FF3B3B]' : 'text-[#888888]'}`}>
          {daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? '1 DAY' : `${daysLeft} DAYS`}
        </span>
      </div>

      {/* STATUS */}
      <div>{getStatusBadge()}</div>
    </div>
  );
};

export default BoardRow;
