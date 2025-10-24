import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useComplaint } from '../../../context/ComplaintContext';
import { complaintsAPI, adminAPI } from '../../../services/api';
import { COMPLAINT_STATUSES, STATUS_ORDER, STATUS_COLORS, STATUS_ICONS } from '../../../utils/constants';
import { logStatusVerification, normalizeComplaintStatuses } from '../../../utils/statusVerification';
import UserInfoCard from '../../../components/UserInfoCard/UserInfoCard';
import './ManageComplaintsNew.css';

const ManageComplaintsNew = () => {
  const { user } = useAuth();
  const { refreshComplaints } = useComplaint();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Fetching complaints for status management...');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      params.limit = 1000;
      
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
      
      let list = data?.complaints || [];
      
      // Filter by search term
      if (search.trim()) {
        list = list.filter((c) => 
          c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()) ||
          c.location?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Use comprehensive status normalization
      const normalizedList = normalizeComplaintStatuses(list);
      
      // Verify status consistency
      const verification = logStatusVerification(normalizedList, 'ManageComplaintsNew');
      
      setComplaints(normalizedList);
      console.log('✅ Total complaints loaded:', normalizedList.length);
      console.log('📊 Status verification:', verification.summary);
    } catch (e) {
      console.error('❌ Failed to fetch complaints:', e);
      setError(e?.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => {
    const id = setTimeout(fetchComplaints, 300);
    return () => clearTimeout(id);
  }, [search]);

  const handleStatusChange = async (complaint, newStatus) => {
    if (!STATUS_ORDER.includes(newStatus)) {
      alert('Invalid status. Only Pending, In Progress, and Resolved are allowed.');
      return;
    }
    
    setSelectedComplaint(complaint);
    setShowModal(true);
    setAdminNote(`Status changed from ${complaint.status} to ${newStatus} by admin`);
    
    // Store the new status for later use
    setSelectedComplaint({...complaint, newStatus});
  };

  const confirmStatusChange = async () => {
    if (!selectedComplaint || !selectedComplaint.newStatus) return;
    
    const { _id, newStatus } = selectedComplaint;
    setUpdatingId(_id);
    
    try {
      console.log(`🔄 Updating complaint ${_id} status to ${newStatus}`);
      
      const response = await complaintsAPI.updateStatus(_id, newStatus, adminNote);
      
      if (response.data.success) {
        console.log('✅ Status updated successfully');
        
        // Update local state
        setComplaints(prev => 
          prev.map(c => 
            c._id === _id 
              ? { ...c, status: newStatus, lastUpdated: new Date().toISOString() }
              : c
          )
        );
        
        // Refresh complaint context for real-time updates across app
        await refreshComplaints();
        
        // Broadcast status update event
        window.dispatchEvent(new CustomEvent('complaintStatusUpdated', {
          detail: { 
            complaintId: _id, 
            oldStatus: selectedComplaint.status,
            newStatus, 
            timestamp: new Date(),
            adminNote 
          }
        }));
        
        alert(`✅ Complaint status updated to ${newStatus} successfully!`);
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (e) {
      console.error('❌ Failed to update status:', e);
      const errorMsg = e?.response?.data?.message || 'Failed to update status';
      alert(`❌ ${errorMsg}`);
    } finally {
      setUpdatingId(null);
      setShowModal(false);
      setSelectedComplaint(null);
      setAdminNote('');
    }
  };

  const getStatusIcon = (status) => {
    return STATUS_ICONS[status] || STATUS_ICONS[COMPLAINT_STATUSES.PENDING];
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS[COMPLAINT_STATUSES.PENDING];
  };

  // Calculate stats with debugging
  const pendingComplaints = complaints.filter(c => c.status === COMPLAINT_STATUSES.PENDING);
  const inprogressComplaints = complaints.filter(c => c.status === COMPLAINT_STATUSES.IN_PROGRESS);
  const resolvedComplaints = complaints.filter(c => c.status === COMPLAINT_STATUSES.RESOLVED);
  
  const stats = {
    total: complaints.length,
    pending: pendingComplaints.length,
    inprogress: inprogressComplaints.length,
    resolved: resolvedComplaints.length,
  };
  
  // Debug logging for stats
  console.log('📊 Current stats:', stats);
  console.log('🔍 Inprogress complaints:', inprogressComplaints.map(c => ({ id: c._id.slice(-6), status: c.status, title: c.title })));

  return (
    <div className="manage-complaints-new">
      <div className="page-header">
        <h1>🎛️ Manage Complaints</h1>
        <p>Admin control panel for complaint status management</p>
        
        {/* Status Chart */}
        <div className="status-chart-section">
          <h3>📊 Complaint Status Overview</h3>
          <div className="chart-container">
            <div className="chart-wrapper">
              <div className="chart-bar">
                {stats.total > 0 ? (
                  <>
                    {/* Always show all three segments */}
                    <div 
                      className="chart-segment pending"
                      style={{ 
                        flex: `${Math.max(stats.pending, 0.1)}`, // Minimum 0.1 for visibility
                        opacity: stats.pending > 0 ? 1 : 0.3
                      }}
                      title={`Pending: ${stats.pending} (${((stats.pending / stats.total) * 100).toFixed(1)}%)`}
                    >
                      {((stats.pending / stats.total) * 100) > 5 && (
                        <span className="segment-label">
                          ⏳ {stats.pending}
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className="chart-segment inprogress"
                      style={{ 
                        flex: `${Math.max(stats.inprogress, 0.1)}`, // Minimum 0.1 for visibility
                        opacity: stats.inprogress > 0 ? 1 : 0.3
                      }}
                      title={`Inprogress: ${stats.inprogress} (${((stats.inprogress / stats.total) * 100).toFixed(1)}%)`}
                    >
                      {((stats.inprogress / stats.total) * 100) > 5 && (
                        <span className="segment-label">
                          🔄 {stats.inprogress}
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className="chart-segment resolved"
                      style={{ 
                        flex: `${Math.max(stats.resolved, 0.1)}`, // Minimum 0.1 for visibility
                        opacity: stats.resolved > 0 ? 1 : 0.3
                      }}
                      title={`Resolved: ${stats.resolved} (${((stats.resolved / stats.total) * 100).toFixed(1)}%)`}
                    >
                      {((stats.resolved / stats.total) * 100) > 5 && (
                        <span className="segment-label">
                          ✅ {stats.resolved}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="chart-segment empty" style={{ flex: '1' }}>
                    <span className="segment-label empty-label">
                      📄 No complaints found
                    </span>
                  </div>
                )}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color pending"></div>
                  <span>Pending ({stats.pending})</span>
                  <span className="percentage">{stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color inprogress"></div>
                  <span>Inprogress ({stats.inprogress})</span>
                  <span className="percentage">{stats.total > 0 ? ((stats.inprogress / stats.total) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color resolved"></div>
                  <span>Resolved ({stats.resolved})</span>
                  <span className="percentage">{stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
            <div className="total-count">
              <div className="total-number">{stats.total}</div>
              <div className="total-label">Total Complaints</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="Roads">Roads</option>
            <option value="Water Supply">Water Supply</option>
            <option value="Electricity">Electricity</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Other">Other</option>
          </select>
          
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          
          <button onClick={fetchComplaints} className="refresh-btn" disabled={loading}>
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={fetchComplaints}>Retry</button>
        </div>
      )}

      {/* Complaints Table */}
      <div className="complaints-table-container">
        <div className="table-wrapper">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>User Information</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="loading-cell">
                    🔄 Loading complaints...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-cell">
                    📝 No complaints found
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr 
                    key={complaint._id} 
                    className={updatingId === complaint._id ? 'updating' : ''}
                  >
                    <td className="id-cell">
                      <div className="complaint-id" title={complaint._id}>
                        <span className="id-prefix">CPL-</span>
                        <span className="id-number">{complaint._id.slice(-8)}</span>
                        <button 
                          className="copy-id-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(complaint._id);
                            // You could add a toast notification here
                          }}
                          title="Copy full ID"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="title-cell">
                      <div className="complaint-title">
                        {complaint.title || 'Untitled'}
                        {complaint.description && (
                          <div className="complaint-description">
                            {complaint.description.length > 100 
                              ? complaint.description.substring(0, 100) + '...'
                              : complaint.description
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="user-info-cell">
                      <UserInfoCard 
                        complaint={complaint}
                        compact={true}
                        showContactInfo={true}
                      />
                    </td>
                    <td>
                      <span className="category-badge">
                        {complaint.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${(complaint.priority || 'medium').toLowerCase()}`}>
                        {complaint.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="location-cell">{complaint.location || 'No location'}</td>
                    <td className="date-cell">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="status-cell">
                        <span 
                          className={`status-badge status-${complaint.status.toLowerCase()}`}
                          style={{ backgroundColor: getStatusColor(complaint.status) }}
                        >
                          {getStatusIcon(complaint.status)} {complaint.status}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {STATUS_ORDER.map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(complaint, status)}
                            disabled={updatingId === complaint._id || complaint.status === status}
                            className={`status-action-btn ${status.toLowerCase()}`}
                            title={`Change to ${status}`}
                          >
                            {getStatusIcon(status)}
                          </button>
                        ))}
                        {updatingId === complaint._id && (
                          <span className="updating-indicator">🔄</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Modal */}
      {showModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Status Change</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <div className="complaint-info">
                <div className="complaint-header">
                  <h4>{selectedComplaint.title}</h4>
                  <div className="id-info-section">
                    <div className="complaint-id-info">
                      <span className="id-label">📋 Complaint ID:</span>
                      <div className="id-display">
                        <span className="id-value">CPL-{selectedComplaint._id.slice(-8)}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => navigator.clipboard.writeText(selectedComplaint._id)}
                          title="Copy full complaint ID"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div className="user-id-info">
                      <span className="id-label">👤 User ID:</span>
                      <div className="id-display">
                        <span className="id-value">USR-{selectedComplaint.user?._id?.slice(-8) || 'Unknown'}</span>
                        {selectedComplaint.user?._id && (
                          <button 
                            className="copy-btn"
                            onClick={() => navigator.clipboard.writeText(selectedComplaint.user._id)}
                            title="Copy full user ID"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* User Information Section */}
                <div className="user-info-section">
                  <h5>👤 User Details</h5>
                  <UserInfoCard 
                    complaint={selectedComplaint}
                    compact={false}
                    showContactInfo={true}
                  />
                </div>
                
                {/* Status Information */}
                <div className="status-info-section">
                  <div className="status-change-info">
                    <p><strong>Current Status:</strong> 
                      <span className={`status-badge status-${selectedComplaint.status.toLowerCase()}`}>
                        {getStatusIcon(selectedComplaint.status)} {selectedComplaint.status}
                      </span>
                    </p>
                    <p><strong>New Status:</strong> 
                      <span className={`status-badge status-${selectedComplaint.newStatus.toLowerCase()}`}>
                        {getStatusIcon(selectedComplaint.newStatus)} {selectedComplaint.newStatus}
                      </span>
                    </p>
                  </div>
                  
                  {/* Complaint Location and Details */}
                  <div className="complaint-details">
                    <p><strong>📍 Location:</strong> {selectedComplaint.location || 'No location provided'}</p>
                    <p><strong>📋 Category:</strong> {selectedComplaint.category || 'Uncategorized'}</p>
                    <p><strong>⚡ Priority:</strong> {selectedComplaint.priority || 'Medium'}</p>
                    <p><strong>📅 Created:</strong> {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                  </div>
                  
                  {/* Complaint Description */}
                  {selectedComplaint.description && (
                    <div className="complaint-description">
                      <p><strong>📝 Description:</strong></p>
                      <div className="description-text">
                        {selectedComplaint.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-note">
                <label htmlFor="adminNote">Admin Note:</label>
                <textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note about this status change..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmStatusChange} className="confirm-btn">
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageComplaintsNew;