import React from 'react';
import { AnimatePresence } from 'framer-motion';
import DriveCard from './DriveCard';

const GridView = ({ drives, onDriveClick }) => {
  if (drives.length === 0) {
    return (
      <div className="py-20 text-center bg-[#FFFBF0]">
        <p className="font-bebas text-[36px] text-[#0F0F0F] opacity-20">NO FLIGHTS FOUND</p>
        <p className="font-mono-space text-[12px] text-[#888888] mt-2">
          Adjust your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 bg-[#FFFBF0]">
      <AnimatePresence mode="popLayout">
        {drives.map((drive, index) => (
          <DriveCard
            key={drive._id}
            drive={drive}
            onClick={onDriveClick}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GridView;
