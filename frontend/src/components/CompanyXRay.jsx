import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { API_URL } from '../config';
import '../styles/XRayPanel.css';

const BR_COLS = ['#FFE135', '#1A6EFF', '#00C86F', '#FF6B00', '#9B59B6', '#FF4444'];

export default function CompanyXRay({ companyName, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const cardRef    = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!companyName) return;
    document.body.style.overflow = 'hidden';

    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(cardRef.current,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' }
    );

    fetch(`${API_URL}/api/placements/company-xray/${encodeURIComponent(companyName)}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });

    return () => { document.body.style.overflow = ''; };
  }, [companyName]);

  const handleClose = () => {
    gsap.to(cardRef.current, { scale: 0.92, opacity: 0, duration: 0.22, ease: 'power2.in' });
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.2, delay: 0.08,
      onComplete: () => { document.body.style.overflow = ''; onClose(); }
    });
  };

  const initial = companyName?.charAt(0)?.toUpperCase() || '?';
  const trendCol = data?.trend === 'rising' ? '#00b85a' : data?.trend === 'declining' ? '#e63535' : '#888';
  const trendIcon = data?.trend === 'rising' ? '▲' : data?.trend === 'declining' ? '▼' : '—';

  return (
    <>
      <div ref={overlayRef} className="xl-overlay" style={{ opacity: 0 }} onClick={handleClose} />

      <div ref={cardRef} className="xl-card" role="dialog" aria-modal="true">
        {/* ── Close button ── */}
        <button className="xl-close" onClick={handleClose} aria-label="Close">✕ Close</button>

        {/* ── Scrollable content ── */}
        <div className="xl-scroll">
          {loading ? (
            <div className="xl-center-state">
              <div className="xl-loader"><div className="xl-loader-bar" /></div>
              <h2 className="xl-center-title">Loading data…</h2>
              <p className="xl-center-sub">{companyName}</p>
            </div>
          ) : error ? (
            <div className="xl-center-state">
              <div className="xl-err-big">404</div>
              <h2 className="xl-center-title">Company not found</h2>
            </div>
          ) : data ? (
            <>
              {/* ═══════════════════════════════════════════
                  HEADER — Identity + Key Stats
              ═══════════════════════════════════════════ */}
              <header className="xl-header">
                <div className="xl-header-left">
                  <div className="xl-avatar">{initial}</div>
                  <div className="xl-header-info">
                    <h1 className="xl-company-name">{companyName}</h1>
                    <p className="xl-company-sub">
                      {data.sector_tag} · {data.category_current}
                    </p>
                    <div className="xl-header-badges">
                      <span className="xl-badge xl-badge-score" style={{ borderColor: trendCol }}>
                        Score: <strong>{data.recruiter_score}</strong>/100
                      </span>
                      <span className="xl-badge" style={{ color: trendCol }}>
                        {trendIcon} {data.trend?.toUpperCase()}
                      </span>
                      <span className="xl-badge">
                        {data.consistency_pct}% consistent
                      </span>
                    </div>
                  </div>
                </div>

                <div className="xl-header-stats">
                  {[
                    { val: data.vitals.total_hired,         lbl: 'Total Hired',   unit: '' },
                    { val: data.vitals.avg_salary,           lbl: 'Avg Package',  unit: ' LPA' },
                    { val: data.vitals.highest_salary,       lbl: 'Peak Package', unit: ' LPA' },
                    { val: data.vitals.seasons_active,       lbl: 'Seasons',      unit: '' },
                  ].map(s => (
                    <div key={s.lbl} className="xl-stat-block">
                      <div className="xl-stat-val">{s.val}{s.unit}</div>
                      <div className="xl-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </header>

              {/* ═══════════════════════════════════════════
                  SALARY OVER THE YEARS — big clear chart
              ═══════════════════════════════════════════ */}
              {data.salary_trend?.length > 0 && (
                <section className="xl-section">
                  <h2 className="xl-sh">Salary Over the Years</h2>
                  <div className="xl-salary-chart">
                    {(() => {
                      const d = data.salary_trend;
                      const max = Math.max(...d.map(e => e.salary_lpa), 1);
                      return d.map((entry, i) => {
                        const pct = Math.round((entry.salary_lpa / max) * 100);
                        const prev = d[i - 1];
                        const delta = prev ? +(entry.salary_lpa - prev.salary_lpa).toFixed(1) : null;
                        const up = delta !== null && delta >= 0;
                        return (
                          <div key={`${entry.year}-${i}`} className="xl-bar-col">
                            <div className="xl-bar-val">{entry.salary_lpa} LPA</div>
                            {delta !== null && (
                              <div className="xl-bar-delta" style={{ color: up ? '#00b85a' : '#e63535' }}>
                                {up ? '+' : ''}{delta}
                              </div>
                            )}
                            <div className="xl-bar-track">
                              <div className="xl-bar-fill" style={{ height: `${Math.max(8, pct)}%` }} />
                            </div>
                            <div className="xl-bar-year">{entry.year}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </section>
              )}

              {/* ═══════════════════════════════════════════
                  SEASON-BY-SEASON DETAILS
              ═══════════════════════════════════════════ */}
              {data.salary_trend?.length > 0 && (
                <section className="xl-section">
                  <h2 className="xl-sh">Season Details</h2>
                  <div className="xl-season-cards">
                    {data.salary_trend.map((entry, i) => {
                      const cgpa = data.cgpa_trend?.[i];
                      const elig = data.eligibility_timeline?.[i];
                      const yb   = data.yearly_branch_breakdown?.[i];
                      return (
                        <div key={`${entry.year}-${i}`} className="xl-s-card">
                          <div className="xl-sc-head">{entry.year}</div>
                          <div className="xl-sc-body">
                            <div className="xl-sc-row">
                              <span>Package</span>
                              <strong>{entry.salary_lpa} LPA</strong>
                            </div>
                            <div className="xl-sc-row">
                              <span>Min CGPA</span>
                              <strong>{cgpa?.raw_label || cgpa?.min_cgpa || '—'}</strong>
                            </div>
                            <div className="xl-sc-row">
                              <span>Eligible</span>
                              <strong>{elig?.eligible_branches || '—'}</strong>
                            </div>
                            {yb && Object.keys(yb.branches || {}).length > 0 && (
                              <div className="xl-sc-chips">
                                {Object.entries(yb.branches).filter(([, v]) => v > 0).map(([br, cnt]) => (
                                  <span key={br} className="xl-sc-chip">{br}: {cnt}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ═══════════════════════════════════════════
                  BRANCH BREAKDOWN
              ═══════════════════════════════════════════ */}
              {Object.keys(data.branch_totals || {}).length > 0 && (
                <section className="xl-section">
                  <h2 className="xl-sh">Branch Breakdown</h2>
                  <div className="xl-branches">
                    {(() => {
                      const entries = Object.entries(data.branch_totals).sort((a, b) => b[1] - a[1]);
                      const maxVal  = entries[0]?.[1] || 1;
                      const total   = entries.reduce((s, [, v]) => s + v, 0);
                      return entries.map(([branch, count], i) => {
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={branch} className="xl-br-row">
                            <div className="xl-br-name">{branch}</div>
                            <div className="xl-br-bar-wrap">
                              <div className="xl-br-bar" style={{
                                width: `${Math.max(5, Math.round((count / maxVal) * 100))}%`,
                                background: BR_COLS[i % BR_COLS.length]
                              }} />
                              <span className="xl-br-inside">{count} hired · {pct}%</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </section>
              )}

              {/* ═══════════════════════════════════════════
                  GENDER SPLIT + BENCHMARK — side by side
              ═══════════════════════════════════════════ */}
              <section className="xl-section xl-two-col-wrap">
                {/* Gender */}
                {data.gender_totals?.total > 0 && (() => {
                  const { male = 0, female = 0, total = 1 } = data.gender_totals;
                  const mPct = Math.round((male / total) * 100);
                  const fPct = 100 - mPct;
                  return (
                    <div className="xl-col-half">
                      <h2 className="xl-sh">Gender Split</h2>
                      <div className="xl-gender-row">
                        <div className="xl-gen-block xl-gen-m">
                          <span className="xl-gen-icon">♂</span>
                          <strong>{male}</strong>
                          <span>{mPct}%</span>
                        </div>
                        <div className="xl-gen-block xl-gen-f">
                          <span className="xl-gen-icon">♀</span>
                          <strong>{female}</strong>
                          <span>{fPct}%</span>
                        </div>
                      </div>
                      <div className="xl-gen-ratio">
                        <div className="xl-gen-ratio-m" style={{ flex: mPct }} />
                        <div className="xl-gen-ratio-f" style={{ flex: fPct }} />
                      </div>
                      <div className="xl-gen-ratio-labels">
                        <span>♂ Male {mPct}%</span>
                        <span>Female {fPct}% ♀</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Benchmark */}
                {data.benchmark && (() => {
                  const { campus_avg_salary = 0, this_company_avg = 0, delta_pct = 0, percentile = 0 } = data.benchmark;
                  const up = delta_pct >= 0;
                  return (
                    <div className="xl-col-half">
                      <h2 className="xl-sh">Vs Campus Benchmark</h2>
                      <div className="xl-bench-compare">
                        <div className="xl-bench-side">
                          <div className="xl-bench-tag">Campus Avg</div>
                          <div className="xl-bench-val">{campus_avg_salary} <span>LPA</span></div>
                        </div>
                        <div className="xl-bench-mid" style={{ background: up ? '#00C86F' : '#e63535', color: up ? '#0a0a0a' : '#fff' }}>
                          {up ? '▲' : '▼'} {Math.abs(delta_pct)}%
                        </div>
                        <div className="xl-bench-side xl-bench-co">
                          <div className="xl-bench-tag">This Company</div>
                          <div className="xl-bench-val">{this_company_avg} <span>LPA</span></div>
                        </div>
                      </div>
                      <div className="xl-pctile">
                        <strong>{percentile}th</strong> percentile — beats {percentile}% of recruiters
                      </div>
                      <div className="xl-pctile-bar">
                        <div className="xl-pctile-fill" style={{ width: `${percentile}%` }} />
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* ═══════════════════════════════════════════
                  ELIGIBILITY HISTORY
              ═══════════════════════════════════════════ */}
              {data.eligibility_timeline?.length > 0 && (
                <section className="xl-section xl-section-last">
                  <h2 className="xl-sh">Eligibility History</h2>
                  <table className="xl-elig-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Min CGPA</th>
                        <th>Eligible Branches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.eligibility_timeline.map(({ year, min_cgpa, eligible_branches }, i) => (
                        <tr key={`${year}-${i}`}>
                          <td>{year}</td>
                          <td>{min_cgpa || '—'}</td>
                          <td>{eligible_branches || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
