import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { labourAPI, apiHelpers } from '../../../services/api';
import UserInfoCard from '../../../components/UserInfoCard/UserInfoCard';
import AttachmentViewer from '../../../components/AttachmentViewer/AttachmentViewer';
// import QuickAttendanceWidget from '../../../components/attendance/QuickAttendanceWidget';
import './AssignedComplaints.css';

const AssignedComplaints = () => {
  const [list, setList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [complaintId, setComplaintId] = useState('');
  const [status, setStatus] = useState(''); // '', 'Assigned', 'In Progress', 'Completed'
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  const [detail, setDetail] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const statuses = ['Assigned', 'In Progress', 'Completed'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const categories = ['Roads & Infrastructure', 'Water Supply', 'Electricity', 'Sanitation', 'Public Transport', 'Healthcare', 'Education', 'Environment', 'Safety & Security', 'Other'];

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await labourAPI.getAssignedComplaints();
      const items = res.data?.complaints || [];
      setList(items);
      setFiltered(items);
    } catch (err) {
      setError(apiHelpers.handleError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Client-side filter for now
  useEffect(() => {
    let data = [...list];
    if (complaintId) data = data.filter(c => String(c._id).toLowerCase().includes(complaintId.trim().toLowerCase()));
    if (status) data = data.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    if (priority) data = data.filter(c => (c.priority || '').toLowerCase() === priority.toLowerCase());
    if (category) data = data.filter(c => (c.category || '').toLowerCase() === category.toLowerCase());
    if (location) data = data.filter(c => (c.location || '').toLowerCase().includes(location.trim().toLowerCase()));
    setFiltered(data);
  }, [complaintId, status, priority, category, location, list]);

  const openDetail = async (id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/labour/complaints/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setDetail(data?.complaint || null);
      setRemarks('');
    } catch (e) {
      alert(e.message);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      setUpdating(true);
      await labourAPI.updateComplaintStatus(id, newStatus, remarks || '');
      setDetail(null);
      await load();
    } catch (e) {
      alert(apiHelpers.handleError(e).message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="ac-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '20px' }}>
        <h1 style={{ margin: 0 }}>Assigned Complaints</h1>
        <div style={{ minWidth: '300px' }}>
          {/* <QuickAttendanceWidget compact={true} showFullHistory={true} /> */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 12,
            background: 'white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Attendance</h4>
            <Link
              to="/labour/attendance" 
              style={{
                display: 'inline-block',
                background: '#6366f1',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '12px'
              }}
            >
              Mark Attendance
            </Link>
          </div>
        </div>
      </div>

      <div className="ac-filters">
        <input placeholder="Complaint ID" value={complaintId} onChange={(e)=>setComplaintId(e.target.value)} />
        <select value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={(e)=>setPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={category} onChange={(e)=>setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Location" value={location} onChange={(e)=>setLocation(e.target.value)} />
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="ac-error">❌ {error}</div>}

      {!loading && filtered.length === 0 && !error && (
        <div className="ac-empty">
          <div className="empty-state">
            <span className="empty-icon">📄</span>
            <h3>No Assigned Complaints</h3>
            <p>You don't have any complaints assigned at the moment.</p>
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Title</th>
                <th>User Information</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Detailed Location</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id}>
                  <td className="complaint-id-cell">
                    <div className="id-display">
                      <span className="id-short">CPL-{c._id.slice(-8)}</span>
                      <button 
                        className="copy-btn-small"
                        onClick={() => navigator.clipboard.writeText(c._id)}
                        title="Copy full ID"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="title-cell">
                    <div className="complaint-title-info">
                      <div className="title-text">{c.title}</div>
                      {c.description && (
                        <div className="description-preview">
                          {c.description.length > 80 ? c.description.substring(0, 80) + '...' : c.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="user-info-table-cell">
                    <UserInfoCard 
                      complaint={c}
                      compact={true}
                      showContactInfo={true}
                    />
                  </td>
                  <td>{c.category}</td>
                  <td>
                    <span className={`priority-badge priority-${(c.priority || 'medium').toLowerCase()}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="location-detail-cell">
                    <div className="location-info">
                      <div className="location-text">{c.location}</div>
                      {c.location && (
                        <div className="location-actions">
                          <button 
                            className="location-btn"
                            onClick={() => {
                              const query = encodeURIComponent(c.location);
                              window.open(`https://www.google.com/maps/search/${query}`, '_blank');
                            }}
                            title="Open in Google Maps"
                          >
                            🗺️
                          </button>
                          <button 
                            className="location-btn"
                            onClick={() => navigator.clipboard.writeText(c.location)}
                            title="Copy location"
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${(c.status || 'pending').toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.assignedAt ? new Date(c.assignedAt).toLocaleDateString() : '-'}</td>
                  <td className="ac-actions">
                    <button onClick={()=>openDetail(c._id)}>View Details</button>
                    <button onClick={()=>{ setDetail(c); setRemarks(''); }}>Add Remarks</button>
                    <div className="ac-menu">
                      {c.pendingStatusUpdate && c.pendingStatusUpdate.newStatus && !c.pendingStatusUpdate.isApproved ? (
                        <div className="pending-status-info">
                          <span className="pending-badge">⏳ Pending Admin Approval</span>
                          <small>Requested: {c.pendingStatusUpdate.newStatus}</small>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={()=>updateStatus(c._id, 'In Progress')}
                            disabled={c.status === 'In Progress' || (c.pendingStatusUpdate && c.pendingStatusUpdate.newStatus && !c.pendingStatusUpdate.isApproved)}
                          >
                            Mark In Progress
                          </button>
                          <button 
                            onClick={()=>updateStatus(c._id, 'Resolved')}
                            disabled={c.status === 'Resolved' || (c.pendingStatusUpdate && c.pendingStatusUpdate.newStatus && !c.pendingStatusUpdate.isApproved)}
                          >
                            Mark Resolved
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="ac-modal" onClick={()=>setDetail(null)}>
          <div className="ac-modal-card" onClick={(e)=>e.stopPropagation()}>
            <div className="ac-modal-header">
              <h3>Complaint Details</h3>
              <button onClick={()=>setDetail(null)}>Close</button>
            </div>
            <div className="ac-modal-body">
              {/* User Information Section */}
              <div className="ac-section user-info-section">
                <div className="section-header">
                  <h4>👤 User Information</h4>
                  <p className="section-subtitle">Contact details to help resolve the complaint</p>
                </div>
                <UserInfoCard 
                  complaint={detail}
                  compact={false}
                  showContactInfo={true}
                />
              </div>
              
              {/* Complaint Basic Info */}
              <div className="ac-section complaint-basic-info">
                <div className="section-header">
                  <h4>📋 Complaint Details</h4>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">📋 Complaint ID:</span>
                    <div className="id-display-container">
                      <span className="info-value complaint-id" title={detail._id}>
                        CPL-{detail._id.slice(-8)}
                      </span>
                      <button 
                        className="copy-id-btn"
                        onClick={() => navigator.clipboard.writeText(detail._id)}
                        title="Copy full complaint ID"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">👤 User ID:</span>
                    <div className="id-display-container">
                      <span className="info-value user-id" title={detail.user?._id}>
                        USR-{detail.user?._id?.slice(-8) || 'Unknown'}
                      </span>
                      {detail.user?._id && (
                        <button 
                          className="copy-id-btn"
                          onClick={() => navigator.clipboard.writeText(detail.user._id)}
                          title="Copy full user ID"
                        >
                          📋
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📝 Title:</span>
                    <span className="info-value">{detail.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🏷️ Category:</span>
                    <span className="info-value">{detail.category}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">⚡ Priority:</span>
                    <span className={`priority-badge priority-${(detail.priority || 'medium').toLowerCase()}`}>
                      {detail.priority}
                    </span>
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">📍 Detailed Location:</span>
                    <div className="location-detailed-info">
                      <div className="location-address">{detail.location || 'No location provided'}</div>
                      {detail.location && (
                        <div className="location-action-buttons">
                          <button 
                            className="location-action-btn maps-btn"
                            onClick={() => {
                              const query = encodeURIComponent(detail.location);
                              window.open(`https://www.google.com/maps/search/${query}`, '_blank');
                            }}
                            title="Open in Google Maps"
                          >
                            🗺️ Open in Maps
                          </button>
                          <button 
                            className="location-action-btn directions-btn"
                            onClick={() => {
                              const query = encodeURIComponent(detail.location);
                              window.open(`https://www.google.com/maps/dir//${query}`, '_blank');
                            }}
                            title="Get Directions"
                          >
                            🧭 Get Directions
                          </button>
                          <button 
                            className="location-action-btn copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(detail.location);
                              // You could add a toast notification here
                            }}
                            title="Copy Address"
                          >
                            📋 Copy Address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">🎯 Status:</span>
                    <span className={`status-badge status-${(detail.status || 'pending').toLowerCase()}`}>
                      {detail.status}
                    </span>
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">📅 Created:</span>
                    <span className="info-value">
                      {new Date(detail.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="ac-section">
                <div className="section-header">
                  <h4>📄 Description</h4>
                </div>
                <div className="ac-box description-box">
                  {detail.description || 'No description provided'}
                </div>
              </div>

              {/* Supporting Files Section */}
              {detail.attachments && detail.attachments.length > 0 && (
                <div className="ac-section">
                  <div className="section-header">
                    <h4>📎 Supporting Files</h4>
                    <p className="section-subtitle">Files uploaded by the user to support their complaint</p>
                  </div>
                  <AttachmentViewer attachments={detail.attachments} compact={false} />
                </div>
              )}

              <div className="ac-section">
                <div><b>Status History</b></div>
                <div className="ac-box">
                  {Array.isArray(detail.statusHistory) && detail.statusHistory.length > 0 ? (
                    detail.statusHistory.map((h, idx) => (
                      <div key={idx} className="ac-hist">
                        <span>{new Date(h.updatedAt || h.createdAt || Date.now()).toLocaleString()}</span>
                        <span>— {h.status}</span>
                        {h.note ? <span> • {h.note}</span> : null}
                      </div>
                    ))
                  ) : 'No history available.'}
                </div>
              </div>

              <div className="ac-section">
                <div><b>Update Status</b></div>
                {detail.pendingStatusUpdate && detail.pendingStatusUpdate.newStatus && !detail.pendingStatusUpdate.isApproved ? (
                  <div className="pending-status-modal">
                    <div className="pending-badge-large">⏳ Status Update Pending Admin Approval</div>
                    <div className="pending-details">
                      <p><strong>Requested Status:</strong> {detail.pendingStatusUpdate.newStatus}</p>
                      <p><strong>Requested At:</strong> {new Date(detail.pendingStatusUpdate.requestedAt).toLocaleString()}</p>
                      {detail.pendingStatusUpdate.remarks && (
                        <p><strong>Your Remarks:</strong> {detail.pendingStatusUpdate.remarks}</p>
                      )}
                    </div>
                    <p className="pending-note">Please wait for admin approval before requesting another status change.</p>
                  </div>
                ) : (
                  <>
                    <div><b>Add Remarks</b></div>
                    <textarea 
                      value={remarks} 
                      onChange={(e)=>setRemarks(e.target.value)} 
                      rows={3} 
                      placeholder="Remarks (optional)" 
                    />
                    <div className="ac-actions-inline">
                      <button 
                        disabled={updating || detail.status === 'In Progress'} 
                        onClick={()=>updateStatus(detail._id, 'In Progress')}
                      >
                        {updating ? '...' : 'Request: In Progress'}
                      </button>
                      <button 
                        disabled={updating || detail.status === 'Resolved'} 
                        onClick={()=>updateStatus(detail._id, 'Resolved')}
                      >
                        {updating ? '...' : 'Request: Resolved'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedComplaints;
