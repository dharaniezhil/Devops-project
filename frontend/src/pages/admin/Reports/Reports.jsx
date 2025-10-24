import React, { useEffect, useMemo, useState } from 'react';
import { reportsAPI } from '../../../services/api';

const StatCard = ({ title, value, suffix = '', color = '#667eea' }) => (
  <div style={{
    background: '#f8f9fa',
    padding: '2rem',
    borderRadius: '15px',
    textAlign: 'center',
    border: `2px solid ${color}`
  }}>
    <h3 style={{ margin: '0 0 1rem 0', color }}>{title}</h3>
    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#2c3e50' }}>
      {value}{suffix}
    </p>
  </div>
);

const Reports = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const params = useMemo(() => ({}), []); // Extend later with date filters

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportsAPI.getMetrics(params);
      if (res.data?.success) {
        setMetrics(res.data.metrics);
      } else {
        throw new Error(res.data?.message || 'Failed to load metrics');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const regenerate = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportsAPI.regenerate(params);
      if (res.data?.success) {
        setMetrics(res.data.metrics);
      } else {
        throw new Error(res.data?.message || 'Failed to regenerate');
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCsv = async () => {
    const res = await reportsAPI.exportCSV(params);
    downloadBlob(res.data, 'report.csv');
  };
  const exportXlsx = async () => {
    const res = await reportsAPI.exportExcel(params);
    downloadBlob(res.data, 'report.xlsx');
  };
  const exportPdf = async () => {
    const res = await reportsAPI.exportPDF(params);
    downloadBlob(res.data, 'report.pdf');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2.2rem', color: 'white', textAlign: 'center', marginBottom: '1.5rem',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          📊 Reports & Analytics
        </h1>

        <div style={{ background: 'white', borderRadius: 20, padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          {error && (
            <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>
          )}
          {loading && (
            <div style={{ color: '#334155', marginBottom: 12 }}>Loading...</div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button onClick={exportCsv} className="btn" style={{ background: '#667eea', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, cursor: 'pointer' }}>Export CSV</button>
            <button onClick={exportXlsx} className="btn" style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, cursor: 'pointer' }}>Export Excel</button>
            <button onClick={exportPdf} className="btn" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, cursor: 'pointer' }}>Export PDF</button>
            <div style={{ flex: 1 }} />
            <button onClick={regenerate} disabled={loading} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, cursor: 'pointer' }}>Regenerate Report</button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem'
          }}>
            <StatCard title="Total Complaints" value={metrics?.totalComplaints ?? '—'} color="#667eea" />
            <StatCard title="Resolution Rate" value={metrics?.resolutionRate ?? '—'} suffix="%" color="#22c55e" />
            <StatCard title="Avg Response Time" value={metrics?.averageResponseTimeDays ?? '—'} suffix=" days" color="#f59e0b" />
            <StatCard title="User Satisfaction" value={metrics?.averageUserSatisfaction ?? '—'} suffix=" / 5" color="#dc2626" />
          </div>

          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ color: '#64748b', margin: 0 }}>
              Tip: Use the Export buttons to download CSV, Excel, or PDF. Click "Regenerate Report" to recalculate metrics in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
