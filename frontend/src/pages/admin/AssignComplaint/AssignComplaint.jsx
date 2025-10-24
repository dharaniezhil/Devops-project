import React, { useEffect, useState } from 'react';
import { adminAPI, superadminAPI, apiHelpers } from '../../../services/api';

const AssignComplaint = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [labours, setLabours] = useState([]);
  const [selected, setSelected] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, lRes] = await Promise.all([
        adminAPI.getPendingComplaints(),
        superadminAPI.listLabours()
      ]);
      const cList = (cRes.data?.complaints || cRes.data || []).filter(c => (c.status === 'Pending'));
      const lList = (lRes.data?.labours || lRes.data || []).filter(l => l.status === 'active');
      setComplaints(cList);
      setLabours(lList);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const assign = async (complaintId) => {
    const labourId = selected[complaintId];
    if (!labourId) {
      alert('Please select a labour');
      return;
    }
    setAssigningId(complaintId);
    setMessage('');
    try {
      const res = await adminAPI.assignComplaint(complaintId, labourId);
      setMessage(res.data?.message || 'Complaint assigned successfully');
      setComplaints(prev => prev.filter(c => c._id !== complaintId));
    } catch (err) {
      alert(apiHelpers.handleError(err).message);
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading pending complaints...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Assign Complaints</h2>
      {message && <div style={{ color: '#10b981', marginBottom: 12 }}>{message}</div>}
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding: 8 }}>Complaint ID</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding: 8 }}>Title / Description</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding: 8 }}>User</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding: 8 }}>Status</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding: 8 }}>Select Labour</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #e5e7eb', padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 12, color: '#6b7280' }}>No pending complaints</td>
            </tr>
          )}
          {complaints.map((c) => (
            <tr key={c._id}>
              <td style={{ padding: 8 }}>{c._id}</td>
              <td style={{ padding: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.title}</div>
                <div style={{ color: '#6b7280' }}>{c.description}</div>
              </td>
              <td style={{ padding: 8 }}>{c.user?.name || 'N/A'}</td>
              <td style={{ padding: 8 }}>{c.status}</td>
              <td style={{ padding: 8 }}>
                <select
                  value={selected[c._id] || ''}
                  onChange={(e)=>setSelected(prev => ({ ...prev, [c._id]: e.target.value }))}
                  style={{ padding: 6 }}
                >
                  <option value="">-- Select Labour --</option>
                  {labours.map(l => (
                    <option key={l._id || l.id} value={l._id || l.id}>
                      {l.name} ({l.email})
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: 8 }}>
                <button
                  onClick={() => assign(c._id)}
                  disabled={assigningId === c._id}
                  style={{ padding: '6px 12px' }}
                >
                  {assigningId === c._id ? 'Assigning...' : 'Assign'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignComplaint;