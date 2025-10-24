import React, { useState, useEffect } from 'react';
import './PendingStatusUpdates.css';

const PendingStatusUpdates = () => {
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPendingUpdates();
  }, []);

  const fetchPendingUpdates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/complaints/pending-updates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending updates');
      }

      const data = await response.json();
      setPendingUpdates(data.complaints || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending updates');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (complaintId, approve, adminNote = '') => {
    try {
      setProcessing(prev => ({ ...prev, [complaintId]: true }));
      setError('');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/complaints/${complaintId}/approve-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ approve, adminNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to process status update request');
      }

      const data = await response.json();
      
      // Remove the processed item from the list
      setPendingUpdates(prev => prev.filter(item => item._id !== complaintId));
      
      // Show success message
      alert(`Status update ${approve ? 'approved' : 'rejected'} successfully`);
      
    } catch (err) {
      setError(err.message || 'Failed to process request');
    } finally {
      setProcessing(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  if (loading) {
    return <div className="psu-loading">Loading pending status updates...</div>;
  }

  if (error) {
    return (
      <div className="psu-error">
        <span>❌ {error}</span>
        <button onClick={fetchPendingUpdates} className="psu-retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="psu-container">
      <div className="psu-header">
        <h2>Pending Status Update Approvals</h2>
        <div className="psu-count">
          {pendingUpdates.length} {pendingUpdates.length === 1 ? 'request' : 'requests'} pending
        </div>
      </div>

      {pendingUpdates.length === 0 ? (
        <div className="psu-empty">
          <div className="empty-icon">✅</div>
          <h3>No Pending Requests</h3>
          <p>All status update requests have been processed.</p>
        </div>
      ) : (
        <div className="psu-list">
          {pendingUpdates.map((complaint) => (
            <div key={complaint._id} className="psu-item">
              <div className="psu-item-header">
                <div className="psu-complaint-info">
                  <h4>{complaint.title}</h4>
                  <div className="psu-complaint-meta">
                    <span>ID: CPL-{complaint._id.slice(-8)}</span>
                    <span>User: {complaint.user?.name || 'Unknown'}</span>
                    <span>Location: {complaint.location}</span>
                  </div>
                </div>
                <div className="psu-current-status">
                  <span className={`status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}`}>
                    {complaint.status}
                  </span>
                </div>
              </div>

              <div className="psu-request-details">
                <div className="psu-request-info">
                  <div className="psu-info-row">
                    <strong>Requested Status:</strong>
                    <span className={`status-badge status-${complaint.pendingStatusUpdate.newStatus.toLowerCase().replace(' ', '-')}`}>
                      {complaint.pendingStatusUpdate.newStatus}
                    </span>
                  </div>
                  <div className="psu-info-row">
                    <strong>Requested By:</strong>
                    <span>{complaint.pendingStatusUpdate.requestedBy?.name || 'Unknown Labour'}</span>
                  </div>
                  <div className="psu-info-row">
                    <strong>Requested At:</strong>
                    <span>{new Date(complaint.pendingStatusUpdate.requestedAt).toLocaleString()}</span>
                  </div>
                  {complaint.pendingStatusUpdate.remarks && (
                    <div className="psu-info-row">
                      <strong>Labour Remarks:</strong>
                      <span>{complaint.pendingStatusUpdate.remarks}</span>
                    </div>
                  )}
                </div>

                <div className="psu-actions">
                  <div className="psu-admin-note">
                    <label>Admin Note (Optional):</label>
                    <textarea
                      id={`note-${complaint._id}`}
                      placeholder="Add a note about this decision..."
                      rows="3"
                    />
                  </div>
                  <div className="psu-buttons">
                    <button
                      onClick={() => {
                        const note = document.getElementById(`note-${complaint._id}`).value;
                        handleApproval(complaint._id, true, note);
                      }}
                      disabled={processing[complaint._id]}
                      className="psu-approve-btn"
                    >
                      {processing[complaint._id] ? 'Processing...' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const note = document.getElementById(`note-${complaint._id}`).value;
                        handleApproval(complaint._id, false, note);
                      }}
                      disabled={processing[complaint._id]}
                      className="psu-reject-btn"
                    >
                      {processing[complaint._id] ? 'Processing...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="psu-footer">
        <button onClick={fetchPendingUpdates} className="psu-refresh-btn">
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default PendingStatusUpdates;