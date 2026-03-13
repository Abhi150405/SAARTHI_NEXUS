
import React, { useState, useEffect } from 'react';
import { Search, Building, Calendar, DollarSign, BookOpen, ChevronRight, Users, TrendingUp } from 'lucide-react';
import '../styles/CompanyRecords.css';
import { API_URL } from '../config';

const CompanyRecords = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc');
    const [listSortOrder, setListSortOrder] = useState('asc');
    const detailsRef = React.useRef(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await fetch(`${API_URL}/api/companies`);
            const data = await response.json();
            setCompanies(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching companies:', error);
            setLoading(false);
        }
    };

    const fetchCompanyDetails = async (name) => {
        setDetailsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/company/${encodeURIComponent(name)}`);
            if (!response.ok) throw new Error('Failed to fetch details');
            const data = await response.json();
            setSelectedCompany(data);
            setSortOrder('desc');

            // On mobile, scroll to details section
            if (window.innerWidth <= 1024) {
                setTimeout(() => {
                    detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
            alert('Could not load company details. Please check your connection.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const filteredCompanies = companies
        .filter(c => c.company.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
             if (listSortOrder === 'asc') {
                 return a.company.localeCompare(b.company);
             } else if (listSortOrder === 'desc') {
                 return b.company.localeCompare(a.company);
             } else if (listSortOrder === 'newest') {
                 let dA = a.latestVisitDate ? new Date(a.latestVisitDate).getTime() : 0;
                 let dB = b.latestVisitDate ? new Date(b.latestVisitDate).getTime() : 0;
                 // secondary sort by name if dates are equal (e.g. both 0)
                 return dB - dA || a.company.localeCompare(b.company);
             } else if (listSortOrder === 'oldest') {
                 let dA = a.latestVisitDate ? new Date(a.latestVisitDate).getTime() : 0;
                 let dB = b.latestVisitDate ? new Date(b.latestVisitDate).getTime() : 0;
                 return dA - dB || a.company.localeCompare(b.company);
             }
             return 0;
        });

    if (loading) return <div className="loading">Loading records...</div>;

    return (
        <div className="records-page">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Company Insights</h2>
                    <p className="page-subtitle">Historical visit data and hiring trends across years</p>
                </div>
            </div>

            <div className="records-layout">
                <div className="companies-list-section">
                    <div className="search-bar card" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, backgroundColor: 'transparent' }}>
                            <Search size={20} className="icon-muted" style={{ marginRight: '0.5rem' }} />
                            <input
                                type="text"
                                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.95rem' }}
                                placeholder="Find a company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={listSortOrder}
                            onChange={(e) => setListSortOrder(e.target.value)}
                            style={{ 
                                padding: '0.4rem', 
                                borderRadius: '4px', 
                                border: '1px solid var(--border-color)', 
                                backgroundColor: 'var(--bg-main)', 
                                color: 'var(--text-main)', 
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                minWidth: '130px'
                            }}
                        >
                            <option value="asc">A-Z</option>
                            <option value="desc">Z-A</option>
                            <option value="newest">Recent Visits</option>
                            <option value="oldest">Oldest Visits</option>
                        </select>
                    </div>

                    <div className="companies-scroll-area">
                        {filteredCompanies.map((c, index) => (
                            <div
                                key={index}
                                className={`company-list-item card ${selectedCompany?.name === c.company ? 'active' : ''}`}
                                onClick={() => fetchCompanyDetails(c.company)}
                            >
                                <div className="item-info">
                                    <h4>{c.company}</h4>
                                    <p>{c.visits} Visits • {c.totalHires} Total Hires</p>
                                </div>
                                <ChevronRight size={18} className="icon-fade" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="details-section" ref={detailsRef}>
                    {detailsLoading ? (
                        <div className="empty-details card">
                            <div className="loader"></div>
                            <p>Fetching company history...</p>
                        </div>
                    ) : selectedCompany ? (
                        <div className="company-detail-view card animate-fade-in">
                            <div className="detail-header">
                                <div className="title-block">
                                    <div className="company-logo-type">
                                        <Building size={32} />
                                    </div>
                                    <div>
                                        <h2>{selectedCompany.name}</h2>
                                        <div className="stats-row">
                                            <span className="badge"><Users size={14} /> {selectedCompany.total_hires} Hired</span>
                                            <span className="badge"><Calendar size={14} /> {selectedCompany.visit_count} Years</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="years-timeline">
                                <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3>Hiring History</h3>
                                    <div className="sort-control" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label htmlFor="sortOrder" style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Sort by Date:</label>
                                        <select 
                                            id="sortOrder" 
                                            value={sortOrder} 
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
                                        >
                                            <option value="desc">Newest First</option>
                                            <option value="asc">Oldest First</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="timeline-grid">
                                    {[...selectedCompany.history].sort((a, b) => {
                                        let dateA = a.parsed_visit_date ? new Date(a.parsed_visit_date).getTime() : new Date(a.year.substring(0, 4)).getTime();
                                        let dateB = b.parsed_visit_date ? new Date(b.parsed_visit_date).getTime() : new Date(b.year.substring(0, 4)).getTime();
                                        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                                    }).map((h, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className="year-label">{h.year}</div>
                                            <div className="history-card">
                                                <div className="main-stat">
                                                    <div className="stat-group">
                                                        <span className="label">Package</span>
                                                        <span className="value">{h.salary}</span>
                                                    </div>
                                                    <div className="stat-group highlight">
                                                        <span className="label">Hired</span>
                                                        <span className="value">{h.hires}</span>
                                                    </div>
                                                </div>
                                                <div className="extra-details">
                                                    {h.visit_date && (
                                                        <p className="criteria-text" style={{ marginBottom: '0.4rem' }}>
                                                            <strong>Date of Visit:</strong> {new Date(h.visit_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    <p className="criteria-text" style={{ marginBottom: '0.8rem' }}>
                                                        <strong>Criteria:</strong> {h.criteria.min_cgpa} CGPA {h.criteria.eligible_branches ? `(${h.criteria.eligible_branches})` : ''}
                                                    </p>
                                                    <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                                        <div className="gender-stats">
                                                            <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-light)' }}>Gender Distribution</strong>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                                <span className="pill" style={{ background: 'var(--bg-main)' }}>Male: {h.gender_breakdown?.male || 0}</span>
                                                                <span className="pill" style={{ background: 'var(--bg-main)' }}>Female: {h.gender_breakdown?.female || 0}</span>
                                                            </div>
                                                        </div>
                                                        <div className="dept-stats">
                                                            <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-light)' }}>Department Wise</strong>
                                                            <div className="branch-pills" style={{ marginTop: '0' }}>
                                                                {Object.entries(h.dept_breakdown).map(([dept, count]) => (
                                                                    count > 0 && <span key={dept} className="pill" style={{ background: 'var(--bg-main)' }}>{dept}: {count}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-details card">
                            <TrendingUp size={48} className="icon-muted" />
                            <h3>Select a company to see details</h3>
                            <p>Browse the list or use the search bar to find specific placement history.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyRecords;
