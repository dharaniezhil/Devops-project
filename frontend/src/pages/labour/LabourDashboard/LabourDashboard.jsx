import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { labourAPI, apiHelpers } from '../../../services/api';
import SimpleAttendanceWidget from '../../../components/attendance/SimpleAttendanceWidget';
// import QuickAttendanceWidget from '../../../components/attendance/QuickAttendanceWidget';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: 16,
  background: 'white',
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
};

const LabourDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, statsRes] = await Promise.all([
        labourAPI.getAssignedComplaints(),
        labourAPI.getStats()
      ]);
      setComplaints(listRes.data.complaints || []);
      setStats(statsRes.data?.stats || { total: 0, inProgress: 0, pending: 0, completed: 0 });
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, []); // Empty dependency array to run only on mount


  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Labour Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Welcome back!</span>
          <Link
            to="/labour/attendance" 
            style={{ 
              background: '#6366f1', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            📝 Mark Attendance
          </Link>
        </div>
      </div>

      {/* Simple Attendance Widget - No infinite loops */}
      <SimpleAttendanceWidget />

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 12, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Total Assigned</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>In Progress</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.inProgress}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Pending</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.pending}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.completed}</div>
        </div>
      </div>

      {/* Recent (top 3) preview only */}
      <div style={cardStyle}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin: 0 }}>Recent Assigned</h3>
          <a href="/labour/assigned-complaints" style={{ color:'#6366f1', textDecoration:'none' }}>Go to Assigned Complaints →</a>
        </div>
        {complaints.length === 0 ? (
          <div style={{ marginTop: 8, color:'#6b7280' }}>No complaints assigned yet.</div>
        ) : (
          <div style={{ display:'grid', gap: 8, marginTop: 12 }}>
            {complaints.slice(0,3).map((c) => (
              <div key={c._id} style={{ padding: 8, border:'1px solid #e5e7eb', borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div style={{ color:'#6b7280', fontSize: 13 }}>{c.category} • {c.priority} • {c.location}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Status: {c.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabourDashboard;
