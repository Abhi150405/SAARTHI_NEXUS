import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Database, Plus, Trash2, Search, ArrowUpDown } from 'lucide-react';
import '../styles/Dashboard.css'; 

const ManagePlacementRecords = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/placements`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, companyName) => {
    if (!window.confirm(`Are you sure you want to delete the placement record for ${companyName}?`)) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/admin/placement/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r._id !== id));
      } else {
        alert('Failed to delete the record.');
      }
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Network error while deleting.');
    }
  };

  const filteredRecords = records.filter(r => 
    (r.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.academic_year || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ maxWidth: 1000 }}>
        
        <div className="dash-header" style={{ paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Database size={24} color="#F97316" />
              Manage Records
            </h1>
            <p className="subtitle" style={{ color: '#A3A3A3' }}>View and delete existing placement drive records.</p>
          </div>
          <button 
            className="btn-primary-dash" 
            onClick={() => {
              if (setActiveTab) setActiveTab('add-placement');
              else navigate('/app/add-placement');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} />
            Add Record
          </button>
        </div>

        <div className="chart-card">
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="chart-overline" style={{ margin: 0 }}>All Placements</div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 6, width: '250px' }}>
              <Search size={16} color="#737373" />
              <input 
                type="text" 
                placeholder="Search company or year..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: 13, marginLeft: 8, outline: 'none', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '16px 20px', color: '#A3A3A3', fontWeight: 600 }}>Academic Year</th>
                  <th style={{ padding: '16px 20px', color: '#A3A3A3', fontWeight: 600 }}>Company</th>
                  <th style={{ padding: '16px 20px', color: '#A3A3A3', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '16px 20px', color: '#A3A3A3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>Date <ArrowUpDown size={12} /></th>
                  <th style={{ padding: '16px 20px', color: '#A3A3A3', fontWeight: 600 }}>Salary (LPA)</th>
                  <th style={{ padding: '16px 20px', color: '#A3A3A3', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#737373' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 16, height: 16, border: '2px solid #F97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Loading records...
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#737373' }}>
                      No placement records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 20px', color: '#F5F5F5' }}>{r.academic_year}</td>
                      <td style={{ padding: '16px 20px', color: '#F5F5F5', fontWeight: 500 }}>{r.company_name}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 8px', background: 'rgba(249, 115, 22, 0.1)', color: '#F97316', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {r.category || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#A3A3A3' }}>
                        {r.visit_date ? new Date(r.visit_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#F5F5F5', fontWeight: 600 }}>₹ {r.salary_lpa}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDelete(r._id, r.company_name)}
                          style={{ margin: 0, padding: 6, background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagePlacementRecords;
