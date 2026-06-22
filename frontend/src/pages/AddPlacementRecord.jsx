import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowLeft, Save, PlusCircle, AlertCircle } from 'lucide-react';
import '../styles/Dashboard.css'; // Reusing dashboard styles for consistency

const AddPlacementRecord = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    academic_year: '2023-2024',
    company_name: '',
    category: 'IT',
    salary_lpa: '',
    visit_date: new Date().toISOString().split('T')[0],
    total_salary_lpa: '',
    criteria: '{\n  "cgpa": 6.0,\n  "tenth": 60,\n  "twelfth": 60\n}',
    selections: '{\n  "CE": 0,\n  "IT": 0,\n  "E&TC": 0,\n  "E&CE": 0,\n  "AI&DS": 0\n}',
    gender_distribution: '{\n  "Male": 0,\n  "Female": 0\n}'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Parse JSON strings
      const criteriaObj = JSON.parse(formData.criteria);
      const selectionsObj = JSON.parse(formData.selections);
      const genderDistributionObj = JSON.parse(formData.gender_distribution);

      const payload = {
        ...formData,
        salary_lpa: parseFloat(formData.salary_lpa) || 0,
        total_salary_lpa: parseFloat(formData.total_salary_lpa) || 0,
        criteria: criteriaObj,
        selections: selectionsObj,
        gender_distribution: genderDistributionObj
      };

      const response = await fetch(`${API_URL}/api/admin/placement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess('Placement record integrated successfully.');
        setFormData({
          ...formData, // retain year/date defaults
          company_name: '',
          salary_lpa: '',
          total_salary_lpa: ''
        });
        setTimeout(() => {
          if (setActiveTab) setActiveTab('manage-placements');
          else navigate('/app/manage-placements');
        }, 1500);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Failed to add record.');
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format in one of the JSON fields. Please check your syntax.');
      } else {
        setError('Network error occurred.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ maxWidth: 800 }}>
        
        <div className="dash-header" style={{ paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' }}>
          <div>
            <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                className="btn-ghost" 
                style={{ padding: '6px', border: 'none' }}
                onClick={() => {
                  if (setActiveTab) setActiveTab('manage-placements');
                  else navigate('/app/manage-placements');
                }}
              >
                <ArrowLeft size={20} />
              </button>
              Add New Record
            </h1>
            <p className="subtitle" style={{ marginLeft: 36, color: '#A3A3A3' }}>Insert a new company drive and placement statistics.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '8px', color: '#EF4444', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '16px', borderRadius: '8px', color: '#22C55E', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="chart-card" style={{ padding: '24px' }}>
            <div className="chart-overline" style={{ marginBottom: 16 }}>Basic Information</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Academic Year *</label>
                <input 
                  type="text" 
                  name="academic_year"
                  required
                  value={formData.academic_year} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px', borderRadius: '6px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Company Name *</label>
                <input 
                  type="text" 
                  name="company_name"
                  required
                  value={formData.company_name} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px', borderRadius: '6px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Category</label>
                <select 
                  name="category"
                  value={formData.category} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px', borderRadius: '6px', color: '#F5F5F5', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="IT">IT</option>
                  <option value="Core">Core</option>
                  <option value="Management">Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Visit Date *</label>
                <input 
                  type="date" 
                  name="visit_date"
                  required
                  value={formData.visit_date} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px', borderRadius: '6px', color: '#F5F5F5', fontSize: '14px', outline: 'none', colorScheme: 'dark' }} 
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Salary (LPA) *</label>
                <input 
                  type="number"
                  step="0.01" 
                  name="salary_lpa"
                  required
                  value={formData.salary_lpa} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px', borderRadius: '6px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Total Salary (LPA)</label>
                <input 
                  type="number"
                  step="0.01" 
                  name="total_salary_lpa"
                  value={formData.total_salary_lpa} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '10px 14px', borderRadius: '6px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} 
                />
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '24px' }}>
            <div className="chart-overline" style={{ marginBottom: 16 }}>Advanced JSON Data</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Criteria (JSON)</label>
                <textarea 
                  name="criteria"
                  rows={4}
                  value={formData.criteria} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '12px', borderRadius: '6px', color: '#F97316', fontSize: '13px', outline: 'none', fontFamily: 'monospace', resize: 'vertical' }} 
                />
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Selections by Branch (JSON)</label>
                <textarea 
                  name="selections"
                  rows={6}
                  value={formData.selections} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '12px', borderRadius: '6px', color: '#F97316', fontSize: '13px', outline: 'none', fontFamily: 'monospace', resize: 'vertical' }} 
                />
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>Gender Distribution (JSON)</label>
                <textarea 
                  name="gender_distribution"
                  rows={3}
                  value={formData.gender_distribution} 
                  onChange={handleChange}
                  style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '12px', borderRadius: '6px', color: '#F97316', fontSize: '13px', outline: 'none', fontFamily: 'monospace', resize: 'vertical' }} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button 
              type="submit" 
              className="btn-primary-dash" 
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, padding: '12px 24px', fontSize: 14 }}
            >
              {loading ? (
                <div style={{ width: 16, height: 16, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : (
                <Save size={18} />
              )}
              {loading ? 'Saving...' : 'Save Placement Record'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddPlacementRecord;
