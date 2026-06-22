import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import EligibilityStamp from './EligibilityStamp';
import RoundTimeline from './RoundTimeline';
import CountdownTimer from './CountdownTimer';
import { animateCountUp } from '../../animations/drivesAnimations';

const BoardingPassPanel = ({ drive, profile, onClose, onApply, isApplied }) => {
  const cgpaRef = useRef(null);
  const sscRef = useRef(null);
  const hscRef = useRef(null);
  const amcatRef = useRef(null);

  useEffect(() => {
    if (!drive) return;
    const c = drive.criteria;
    animateCountUp(cgpaRef.current, c.cgpa, 1, 0);
    animateCountUp(sscRef.current, c.ssc, 0, 0.1);
    animateCountUp(hscRef.current, c.hsc, 0, 0.2);
    animateCountUp(amcatRef.current, c.amcat, 0, 0.3);
  }, [drive]);

  if (!drive) return null;

  const c = drive.criteria;
  const branches = drive.allowedBranches || [];
  const userBranch = profile?.department || profile?.dept || '';

  const cutoffs = [
    { label: 'MIN CGPA', value: c.cgpa, ref: cgpaRef, met: !c.cgpa || (parseFloat(profile?.college_cgpa) || 0) >= c.cgpa },
    { label: 'MIN SSC %', value: `${c.ssc}`, ref: sscRef, met: !c.ssc || (parseFloat(profile?.tenth_percentage) || 0) >= c.ssc },
    { label: 'MIN HSC %', value: `${c.hsc}`, ref: hscRef, met: !c.hsc || (parseFloat(profile?.twelfth_percentage) || 0) >= c.hsc },
    { label: 'MIN AMCAT', value: `${c.amcat}`, ref: amcatRef, met: !c.amcat || (parseInt(profile?.amcat_score) || 0) >= c.amcat },
  ];

  const failedReason = !drive.isEligible ? drive.eligibilityReasons?.[0] || 'Does not meet criteria' : null;
  const rounds = [{ round_name: 'APTITUDE' }, { round_name: 'TECHNICAL' }, { round_name: 'HR' }];

  return (
    <motion.div
      key="boarding-pass"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="h-screen sticky top-0 bg-[#f5f0e8] border-l-[3px] border-[#0a0a0a] overflow-y-auto flex flex-col"
    >
      {/* TICKET HEADER */}
      <div className="bg-white p-6 lg:p-8 relative overflow-hidden border-b-[3px] border-[#0a0a0a]">
        {/* Dot grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #0a0a0a 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        <div className="flex justify-between items-start relative z-10">
          <span className="font-mono-space text-[10px] font-bold uppercase tracking-[3px] text-[#888888]">
            BOARDING PASS
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-[#FF6B00] border-[3px] border-[#0a0a0a] font-bold text-white flex items-center justify-center hover:bg-[#FFE135] hover:text-[#0a0a0a] transition-colors duration-75 cursor-pointer"
            style={{ boxShadow: '3px 3px 0px #0a0a0a' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative z-10 mt-6">
          <h2 className="font-bebas text-[40px] lg:text-[56px] leading-[0.9] text-[#0a0a0a]">
            {drive.companyName}
          </h2>
          <p className="font-mono-space text-[14px] text-[#888888] mt-2">{drive.role}</p>
        </div>

        {/* Package stamp */}
        <div
          className="absolute bottom-6 lg:bottom-8 right-6 lg:right-8 bg-[#FFE135] border-[3px] border-[#0a0a0a] px-4 py-2 leading-none z-10"
          style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
        >
          <span className="font-bebas text-[36px] lg:text-[48px] text-[#0a0a0a]">{drive.ctc}</span>
          <span className="font-mono-space text-[10px] text-[#888888] ml-1 uppercase">LPA</span>
        </div>
      </div>

      {/* PERFORATION */}
      <div className="relative border-b-[3px] border-dashed border-[#0a0a0a]">
        <div className="absolute left-[-8px] top-[-8px] w-4 h-4 bg-[#f5f0e8] rounded-full border-[2px] border-[#0a0a0a]" />
        <div className="absolute right-[-8px] top-[-8px] w-4 h-4 bg-[#f5f0e8] rounded-full border-[2px] border-[#0a0a0a]" />
      </div>

      {/* TICKET BODY */}
      <div className="p-6 lg:p-8 flex-1">
        <EligibilityStamp isEligible={drive.isEligible} reason={failedReason} />

        {drive.requirements && (
          <div className="mb-6">
            <div className="font-mono-space text-[10px] font-bold uppercase tracking-[2px] text-[#888888] mb-3 border-b-[2px] border-[#0a0a0a] pb-2">
              REQUIREMENTS
            </div>
            <p className="text-[14px] text-[#4B4B4B] leading-[1.7]">{drive.requirements}</p>
          </div>
        )}

        {/* Cutoff grid */}
        <div
          className="grid grid-cols-2 gap-0 border-[3px] border-[#0a0a0a] my-6"
          style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
        >
          {cutoffs.map((cell, i) => (
            <div key={i} className={`p-5 ${i < 2 ? 'border-b-[2px] border-[#0a0a0a]' : ''} ${i % 2 === 0 ? 'border-r-[2px] border-[#0a0a0a]' : ''} ${
              cell.met ? 'bg-[#00C86F]/10' : 'bg-[#FF3B3B]/10'
            }`}>
              <div className="font-mono-space text-[9px] font-bold uppercase text-[#888888] tracking-[2px] mb-1">{cell.label}</div>
              <div ref={cell.ref} className={`font-bebas text-[36px] leading-none ${cell.met ? 'text-[#00C86F]' : 'text-[#FF3B3B]'}`}>
                {cell.value}
              </div>
            </div>
          ))}
        </div>

        {/* Branches */}
        {branches.length > 0 && (
          <div className="mt-6">
            <div className="font-mono-space text-[10px] font-bold uppercase tracking-[2px] text-[#888888] mb-3 border-b-[2px] border-[#0a0a0a] pb-2">
              ELIGIBLE BRANCHES
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {branches.map((b) => {
                const isYours = b.toUpperCase() === userBranch.toUpperCase();
                return (
                  <span key={b} className={`font-mono-space text-[11px] font-bold uppercase px-3 py-1.5 border-[3px] border-[#0a0a0a] ${
                    isYours ? 'bg-[#FFE135] text-[#0a0a0a]' : 'bg-[#f5f0e8] text-[#0a0a0a]'
                  }`}>
                    {b}{isYours && ' (YOU)'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <RoundTimeline rounds={rounds} />
      </div>

      {/* TICKET FOOTER */}
      <div className="bg-white border-t-[3px] border-[#0a0a0a] p-6 flex gap-3 justify-between items-center sticky bottom-0">
        <div>
          <span className="font-mono-space text-[#888888] text-[12px] block font-bold uppercase tracking-[1px]">CLOSES IN:</span>
          <CountdownTimer deadline={drive.deadline} />
        </div>

        {drive.isEligible ? (
          isApplied ? (
            <span
              className="bg-[#00C86F] border-[3px] border-[#0a0a0a] font-mono-space font-bold text-[14px] text-[#0a0a0a] px-8 py-3 uppercase tracking-[1px]"
              style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
            >
              ● APPLIED
            </span>
          ) : (
            <button
              onClick={() => onApply(drive)}
              className="bg-[#0a0a0a] border-[3px] border-[#0a0a0a] font-mono-space font-bold text-[14px] text-[#FFE135] px-8 py-3 uppercase tracking-[1px] cursor-pointer hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100"
              style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '3px 3px 0px #0a0a0a'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '6px 6px 0px #0a0a0a'; }}
            >
              APPLY NOW →
            </button>
          )
        ) : (
          <span className="bg-[#f5f0e8] border-[3px] border-[#0a0a0a] font-mono-space font-bold text-[14px] text-[#888888] px-8 py-3 uppercase cursor-not-allowed">
            NOT ELIGIBLE
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default BoardingPassPanel;
