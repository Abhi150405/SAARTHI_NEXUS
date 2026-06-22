import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'ALL DRIVES' },
  { key: 'eligible', label: 'ELIGIBLE ✓' },
  { key: 'closing', label: 'CLOSING SOON ⚡' },
  { key: 'applied', label: 'APPLIED ●' },
];

const ControlStrip = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewChange,
}) => {
  return (
    <div className="bg-[#FFE135] border-b-[3px] border-[#0a0a0a] px-4 lg:px-10 py-3 flex items-center gap-3 flex-wrap">
      {/* Filter tabs */}
      <div
        className="flex border-[3px] border-[#0a0a0a]"
        style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-3 lg:px-5 py-2.5 font-mono-space font-bold text-[11px] lg:text-[12px] uppercase tracking-[1px] cursor-pointer transition-all duration-75 ${
              i < TABS.length - 1 ? 'border-r-[3px] border-[#0a0a0a]' : ''
            } ${
              activeTab === tab.key
                ? 'bg-[#0a0a0a] text-[#FFE135]'
                : 'bg-[#f5f0e8] text-[#0a0a0a] hover:bg-[#f0ead8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-[280px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]"
        />
        <input
          type="text"
          placeholder="Search drives..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#f5f0e8] border-[3px] border-[#0a0a0a] pl-9 pr-4 py-2 font-mono-space text-[12px] placeholder-[#888888] focus:border-[#FF6B00] outline-none"
        />
      </div>

      {/* View toggle */}
      <div className="hidden md:flex ml-auto border-[3px] border-[#0a0a0a]">
        <button
          onClick={() => onViewChange('board')}
          className={`px-3.5 py-2.5 transition-colors duration-75 ${
            viewMode === 'board'
              ? 'bg-[#0a0a0a] text-[#FFE135]'
              : 'bg-[#f5f0e8] text-[#0a0a0a] hover:bg-[#f0ead8]'
          }`}
          title="List View"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => onViewChange('grid')}
          className={`px-3.5 py-2.5 border-l-[3px] border-[#0a0a0a] transition-colors duration-75 ${
            viewMode === 'grid'
              ? 'bg-[#0a0a0a] text-[#FFE135]'
              : 'bg-[#f5f0e8] text-[#0a0a0a] hover:bg-[#f0ead8]'
          }`}
          title="Grid View"
        >
          <LayoutGrid size={18} />
        </button>
      </div>
    </div>
  );
};

export default ControlStrip;
