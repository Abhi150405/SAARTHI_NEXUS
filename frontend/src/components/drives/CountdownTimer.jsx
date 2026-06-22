import React, { useEffect, useRef } from 'react';
import { startCountdownTimer } from '../../animations/drivesAnimations';

const CountdownTimer = ({ deadline }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!timerRef.current || !deadline) return;
    const cleanup = startCountdownTimer(timerRef.current, new Date(deadline).getTime());
    return cleanup;
  }, [deadline]);

  return (
    <span ref={timerRef} className="font-bebas text-[32px] text-[#FF3B3B] leading-none">
      0D : 00H : 00M
    </span>
  );
};

export default CountdownTimer;
