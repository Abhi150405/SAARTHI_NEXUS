
import React, { useState, useEffect } from 'react';
import { Search, Building, Calendar, DollarSign, BookOpen, ChevronRight, Users, TrendingUp } from 'lucide-react';
import '../styles/CompanyRecords.css';

const CompanyRecords = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/companies');
            const data = await response.json();
            setCompanies(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching companies:', error);
            setLoading(false);
        }
    };

    const fetchCompanyDetails = async (name) => {
        try {
            const response = await fetch(`http://localhost:5000/api/company/${encodeURIComponent(name)}`);
            const data = await response.json();
            setSelectedCompany(data);
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <div className="search-bar card">
                        <Search size={20} className="icon-muted" />
                        <input
                            type="text"
                            placeholder="Find a company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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

                <div className="details-section">
                    {selectedCompany ? (
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
                                <h3>Hiring History</h3>
                                <div className="timeline-grid">
                                    {selectedCompany.history.map((h, i) => (
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
                                                    <div className="branch-pills">
                                                        {Object.entries(h.dept_breakdown).map(([dept, count]) => (
                                                            count > 0 && <span key={dept} className="pill">{dept}: {count}</span>
                                                        ))}
                                                    </div>
                                                    <p className="criteria-text">Criteria: {h.criteria.min_cgpa} CGPA</p>
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
