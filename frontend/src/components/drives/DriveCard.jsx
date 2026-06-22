import React from 'react';
import { motion } from 'framer-motion';

const DriveCard = ({ drive, onClick, index }) => {
  const initials = (drive.companyName || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const daysLeft = drive.daysLeft ?? 5;
  const isUrgent = daysLeft <= 2;
  const branches = drive.allowedBranches || [];

  const topBandColor = drive.isApplied
    ? 'bg-[#FF6B00]'
    : drive.isEligible
    ? 'bg-[#00C86F]'
    : 'bg-[#FF3B3B]';

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => onClick(drive)}
      className="bg-white border-[3px] border-[#0a0a0a] cursor-pointer group relative overflow-hidden hover:bg-[#FFE135] transition-colors duration-150"
    >
      {/* Top color band */}
      <div className={`h-[6px] ${topBandColor} border-b-[3px] border-[#0a0a0a]`} />

      {/* Card header */}
      <div className="px-5 pt-5 pb-0 flex justify-between items-start">
        <div>
          <div className="w-10 h-10 bg-[#FF6B00] border-[3px] border-[#0a0a0a] font-bebas text-[16px] text-white flex items-center justify-center">
            {initials}
          </div>
          <h3 className="font-bold text-[18px] text-[#0a0a0a] mt-3 leading-tight">
            {drive.companyName}
          </h3>
          <p className="font-mono-space text-[11px] text-[#888888] mt-0.5">
            {drive.role}
          </p>
        </div>
        <div
          className="bg-[#FFE135] border-[3px] border-[#0a0a0a] px-3 py-1 leading-none shrink-0"
          style={{ boxShadow: '3px 3px 0px #0a0a0a' }}
        >
          <span className="font-bebas text-[28px] text-[#0a0a0a]">{drive.ctc}</span>
        </div>
      </div>

      {/* Perforated divider */}
      <div className="my-4 mx-5 border-b-[2px] border-dashed border-[#0a0a0a] opacity-20" />

      {/* Mini stats row */}
      <div className="mx-5 grid grid-cols-3 border-[2px] border-[#0a0a0a]">
        {[
          { value: drive.criteria?.cgpa || '—', label: 'CGPA' },
          { value: drive.criteria?.ssc ? `${drive.criteria.ssc}%` : '—', label: 'SSC' },
          { value: drive.criteria?.hsc ? `${drive.criteria.hsc}%` : '—', label: 'HSC' },
        ].map((cell, i) => (
          <div key={i} className={`py-3 text-center ${i < 2 ? 'border-r-[2px] border-[#0a0a0a]' : ''}`}>
            <div className="font-mono-space font-bold text-[14px] text-[#0a0a0a] leading-none">{cell.value}</div>
            <div className="font-mono-space text-[9px] uppercase text-[#888888] mt-1 tracking-[1px]">{cell.label}</div>
          </div>
        ))}
      </div>

      {/* Branch tags */}
      {branches.length > 0 && (
        <div className="px-5 pt-3 pb-2 flex gap-1 flex-wrap">
          {branches.map((b) => (
            <span key={b} className="border-[2px] border-[#0a0a0a] bg-[#f5f0e8] text-[#0a0a0a] font-mono-space text-[10px] font-bold uppercase px-2 py-0.5">
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Card footer */}
      <div className="bg-[#0a0a0a] border-t-[3px] border-[#0a0a0a] px-5 py-3 flex justify-between items-center mt-2">
        <span className={`font-mono-space text-[11px] font-bold ${isUrgent ? 'text-[#FF3B3B]' : 'text-[#888888]'}`}>
          {isUrgent && '⬤ '}
          {daysLeft === 0 ? 'CLOSES TODAY' : daysLeft === 1 ? '1 DAY LEFT' : `${daysLeft} DAYS LEFT`}
        </span>

        {drive.isEligible || drive.isApplied ? (
          <span className="bg-[#FFE135] text-[#0a0a0a] font-mono-space font-bold text-[10px] border-[2px] border-[#FFE135] px-3 py-1.5 uppercase tracking-[1px]">
            {drive.isApplied ? '● APPLIED' : 'VIEW →'}
          </span>
        ) : (
          <span className="bg-transparent text-[#888888] border-[2px] border-[#555] font-mono-space font-bold text-[10px] px-3 py-1.5 uppercase tracking-[1px]">
            ✗ LOCKED
          </span>
        )}
      </div>

      {/* Watermark */}
      <div className={`absolute bottom-16 right-3 pointer-events-none select-none font-bebas text-[60px] leading-none tracking-[4px] rotate-[-20deg] opacity-[0.04] ${drive.isEligible ? 'text-[#00C86F]' : 'text-[#FF3B3B]'}`}>
        {drive.isEligible ? 'ELIGIBLE' : 'LOCKED'}
      </div>
    </motion.div>
  );
};

export default DriveCard;
