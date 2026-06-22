import React, { useEffect, useRef } from 'react';
import { animateStampIn } from '../../animations/drivesAnimations';

const EligibilityStamp = ({ isEligible, reason }) => {
  const stampRef = useRef(null);

  useEffect(() => {
    animateStampIn(stampRef.current);
  }, [isEligible]);

  return (
    <div className="mb-8">
      <div
        ref={stampRef}
        className={`border-[4px] px-6 py-3 w-fit rotate-[-8deg] ${
          isEligible ? 'border-[#00C86F]' : 'border-[#FF3B3B]'
        }`}
      >
        <span className={`font-bebas text-[40px] tracking-widest leading-none ${
          isEligible ? 'text-[#00C86F]' : 'text-[#FF3B3B]'
        }`}>
          {isEligible ? '✓ ELIGIBLE TO APPLY' : '✗ NOT ELIGIBLE'}
        </span>
      </div>
      {!isEligible && reason && (
        <p className="font-mono-space text-[12px] text-[#888888] mt-3">
          Reason: {reason}
        </p>
      )}
    </div>
  );
};

export default EligibilityStamp;
