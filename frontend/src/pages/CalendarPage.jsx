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
  Info,
  Pin,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Sparkles
} from 'lucide-react';
import CompanyXRay from '../components/CompanyXRay';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CURRENT YEAR PLACEMENT EVENTS (2026-27 Cycle — Upcoming Live Schedule)
// STRICTLY ONLY the upcoming 11 companies from the official schedule
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const currentYearEvents = [
  // 1. PhonePe
  { date: '2026-08-03', company: 'PhonePe', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Online Assessment / Coding Test', pkg: '₹33.50 LPA', details: 'Online coding assessment & technical test round.' },
  { date: '2026-08-04', company: 'PhonePe', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Technical & HR Interviews', pkg: '₹33.50 LPA', details: 'On-campus / Virtual technical and HR interview rounds.' },

  // 2. ProcDNA
  { date: '2026-08-05', company: 'ProcDNA', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Aptitude Online Assessment (OA)', pkg: '₹16.74 LPA', details: 'Aptitude & analytical online assessment round.' },
  { date: '2026-08-11', company: 'ProcDNA', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Interviews', pkg: '₹16.74 LPA', details: 'Official placement drive interviews for shortlisted candidates.' },

  // 3. ZS Associates
  { date: '2026-08-07', company: 'ZS Associates', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'R2 Communication Assessment (6PM - 10PM)', pkg: '₹13.65 LPA', details: 'Round 2 Communication Assessment (6:00 PM - 10:00 PM).' },
  { date: '2026-08-08', company: 'ZS Associates', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'R3 Tech AI Assessment (6PM - 10PM)', pkg: '₹13.65 LPA', details: 'Round 3 Tech AI Assessment (6:00 PM - 10:00 PM).' },
  { date: '2026-08-19', company: 'ZS Associates', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Test & Interviews', pkg: '₹13.65 LPA', details: 'Final online test and technical interview rounds.' },

  // 4. Bloomberg
  { date: '2026-08-12', company: 'Bloomberg', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Pre-placement Talk (Pizza Day) + Online Assessment', pkg: '₹35+ LPA', details: 'Pre-placement Talk (Pizza Day) + Online Assessment.' },
  { date: '2026-08-13', company: 'Bloomberg', branch: 'CE, IT, AI&DS, ECE, E&TC', role: '1st Round Interviews (On-campus)', pkg: '₹35+ LPA', details: '1st Round of technical & algorithmic interviews on campus.' },
  { date: '2026-08-14', company: 'Bloomberg', branch: 'CE, IT, AI&DS, ECE, E&TC', role: '2nd Round Interviews (Bloomberg Office)', pkg: '₹35+ LPA', details: '2nd Round of Interviews at Bloomberg Office.' },

  // 5. Aspect Ratio
  { date: '2026-08-12', company: 'Aspect Ratio', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Pen-Paper Test (9 AM)', pkg: '₹12 LPA', details: 'Offline Pen-Paper Test scheduled for 9:00 AM sharp.' },
  { date: '2026-08-18', company: 'Aspect Ratio', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Interviews', pkg: '₹12 LPA', details: 'Personal interviews for shortlisted candidates.' },

  // 6. Energy Exemplar
  { date: '2026-08-17', company: 'Energy Exemplar', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Aptitude Test & Interviews', pkg: '₹12 LPA', details: 'Aptitude test followed by technical and HR interviews.' },

  // 7. Principal Global Solutions
  { date: '2026-08-21', company: 'Principal Global Solutions', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'PPT and Test', pkg: '₹9 LPA', details: 'Pre-placement talk followed by online assessment.' },

  // 8. Zensar
  { date: '2026-08-24', company: 'Zensar', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Test & Interviews', pkg: '₹6.50 LPA', details: 'Online coding test and technical interview rounds.' },

  // 9. Amazon (Winter Internship)
  { date: '2026-08-25', company: 'Amazon (Winter Internship)', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Online Assessment (Winter Intern)', pkg: '₹1.10L/mo', details: 'Online coding assessment for Winter Internship drive.' },
  { date: '2026-09-03', company: 'Amazon (Winter Internship)', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Interviews (Winter Intern)', pkg: '₹1.10L/mo', details: 'Technical and bar raiser interviews.' },

  // 10. ACI Worldwide
  { date: '2026-08-25', company: 'ACI Worldwide', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'PPT + Online Assessment', pkg: '₹12.50 LPA', details: 'Pre-placement talk and online coding test.' },
  { date: '2026-08-26', company: 'ACI Worldwide', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Interviews', pkg: '₹12.50 LPA', details: 'Technical and HR interview rounds.' },

  // 11. Toshiba
  { date: '2026-08-27', company: 'Toshiba', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'PPT + Online Assessment', pkg: '₹11.50 LPA', details: 'PPT followed by online test.' },
  { date: '2026-08-28', company: 'Toshiba', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Interviews', pkg: '₹11.50 LPA', details: 'Offline/Online technical interviews.' },

  // 12. Sell.Do
  { date: '2026-09-05', company: 'Sell.do', branch: 'CE, IT, AI&DS, ECE, E&TC', role: 'Test & Interviews', pkg: '₹8.50 LPA', details: 'Product engineering test and interview drive.' }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAST YEAR PLACEMENT EVENTS ARCHIVE (2025-26 Academic Cycle — Aug–Dec 2025)
// EXACT 41 PICT Placement Activities from 2025
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const lastYearEvents = [
  // August 2025
  { date: '2025-08-01', company: 'PhonePe', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹32.75 LPA', details: 'Full-time role for graduates.' },
  { date: '2025-08-03', company: 'ZS Associates', branch: 'CE, E&TC, IT', role: 'Business Technology Solutions Associate (BTSA)', pkg: '₹13.65 LPA', details: 'Consulting & technology analysis role.' },
  { date: '2025-08-04', company: 'eQ Technologic', branch: 'CE, E&TC, IT', role: 'Software Developer (₹13.88 LPA) / Quality Assurance (₹11.13 LPA)', pkg: '₹11.13 - ₹13.88 LPA', details: 'Dual profile hiring for Development and QA.' },
  { date: '2025-08-05', company: 'Siemens', branch: 'CE, E&TC, IT', role: 'Software Engineer', pkg: '₹12+ LPA', details: 'Core software engineering roles.' },
  { date: '2025-08-07', company: 'Commvault Systems', branch: 'CE, IT', role: 'Software Developer', pkg: '₹16 LPA + $19K RSU + ₹75K Relocation | Intern: ₹50K/mo', details: 'High-compensation developer role with standard stock options.' },
  { date: '2025-08-09', company: 'Barclays', branch: 'CE, E&TC, IT (TE & BE)', role: 'Software Developer (₹13.50 LPA) / Summer Intern (₹75K/mo)', pkg: '₹13.50 LPA | Intern: ₹75K/mo', details: 'Open to Third Year (TE) for internships and Final Year (BE) for FTE.' },
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
  { date: '2025-10-10', company: 'Kylas / BeyondWalls', branch: 'CE, E&TC, IT', role: 'Product Engineer (₹9 LPA) / Account Exec (₹7 LPA) / Tech Sales (₹6 LPA)', pkg: '₹6.00 - ₹9.00 LPA', details: 'Technical development and sales profiles.' },
  { date: '2025-10-13', company: 'IBM', branch: 'CE, E&TC, IT', role: 'Software Developer', pkg: '₹11 LPA', details: 'Global hybrid cloud and AI technology company.' },
  { date: '2025-10-14', company: 'Ciena', branch: 'CE, E&TC, IT', role: 'Software Developer', pkg: '₹14 LPA', details: 'Telecommunication networking systems developer.' },
  { date: '2025-10-16', company: 'Xceedance', branch: 'CE, E&TC, IT', role: 'Associate Programmer / QA / BI', pkg: '₹7 LPA', details: 'Insurance tech advisory and data analytics.' },
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

// Month Configurations (2026-27 vs 2025-26)
const currentYearMonths = [
  { name: 'August 2026', year: 2026, month: 7, days: 31, startDay: 6 },  // Saturday
  { name: 'September 2026', year: 2026, month: 8, days: 30, startDay: 2 },// Tuesday
  { name: 'October 2026', year: 2026, month: 9, days: 31, startDay: 4 },  // Thursday
  { name: 'November 2026', year: 2026, month: 10, days: 30, startDay: 0 },// Sunday
  { name: 'December 2026', year: 2026, month: 11, days: 31, startDay: 2 } // Tuesday
];

const lastYearMonths = [
  { name: 'August 2025', year: 2025, month: 7, days: 31, startDay: 5 },  // Friday
  { name: 'September 2025', year: 2025, month: 8, days: 30, startDay: 1 },// Monday
  { name: 'October 2025', year: 2025, month: 9, days: 31, startDay: 3 },  // Wednesday
  { name: 'November 2025', year: 2025, month: 10, days: 30, startDay: 6 },// Saturday
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
  'TCS Research & Innovation': 'TCS R&I',
  'Bloomberg': 'Bloomberg',
  'Energy Exemplar': 'Energy Exemplar',
  'Principal Global Solutions': 'Principal Global',
  'Zensar': 'Zensar',
  'Amazon (Winter Internship)': 'Amazon'
};

const pgAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const CalendarPage = () => {
  const navigate = useNavigate();
  
  // Section toggle: 'current' (2026-27) or 'last' (2025-26)
  const [activeYearCycle, setActiveYearCycle] = useState('current');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [selectedDayString, setSelectedDayString] = useState('');
  const [activeEventDetail, setActiveEventDetail] = useState(null);
  const [xrayCompany, setXrayCompany] = useState(null);

  // ── Real-time Today Date Config ──────────────────────────────────
  const realTimeToday = useMemo(() => new Date(), []);
  const todayYear = realTimeToday.getFullYear();
  const todayMonth = realTimeToday.getMonth();
  const todayDate = realTimeToday.getDate();
  const todayStringFormatted = realTimeToday.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const monthsList = activeYearCycle === 'current' ? currentYearMonths : lastYearMonths;
  const allEvents = activeYearCycle === 'current' ? currentYearEvents : lastYearEvents;
  const currentMonth = monthsList[currentMonthIndex] || monthsList[0];

  const handleOpenXRay = (calendarCompanyName) => {
    const dbName = companyDbMapping[calendarCompanyName] || calendarCompanyName;
    setXrayCompany(dbName);
  };

  const formatDateKey = (day) => {
    const mm = String(currentMonth.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentMonth.year}-${mm}-${dd}`;
  };

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
  }, [allEvents, currentMonth]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return allEvents;
    const query = searchQuery.toLowerCase();
    return allEvents.filter(
      e => e.company.toLowerCase().includes(query) || 
           e.role.toLowerCase().includes(query) ||
           e.branch.toLowerCase().includes(query)
    );
  }, [allEvents, searchQuery]);

  const dayHasSearchResult = (day) => {
    if (!searchQuery.trim()) return false;
    const key = formatDateKey(day);
    return filteredEvents.some(e => e.date === key);
  };

  const handleDayClick = (day, events, targetEvent = null) => {
    const formattedDate = new Date(currentMonth.year, currentMonth.month, day).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    setSelectedDay(day);
    setSelectedDayString(formattedDate);
    setSelectedDayEvents(events || []);
    if (targetEvent) {
      setActiveEventDetail(targetEvent);
    } else {
      setActiveEventDetail(null);
    }
  };

  const closeModal = () => {
    setSelectedDayEvents(null);
    setActiveEventDetail(null);
  };

  const prevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
      setSelectedDay(null);
    }
  };

  const nextMonth = () => {
    if (currentMonthIndex < monthsList.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
      setSelectedDay(null);
    }
  };

  const handleSwitchCycle = (cycle) => {
    setActiveYearCycle(cycle);
    setCurrentMonthIndex(0);
    setSelectedDay(null);
  };

  const jumpToToday = () => {
    setActiveYearCycle('current');
    const matchingIndex = currentYearMonths.findIndex(
      m => m.year === todayYear && m.month === todayMonth
    );
    if (matchingIndex !== -1) {
      setCurrentMonthIndex(matchingIndex);
    } else {
      setCurrentMonthIndex(0); // August 2026
    }
  };

  // Generate calendar grid cells with real-time pointer check
  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < currentMonth.startDay; i++) {
      cells.push({ type: 'empty', id: `empty-${i}` });
    }
    for (let day = 1; day <= currentMonth.days; day++) {
      const events = monthEventsMap[day] || [];
      const isSearched = dayHasSearchResult(day);
      
      // Real-time Today Cell Pointer check (matches live date: 2026-08-09)
      const isToday = (
        activeYearCycle === 'current' &&
        currentMonth.year === todayYear &&
        currentMonth.month === todayMonth &&
        day === todayDate
      );

      cells.push({ type: 'day', day, events, isSearched, isToday });
    }
    return cells;
  }, [currentMonth, monthEventsMap, searchQuery, activeYearCycle, todayYear, todayMonth, todayDate]);

  return (
    <motion.div {...pgAnim} className="pb-16">
      
      {/* ── Page Header + Realtime Pointer Badge ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <span className="font-black uppercase tracking-widest text-[10px] text-[#F97316]">Activity Dashboard</span>
          <h1 className="font-black text-[34px] md:text-[38px] text-[#0F0F0F] tracking-[-0.03em] leading-tight flex items-center gap-3">
            Placement Calendar
            <span className="text-[12px] font-black uppercase px-2.5 py-1 bg-[#FACC15] border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] rounded">
              {activeYearCycle === 'current' ? '2026-27 Current Cycle' : '2025-26 Last Year'}
            </span>
          </h1>
          <p className="font-medium text-[14px] text-[#4B4B4B] mt-1">
            Track upcoming company recruitment drives, assessment rounds, and historical placement visits.
          </p>
        </div>

        {/* Real-time Today Indicator Widget */}
        <div className="flex items-center gap-3 bg-[#FFFBF0] border-[3px] border-[#0F0F0F] p-3 shadow-[4px_4px_0px_#0F0F0F] self-start lg:self-auto">
          <div className="w-10 h-10 bg-[#EF4444] text-white border-[2px] border-[#0F0F0F] flex items-center justify-center font-black rounded shadow-[2px_2px_0px_#0F0F0F] shrink-0 animate-pulse">
            <Pin size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-[11px] text-[#EF4444] uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping inline-block" /> REAL-TIME TODAY POINTER
              </span>
            </div>
            <p className="text-[13px] font-black text-[#0F0F0F] leading-tight">{todayStringFormatted}</p>
          </div>
          {activeYearCycle === 'current' && (
            <button
              onClick={jumpToToday}
              className="ml-2 px-3 py-1.5 bg-[#00C86F] text-[#0F0F0F] font-black text-[11px] uppercase border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Jump Today
            </button>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION TOGGLE: Current Year (2026-27) vs Last Year (2025-26)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white border-[3px] border-[#0F0F0F] p-3 shadow-[5px_5px_0px_#0F0F0F]">
        
        {/* Section Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSwitchCycle('current')}
            className={`flex items-center gap-2 px-4 py-2.5 font-black text-[13px] uppercase border-[2.5px] border-[#0F0F0F] transition-all ${
              activeYearCycle === 'current'
                ? 'bg-[#F97316] text-white shadow-[3px_3px_0px_#0F0F0F] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-[#FAF9F6] text-[#0F0F0F] hover:bg-[#FFF3CD] shadow-[1px_1px_0px_#0F0F0F]'
            }`}
          >
            <Flame size={16} /> Current Year Calendar (2026-27)
          </button>
          
          <button
            onClick={() => handleSwitchCycle('last')}
            className={`flex items-center gap-2 px-4 py-2.5 font-black text-[13px] uppercase border-[2.5px] border-[#0F0F0F] transition-all ${
              activeYearCycle === 'last'
                ? 'bg-[#1A6EFF] text-white shadow-[3px_3px_0px_#0F0F0F] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-[#FAF9F6] text-[#0F0F0F] hover:bg-[#FFF3CD] shadow-[1px_1px_0px_#0F0F0F]'
            }`}
          >
            <Clock size={16} /> Last Year Calendar (2025-26)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <input
            type="text"
            placeholder="Search company, branch, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFBF0] text-[#0F0F0F] font-bold text-[13px] placeholder:text-[#888888] pl-10 pr-4 py-2 border-[2.5px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] focus:shadow-[1px_1px_0px_#0F0F0F] focus:outline-none transition-all"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F0F0F]" />
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ANNOUNCEMENT BULLETIN BOX (Tentative Placement Drive Updates 2026)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeYearCycle === 'current' && (
        <div className="bg-[#FFFBF0] border-[3px] border-[#0F0F0F] shadow-[5px_5px_0px_#0F0F0F] p-4 md:p-5 mb-8">
          <div className="flex items-center justify-between border-b-[2px] border-[#0F0F0F] pb-3 mb-3">
            <h3 className="font-black text-[16px] text-[#0F0F0F] uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="text-[#EF4444]" size={20} />
              📢 Placement Drive Updates & Tentative Schedule (2026-27)
            </h3>
            <span className="text-[11px] font-black bg-[#EF4444] text-white px-2 py-0.5 border border-[#0F0F0F] uppercase">
              LIVE SCHEDULE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] font-bold text-[#0F0F0F]">
            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">1. PhonePe & ProcDNA</span>
              PhonePe OA: 3rd Aug | PhonePe Int: 4th Aug | ProcDNA OA: 5th Aug | ProcDNA Int: 11th Aug
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">2. ZS Associates</span>
              R2 Comm: 7th Aug (6-10PM) | R3 AI: 8th Aug (6-10PM) | Test & Interviews: 19th Aug
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">3. Bloomberg</span>
              Pizza Day PPT + OA: 12th Aug | R1 Campus: 13th Aug | R2 Office: 14th Aug
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">4. Aspect Ratio</span>
              Pen-Paper Test: 12th Aug (9AM) | Interviews: 18th Aug
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">5. Energy Exemplar</span>
              Aptitude Test & Interviews: 17th August 2026
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">6. Principal Global</span>
              PPT and Test: 21st August 2026
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">7. Zensar & Sell.Do</span>
              Zensar Test: 24th Aug | Sell.Do Drive: September 2026
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">8. Amazon & ACI Worldwide</span>
              Amazon OA: 25th Aug, Int: 3rd Sept | ACI: 25th-26th Aug
            </div>

            <div className="bg-white border-[2px] border-[#0F0F0F] p-2.5 shadow-[2px_2px_0px_#0F0F0F]">
              <span className="font-black text-[#F97316] block">9. Toshiba</span>
              PPT & OA: 27th Aug | Interviews: 28th Aug
            </div>
          </div>

          <div className="mt-3 bg-[#FEE2E2] border-[2px] border-[#EF4444] p-2.5 text-[12px] font-black text-[#991B1B] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} /> Barclays and Espressif drives have been POSTPONED. Updates will be shared soon.
            </span>
            <span className="text-[10px] uppercase underline">Stay active on official placement groups</span>
          </div>
        </div>
      )}

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

              const { day, events, isSearched, isToday } = cell;
              const hasEvents = events.length > 0;
              const isSelectedDay = selectedDay === day;
              
              // Custom Styling classes for calendar cells with Real-Time Today Pointer & Selected Day Highlight
              let cellClass = "aspect-[1/1] p-1 md:p-2 border-[3px] border-[#0F0F0F] rounded-lg relative flex flex-col justify-between transition-all duration-75 cursor-pointer ";
              
              if (isSelectedDay) {
                cellClass += "bg-[#FACC15] ring-4 ring-[#0F0F0F] ring-offset-2 z-20 shadow-[4px_4px_0px_#0F0F0F] scale-[1.03] ";
              } else if (isToday) {
                cellClass += "bg-[#FEF08A] ring-4 ring-[#F97316] ring-offset-2 shadow-[4px_4px_0px_#0F0F0F] z-10 ";
              } else if (hasEvents) {
                cellClass += "bg-[#FFFBF0] hover:bg-[#FFF3CD] shadow-[2px_2px_0px_#0F0F0F] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px]";
              } else {
                cellClass += "bg-white hover:bg-[#FAF9F6] text-[#888888]";
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
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-[12px] md:text-[14px] ${isSelectedDay || isToday || hasEvents ? 'text-[#0F0F0F]' : 'text-gray-400'}`}>
                      {day}
                    </span>

                    {/* Real-Time Today / Selected Badge */}
                    {isToday ? (
                      <span className="bg-[#EF4444] text-white text-[8px] md:text-[9px] font-black px-1 py-0.5 rounded shadow border border-[#0F0F0F] uppercase tracking-tighter flex items-center gap-0.5">
                        <Pin size={10} /> TODAY
                      </span>
                    ) : isSelectedDay && (
                      <span className="bg-[#0F0F0F] text-white text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-tighter">
                        SELECTED
                      </span>
                    )}
                  </div>
                  
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
              This month has <span className="text-[#F97316] font-black">{Object.keys(monthEventsMap).length} active days</span> of recruiting. Click any date cell to inspect candidate eligibility, assessments, and salary compensation.
            </p>
          </div>

          <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[6px_6px_0px_#0F0F0F] p-5 max-h-[460px] flex flex-col">
            <h3 className="font-black text-[16px] text-[#0F0F0F] uppercase tracking-tight mb-4 shrink-0 flex items-center justify-between">
              <span>Visits in {currentMonth.name}</span>
              <span className="text-[11px] font-black text-[#F97316] uppercase">
                {Object.keys(monthEventsMap).length} Drives
              </span>
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
                        onClick={() => handleDayClick(dayNum, evs, e)}
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

      {/* ─── Neobrutalist Dual-Stage Modal for Selected Day & Event Details ─── */}
      <AnimatePresence>
        {selectedDayEvents && (
          <>
            {/* Modal Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-[#0F0F0F]/65 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed left-[4%] right-[4%] md:left-auto md:right-auto md:w-[650px] max-h-[88vh] bg-[#FFFBF0] border-[4px] border-[#0F0F0F] shadow-[12px_12px_0px_#0F0F0F] z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              style={{ top: '6%' }}
            >
              {/* ── Modal Header ── */}
              <div className="bg-[#FACC15] border-b-[4px] border-[#0F0F0F] p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {activeEventDetail && (
                    <button
                      onClick={() => setActiveEventDetail(null)}
                      className="px-2.5 py-1 bg-white text-[#0F0F0F] border-[2px] border-[#0F0F0F] font-black text-[11px] uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-[#FFF3CD] flex items-center gap-1 transition-all"
                    >
                      <ArrowLeft size={14} /> Back to Day List
                    </button>
                  )}
                  <div>
                    <span className="font-black text-[10px] uppercase text-[#0F0F0F]/60 tracking-wider">
                      {activeEventDetail ? 'EVENT SPECIFICATIONS & OVERVIEW' : `VISIT SCHEDULE • ${selectedDayEvents.length} EVENT${selectedDayEvents.length !== 1 ? 'S' : ''}`}
                    </span>
                    <h3 className="font-black text-[18px] md:text-[20px] text-[#0F0F0F] leading-tight">
                      {selectedDayString}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-9 h-9 bg-white border-[3px] border-[#0F0F0F] flex items-center justify-center hover:bg-[#EF4444] hover:text-white transition-colors duration-100 shadow-[2px_2px_0px_#0F0F0F] shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Modal Body ── */}
              <div className="p-5 md:p-6 overflow-y-auto space-y-5 flex-1">

                {/* VIEW 1: SINGLE EVENT FULL DETAILS */}
                {activeEventDetail ? (
                  <div className="space-y-5">
                    {/* Header Card */}
                    <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b-[2px] border-dashed border-[#E5E7EB] pb-3 mb-3">
                        <div>
                          <span className="font-black text-[10px] uppercase tracking-wider text-[#F97316]">RECRUITMENT DRIVE</span>
                          <h4 className="font-black text-[24px] text-[#0F0F0F] leading-tight flex items-center gap-2">
                            <Building2 className="text-[#F97316]" size={24} />
                            {activeEventDetail.company}
                          </h4>
                        </div>
                        <span className="font-black text-[14px] bg-[#A3E635] text-[#0F0F0F] border-[2.5px] border-[#0F0F0F] px-3 py-1 shadow-[2px_2px_0px_#0F0F0F]">
                          {activeEventDetail.pkg}
                        </span>
                      </div>

                      {/* Main Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] font-bold">
                        <div className="bg-[#FFFBF0] border-[2px] border-[#0F0F0F] p-3">
                          <span className="text-[10px] text-[#888888] uppercase tracking-wider block mb-0.5">Target Designation / Role</span>
                          <span className="text-[#0F0F0F] font-black text-[14px] flex items-center gap-1.5">
                            <Briefcase size={14} className="text-[#F97316]" /> {activeEventDetail.role}
                          </span>
                        </div>
                        <div className="bg-[#FFFBF0] border-[2px] border-[#0F0F0F] p-3">
                          <span className="text-[10px] text-[#888888] uppercase tracking-wider block mb-0.5">Eligible Engineering Branches</span>
                          <span className="text-[#0F0F0F] font-black text-[14px] flex items-center gap-1.5">
                            <Users size={14} className="text-[#60A5FA]" /> {activeEventDetail.branch}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Overview */}
                    <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] p-5">
                      <h5 className="font-black text-[14px] text-[#0F0F0F] uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-[#F97316]" /> Drive Stage & Overview
                      </h5>
                      <p className="text-[13px] font-bold text-[#333333] leading-relaxed bg-[#FAF9F6] border-[2px] border-[#0F0F0F] p-3">
                        {activeEventDetail.details || 'Official placement activity scheduled for PICT campus recruitment cycle.'}
                      </p>
                    </div>

                    {/* Preparation & Round Strategy */}
                    <div className="bg-[#FFFBF0] border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] p-5">
                      <h5 className="font-black text-[14px] text-[#0F0F0F] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-[#F59E0B]" /> Recommended Preparation Checklist
                      </h5>
                      <div className="space-y-2 text-[12px] font-bold text-[#0F0F0F]">
                        <div className="flex items-center gap-2 bg-white border-[2px] border-[#0F0F0F] p-2.5">
                          <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                          <span>Revise Data Structures & Algorithms (Arrays, Trees, Graphs, Dynamic Programming)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border-[2px] border-[#0F0F0F] p-2.5">
                          <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                          <span>Review Core Computer Science Fundamentals (OS, DBMS, SQL, Computer Networks)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white border-[2px] border-[#0F0F0F] p-2.5">
                          <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
                          <span>Prepare Resume Project Walkthroughs & Past Internship Experiences</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleOpenXRay(activeEventDetail.company)}
                      className="w-full bg-[#60A5FA] text-[#0F0F0F] font-black border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] py-3 text-[13px] uppercase flex items-center justify-center gap-2 hover:shadow-[2px_2px_0px_#0F0F0F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      <Building2 size={16} /> Open Company X-Ray Insights for {activeEventDetail.company} →
                    </button>
                  </div>
                ) : (
                  /* VIEW 2: LIST OF EVENTS ON THE SELECTED DAY */
                  selectedDayEvents.length === 0 ? (
                    <div className="bg-white border-[3px] border-[#0F0F0F] shadow-[4px_4px_0px_#0F0F0F] p-8 text-center space-y-3">
                      <div className="w-12 h-12 bg-[#FFFBF0] border-[2px] border-[#0F0F0F] rounded-full flex items-center justify-center mx-auto shadow-[2px_2px_0px_#0F0F0F]">
                        <CalendarIcon size={24} className="text-[#888888]" />
                      </div>
                      <h4 className="font-black text-[16px] text-[#0F0F0F]">No Placement Events Scheduled</h4>
                      <p className="text-[13px] font-bold text-[#666666]">
                        There are no recruitment drives or assessment rounds listed for {selectedDayString}.
                      </p>
                    </div>
                  ) : (
                    selectedDayEvents.map((e, index) => (
                      <div
                        key={index}
                        className="bg-white border-[3px] border-[#0F0F0F] shadow-[5px_5px_0px_#0F0F0F] p-5 relative space-y-4"
                      >
                        {/* Company & Package Row */}
                        <div className="flex items-start justify-between gap-3 border-b-[2px] border-dashed border-[#E5E7EB] pb-3">
                          <div>
                            <span className="font-black text-[10px] uppercase text-[#F97316] tracking-wider">EVENT #{index + 1}</span>
                            <h4 className="font-black text-[22px] text-[#0F0F0F] leading-tight flex items-center gap-2">
                              <Building2 className="text-[#F97316]" size={22} />
                              {e.company}
                            </h4>
                          </div>
                          <span className="font-black text-[13px] bg-[#A3E635] border-[2px] border-[#0F0F0F] px-2.5 py-1 shadow-[2px_2px_0px_#0F0F0F]">
                            {e.pkg}
                          </span>
                        </div>

                        {/* Event Tags */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] font-bold">
                          <div className="bg-[#FAF9F6] border-[2px] border-[#0F0F0F] p-2.5">
                            <span className="text-[9px] text-[#888888] uppercase tracking-wider block">Target Role</span>
                            <span className="text-[#0F0F0F] font-black text-[12px]">{e.role}</span>
                          </div>
                          <div className="bg-[#FAF9F6] border-[2px] border-[#0F0F0F] p-2.5">
                            <span className="text-[9px] text-[#888888] uppercase tracking-wider block">Eligible Branches</span>
                            <span className="text-[#0F0F0F] font-black text-[12px]">{e.branch}</span>
                          </div>
                        </div>

                        {/* Brief Summary */}
                        {e.details && (
                          <div className="bg-[#FFFBF0] border-[2px] border-[#0F0F0F] p-2.5 text-[12px] font-bold text-[#4B4B4B] flex items-start gap-2">
                            <Info size={14} className="text-[#F97316] shrink-0 mt-0.5" />
                            <span>{e.details}</span>
                          </div>
                        )}

                        {/* Interactive Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setActiveEventDetail(e)}
                            className="w-full bg-[#FACC15] text-[#0F0F0F] font-black border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] py-2 text-[12px] uppercase flex items-center justify-center gap-1.5 hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          >
                            <FileText size={14} /> View Full Details →
                          </button>
                          <button
                            onClick={() => handleOpenXRay(e.company)}
                            className="w-full bg-white text-[#0F0F0F] font-black border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] py-2 text-[12px] uppercase flex items-center justify-center gap-1.5 hover:bg-[#FAF9F6] hover:shadow-[1px_1px_0px_#0F0F0F] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          >
                            <Building2 size={14} /> Company X-Ray
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>

              {/* ── Modal Footer ── */}
              <div className="bg-[#FAF9F6] border-t-[3px] border-[#0F0F0F] p-4 flex items-center justify-between shrink-0">
                {activeEventDetail ? (
                  <button
                    onClick={() => setActiveEventDetail(null)}
                    className="bg-white text-[#0F0F0F] font-black border-[2px] border-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] px-4 py-1.5 text-[12px] uppercase flex items-center gap-1 hover:bg-[#FFF3CD]"
                  >
                    <ArrowLeft size={14} /> Back to Day List
                  </button>
                ) : (
                  <span className="text-[11px] font-black text-[#888888] uppercase">
                    Select an event to view full details
                  </span>
                )}
                <button
                  onClick={closeModal}
                  className="bg-[#0F0F0F] text-white font-black border-[2px] border-[#0F0F0F] shadow-[3px_3px_0px_#0F0F0F] px-5 py-2 text-[12px] uppercase hover:bg-[#333333] transition-all"
                >
                  Close Modal
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Standalone X-Ray Overlay Modal on Calendar Page ── */}
      {xrayCompany && (
        <CompanyXRay
          companyName={xrayCompany}
          onClose={() => setXrayCompany(null)}
        />
      )}

    </motion.div>
  );
};

export default CalendarPage;
