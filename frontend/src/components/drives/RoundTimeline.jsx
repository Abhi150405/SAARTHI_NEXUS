import React from 'react';
import { motion } from 'framer-motion';

const RoundTimeline = ({ rounds }) => {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="font-mono-space text-[10px] font-bold uppercase tracking-[2px] text-[#888888] mb-3 border-b-[2px] border-[#0a0a0a] pb-2">
        SELECTION PROCESS ROUNDS
      </div>
      <div className="flex items-center mt-4">
        {rounds.map((round, index) => (
          <div key={index} className="flex flex-col items-center flex-1 relative">
            {/* Connecting line */}
            {index < rounds.length - 1 && (
              <motion.div
                className="absolute top-5 h-[3px] bg-[#0a0a0a] z-0"
                style={{ left: 'calc(50% + 20px)', right: 'calc(-50% + 20px)', transformOrigin: 'left' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.12 + 0.06, duration: 0.2 }}
              />
            )}
            {/* Step circle */}
            <motion.div
              className="w-10 h-10 bg-[#FFE135] border-[3px] border-[#0a0a0a] font-bold text-[14px] text-[#0a0a0a] flex items-center justify-center z-10 relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.12, type: 'spring', stiffness: 400, damping: 15 }}
            >
              {index + 1}
            </motion.div>
            {/* Step label */}
            <span className="font-mono-space text-[9px] font-bold uppercase text-[#888888] mt-2 text-center leading-tight tracking-[1px]">
              {round.round_name || round}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoundTimeline;
