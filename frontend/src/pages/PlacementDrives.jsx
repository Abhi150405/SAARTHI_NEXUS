import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { API_URL } from '../config';
import PageMasthead from '../components/drives/PageMasthead';
import ControlStrip from '../components/drives/ControlStrip';
import BoardView from '../components/drives/BoardView';
import GridView from '../components/drives/GridView';
import BoardingPassPanel from '../components/drives/BoardingPassPanel';
import { animateBoardExit } from '../animations/drivesAnimations';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPER: Synthesize deadline from drive data
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function syntheticDeadline(driveId) {
  let hash = 0;
  for (let i = 0; i < driveId.length; i++) {
    hash = (hash * 31 + driveId.charCodeAt(i)) & 0x7fffffff;
  }
  const daysFromNow = (hash % 7) + 1;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysFromNow);
  deadline.setHours(23, 59, 59, 0);
  return { deadline: deadline.toISOString(), daysLeft: daysFromNow };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPER: Check eligibility against profile
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function checkElig(drive, profile) {
  if (!profile) return { ok: false, reasons: ['Profile missing'] };
  const r = [];
  const c = drive.criteria;
  if ((parseFloat(profile.tenth_percentage) || 0) < c.ssc) r.push(`SSC below ${c.ssc}%`);
  if ((parseFloat(profile.twelfth_percentage) || 0) < c.hsc) r.push(`HSC below ${c.hsc}%`);
  if ((parseFloat(profile.college_cgpa) || 0) < c.cgpa) r.push(`CGPA below ${c.cgpa}`);
  if ((parseInt(profile.amcat_score) || 0) < c.amcat) r.push(`AMCAT below ${c.amcat}`);
  const raw = (profile.department || profile.dept || '').toUpperCase();
  const br = raw.includes('ELECTRONICS') && raw.includes('COMPUTER') ? 'E&CE' : raw;
  const al = drive.allowedBranches || [];
  if (al.length > 0 && !al.includes(br)) r.push('Branch not eligible');
  return { ok: r.length === 0, reasons: r };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   REGISTRATION MODAL (light-mode neubrutalism)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const inp = 'w-full bg-white border-[3px] border-[#0a0a0a] px-4 py-3 font-mono-space text-[14px] text-[#0a0a0a] focus:outline-none focus:border-[#FF6B00] transition-all duration-100 placeholder:text-[#888]';

const RegisterModal = ({ drive, regForm, setRegForm, onSubmit, onClose }) => {
  if (!drive) return null;
  return (
    <motion.div
      className="fixed inset-0 bg-[#0a0a0a]/50 z-[1000] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white border-[3px] border-[#0a0a0a] w-full max-w-[600px]"
        style={{ boxShadow: '10px 10px 0px #0a0a0a' }}
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#FF6B00] border-b-[3px] border-[#0a0a0a] px-6 py-4 flex justify-between items-center">
          <h2 className="font-bold text-[16px] text-white">Register — {drive.companyName}</h2>
          <button onClick={onClose} className="text-white cursor-pointer font-bold text-xl">✕</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="font-mono-space font-bold text-[10px] uppercase tracking-[2px] text-[#888] block mb-1">Full Name</label>
            <input type="text" required className={inp} value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono-space font-bold text-[10px] uppercase tracking-[2px] text-[#888] block mb-1">College Email</label>
              <input type="email" readOnly className={`${inp} !bg-[#f5f0e8] !text-[#888] cursor-not-allowed`} value={regForm.collegeEmail} />
            </div>
            <div>
              <label className="font-mono-space font-bold text-[10px] uppercase tracking-[2px] text-[#888] block mb-1">Personal Email</label>
              <input type="email" required className={inp} value={regForm.personalEmail} onChange={(e) => setRegForm({ ...regForm, personalEmail: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="font-mono-space font-bold text-[10px] uppercase tracking-[2px] text-[#888] block mb-1">Mobile</label>
            <input type="tel" required className={inp} value={regForm.mobile} onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })} />
          </div>
          <div className="bg-[#f5f0e8] border-[3px] border-[#0a0a0a] p-4">
            <p className="font-mono-space font-bold text-[10px] uppercase tracking-[2px] text-[#888] mb-3">Academic Data</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'SSC', v: regForm.ssc },
                { l: 'HSC', v: regForm.hsc },
                { l: 'CGPA', v: regForm.cgpa },
                { l: 'AMCAT', v: regForm.amcat },
              ].map((x) => (
                <div key={x.l} className="flex justify-between">
                  <span className="font-mono-space text-[12px] text-[#888]">{x.l}:</span>
                  <span className="font-bold text-[13px]">{x.v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#0a0a0a] text-[#FFE135] font-bold border-[3px] border-[#0a0a0a] py-3 text-[14px] uppercase tracking-[1px] font-mono-space cursor-pointer hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100"
            style={{ boxShadow: '6px 6px 0px #0a0a0a' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '3px 3px 0px #0a0a0a'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '6px 6px 0px #0a0a0a'; }}
          >
            Confirm Registration
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN PAGE COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PlacementDrives = () => {
  const [drives, setDrives] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selDrive, setSelDrive] = useState(null);
  const [regForm, setRegForm] = useState({
    name: '', collegeEmail: '', personalEmail: '', mobile: '',
    ssc: '', hsc: '', cgpa: '', amcat: '',
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('board');
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const boardContainerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Data fetching (preserved)
  useEffect(() => {
    (async () => {
      try {
        const pR = await fetch(`${API_URL}/api/profile?email=${encodeURIComponent(user.email)}`);
        if (pR.ok) {
          const p = await pR.json();
          setProfile(p);
          setRegForm({
            name: p.full_name || user.fullName || '',
            collegeEmail: user.email || '',
            personalEmail: '', mobile: '',
            ssc: p.tenth_percentage || '', hsc: p.twelfth_percentage || '',
            cgpa: p.college_cgpa || '', amcat: p.amcat_score || '',
          });
        }
        const dR = await fetch(`${API_URL}/api/drives/`);
        if (dR.ok) setDrives(await dR.json());
        const rR = await fetch(`${API_URL}/api/drives/registrations/student/${user.email}`);
        if (rR.ok) setApplied(await rR.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Registration (preserved)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/drives/${selDrive._id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveId: selDrive._id, studentEmail: user.email,
          name: regForm.name, ssc: parseFloat(regForm.ssc) || 0,
          hsc: parseFloat(regForm.hsc) || 0, cgpa: parseFloat(regForm.cgpa) || 0,
          amcat: parseInt(regForm.amcat) || 0, collegeEmail: regForm.collegeEmail,
          personalEmail: regForm.personalEmail, mobile: regForm.mobile,
        }),
      });
      if (res.ok) { alert('Registered!'); setShowModal(false); setApplied((p) => [...p, selDrive._id]); }
      else { const d = await res.json(); alert(`Failed: ${d.detail || 'Error'}`); }
    } catch { alert('Server error'); }
  };

  // Enrich drives
  const enrichedDrives = useMemo(() => {
    return drives.map((d) => {
      const { ok, reasons } = checkElig(d, profile);
      const { deadline, daysLeft } = syntheticDeadline(d._id);
      return { ...d, isEligible: ok, eligibilityReasons: reasons, deadline, daysLeft, isClosingSoon: daysLeft <= 2, isApplied: applied.includes(d._id) };
    });
  }, [drives, profile, applied]);

  // Filtered drives
  const filteredDrives = useMemo(() => {
    let result = [...enrichedDrives];
    switch (activeTab) {
      case 'eligible': result = result.filter((d) => d.isEligible); break;
      case 'closing': result = result.filter((d) => d.isClosingSoon); break;
      case 'applied': result = result.filter((d) => d.isApplied); break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => d.companyName.toLowerCase().includes(q) || d.role.toLowerCase().includes(q));
    }
    return result;
  }, [enrichedDrives, activeTab, searchQuery]);

  const stats = useMemo(() => ({
    total: enrichedDrives.length,
    eligible: enrichedDrives.filter((d) => d.isEligible).length,
    closingToday: enrichedDrives.filter((d) => d.daysLeft <= 1).length,
  }), [enrichedDrives]);

  const handleTabChange = useCallback((tab) => {
    if (isAnimating) return;
    if (viewMode === 'board' && boardContainerRef.current) {
      setIsAnimating(true);
      const rows = boardContainerRef.current.querySelectorAll('[data-board-row]');
      animateBoardExit(Array.from(rows), () => { setActiveTab(tab); setIsAnimating(false); });
    } else { setActiveTab(tab); }
  }, [isAnimating, viewMode]);

  const handleDriveClick = useCallback((drive) => { setSelectedDrive(drive); }, []);
  const handleApply = useCallback((drive) => { setSelDrive(drive); setShowModal(true); }, []);
  const effectiveViewMode = isMobile ? 'grid' : viewMode;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#f5f0e8]">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-[#0a0a0a] border-t-[#FFE135] animate-spin mx-auto" />
          <p className="font-mono-space text-[12px] text-[#888888] mt-4 uppercase tracking-[2px] font-bold">
            Loading departures...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f0e8] min-h-screen -m-4 lg:-m-8">
      <PageMasthead totalDrives={stats.total} eligibleCount={stats.eligible} closingTodayCount={stats.closingToday} />
      <ControlStrip
        activeTab={activeTab} onTabChange={handleTabChange}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        viewMode={effectiveViewMode} onViewChange={setViewMode}
      />

      <div className="flex">
        <motion.div
          layout
          transition={{ layout: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
          className={`${selectedDrive && !isMobile ? 'w-[55%]' : 'w-full'} transition-all`}
          ref={boardContainerRef}
        >
          {effectiveViewMode === 'board' ? (
            <BoardView drives={filteredDrives} onDriveClick={handleDriveClick} isAnimating={isAnimating} />
          ) : (
            <GridView drives={filteredDrives} onDriveClick={handleDriveClick} />
          )}
        </motion.div>

        <AnimatePresence>
          {selectedDrive && (
            <motion.div layout className={`${isMobile ? 'fixed inset-0 z-50' : 'w-[45%]'}`}>
              <BoardingPassPanel
                drive={selectedDrive} profile={profile}
                onClose={() => setSelectedDrive(null)}
                onApply={handleApply} isApplied={applied.includes(selectedDrive._id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <RegisterModal
            drive={selDrive} regForm={regForm} setRegForm={setRegForm}
            onSubmit={handleSubmit} onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlacementDrives;
