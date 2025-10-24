import React, { useEffect, useState } from 'react';
import { adminAPI, apiHelpers } from '../../../services/api';

const containerCard = {
  background: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.06) ',
  padding: 16
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 10
};

const actionsWrap = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end'
};

const inputStyle = {
  padding: '10px 12px',
  minWidth: 260,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none'
};

const buttonStyle = {
  padding: '10px 12px',
  background: '#4f46e5',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer'
};

const tableWrap = {
  overflowX: 'auto',
  width: '100%'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  tableLayout: 'fixed'
};

const thStyle = {
  textAlign: 'left',
  padding: '12px 12px',
  fontWeight: 600,
  background: '#f9fafb',
  borderBottom: '1px solid #e5e7eb'
};

const tdStyle = {
  padding: '12px 12px',
  borderBottom: '1px solid #e5e7eb',
  verticalAlign: 'middle',
  color: '#111827'
};

const badge = (status) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: status === 'active' ? '#dcfce7' : '#fee2e2',
  color: status === 'active' ? '#065f46' : '#991b1b'
});

const noteStyle = {
  marginTop: 14,
  paddingTop: 6,
  color: '#6b7280',
  fontSize: 12
};

const ManageLabours = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [labours, setLabours] = useState([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Try admin endpoint first
      let res = await adminAPI.listLabours();
      let list = res.data?.labours || res.data || [];
      // If admin endpoint returns empty or access-limited, fall back to superadmin listing (read-only)
      if (!Array.isArray(list) || list.length === 0) {
        try {
          const alt = await (await import('../../../services/api')).superadminAPI.listLabours();
          list = alt.data?.labours || alt.data || [];
        } catch (_) {
          // ignore fallback errors; keep original list
        }
      }
      setLabours(Array.isArray(list) ? list : []);
    } catch (err) {
      const info = apiHelpers.handleError(err);
      setError(info.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = labours.filter(l => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (l.name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={containerCard}>
        <div style={headerRow}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Manage Labours</h2>
          <div style={{ ...actionsWrap, minWidth: 260 }}>
            <input
              placeholder="Search (name, email, phone, status)"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              style={inputStyle}
            />
            <button onClick={load} style={buttonStyle}>Refresh</button>
          </div>
        </div>

        {loading && <div>Loading labours...</div>}
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>Error: {error}</div>}

        {!loading && !error && (
          <div style={tableWrap}>
            <table style={tableStyle}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '22%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, whiteSpace: 'nowrap' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>No labours found</td>
                  </tr>
                )}
                {filtered.map(l => (
                  <tr key={l._id || l.id}>
                    <td style={tdStyle}>{l.name}</td>
                    <td style={tdStyle}>{l.email}</td>
                    <td style={tdStyle}>{l.phone || '-'}</td>
                    <td style={tdStyle}>
                      <span style={badge(l.status || 'active')}>{l.status || 'active'}</span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{l.createdAt ? new Date(l.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={noteStyle}>
          Note: This view is read-only for Admins. SuperAdmins can create/update/delete labour accounts from the Super Admin pages.
        </div>
      </div>
    </div>
  );
};

export default ManageLabours;
