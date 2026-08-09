import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { API_URL } from '../config';
import '../styles/CompanyRecords.css';
import CompanyXRay from '../components/CompanyXRay';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────────────────────────
// PURE RENDER HELPERS — accept API data ONLY, no internal constants
// ─────────────────────────────────────────────────────────────────

function buildCompanyRow(companyData, availableYears, onEnter, onMove, onLeave) {
  return availableYears.map(year => {
    const hired = companyData.years[year]; // undefined if no visit
    let cls = 'hm-cell ';
    let content = '';
    if (hired === undefined) {
      cls += 'empty';
      content = '—';
    } else if (hired === 0) {
      cls += 'zero';
      content = '0';
    } else {
      cls += 'filled';
      content = hired;
    }
    const tooltip =
      hired === undefined
        ? `${companyData.company} · ${year} · Did not visit`
        : `${companyData.company} · ${year} · ${hired} hired`;
    return { cls, content, tooltip, year };
  });
}

const TIER_COLOR = {
  SUPER_DREAM: '#FF3B3B',
  DREAM: '#1A6EFF',
  GROUP_I: '#FF6B00',
  GROUP_II: '#00C86F',
  MASS: '#888888'
};

// ─────────────────────────────────────────────────────────────────
// SKELETON COMPONENTS
// ─────────────────────────────────────────────────────────────────
const SkeletonBlock = ({ w = '100%', h = 40 }) => (
  <div className="skeleton-block" style={{ width: w, height: h }} />
);

// ─────────────────────────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────────────────────────
const ErrorState = ({ message, retry }) => (
  <div className="error-state">
    <div className="error-icon">!</div>
    <div className="error-msg">{message}</div>
    {retry && <button className="sort-btn" onClick={retry}>RETRY</button>}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const CompanyRecords = () => {
  // ── Summary hero stats ──────────────────────────────────────────
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  // ── Year-selector + per-year mini-stats ─────────────────────────
  const [yearList, setYearList] = useState([]);         // derived from /by-year
  const [yearData, setYearData] = useState({});          // keyed by year string
  const [currentYear, setCurrentYear] = useState(null);

  // ── Package distribution + top recruiters ───────────────────────
  const [barData, setBarData] = useState([]);
  const [lbData, setLbData] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState(null);
  const [sortByBracket, setSortByBracket] = useState(false);

  // ── Loyalty Spectrum ────────────────────────────────────────────
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [loyaltyError, setLoyaltyError] = useState(null);
  const [activeSegment, setActiveSegment] = useState('ALL');
  const loyaltyTrackRef = useRef(null);

  // ── Hall of Offers ──────────────────────────────────────────────
  const [offers, setOffers] = useState([]);
  const [offersTotal, setOffersTotal] = useState(0);
  const [offersPage, setOffersPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Filters (from /filters-meta — all derived) ──────────────────
  const [filtersMeta, setFiltersMeta] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    year: 'all',
    search: '',
    branch: '',
    sort: 'salary_desc',
    visit_type: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const searchDebounceRef = useRef(null);

  const containerRef = useRef(null);
  const marqueeTweenRef = useRef(null);
  const heroAnimatedRef = useRef(false);

  // ── Company X-Ray panel ──────────────────────────────────
  const [xrayCompany, setXrayCompany] = useState(null);
  const openXRay = (companyName) => setXrayCompany(companyName);

  const location = useLocation();

  useEffect(() => {
    const hashQuery = window.location.hash.includes('?') ? '?' + window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(location.search || hashQuery || window.location.search);
    const company = params.get('company') || location.state?.xrayCompany;
    if (company) {
      setXrayCompany(company);
    }
  }, [location]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Summary (hero stats)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setSummaryError(null);
    fetch(`${API_URL}/api/placements/summary`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(data => { if (!cancelled) setSummary(data); })
      .catch(err => { if (!cancelled) setSummaryError(err.message); });
    return () => { cancelled = true; };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: By-year data (year tabs + mini-stats)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/placements/by-year`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(data => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => a.year.localeCompare(b.year));
        const byYear = {};
        sorted.forEach(d => { byYear[d.year] = d; });
        setYearList(sorted.map(d => d.year));
        setYearData(byYear);
        // Default to the latest year
        if (sorted.length > 0) {
          setCurrentYear(sorted[sorted.length - 1].year);
        }
      })
      .catch(() => { /* non-fatal — year tabs stay empty */ });
    return () => { cancelled = true; };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Filters meta (powers dropdowns)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/placements/filters-meta`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(data => { if (!cancelled) setFiltersMeta(data); })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Package distribution + Top recruiters when year changes
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentYear) return;
    let cancelled = false;
    setDashLoading(true);
    setDashError(null);

    Promise.all([
      fetch(`${API_URL}/api/placements/package-distribution?year=${encodeURIComponent(currentYear)}`)
        .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); }),
      fetch(`${API_URL}/api/placements/top-recruiters?year=${encodeURIComponent(currentYear)}&limit=8`)
        .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
    ])
      .then(([brackets, recruiters]) => {
        if (cancelled) return;
        // Build barData with pct
        const BRACKET_ORDER = ['40+ LPA', '30-40 LPA', '20-30 LPA', '10-20 LPA', '<10 LPA'];
        const BRACKET_COLOR = {
          '40+ LPA': 'var(--green)',
          '30-40 LPA': 'var(--blue)',
          '20-30 LPA': 'var(--yellow)',
          '10-20 LPA': 'var(--orange)',
          '<10 LPA': 'var(--red)'
        };
        const sorted = [...brackets].sort((a, b) =>
          BRACKET_ORDER.indexOf(a.bracket) - BRACKET_ORDER.indexOf(b.bracket)
        );
        const max = Math.max(...sorted.map(b => b.count), 1);
        setBarData(sorted.map(b => ({
          l: b.bracket,
          c: b.count,
          clr: BRACKET_COLOR[b.bracket] || 'var(--gray)',
          pct: ((b.count / max) * 100).toFixed(1)
        })));

        // lbData
        const maxHires = recruiters.length ? recruiters[0].total_hired : 1;
        setLbData(recruiters.map(r => ({
          n: r.company,
          h: r.total_hired,
          a: r.avg_lpa,
          pct: r.bar_pct ?? ((r.total_hired / maxHires) * 100).toFixed(1)
        })));
        setDashLoading(false);
      })
      .catch(err => {
        if (!cancelled) {
          setDashError(err.message);
          setDashLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [currentYear]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Loyalty Spectrum
  // ─────────────────────────────────────────────────────────────────
  const loadLoyalty = () => {
    setLoyaltyLoading(true);
    setLoyaltyError(null);
    fetch(`${API_URL}/api/placements/loyalty-spectrum`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(data => {
        setLoyaltyData(data);
        setLoyaltyLoading(false);
      })
      .catch(err => {
        setLoyaltyError(err.message);
        setLoyaltyLoading(false);
      });
  };

  useEffect(() => { loadLoyalty(); }, []);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Hall of Offers (page 1 reset on filter change)
  // ─────────────────────────────────────────────────────────────────
  const loadOffersPage1 = (filters) => {
    setOffersLoading(true);
    setOffersError(null);
    setOffers([]);
    setOffersPage(1);
    setHasMore(true);

    const params = new URLSearchParams({
      year: filters.year || 'all',
      search: filters.search || '',
      branch: filters.branch || '',
      sort: filters.sort || 'salary_desc',
      visit_type: filters.visit_type || '',
      page: 1,
      limit: 24
    });

    fetch(`${API_URL}/api/placements/hall-of-offers?${params}`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(json => {
        setOffers(json.data);
        setOffersTotal(json.total);
        setHasMore(json.has_more);
        setOffersPage(2);
        setOffersLoading(false);
      })
      .catch(err => {
        setOffersError(err.message);
        setOffersLoading(false);
      });
  };

  useEffect(() => {
    loadOffersPage1(activeFilters);
  }, [activeFilters]);

  // ─────────────────────────────────────────────────────────────────
  // FETCH: Load More (paginated — hits network every time)
  // ─────────────────────────────────────────────────────────────────
  const loadMoreOffers = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const params = new URLSearchParams({
      year: activeFilters.year || 'all',
      search: activeFilters.search || '',
      branch: activeFilters.branch || '',
      sort: activeFilters.sort || 'salary_desc',
      visit_type: activeFilters.visit_type || '',
      page: offersPage,
      limit: 24
    });

    try {
      const res = await fetch(`${API_URL}/api/placements/hall-of-offers?${params}`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setOffers(prev => [...prev, ...json.data]);
      setHasMore(json.has_more);
      setOffersPage(prev => prev + 1);
    } catch {
      // silent fail on load-more — user can try again
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // SEARCH DEBOUNCE (300ms)
  // ─────────────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setActiveFilters(prev => ({ ...prev, search: val }));
    }, 300);
  };

  // ─────────────────────────────────────────────────────────────────
  // ANIMATIONS
  // ─────────────────────────────────────────────────────────────────

  // Hero stats animation (runs once when summary loads)
  useEffect(() => {
    if (!summary || heroAnimatedRef.current) return;
    heroAnimatedRef.current = true;

    gsap.fromTo('.hero-stat', { y: -30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: 'power3.out' });
    document.querySelectorAll('.hs-num[data-count]').forEach((el, i) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      gsap.fromTo(el, { textContent: 0 }, {
        textContent: target,
        duration: 1.8,
        ease: 'power2.out',
        delay: 0.2 + i * 0.2,
        snap: { textContent: 1 },
        onUpdate() {
          el.textContent = Math.round(parseFloat(el.textContent)) + suffix;
        }
      });
    });
  }, [summary]);

  // Year tabs animation
  useEffect(() => {
    if (!yearList.length) return;
    gsap.fromTo('.year-tab', { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'power3.out' });
  }, [yearList]);

  // Bar + leaderboard animations on data change
  useLayoutEffect(() => {
    if (!barData.length && !lbData.length) return;
    const ctx = gsap.context(() => {
      gsap.to(['.dash-left', '.dash-right'], { opacity: 1, duration: 0.25 });
      gsap.fromTo('.bar-fill', { width: '0%' }, { width: (i, el) => el.dataset.w + '%', duration: 0.9, stagger: 0.12, ease: 'power3.out' });
      document.querySelectorAll('.bar-count[data-count]').forEach((el, i) => {
        const t = parseInt(el.dataset.count, 10);
        gsap.fromTo(el, { textContent: 0 }, {
          textContent: t, duration: 1, delay: i * 0.12, ease: 'power2.out', snap: { textContent: 1 },
          onUpdate() { el.textContent = Math.round(parseFloat(el.textContent)); }
        });
      });
      gsap.fromTo('.lb-card', { x: 40, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out', delay: 0.1 });
      gsap.fromTo('.lb-minibar-fill', { width: '0%' }, { width: (i, el) => el.dataset.w + '%', duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.3 });
      document.querySelectorAll('.lb-count[data-count]').forEach((el, i) => {
        const t = parseInt(el.dataset.count, 10);
        gsap.fromTo(el, { textContent: 0 }, {
          textContent: t, duration: 1, delay: 0.2 + i * 0.1, ease: 'power2.out', snap: { textContent: 1 },
          onUpdate() { el.textContent = Math.round(parseFloat(el.textContent)); }
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, [barData, lbData]);

  // Loyalty Spectrum — ScrollTrigger animation on section entry
  // PERF: Only animate first 12 visible cards, skip per-spark-bar animation
  useEffect(() => {
    if (!loyaltyData || loyaltyLoading) return;
    const trigger = ScrollTrigger.create({
      trigger: '#loyalty-section',
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.from('.stat-box', { opacity: 0, stagger: 0.1, duration: 0.4, ease: 'power3.out' });
        document.querySelectorAll('.stat-num[data-count]').forEach(el => {
          const target = parseInt(el.dataset.count, 10);
          gsap.fromTo(el, { textContent: 0 }, {
            textContent: target, duration: 0.8, ease: 'power2.out',
            snap: { textContent: 1 },
            onUpdate() { el.textContent = Math.round(parseFloat(el.textContent)); }
          });
        });
        gsap.from('.loyalty-chip', { x: -15, opacity: 0, stagger: 0.04, duration: 0.25, delay: 0.3, ease: 'power2.out' });
        // Only animate the first 12 cards — the rest appear instantly
        const visCards = document.querySelectorAll('.loyalty-card');
        const batch = Array.from(visCards).slice(0, 12);
        if (batch.length) {
          gsap.from(batch, { x: 40, opacity: 0, stagger: 0.04, duration: 0.35, delay: 0.35, ease: 'power3.out' });
        }
      }
    });
    return () => trigger.kill();
  }, [loyaltyData, loyaltyLoading]);

  // Marquee animation — starts/restarts whenever offers array changes
  useEffect(() => {
    if (!offers.length) return;
    // Kill previous tween before starting a fresh one
    marqueeTweenRef.current?.kill();
    const track = document.getElementById('marqueeTrack');
    if (!track) return;
    // Reset position first so restart is clean
    gsap.set(track, { x: 0 });
    const totalW = track.scrollWidth / 2; // half because content is duplicated
    marqueeTweenRef.current = gsap.to(track, {
      x: -totalW,
      duration: 60,
      ease: 'none',
      repeat: -1
    });
  }, [offers]);

  // ─────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────
  const handleYearChange = (year) => {
    if (year === currentYear) return;
    gsap.to(['.dash-left', '.dash-right'], {
      opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => setCurrentYear(year)
    });
  };

  const handleSortToggle = () => {
    gsap.to('.bar-row', {
      opacity: 0, y: -10, duration: 0.2, stagger: 0.04, ease: 'power2.in',
      onComplete: () => {
        setSortByBracket(prev => !prev);
        // Re-sort barData
        setBarData(prev => {
          const BRACKET_ORDER = ['40+ LPA', '30-40 LPA', '20-30 LPA', '10-20 LPA', '<10 LPA'];
          const sorted = [...prev];
          if (!sortByBracket) {
            sorted.sort((a, b) => BRACKET_ORDER.indexOf(a.l) - BRACKET_ORDER.indexOf(b.l));
          } else {
            sorted.sort((a, b) => b.c - a.c);
          }
          return sorted;
        });
      }
    });
  };

  const handleSegmentFilter = (segment) => {
    // PERF: Single batch fade-out (no per-card stagger), then swap data, then fade-in first 12 only
    const track = loyaltyTrackRef.current;
    if (track) {
      gsap.to(track, {
        opacity: 0, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          setActiveSegment(segment);
          if (track) track.scrollLeft = 0;
          requestAnimationFrame(() => {
            gsap.to(track, { opacity: 1, duration: 0.2, ease: 'power2.out' });
            const visCards = track.querySelectorAll('.loyalty-card');
            const batch = Array.from(visCards).slice(0, 12);
            if (batch.length) {
              gsap.from(batch, { x: 24, opacity: 0, stagger: 0.03, duration: 0.25, ease: 'power3.out' });
            }
          });
        }
      });
    } else {
      setActiveSegment(segment);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // DERIVED display values (never typed manually)
  // ─────────────────────────────────────────────────────────────────
  const currentYearStats = currentYear ? yearData[currentYear] : null;

  const displayedCount = offers.length;
  const totalCount = offersTotal;

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="cr-page-wrapper" ref={containerRef}>

      {/* Company X-Ray panel — mounted here, portal-like fixed overlay */}
      {xrayCompany && (
        <CompanyXRay
          companyName={xrayCompany}
          onClose={() => setXrayCompany(null)}
        />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━ ZONE 1: HERO STATS ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hero-stats">
        {summaryError ? (
          <div className="hero-stat-error">Could not load stats</div>
        ) : !summary ? (
          [0, 1, 2].map(i => (
            <div key={i} className="hero-stat">
              <div className="skeleton-block" style={{ height: 80, marginBottom: 8 }} />
              <div className="skeleton-block" style={{ height: 14, width: '60%', margin: '0 auto' }} />
            </div>
          ))
        ) : (
          <>
            <div className="hero-stat">
              <div className="hs-num" data-count={summary.total_placed} style={{ color: 'var(--yellow)' }}>0</div>
              <div className="hs-label">Total Placed</div>
            </div>
            <div className="hero-stat">
              <div className="hs-num" data-count={summary.highest_lpa} style={{ color: 'var(--green)' }}>0</div>
              <div className="hs-label">Highest Pkg (LPA)</div>
            </div>
            <div className="hero-stat">
              <div className="hs-num" data-count={summary.total_companies} data-suffix="+" style={{ color: 'var(--blue)' }}>0</div>
              <div className="hs-label">Companies</div>
            </div>
          </>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━ ZONE 2: YEAR SELECTOR ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="year-row">
        {yearList.length === 0 ? (
          <div className="skeleton-block" style={{ height: 40, width: 320 }} />
        ) : (
          <div className="year-tabs">
            {yearList.map(y => (
              <button
                key={y}
                className={`year-tab ${y === currentYear ? 'active' : ''}`}
                onClick={() => handleYearChange(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}
        <div className="year-mini-stats">
          {currentYearStats
            ? `${currentYearStats.total_placed} PLACED  ·  ${currentYearStats.highest_lpa} LPA HIGHEST  ·  ${currentYearStats.total_companies} COMPANIES`
            : '—'}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━ ZONE 3: DASHBOARD GRID ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="dash-grid">
        <div className="dash-left">
          <div className="zone-title">
            PACKAGE DISTRIBUTION
            <button className="sort-btn" onClick={handleSortToggle}>
              SORT: {sortByBracket ? 'BRACKET ↕' : 'COUNT ↕'}
            </button>
          </div>
          {dashError ? (
            <ErrorState message="Failed to load distribution" retry={() => currentYear && setCurrentYear(currentYear)} />
          ) : dashLoading ? (
            [0, 1, 2, 3, 4].map(i => (
              <div key={i} className="bar-row">
                <div className="skeleton-block" style={{ width: 80, height: 16 }} />
                <div className="skeleton-block" style={{ flex: 1, height: 32 }} />
                <div className="skeleton-block" style={{ width: 40, height: 22 }} />
              </div>
            ))
          ) : (
            barData.map(r => (
              <div key={r.l} className="bar-row">
                <div className="bar-label">{r.l}</div>
                <div className="bar-container">
                  <div className="bar-fill" data-w={r.pct} style={{ background: r.clr }} />
                </div>
                <div className="bar-count" data-count={r.c}>0</div>
              </div>
            ))
          )}
        </div>

        <div className="dash-right">
          <div className="zone-title">TOP RECRUITERS</div>
          {dashError ? (
            <ErrorState message="Failed to load recruiters" />
          ) : dashLoading ? (
            [0, 1, 2, 3].map(i => (
              <div key={i} className="lb-card">
                <div className="skeleton-block" style={{ width: 36, height: 36, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-block" style={{ height: 16, marginBottom: 6 }} />
                  <div className="skeleton-block" style={{ height: 10 }} />
                </div>
              </div>
            ))
          ) : (
            lbData.map((c, i) => (
              <div
                key={c.n}
                className="lb-card"
                data-company={c.n}
                onClick={() => handleCompanyHeatmapClick(c.n)}
              >
                <div className="lb-rank">#{i + 1}</div>
                <div className="lb-avatar">{c.n.charAt(0)}</div>
                <div className="lb-info">
                  <div className="lb-name">{c.n}</div>
                  <div className="lb-meta">Avg: {c.a} LPA</div>
                  <div className="lb-minibar">
                    <div className="lb-minibar-fill" data-w={c.pct} />
                  </div>
                </div>
                <div className="lb-count" data-count={c.h}>0</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━ ZONE 4: LOYALTY SPECTRUM ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="zone4" id="loyalty-section">
        <div className="loyalty-header">
          <div className="zone-title" style={{ fontSize: '32px', marginBottom: 4 }}>WHO KEEPS COMING BACK?</div>
          <div className="loyalty-subtitle">4 seasons of recruiter loyalty, in one glance</div>
        </div>

        {loyaltyError ? (
          <ErrorState message="Failed to load loyalty data" retry={loadLoyalty} />
        ) : loyaltyLoading ? (
          <>
            {/* Skeleton stat strip */}
            <div className="loyalty-stats">
              {[0,1,2,3].map(i => (
                <div key={i} className="stat-box" style={{ background: '#e8e3d8' }}>
                  <div className="skeleton-block" style={{ height: 56, marginBottom: 8 }} />
                  <div className="skeleton-block" style={{ height: 12, width: '70%', margin: '0 auto' }} />
                </div>
              ))}
            </div>
            {/* Skeleton track */}
            <div className="loyalty-track-wrap">
              <div className="loyalty-track">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="loyalty-card loyalty-card--skeleton">
                    <div className="skeleton-block" style={{ height: 20, marginBottom: 8 }} />
                    <div className="skeleton-block" style={{ height: 48, marginBottom: 8 }} />
                    <div className="skeleton-block" style={{ height: 16 }} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : loyaltyData && (() => {
          // All derived from API response — no constants typed here
          const { summary, companies, all_years } = loyaltyData;

          const SEGMENTS = [
            { key: 'ALL',          label: 'ALL',          count: companies.length },
            { key: 'ALWAYS_THERE', label: 'ALWAYS THERE', count: summary.always_there },
            { key: 'COMEBACK',     label: 'COMEBACK KIDS', count: summary.comeback },
            { key: 'FIRST_TIMER',  label: 'FIRST TIMERS', count: summary.first_timer },
            { key: 'GHOSTED',      label: 'GHOSTED US',   count: summary.ghosted },
          ];

          const SEG_STYLE = {
            ALWAYS_THERE: { bg: 'var(--green)',  text: '#000', label: 'ALWAYS THERE',  sub: 'Visited every season' },
            COMEBACK:     { bg: 'var(--blue)',   text: '#fff', label: 'COMEBACK KIDS', sub: 'Left, then returned' },
            FIRST_TIMER:  { bg: 'var(--yellow)', text: '#000', label: 'FIRST TIMERS',  sub: 'New this season' },
            GHOSTED:      { bg: 'var(--red)',    text: '#fff', label: 'GHOSTED US',    sub: "Haven't returned" },
          };

          const TREND_ARROW = { rising: '▲', declining: '▼', flat: '–' };
          const TREND_COLOR = { rising: 'var(--green)', declining: 'var(--red)', flat: 'var(--gray)' };

          // Filter companies client-side from already-fetched data
          const visibleCompanies = activeSegment === 'ALL'
            ? companies
            : companies.filter(c => c.segment === activeSegment);

          // Max sparkline value across ALL companies (for proportional bars)
          const globalMax = Math.max(
            1,
            ...companies.flatMap(c => c.sparkline.filter(v => v !== null))
          );

          return (
            <>
              {/* ─── Narrative stat strip ───────────────────────────── */}
              <div className="loyalty-stats">
                {Object.entries(SEG_STYLE).map(([segKey, style]) => (
                  <div
                    key={segKey}
                    className={`stat-box ${activeSegment === segKey ? 'stat-box--active' : ''}`}
                    style={{ background: style.bg, color: style.text }}
                    onClick={() => handleSegmentFilter(segKey)}
                  >
                    <span
                      className="stat-num"
                      data-count={summary[segKey.toLowerCase()]}
                    >
                      {summary[segKey.toLowerCase()]}
                    </span>
                    <span className="stat-label">{style.label}</span>
                    <span className="stat-sub">{style.sub}</span>
                  </div>
                ))}
              </div>

              {/* ─── Segment filter chips ─────────────────────────────*/}
              <div className="loyalty-chips">
                {SEGMENTS.map(s => (
                  <button
                    key={s.key}
                    className={`loyalty-chip ${activeSegment === s.key ? 'loyalty-chip--active' : ''}`}
                    onClick={() => handleSegmentFilter(s.key)}
                  >
                    {s.label} ({s.count})
                  </button>
                ))}
              </div>

              {/* ─── Horizontal card track ───────────────────────────*/}
              <div className="loyalty-track-wrap">
                <button
                  id="scroll-left"
                  className="scroll-arrow scroll-arrow--left"
                  aria-label="Scroll left"
                  onClick={() => loyaltyTrackRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                >←</button>

                <div className="loyalty-track" ref={loyaltyTrackRef}>
                  {visibleCompanies.length === 0 ? (
                    <div className="loyalty-empty-card">
                      NO COMPANIES IN THIS CATEGORY YET
                    </div>
                  ) : (
                    visibleCompanies.map((c, idx) => {
                      const seg = SEG_STYLE[c.segment] || SEG_STYLE.ALWAYS_THERE;
                      const initial = (c.company || '?').charAt(0).toUpperCase();
                      return (
                        <div
                          key={c.company + idx}
                          className="loyalty-card"
                          style={{ '--seg-color': seg.bg }}
                          onClick={() => openXRay(c.company)}
                          title={`Click to open ${c.company} X-Ray`}
                        >
                          {/* Row 1: avatar + name + trend */}
                          <div className="lc-header">
                            <div className="lc-avatar" style={{ background: seg.bg, color: seg.text }}>
                              {initial}
                            </div>
                            <div className="lc-name">{c.company}</div>
                            <div
                              className="lc-trend"
                              style={{ color: TREND_COLOR[c.trend] }}
                            >
                              {TREND_ARROW[c.trend] || '–'}
                            </div>
                          </div>

                          {/* Row 2: sparkline */}
                          <div className="sparkline">
                            {c.sparkline.map((v, yi) => {
                              if (v === null) {
                                return <div key={yi} className="spark-bar spark-bar--empty" />;
                              }
                              const heightPct = Math.max(8, Math.round((v / globalMax) * 100));
                              return (
                                <div
                                  key={yi}
                                  className="spark-bar"
                                  style={{ height: `${heightPct}%` }}
                                  title={`${all_years[yi]}: ${v} hired`}
                                />
                              );
                            })}
                          </div>
                          {/* Year ticks below sparkline */}
                          <div className="spark-years">
                            {all_years.map(y => (
                              <span key={y} className="spark-year-tick">
                                {y.slice(-2)}
                              </span>
                            ))}
                          </div>

                          {/* Row 3: segment badge */}
                          <div
                            className="lc-segment-badge"
                            style={{ background: seg.bg, color: seg.text }}
                          >
                            {seg.label}
                          </div>

                          {/* Row 4: stats */}
                          <div className="lc-stats">
                            {c.total_hired} hired
                            {c.avg_lpa !== null ? ` · ${c.avg_lpa} LPA avg` : ''}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  id="scroll-right"
                  className="scroll-arrow scroll-arrow--right"
                  aria-label="Scroll right"
                  onClick={() => loyaltyTrackRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                >→</button>
              </div>
            </>
          );
        })()}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━ ZONE 5: HALL OF OFFERS ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="zone5">
        <div className="zone5-title">HALL OF OFFERS</div>
        <div className="zone5-sub">Every offer. Every company. Every year.</div>

        {/* Filter bar — powered exclusively by filtersMeta from API */}
        <div className="offers-filters">
          {/* Year filter */}
          <select
            className="filter-select"
            value={activeFilters.year}
            onChange={e => setActiveFilters(prev => ({ ...prev, year: e.target.value }))}
          >
            <option value="all">ALL YEARS</option>
            {(filtersMeta?.years ?? []).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Branch filter — derived from filters-meta, never hardcoded */}
          <select
            className="filter-select"
            value={activeFilters.branch}
            onChange={e => setActiveFilters(prev => ({ ...prev, branch: e.target.value }))}
          >
            <option value="">ALL BRANCHES</option>
            {(filtersMeta?.branches ?? []).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="filter-select"
            value={activeFilters.sort}
            onChange={e => setActiveFilters(prev => ({ ...prev, sort: e.target.value }))}
          >
            <option value="salary_desc">HIGHEST SALARY</option>
            <option value="salary_asc">LOWEST SALARY</option>
            <option value="hired_desc">MOST HIRED</option>
            <option value="company_asc">COMPANY A–Z</option>
          </select>

          {/* PPO filter */}
          <button
            className={`filter-btn ${activeFilters.visit_type === 'PPO' ? 'active' : ''}`}
            onClick={() => setActiveFilters(prev => ({
              ...prev,
              visit_type: prev.visit_type === 'PPO' ? '' : 'PPO'
            }))}
          >
            PPO ONLY
          </button>

          {/* Search */}
          <input
            className="search-input"
            type="text"
            placeholder="Search company..."
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>

        {/* Count indicator — reads from API response, never typed */}
        <div className="offers-count-bar">
          {offersLoading ? '—' : `SHOWING ${displayedCount} OF ${totalCount} OFFERS`}
        </div>

        {/* ── MARQUEE TICKER ─────────────────────────────────────── */}
        {offersError ? (
          <ErrorState
            message="Failed to load offers"
            retry={() => loadOffersPage1(activeFilters)}
          />
        ) : offersLoading ? (
          <div className="marquee-wrap">
            <div className="marquee-track">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="offer-card offer-card--skeleton">
                  <div className="skeleton-block" style={{ width: 32, height: 32, marginBottom: 8 }} />
                  <div className="skeleton-block" style={{ height: 18, marginBottom: 6 }} />
                  <div className="skeleton-block" style={{ height: 32, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton-block" style={{ height: 14 }} />
                </div>
              ))}
            </div>
          </div>
        ) : offers.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">◉</div>
            <div className="no-results-text">NO OFFERS MATCH YOUR FILTERS</div>
          </div>
        ) : (
          <div
            className="marquee-wrap"
            onMouseEnter={() => marqueeTweenRef.current?.pause()}
            onMouseLeave={() => marqueeTweenRef.current?.play()}
          >
            {/* Two identical sets rendered for seamless infinite loop */}
            <div className="marquee-track" id="marqueeTrack">
              {[...offers, ...offers].map((offer, idx) => {
                const tierColor = TIER_COLOR[offer.tier] || TIER_COLOR.MASS;
                const initial = (offer.company_name || '?').charAt(0).toUpperCase();
                return (
                  <div
                    key={`${offer.company_name}-${offer.academic_year}-${idx}`}
                    className="offer-card"
                    onClick={() => idx < offers.length && openXRay(offer.company_name)}
                    title={idx < offers.length ? `Click to open ${offer.company_name} X-Ray` : undefined}
                    style={{ cursor: idx < offers.length ? 'pointer' : 'default' }}
                  >
                    <div className="oc-avatar" style={{ background: tierColor }}>{initial}</div>
                    <div className="oc-company">{offer.company_name.toUpperCase()}</div>
                    {offer.visit_type === 'PPO' && <div className="oc-ppo">PPO</div>}
                    <div className="oc-pkg">
                      {offer.salary_lpa}<span> LPA</span>
                    </div>
                    <div className="oc-branches">
                      {offer.hiring_branches.length > 0
                        ? offer.hiring_branches.join(' · ')
                        : offer.eligible_branches || '—'}
                    </div>
                    <div className="oc-meta">
                      {offer.academic_year} · ♀{offer.female} ♂{offer.male}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyRecords;
