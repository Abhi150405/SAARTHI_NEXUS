import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon, 
  Building2, 
  Briefcase, 
  Award, 
  Users, 
  X,
  Info
} from 'lucide-react';

const allEvents = [
  // August 2025
  { date: '2025-08-01', company: 'PhonePe', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹32.75 LPA', details: 'Full-time role for graduates.' },
  { date: '2025-08-03', company: 'ZS Associates', branch: 'CE, E&TC, IT', role: 'Business Technology Solutions Associate (BTSA)', pkg: '₹13.65 LPA', details: 'Consulting & technology analysis role.' },
  { date: '2025-08-04', company: 'eQ Technologic', branch: 'CE, E&TC, IT', role: 'Software Developer (₹13.88 LPA) / Quality Assurance (₹11.13 LPA)', pkg: '₹11.13 - ₹13.88 LPA', details: 'Dual profile hiring for Development and QA.' },
  { date: '2025-08-05', company: 'Siemens', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹12+ LPA', details: 'Core software engineering roles.' },
  { date: '2025-08-07', company: 'Commvault Systems', branch: 'CE, IT', role: 'Software Developer', pkg: '₹16 LPA + $19K RSU + ₹75K Relocation | Intern: ₹50K/mo', details: 'High-compensation developer role with standard stock options and relocation benefits.' },
  { date: '2025-08-09', company: 'Barclays', branch: 'CE, E&TC, IT (TE & BE)', role: 'Software Developer (₹13.50 LPA) / Summer Intern (₹75K/month)', pkg: '₹13.50 LPA | Intern: ₹75K/mo', details: 'Open to Third Year (TE) for internships and Final Year (BE) for FTE.' },
  { date: '2025-08-11', company: 'OneCard', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹16.20 LPA', details: 'Fintech product developer role.' },
  { date: '2025-08-13', company: 'Bank of New York', branch: 'CE, E&TC, IT', role: 'Internship', pkg: '₹75K/month', details: 'Pre-placement offer opportunity post-internship.' },
  { date: '2025-08-14', company: 'ProcDNA', branch: 'CE, E&TC, IT', role: 'Business Analyst / Technology Analyst', pkg: '₹16.74 LPA', details: 'Consulting and big data analytics for pharma.' },
  { date: '2025-08-16', company: 'Toshiba', branch: 'CE, E&TC, IT', role: 'Associate Software Engineer / Hardware Engineer', pkg: '₹11.50 LPA', details: 'Software and hardware design roles.' },
  { date: '2025-08-23', company: 'NICE Systems', branch: 'CE, E&TC, IT', role: 'Associate Software Engineer', pkg: '₹12 LPA', details: 'Enterprise customer experience software developer.' },
  { date: '2025-08-24', company: 'Accordion D&A', branch: 'CE, E&TC, IT', role: 'Data Analyst', pkg: '₹8.50 LPA', details: 'Financial consulting and data analytics.' },
  { date: '2025-08-28', company: 'Arista Networks', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹29.44 LPA', details: 'High-performance cloud networking developer role.' },
  { date: '2025-08-30', company: 'Pattern Technologies', branch: 'CE', role: 'Software Engineering Intern', pkg: '₹50K/month', details: 'Computer Engineering only. Summer/semester internship.' },
  
  // September 2025
  { date: '2025-09-01', company: 'FlexTrade', branch: 'CE, E&TC, IT', role: 'C++ Developer (₹9.96 LPA) / Tech Analyst (₹9 LPA) / FIX Analyst (₹8 LPA)', pkg: '₹8.00 - ₹9.96 LPA', details: 'Multi-role hiring for trading software developer.' },
  { date: '2025-09-08', company: 'UPTIQ', branch: 'CE, E&TC, IT', role: 'Software Developer', pkg: '₹22 LPA', details: 'Product engineering role.' },
  { date: '2025-09-08', company: 'Entrata', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹7 LPA', details: 'Property management software platform hiring.' },
  { date: '2025-09-12', company: 'Wissen Technology', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹9.50 LPA', details: 'Fintech and enterprise software developer.' },
  { date: '2025-09-20', company: 'Sell.do', branch: 'CE, E&TC, IT', role: 'Product Engineer', pkg: '₹8.50 LPA', details: 'CRM product platform development.' },
  { date: '2025-09-22', company: 'SAP', branch: 'CE, E&TC, IT', role: 'Associate Consultant', pkg: '₹8 LPA', details: 'Enterprise resource planning consultant role.' },
  { date: '2025-09-23', company: 'Promobi Technologies', branch: 'IT (UG), CE & DS (PG)', role: 'Software Engineer', pkg: '₹8 - ₹10 LPA', details: 'Mobile device management platform developer.' },
  { date: '2025-09-23', company: 'ARAI', branch: 'CE, E&TC, IT (2025 Batch)', role: 'Graduate Trainee Engineer', pkg: '₹5.6 LPA', details: 'Automotive research & development association.' },
  { date: '2025-09-24', company: 'Concentric AI', branch: 'CE, IT (UG & PG)', role: 'SDE', pkg: '₹17.50 LPA', details: 'Data security posture management developer.' },
  { date: '2025-09-29', company: 'NCS Technologies', branch: 'CE, IT', role: 'Software Engineer', pkg: '₹6.82 LPA', details: 'Global IT services company.' },
  
  // October 2025
  { date: '2025-10-10', company: 'Kylas / BeyondWalls', branch: 'CE, E&TC, IT', role: 'Product Engineer (₹9 LPA) / Account Executive (₹7 LPA) / Tech Sales (₹6 LPA)', pkg: '₹6.00 - ₹9.00 LPA', details: 'Technical development and sales/relationship management profiles.' },
  { date: '2025-10-13', company: 'IBM', branch: 'CE, E&TC, IT', role: 'Software Developer', pkg: '₹11 LPA', details: 'Global hybrid cloud and AI technology company.' },
  { date: '2025-10-14', company: 'Ciena', branch: 'CE, E&TC, IT', role: 'Software Developer', pkg: '₹14 LPA', details: 'Telecommunication networking systems developer.' },
  { date: '2025-10-16', company: 'Xceedance', branch: 'CE, E&TC, IT', role: 'Associate Programmer / Quality Analyst / BI', pkg: '₹7 LPA', details: 'Insurance tech advisory and data analytics.' },
  { date: '2025-10-28', company: 'Aspect Ratio', branch: 'CE, E&TC, IT', role: 'Analyst', pkg: '₹12 LPA', details: 'Life sciences management consulting and analytics.' },
  { date: '2025-10-29', company: 'ACI Worldwide', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹12.50 LPA', details: 'Real-time electronic payments solutions.' },
  { date: '2025-10-31', company: 'Iaura', branch: 'CE, IT', role: 'Entry Level Fresher', pkg: '₹5 - ₹8 LPA', details: 'Software engineer and system trainee.' },
  
  // November 2025
  { date: '2025-11-03', company: 'Rahi Technologies', branch: 'CE, IT', role: 'Software Engineer', pkg: '₹8.50 LPA', details: 'Enterprise IT solutions and global systems.' },
  { date: '2025-11-04', company: 'ION Group', branch: 'CE, E&TC, IT', role: 'Software Developer / Technical Analyst', pkg: '₹17.30 LPA', details: 'Fintech capital markets software developers.' },
  { date: '2025-11-05', company: 'IBM (Female Only)', branch: 'CE, IT', role: 'Consulting', pkg: '₹4.50 LPA', details: 'Special diversity hiring drive for consulting.' },
  { date: '2025-11-07', company: 'AT20.ai', branch: 'CE, IT', role: 'Full Stack / Data Engineer / AI/ML Engineer', pkg: '₹8 - ₹10 LPA', details: 'Deep learning product builder.' },
  { date: '2025-11-13', company: 'Fractal', branch: 'CE, E&TC, IT', role: 'Decision Science / Data Science / Data Engineer', pkg: '₹10 LPA', details: 'Analytics & cognitive science solutions provider.' },
  { date: '2025-11-19', company: 'NVIDIA', branch: 'CE, E&TC, IT', role: 'QA Tools & Test Development Intern', pkg: '₹40K/month', details: 'Graphics processing units and high-performance computing chipmaker.' },
  { date: '2025-11-28', company: 'Western Union', branch: 'CE, E&TC, IT', role: 'Trainee Associate', pkg: '₹7.25 LPA', details: 'Global money transfer platform engineering.' },
  
  // December 2025
  { date: '2025-12-02', company: 'Emcure', branch: 'CE, IT', role: 'Graduate Trainee Engineer', pkg: '₹5 LPA', details: 'Pharmaceutical technology systems development.' },
  { date: '2025-12-03', company: 'GEP', branch: 'CE, E&TC, IT', role: 'Software Engineer / Associate Data Scientist', pkg: '₹20 LPA', details: 'Procurement and supply chain cloud software.' },
  { date: '2025-12-03', company: 'TCS Research & Innovation', branch: 'CE, IT (UG & PG)', role: 'Research & Innovation', pkg: 'UG: ₹9.08 LPA | PG: ₹11.58 LPA', details: 'Advanced computing research labs hiring.' }
];

const monthsList = [
  { name: 'August 2025', year: 2025, month: 7, days: 31, startDay: 5 }, // Friday
  { name: 'September 2025', year: 2025, month: 8, days: 30, startDay: 1 }, // Monday
  { name: 'October 2025', year: 2025, month: 9, days: 31, startDay: 3 }, // Wednesday
  { name: 'November 2025', year: 2025, month: 10, days: 30, startDay: 6 }, // Saturday
  { name: 'December 2025', year: 2025, month: 11, days: 31, startDay: 1 } // Monday
];

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const companyDbMapping = {
  'PhonePe': 'PhonePe',
  'ZS Associates': 'ZS Associates',
  'eQ Technologic': 'EQ Technologic',
  'Siemens': 'Siemens',
  'Commvault Systems': 'Commvault',
  'Barclays': 'Barclays',
  'OneCard': 'OneCard',
  'Bank of New York': 'BNY Mellon',
  'ProcDNA': 'ProcDNA',
  'Toshiba': 'Toshiba',
  'NICE Systems': 'NICE Systems',
  'Accordion D&A': 'Accordion',
  'Arista Networks': 'Arista Networks',
  'Pattern Technologies': 'Pattern',
  'FlexTrade': 'FlexTrade',
  'UPTIQ': 'UPTIQ',
  'Entrata': 'Entrata',
  'Wissen Technology': 'Wissen Technology',
  'Sell.do': 'Sell.do',
  'SAP': 'SAP',
  'Promobi Technologies': 'Promobi',
  'ARAI': 'ARAI',
  'Concentric AI': 'ConcentricAl',
  'NCS Technologies': 'NCS',
  'Kylas / BeyondWalls': 'Kylas',
  'IBM': 'IBM',
  'Ciena': 'Ciena',
  'Xceedance': 'Xceedance',
  'Aspect Ratio': 'Aspect Ratio',
  'ACI Worldwide': 'ACI Worldwide',
  'Iaura': 'Iaura',
  'Rahi Technologies': 'Rahi Technolgies',
  'ION Group': 'Ion Group',
  'IBM (Female Only)': 'IBM',
  'AT20.ai': 'AT20.ai',
  'Fractal': 'Fractal',
  'NVIDIA': 'NVIDIA',
  'Western Union': 'Western Union',
  'Emcure': 'Emcure',
  'GEP': 'GEP',
  'TCS Research & Innovation': 'TCS R&I'
};

const pgAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // August 2025
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [selectedDayString, setSelectedDayString] = useState('');

  const handleNavigateToXRay = (calendarCompanyName) => {
    const dbName = companyDbMapping[calendarCompanyName] || calendarCompanyName;
    navigate(`/app/records?company=${encodeURIComponent(dbName)}`);
  };

  const currentMonth = monthsList[currentMonthIndex];

  // Helper to format date key matching 'YYYY-MM-DD'
  const formatDateKey = (day) => {
    const mm = String(currentMonth.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentMonth.year}-${mm}-${dd}`;
  };

  // Map events of this month
  const monthEventsMap = useMemo(() => {
    const map = {};
    allEvents.forEach(e => {
      const parts = e.date.split('-');
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const d = parseInt(parts[2]);
      if (y === currentMonth.year && m === currentMonth.month) {
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    });
    return map;
  }, [currentMonthIndex]);

  // Handle search matching companies
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return allEvents;
    const query = searchQuery.toLowerCase();
    return allEvents.filter(
      e => e.company.toLowerCase().includes(query) || 
           e.role.toLowerCase().includes(query) ||
           e.branch.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Check if a day has any matching search query
  const dayHasSearchResult = (day) => {
    if (!searchQuery.trim()) return false;
    const key = formatDateKey(day);
    return filteredEvents.some(e => e.date === key);
  };

  const handleDayClick = (day, events) => {
    if (!events || events.length === 0) return;
    const formattedDate = new Date(currentMonth.year, currentMonth.month, day).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    setSelectedDayString(formattedDate);
    setSelectedDayEvents(events);
  };

  const prevMonth = () => {
    if (currentMonthIndex > 0) setCurrentMonthIndex(currentMonthIndex - 1);
  };

  const nextMonth = () => {
    if (currentMonthIndex < monthsList.length - 1) setCurrentMonthIndex(currentMonthIndex + 1);
  };

  // Generate calendar grid array
  const gridCells = useMemo(() => {
    const cells = [];
    // Pad leading empty days
    for (let i = 0; i < currentMonth.startDay; i++) {
      cells.push({ type: 'empty', id: `empty-${i}` });
    }
    // Month days
    for (let day = 1; day <= currentMonth.days; day++) {
      const events = monthEventsMap[day] || [];
      const isSearched = dayHasSearchResult(day);
      cells.push({ type: 'day', day, events, isSearched });
    }
    return cells;
  }, [currentMonth, monthEventsMap, filteredEvents, searchQuery]);

  return (
    <motion.div {...pgAnim} className="pb-16">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="font-black uppercase tracking-widest text-[10px] text-[#F97316]">Activity Dashboard</span>
          <h1 className="font-black text-[36px] text-[#0F0F0F] tracking-[-0.03em] leading-tight">Placement Calendar</h1>
          <p className="font-medium text-[14px] text-[#4B4B4B]">Track company drives, roles, and scheduled branch visits for the Aug-Dec 2025 cycle.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 shrink-0">
          <input
            type="text"
            placeholder="Search company, branch, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFBF0] text-[#0F0F0F] font-bold text-[13px] placeholder:text-[#888888] pl-10 pr-4 py-2.5 border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] focus:shadow-[1px_1px_0px_#0F0F0F] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0F0F0F]" />
        </div>
      </div>

      {/* ── Main Layout Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ── Left: Calendar Grid (8 Cols) ── */}
        <div className="xl:col-span-8 bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-4 md:p-6">
          
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between border-b-[3px] border-[#0F0F0F] pb-4 mb-6">
            <h2 className="font-black text-[22px] text-[#0F0F0F] tracking-tight flex items-center gap-2">
              <CalendarIcon size={20} className="text-[#F97316]" />
              {currentMonth.name}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                disabled={currentMonthIndex === 0}
                className="w-10 h-10 bg-white border-[3px] border-[#0F0F0F] flex items-center justify-center font-black shadow-[3px_3px_0px_#0F0F0F] disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                disabled={currentMonthIndex === monthsList.length - 1}
                className="w-10 h-10 bg-white border-[3px] border-[#0F0F0F] flex items-center justify-center font-black shadow-[3px_3px_0px_#0F0F0F] disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Grid Headers (Days of the Week) */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {weekdayNames.map((name, i) => (
              <span
                key={name}
                className={`font-black text-[11px] uppercase py-1 border-[2px] border-transparent tracking-wider ${
                  i === 0 || i === 6 ? 'text-[#EF4444]' : 'text-[#888888]'
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Calendar Cells Grid */}
          <div className="grid grid-cols-7 gap-2">
            {gridCells.map((cell) => {
              if (cell.type === 'empty') {
                return (
                  <div
                    key={cell.id}
                    className="aspect-[1/1] border-[2px] border-dashed border-[#E5E7EB] bg-[#FAF9F6]/20 rounded-lg"
                  />
                );
              }

              const { day, events, isSearched } = cell;
              const hasEvents = events.length > 0;
              
              // Custom Styling classes for calendar cells
              let cellClass = "aspect-[1/1] p-1 md:p-2 border-[3px] border-[#0F0F0F] rounded-lg relative flex flex-col justify-between transition-all duration-75 ";
              if (hasEvents) {
                cellClass += "bg-[#FFFBF0] hover:bg-[#FFF3CD] cursor-pointer shadow-[2px_2px_0px_#0F0F0F] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px]";
              } else {
                cellClass += "bg-white text-[#888888]";
              }

              if (isSearched) {
                cellClass += " ring-4 ring-[#FACC15] ring-offset-2";
              }

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day, events)}
                  className={cellClass}
                >
                  <span className={`font-black text-[12px] md:text-[14px] ${hasEvents ? 'text-[#0F0F0F]' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  
                  {/* Event indicator inside the cell */}
                  {hasEvents && (
                    <div className="mt-1 flex flex-col gap-0.5 max-h-[80%] overflow-hidden">
                      {events.map((e, index) => (
                        <div
                          key={index}
                          className="px-1 py-0.5 rounded border border-[#0F0F0F] text-[8px] md:text-[9px] font-black uppercase tracking-tight truncate select-none shadow-[1px_1px_0px_#0F0F0F]"
                          style={{
                            backgroundColor: index === 0 ? '#FACC15' : index === 1 ? '#60A5FA' : '#A3E635'
                          }}
                        >
                          {e.company}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* ── Right: List of Company Visits this Month (4 Cols) ── */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          <div className="bg-[#FFFBF0] border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-5">
            <h3 className="font-black text-[16px] text-[#0F0F0F] uppercase tracking-tight mb-4 flex items-center gap-2">
              <Info size={16} className="text-[#F97316]" />
              Schedule Summary
            </h3>
            <p className="text-[12px] font-bold text-[#4B4B4B] leading-relaxed">
              This month has <span className="text-[#F97316] font-black">{Object.keys(monthEventsMap).length} active days</span> of recruiting. Click any highlighted date on the calendar to view candidate branches, job descriptions, and salary packages.
            </p>
          </div>

          <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-5 max-h-[460px] flex flex-col">
            <h3 className="font-black text-[16px] text-[#0F0F0F] uppercase tracking-tight mb-4 shrink-0">
              Visits in {currentMonth.name}
            </h3>
            
            <div className="overflow-y-auto pr-1 flex-1 space-y-3 scrollbar-thin">
              {Object.keys(monthEventsMap).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] font-bold text-[#888888]">No placement activities scheduled.</p>
                </div>
              ) : (
                Object.keys(monthEventsMap)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(day => {
                    const dayNum = parseInt(day);
                    const evs = monthEventsMap[dayNum];
                    return evs.map((e, index) => (
                      <button
                        key={`${day}-${index}`}
                        onClick={() => handleDayClick(dayNum, evs)}
                        className="w-full text-left p-3 bg-[#FFFBF0] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-[10px] bg-[#0F0F0F] text-white px-1.5 py-0.5 rounded">
                              {dayNum} {currentMonth.name.split(' ')[0]}
                            </span>
                            <span className="font-black text-[13px] text-[#0F0F0F] group-hover:text-[#F97316] transition-colors truncate">
                              {e.company}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-[#525252] truncate">{e.role}</p>
                        </div>
                        <span className="font-black text-[11px] text-[#22C55E] shrink-0 ml-2">
                          {e.pkg.split('|')[0].trim()}
                        </span>
                      </button>
                    ));
                  })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── Neobrutalist Modal for Selected Day Details ─── */}
      <AnimatePresence>
        {selectedDayEvents && (
          <>
            {/* Modal Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDayEvents(null)}
              className="fixed inset-0 bg-[#0F0F0F]/65 z-50 flex items-center justify-center p-4"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed left-[5%] right-[5%] md:left-auto md:right-auto md:w-[600px] max-h-[85vh] bg-[#FFFBF0] border-[4px] border-[#0F0F0F] shadow-[10px_10px_0px_#0F0F0F] z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              style={{ top: '10%' }}
            >
              {/* Modal Header */}
              <div className="bg-[#FACC15] border-b-[4px] border-[#0F0F0F] p-4 flex items-center justify-between shrink-0">
                <div>
                  <span className="font-black text-[10px] uppercase text-[#0F0F0F]/60">VISIT DETAILS</span>
                  <h3 className="font-black text-[18px] text-[#0F0F0F]">{selectedDayString}</h3>
                </div>
                <button
                  onClick={() => setSelectedDayEvents(null)}
                  className="w-9 h-9 bg-white border-[3px] border-[#0F0F0F] flex items-center justify-center hover:bg-[#EF4444] hover:text-white transition-colors duration-100 shadow-[2px_2px_0px_#0F0F0F]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {selectedDayEvents.map((e, index) => (
                  <div
                    key={index}
                    className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] p-5 relative"
                  >
                    {/* Company Tag */}
                    <div className="flex items-center justify-between mb-4 border-b-[2px] border-dashed border-[#E5E7EB] pb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="text-[#F97316]" size={20} />
                        <h4 className="font-black text-[20px] text-[#0F0F0F]">{e.company}</h4>
                      </div>
                      <span className="font-black text-[13px] bg-[#A3E635] border-[2px] border-[#0F0F0F] px-2 py-0.5 shadow-[2px_2px_0px_#0F0F0F]">
                        {e.pkg}
                      </span>
                    </div>

                    {/* Event Grid Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] font-bold">
                      <div className="bg-[#FAF9F6] border-[2px] border-[#0F0F0F] p-3">
                        <div className="flex items-center gap-1.5 text-[#888888] text-[10px] uppercase tracking-wider mb-1">
                          <Users size={12} /> Eligible Branches
                        </div>
                        <span className="text-[#0F0F0F] text-[13px] font-black">{e.branch}</span>
                      </div>
                      <div className="bg-[#FAF9F6] border-[2px] border-[#0F0F0F] p-3">
                        <div className="flex items-center gap-1.5 text-[#888888] text-[10px] uppercase tracking-wider mb-1">
                          <Briefcase size={12} /> Target Role
                        </div>
                        <span className="text-[#0F0F0F] text-[13px] font-black">{e.role}</span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {e.details && (
                      <div className="mt-4 bg-[#FAF9F6] border-[2px] border-[#0F0F0F] p-3 text-[12px] font-bold text-[#4B4B4B] leading-relaxed flex items-start gap-2">
                        <Award size={16} className="text-[#F97316] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-[#888888] uppercase block tracking-wider mb-0.5">Job Overview</span>
                          {e.details}
                        </div>
                      </div>
                    )}

                    {/* View Insights Button */}
                    <button
                      onClick={() => handleNavigateToXRay(e.company)}
                      className="mt-4 w-full bg-[#60A5FA] text-[#0F0F0F] font-black border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] py-2.5 text-[12px] flex items-center justify-center gap-2 hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      <Building2 size={14} /> View Company Insights (X-Ray) →
                    </button>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="bg-[#FAF9F6] border-t-[3px] border-[#0F0F0F] p-4 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedDayEvents(null)}
                  className="bg-white text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] px-5 py-2 text-[12px] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default CalendarPage;
