import React, { useEffect, useMemo, useState } from 'react';
import { complaintsAPI, apiHelpers } from '../../../services/api';
import './AssignedStatus.css';

// Admin page: Assigned Complaint Status (short: Assigned Status)
const AssignedStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); // '', 'Assigned', 'In Progress', 'Completed'
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch complaints (limit applied to reduce payload; backend supports params.limit)
      const { data } = await complaintsAPI.getAll({ limit: 200 });
      const list = data?.complaints || [];
      // We show only items that have been assigned (assumption: status transitions after assignment)
      const assignedLikeStatuses = ['Assigned', 'In Progress', 'Completed'];
      const filtered = list.filter(c => assignedLikeStatuses.includes(c.status));
      setItems(filtered);
    } catch (e) {
      setError(apiHelpers.handleError(e).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 10000); // poll every 10s to reflect labour updates
    return () => clearInterval(id);
  }, [autoRefresh]);

  const view = useMemo(() => {
    let data = [...items];
    if (status) data = data.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        String(c._id || '').toLowerCase().includes(q) ||
        String(c.title || '').toLowerCase().includes(q) ||
        String(c.category || '').toLowerCase().includes(q) ||
        String(c.location || '').toLowerCase().includes(q) ||
        String(c.assignedTo?.name || c.labour?.name || '').toLowerCase().includes(q)
      );
    }
    return data;
  }, [items, search, status]);

  return (
    <div className="as-container">
      <div className="as-header">
        <div>
          <h1>Assigned Status</h1>
          <p>Live view of complaints after assignment. Changes made by labour (In Progress ➜ Completed) are reflected here.</p>
        </div>
        <div className="as-actions">
          <input className="as-input" placeholder="Search (id, title, category, location, labour)" value={search} onChange={(e)=>setSearch(e.target.value)} />
          <select className="as-input" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <button className="as-btn" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
          <label className="as-toggle">
            <input type="checkbox" checked={autoRefresh} onChange={(e)=>setAutoRefresh(e.target.checked)} /> Auto refresh
          </label>
        </div>
      </div>

      {error && <div className="as-alert as-error">❌ {error}</div>}

      <div className="as-table-wrap">
        <table className="as-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="as-cell-center">Loading...</td></tr>
            )}
            {!loading && view.length === 0 && !error && (
              <tr><td colSpan="7" className="as-cell-center">No assigned complaints found.</td></tr>
            )}
            {!loading && view.map((c) => (
              <tr key={c._id}>
                <td>{c._id}</td>
                <td>{c.title}</td>
                <td>{c.category || '-'}</td>
                <td>{c.location || '-'}</td>
                <td>{c.assignedTo?.name || c.labour?.name || c.assignedTo?.email || '-'}</td>
                <td>
                  <span className={`as-badge as-${String(c.status || '').toLowerCase().replace(/\s+/g,'-')}`}>{c.status}</span>
                </td>
                <td>{new Date(c.updatedAt || c.assignedAt || c.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedStatus;
