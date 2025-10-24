import React, { useEffect, useMemo, useState } from 'react';
import API, { complaintsAPI } from '../../../services/api';
import { STATUS_ORDER, COMPLAINT_STATUSES } from '../../../utils/constants';
import { normalizeComplaintStatuses } from '../../../utils/statusVerification';
import AttachmentViewer from '../../../components/AttachmentViewer/AttachmentViewer';
import './MyComplaints.css';

const STATUSES = STATUS_ORDER; // ['Pending', 'Inprogress', 'Resolved']
const CATEGORIES = ['Roads & Infrastructure', 'Water Supply', 'Electricity', 'Sanitation', 'Public Transport', 'Healthcare', 'Education', 'Environment', 'Safety & Security', 'Other'];

function formatDate(d) {
  try { return new Date(d).toLocaleString(); } catch { return 'N/A'; }
}

export default function MyComplaints() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [complaintId, setComplaintId] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', category: '', photoFile: null, photoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const axiosHeaders = useMemo(() => ({}), []);

  const validObjectId = (v) => /^[a-fA-F0-9]{24}$/.test(String(v||''));

  async function loadList(nextPage = page) {
    setLoading(true);
    try {
      const params = { page: nextPage, limit };
      if (status) params.status = status;
      if (category) params.category = category;
      if (complaintId && validObjectId(complaintId)) params.complaintId = complaintId.trim();

      const { data } = await complaintsAPI.getUserComplaints(params);
      const rawComplaints = data.complaints || [];
      const normalizedComplaints = normalizeComplaintStatuses(rawComplaints);
      setItems(normalizedComplaints);
      setTotal(data.pagination?.totalComplaints || 0);
      setPage(data.pagination?.current || nextPage);
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    try {
      const { data } = await API.get(`/complaints/${id}`, { headers: axiosHeaders });
      setSelected(data?.complaint || data);
      setDetailOpen(true);
      setEditMode(false);
      setEditData({
        title: data.title || data.shortDescription || '',
        description: data.description || '',
        category: data.category || '',
        photoFile: null,
        photoUrl: data.photoUrl || '',
      });
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || e.message });
    }
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    try {
      let body;
      if (editData.photoFile) {
        const form = new FormData();
        form.set('title', editData.title || '');
        form.set('description', editData.description || '');
        form.set('category', editData.category || '');
        if (editData.photoUrl) form.set('photoUrl', editData.photoUrl);
        form.set('photo', editData.photoFile);
        body = form;
      } else {
        body = {
          title: editData.title || '',
          description: editData.description || '',
          category: editData.category || '',
          photoUrl: editData.photoUrl || '',
        };
      }

      const config = editData.photoFile ? { headers: { } } : undefined;
      const { data } = await API.put(`/complaints/${selected._id}`, body, config);
      if (!data?.success) throw new Error(data?.message || 'Update failed');
      setToast({ type: 'success', message: 'Complaint updated successfully' });
      setEditMode(false);
      await openDetail(selected._id);
      await loadList(page);
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || e.message });
    } finally {
      setSaving(false);
    }
  }


  async function downloadAck() {
    if (!selected) return;
    try {
      const res = await API.get(`/complaints/${selected._id}/ack.pdf`, { responseType: 'blob' });
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaint-${selected._id}-ack.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || e.message });
    }
  }

  useEffect(() => {
    loadList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category, limit]);
  
  // Listen for admin status updates
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      console.log('🔄 MyComplaints: Status updated, refreshing...', event.detail);
      loadList(page); // Refresh current page
    };
    
    window.addEventListener('complaintStatusUpdated', handleStatusUpdate);
    
    return () => {
      window.removeEventListener('complaintStatusUpdated', handleStatusUpdate);
    };
  }, [page]);

  function clearFilters() {
    setComplaintId('');
    setStatus('');
    setCategory('');
    setPage(1);
    loadList(1);
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="my-complaints-container theme-page-bg">
      <div className="complaints-wrapper">
        <div className="complaints-header theme-card">
          <h2 className="theme-text-primary">My Complaints</h2>
          <p className="theme-text-secondary">Track and manage all your submitted complaints</p>
        </div>

        {/* Filters Section */}
        <div className="filters-card theme-card">
          <div className="filters-grid">
            <div className="filter-input-wrapper">
              <input
                className="filter-input theme-input"
                type="text"
                placeholder="Filter by Complaint ID (24-char)"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadList(1)}
              />
            </div>
            <select className="filter-select theme-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select theme-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-buttons">
            <button className="btn-search theme-btn-primary" onClick={() => loadList(1)} disabled={loading}>
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
            <button className="btn-clear theme-btn-secondary" onClick={clearFilters}>✨ Clear Filters</button>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-card theme-card">
          <div className="complaints-table-wrapper">
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <tr key={row._id} onClick={() => openDetail(row._id)}>
                    <td>{row._id}</td>
                    <td>{row.title || row.shortDescription || '—'}</td>
                    <td>{row.category || '—'}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${String(row.status||'').toLowerCase()==='resolved'?'status-resolved':String(row.status||'').toLowerCase()==='inprogress'?'status-in-progress':'status-pending'}`}>
                        {row.status || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-view" onClick={() => openDetail(row._id)}>👁️ View</button>
                        {/* Users can only delete complaints that are in Pending status */}
                        {String(row.status || '').toLowerCase() === 'pending' && (
                          <button className="btn-delete" onClick={async () => { 
                            if (confirm('Delete this complaint? This action cannot be undone.')) { 
                              try { 
                                await complaintsAPI.delete(row._id); 
                                await loadList(page); 
                              } catch (err) { 
                                alert(err?.response?.data?.message || 'Delete failed'); 
                              } 
                            } 
                          }}>🗑️ Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <p>No complaints found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="pagination-wrapper">
          <div className="pagination-controls">
            <button className="btn-pagination" onClick={() => { const p = Math.max(1, page - 1); setPage(p); loadList(p); }} disabled={page <= 1}>
              ← Prev
            </button>
            <span className="page-info">Page {page} of {pages}</span>
            <button className="btn-pagination" onClick={() => { const p = Math.min(pages, page + 1); setPage(p); loadList(p); }} disabled={page >= pages}>
              Next →
            </button>
          </div>
          <div className="limit-selector">
            <span>Show:</span>
            <select className="limit-select" value={limit} onChange={(e) => setLimit(parseInt(e.target.value, 10))}>
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Detail Modal/Sidebar */}
        {detailOpen && selected && (
          <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
            <div className="detail-sidebar" onClick={(e) => e.stopPropagation()}>
              <div className="detail-header">
                <h3>Complaint Details</h3>
                <button className="btn-close" onClick={() => setDetailOpen(false)}>✕ Close</button>
              </div>

              {!editMode ? (
                <>
                  <div className="detail-section">
                    <div className="detail-label">Complaint ID</div>
                    <div className="detail-value">{selected._id}</div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Title</div>
                    <div className="detail-value">{selected.title || selected.shortDescription || '—'}</div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Category</div>
                    <div className="detail-value">{selected.category || '—'}</div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Date Submitted</div>
                    <div className="detail-value">{formatDate(selected.createdAt)}</div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Status</div>
                    <div className="detail-value">
                      <span className={`status-badge ${String(selected.status||'').toLowerCase()==='resolved'?'status-resolved':String(selected.status||'').toLowerCase()==='inprogress'?'status-in-progress':'status-pending'}`}>
                        {selected.status || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Description</div>
                    <div className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selected.description || '—'}</div>
                  </div>

                  {/* Supporting Files Section */}
                  {selected.attachments && selected.attachments.length > 0 && (
                    <div className="detail-section">
                      <div className="detail-label">📎 Supporting Files</div>
                      <AttachmentViewer attachments={selected.attachments} compact={false} />
                    </div>
                  )}
                  
                  {/* Legacy Photos Section (for backward compatibility) */}
                  {(selected.photos?.length > 0 || selected.photoUrl || selected.photoDataUrl) && (
                    <div className="detail-section">
                      <div className="detail-label">📸 Photos</div>
                      <div className="photo-grid">
                        {Array.isArray(selected.photos) && selected.photos.length > 0 && selected.photos.map((p, idx) => (
                          <img key={idx} src={p.url || p} alt={`photo-${idx}`} className="photo-item" />
                        ))}
                        {selected.photoUrl && (
                          <img src={selected.photoUrl} alt="photo-url" className="photo-item" />
                        )}
                        {selected.photoDataUrl && (
                          <img src={selected.photoDataUrl} alt="photo-data" className="photo-item" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <div className="detail-label">💬 Authority Responses</div>
                    {Array.isArray(selected.responses) && selected.responses.length > 0 ? (
                      selected.responses.map((r, idx) => (
                        <div key={idx} className="response-item">
                          <div className="response-meta">{formatDate(r.at)} • {r.by || 'Authority'}</div>
                          <div className="response-message">{r.message || JSON.stringify(r)}</div>
                        </div>
                      ))
                    ) : <div className="detail-value">—</div>}
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">📅 Timeline</div>
                    {Array.isArray(selected.updates) && selected.updates.length > 0 ? (
                      selected.updates.slice().reverse().map((u, idx) => (
                        <div key={idx} className="timeline-item">
                          {formatDate(u.at || u.date || u.timestamp)} — {u.type || u.status || 'update'} {u.from ? `(${u.from} → ${u.to})` : ''}
                        </div>
                      ))
                    ) : <div className="detail-value">—</div>}
                  </div>

                  <div className="detail-actions">
                    {/* Users can only edit complaints that are in Pending status */}
                    {String(selected.status || '').toLowerCase() === 'pending' && (
                      <button className="btn-edit" onClick={() => setEditMode(true)}>✏️ Edit</button>
                    )}
                    {/* Show status info for non-editable complaints */}
                    {String(selected.status || '').toLowerCase() !== 'pending' && (
                      <div className="status-info">
                        <p style={{color: '#666', fontSize: '14px', margin: '10px 0'}}>
                          📝 <strong>Note:</strong> Complaints can only be edited when status is "Pending". 
                          Status updates are managed by administrators.
                        </p>
                      </div>
                    )}
                    <button className="btn-download" onClick={downloadAck}>📊 Download</button>
                  </div>
                </>
              ) : (
                <div className="edit-form">
                  <h4 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>Edit Complaint</h4>
                  <div className="form-group">
                    <label>Title</label>
                    <input className="filter-input" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="filter-select" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                      <option value="">Select...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="filter-input" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={6} />
                  </div>
                  <div className="form-group">
                    <label>Photo URL (optional)</label>
                    <input className="filter-input" value={editData.photoUrl} onChange={(e) => setEditData({ ...editData, photoUrl: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>Or Upload Photo (optional)</label>
                    <input className="filter-input" type="file" accept="image/*" onChange={(e) => setEditData({ ...editData, photoFile: e.target.files?.[0] || null })} />
                  </div>
                  <div className="detail-actions">
                    <button className="btn-edit" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button>
                    <button className="btn-close" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`toast ${toast.type==='error'?'toast-error':'toast-success'}`}>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close" onClick={() => setToast(null)}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}