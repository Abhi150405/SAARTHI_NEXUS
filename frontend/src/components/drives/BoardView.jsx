import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import BoardRow from './BoardRow';
import { animateBoardEntry } from '../../animations/drivesAnimations';

const BoardView = ({ drives, onDriveClick, isAnimating }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rows = containerRef.current.querySelectorAll('[data-board-row]');
    if (rows.length > 0) {
      animateBoardEntry(Array.from(rows));
    }
  }, [drives]);

  const columns = [
    'COMPANY', 'ROLE', 'PACKAGE', 'MIN CGPA', 'BRANCHES', 'DEADLINE', 'STATUS',
  ];

  return (
    <div className="w-full bg-[#f5f0e8]">
      {/* Column header row */}
      <div className="grid grid-cols-[2fr_1.4fr_1fr_0.8fr_1.3fr_0.9fr_1.1fr] px-6 lg:px-10 py-3.5 border-b-[3px] border-[#0a0a0a] bg-[#f5f0e8]">
        {columns.map((col, i) => (
          <span
            key={col}
            className={`font-mono-space text-[11px] font-bold uppercase tracking-[2px] text-[#888888] ${
              (col === 'MIN CGPA' || col === 'BRANCHES') ? 'hidden lg:block' : ''
            }`}
          >
            {col}
          </span>
        ))}
      </div>

      {/* Board rows */}
      <div ref={containerRef} className="overflow-y-auto max-h-[calc(100vh-320px)]">
        {drives.length === 0 ? (
          <div className="py-20 text-center bg-white">
            <p className="font-bebas text-[36px] text-[#0a0a0a] opacity-10">NO FLIGHTS FOUND</p>
            <p className="font-mono-space text-[12px] text-[#888888] mt-2">
              Adjust your filters or check back later
            </p>
          </div>
        ) : (
          drives.map((drive) => (
            <div key={drive._id} data-board-row>
              <BoardRow drive={drive} onClick={onDriveClick} isAnimating={isAnimating} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardView;
