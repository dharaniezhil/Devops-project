import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { complaintsAPI, adminAPI } from '../../../services/api';
import { COMPLAINT_STATUSES, STATUS_ORDER, STATUS_COLORS } from '../../../utils/constants';
import AttachmentViewer from '../../../components/AttachmentViewer/AttachmentViewer';
import axios from 'axios';
import './ManageComplaints.css';

const ManageComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const statusOptions = STATUS_ORDER; // ['Pending', 'Inprogress', 'Resolved']

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Fetching complaints for admin...');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      params.limit = 1000; // Get more complaints for admin view
      
      // Try admin API first, then fallback to regular API
      let data;
      try {
        const response = await adminAPI.getAllComplaints(params);
        data = response.data;
        console.log('✅ Fetched via admin API:', data?.complaints?.length);
      } catch (adminError) {
        console.log('❌ Admin API failed, trying regular API...');
        const response = await complaintsAPI.getAll(params);
        data = response.data;
        console.log('✅ Fetched via regular API:', data?.complaints?.length);
      }
      
      const list = data?.complaints || [];
      const filtered = search
        ? list.filter((c) => c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                              c.title?.toLowerCase().includes(search.toLowerCase()) ||
                              c.description?.toLowerCase().includes(search.toLowerCase()))
        : list;
      setComplaints(filtered);
      console.log('✅ Total complaints loaded:', filtered.length);
    } catch (e) {
      console.error('❌ Failed to fetch complaints:', e);
      setError(e?.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    const id = setTimeout(fetchComplaints, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleStatusChange = async (id, newStatus, adminNote = '') => {
    if (!statusOptions.includes(newStatus)) {
      alert('Invalid status. Only Pending, Inprogress, and Resolved are allowed.');
      return;
    }
    
    setUpdatingId(id);
    try {
      console.log(`🔄 Updating complaint ${id} status to ${newStatus}`);
      
      // Use direct API call to ensure proper headers and format
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:5000/api/complaints/${id}/status`, 
        { 
          status: newStatus, 
          adminNote: adminNote || `Status changed to ${newStatus} by admin` 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Status updated successfully');
      await fetchComplaints();
      
      // Show success message
      alert(`Complaint status updated to ${newStatus} successfully!`);
    } catch (e) {
      console.error('❌ Failed to update status:', e);
      const errorMsg = e?.response?.data?.message || 'Failed to update status';
      alert(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await complaintsAPI.delete(id);
      await fetchComplaints();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete complaint');
    }
  };

  return (
    <div className="manage-complaints-container">
      <div className="page-header">
        <h1>📄 Manage Complaints</h1>
        <p>Admin panel to review, update status, and manage all user complaints</p>
        <div className="complaint-stats">
          <span className="stat-badge">📈 Total: {complaints.length}</span>
          <span className="stat-badge pending">⏳ Pending: {complaints.filter(c => c.status === COMPLAINT_STATUSES.PENDING).length}</span>
          <span className="stat-badge progress">🔄 Inprogress: {complaints.filter(c => c.status === COMPLAINT_STATUSES.IN_PROGRESS).length}</span>
          <span className="stat-badge resolved">✅ Resolved: {complaints.filter(c => c.status === COMPLAINT_STATUSES.RESOLVED).length}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by user name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <option value="">All Categories</option>
          <option value="Roads">Roads</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Water">Water</option>
          <option value="Electricity">Electricity</option>
          <option value="Other">Other</option>
        </select>
        <button onClick={fetchComplaints} style={{ padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f7fafc' }}>Refresh</button>
      </div>

      {error && <div style={{ color: '#c53030', marginBottom: '0.5rem' }}>{error}</div>}

      <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f7fafc' }}>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>User</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Category</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Priority</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Description</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: '12px' }}>🔄 Loading complaints...</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: '12px' }}>📝 No complaints found</td></tr>
            ) : (
              complaints.map((c) => {
                const statusColors = STATUS_COLORS;
                const priorityColors = {
                  'Low': '#10b981',
                  'Medium': '#f59e0b',
                  'High': '#ef4444',
                  'Critical': '#dc2626'
                };
                return (
                  <tr key={c._id} style={{ backgroundColor: updatingId === c._id ? '#fef3c7' : 'transparent' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7', fontSize: '12px', color: '#6b7280' }}>
                      {c._id.substring(c._id.length - 6)}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7', fontWeight: 'bold' }}>
                      {c.title || 'Untitled'}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7' }}>
                      {c.user?.name || 'Unknown'}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7' }}>
                      <span style={{ 
                        background: '#f3f4f6', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px' 
                      }}>
                        {c.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7' }}>
                      <span style={{ 
                        background: priorityColors[c.priority] || '#6b7280',
                        color: 'white',
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {c.priority || 'Medium'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid #edf2f7', 
                      maxWidth: '200px', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {c.description}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7', fontSize: '12px' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7' }}>
                      <select 
                        value={c.status} 
                        disabled={updatingId === c._id} 
                        onChange={(e) => handleStatusChange(c._id, e.target.value)} 
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: statusColors[c.status],
                          color: 'white',
                          border: 'none',
                          cursor: updatingId === c._id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {updatingId === c._id && <span style={{ marginLeft: '8px' }}>🔄</span>}
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => setSelectedComplaint(c)}
                          style={{ 
                            background: '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                          title="View details"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => {
                            const note = prompt('Add admin note (optional):');
                            if (note !== null) handleStatusChange(c._id, c.status, note);
                          }}
                          style={{ 
                            background: '#3b82f6', 
                            color: 'white', 
                            border: 'none', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                          title="Add note"
                        >
                          📝
                        </button>
                        <button 
                          onClick={() => handleDelete(c._id)} 
                          style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            border: 'none', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                          title="Delete complaint"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={() => setSelectedComplaint(null)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '900px',
              maxHeight: '90vh',
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Complaint Details</h3>
              <button 
                onClick={() => setSelectedComplaint(null)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              {/* Basic Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <strong>📋 Complaint ID:</strong>
                  <p style={{ margin: '0.25rem 0', fontFamily: 'monospace' }}>
                    {selectedComplaint._id}
                  </p>
                </div>
                <div>
                  <strong>👤 User:</strong>
                  <p style={{ margin: '0.25rem 0' }}>
                    {selectedComplaint.user?.name || 'Unknown'} ({selectedComplaint.user?.email || 'No email'})
                  </p>
                </div>
                <div>
                  <strong>🏷️ Category:</strong>
                  <p style={{ margin: '0.25rem 0' }}>{selectedComplaint.category}</p>
                </div>
                <div>
                  <strong>⚡ Priority:</strong>
                  <span style={{
                    background: {
                      'Low': '#10b981',
                      'Medium': '#f59e0b',
                      'High': '#ef4444',
                      'Critical': '#dc2626'
                    }[selectedComplaint.priority] || '#6b7280',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginLeft: '0.5rem'
                  }}>
                    {selectedComplaint.priority}
                  </span>
                </div>
                <div>
                  <strong>📍 Location:</strong>
                  <p style={{ margin: '0.25rem 0' }}>{selectedComplaint.location}</p>
                </div>
                <div>
                  <strong>📅 Created:</strong>
                  <p style={{ margin: '0.25rem 0' }}>
                    {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <strong>📄 Description:</strong>
                <div style={{
                  background: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedComplaint.description || 'No description provided'}
                </div>
              </div>

              {/* Supporting Files */}
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <AttachmentViewer attachments={selectedComplaint.attachments} compact={false} />
                </div>
              )}

              {/* Admin Notes */}
              {selectedComplaint.adminNote && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <strong>📝 Admin Notes:</strong>
                  <div style={{
                    background: '#fef3c7',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #f59e0b',
                    marginTop: '0.5rem'
                  }}>
                    {selectedComplaint.adminNote}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedComplaint.statusHistory && selectedComplaint.statusHistory.length > 0 && (
                <div>
                  <strong>📈 Status History:</strong>
                  <div style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginTop: '0.5rem'
                  }}>
                    {selectedComplaint.statusHistory.map((history, index) => (
                      <div key={index} style={{
                        padding: '0.5rem 0',
                        borderBottom: index < selectedComplaint.statusHistory.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {new Date(history.updatedAt || history.createdAt).toLocaleString()}
                        </div>
                        <div style={{ fontWeight: 600 }}>Status: {history.status}</div>
                        {history.note && (
                          <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                            Note: {history.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              background: '#f9fafb',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageComplaints;
