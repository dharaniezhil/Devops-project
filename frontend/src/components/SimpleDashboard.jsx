import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const SimpleDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Get the auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Direct API call to fetch complaints
  const fetchComplaintsDirectly = async () => {
    const token = getAuthToken();
    
    if (!token) {
      setError('No authentication token found. Please login as admin.');
      setLoading(false);
      return;
    }

    const endpoints = [
      'http://localhost:5000/api/admin/complaints',
      'http://localhost:5000/api/complaints',
      'http://localhost:5000/api/admins/complaints'
    ];

    console.log('🔄 Trying to fetch complaints with token:', token.substring(0, 20) + '...');

    for (let endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Success with endpoint:', endpoint, 'Data:', response.data);
        
        if (response.data) {
          let complaintsData = [];
          
          // Handle different response formats
          if (response.data.complaints) {
            complaintsData = response.data.complaints;
          } else if (Array.isArray(response.data)) {
            complaintsData = response.data;
          } else if (response.data.success && response.data.complaints) {
            complaintsData = response.data.complaints;
          }
          
          setComplaints(complaintsData);
          setLastUpdate(new Date());
          setError(null);
          setLoading(false);
          console.log('✅ Loaded complaints:', complaintsData.length);
          return; // Success, exit the loop
        }
      } catch (err) {
        console.error(`❌ Failed with ${endpoint}:`, err.response?.status, err.response?.data);
        continue; // Try next endpoint
      }
    }
    
    // If we reach here, all endpoints failed
    setError('Could not fetch complaints from any endpoint. Check console for details.');
    setLoading(false);
  };

  // Auto-refresh every 5 seconds (more aggressive)
  useEffect(() => {
    fetchComplaintsDirectly();
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing complaints...');
      fetchComplaintsDirectly();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Categorize complaints - only the 3 valid statuses
  const categorizeComplaints = () => {
    return {
      pending: complaints.filter(c => c.status === COMPLAINT_STATUSES.PENDING),
      inProgress: complaints.filter(c => c.status === COMPLAINT_STATUSES.IN_PROGRESS),
      resolved: complaints.filter(c => c.status === COMPLAINT_STATUSES.RESOLVED)
    };
  };

  const categories = categorizeComplaints();

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading complaints dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h3>❌ Error Loading Complaints</h3>
          <p>{error}</p>
          <button onClick={fetchComplaintsDirectly} className="retry-button">
            Try Again
          </button>
          <div style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
            <p>Debug info:</p>
            <p>Auth token present: {getAuthToken() ? 'Yes' : 'No'}</p>
            <p>Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>🚀 Simple Admin Dashboard</h1>
          <p>Real-time complaints monitoring</p>
        </div>
        <div className="dashboard-controls">
          <button onClick={fetchComplaintsDirectly} className="refresh-button">
            🔄 Refresh Now
          </button>
          <span style={{color: 'white', fontSize: '12px'}}>
            Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </span>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{complaints.length}</h3>
            <p>Total Complaints</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{categories.pending.length}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card progress">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{categories.inProgress.length}</h3>
            <p>Inprogress</p>
          </div>
        </div>

        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{categories.resolved.length}</h3>
            <p>Resolved</p>
          </div>
        </div>
      </div>

      {/* All Complaints */}
      <div className="all-complaints">
        <div className="section-header">
          <h3>📝 All Complaints ({complaints.length})</h3>
          <div style={{fontSize: '12px', color: '#666'}}>
            Auto-refreshing every 5 seconds • Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
          </div>
        </div>
        
        {complaints.length === 0 ? (
          <div className="no-complaints">
            <p>📝 No complaints found.</p>
          </div>
        ) : (
          <div className="complaints-by-status">
            {Object.entries(categories).map(([status, complaintsInStatus]) => {
              if (complaintsInStatus.length === 0) return null;
              
              const statusIcons = {
                pending: '⏳',
                inProgress: '🔄',
                resolved: '✅'
              };
              
              const statusLabels = {
                pending: 'Pending',
                inProgress: 'Inprogress',
                resolved: 'Resolved'
              };

              return (
                <div key={status} className="status-section">
                  <h4 className={`status-title ${status.toLowerCase().replace(/([A-Z])/g, '-$1')}`}>
                    {statusIcons[status]} {statusLabels[status]} ({complaintsInStatus.length})
                  </h4>
                  <div className="complaints-list">
                    {complaintsInStatus.map((complaint) => (
                      <div key={complaint._id} className="complaint-item">
                        <div className="complaint-header">
                          <h5>{complaint.title || 'Untitled'}</h5>
                          <span className={`status-badge ${status.toLowerCase().replace(/([A-Z])/g, '-$1')}`}>
                            {statusLabels[status]}
                          </span>
                        </div>
                        <p className="complaint-description">
                          {complaint.description || 'No description'}
                        </p>
                        <div className="complaint-meta">
                          <span className="category">{complaint.category || 'Uncategorized'}</span>
                          <span className={`priority ${(complaint.priority || 'medium').toLowerCase()}`}>
                            {complaint.priority || 'Medium'} Priority
                          </span>
                          <span className="location">📍 {complaint.location || 'No location'}</span>
                          <span className="date">
                            {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'No date'}
                          </span>
                          {complaint.user && (
                            <span className="user">👤 {complaint.user.name || 'Unknown user'}</span>
                          )}
                          {complaint.assignedTo && (
                            <span className="assignedTo">🔨 {complaint.assignedTo.name || 'Unknown worker'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboard;