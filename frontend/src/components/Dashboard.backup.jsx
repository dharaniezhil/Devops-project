import React, { useState, useEffect } from 'react';
import { dashboardAPI, complaintsAPI, adminAPI, apiHelpers } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Fetch all complaints from the admin API
  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      console.log('🔄 Fetching all complaints via admin API...');
      // Use the admin complaints endpoint for comprehensive data
      const response = await adminAPI.getAllComplaints();
      if (response.data && response.data.success) {
        setComplaints(response.data.complaints || []);
        console.log('✅ Fetched complaints:', response.data.complaints.length);
      } else {
        console.error('Invalid complaints response:', response.data);
        setComplaints([]);
      }
    } catch (error) {
      console.error('❌ Error fetching complaints:', error);
      const errorInfo = apiHelpers.handleError(error);
      console.error('Complaints fetch failed:', errorInfo.message);
      
      // If admin API fails, try the regular complaints API as fallback
      try {
        console.log('🔄 Trying fallback complaints API...');
        const fallbackResponse = await complaintsAPI.getAll();
        if (fallbackResponse.data && fallbackResponse.data.success) {
          setComplaints(fallbackResponse.data.complaints || []);
          console.log('✅ Fallback successful, fetched:', fallbackResponse.data.complaints.length);
        } else {
          setComplaints([]);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        setComplaints([]);
      }
    } finally {
      setComplaintsLoading(false);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await dashboardAPI.getDashboardData();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorInfo = apiHelpers.handleError(error);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh all data
  const refreshDashboard = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchComplaints()
    ]);
  };

  // Auto-refresh complaints every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchComplaints();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 Dashboard component mounted, loading data...');
    fetchDashboardData();
    fetchComplaints();
  }, []);
  
  // Debug current state
  useEffect(() => {
    console.log('📈 Dashboard state update:', {
      complaintsCount: complaints.length,
      loading,
      complaintsLoading,
      error,
      autoRefreshEnabled
    });
  }, [complaints, loading, complaintsLoading, error, autoRefreshEnabled]);

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h3>❌ Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="no-data-message">
          <h3>📊 No Dashboard Data</h3>
          <p>Unable to load dashboard statistics.</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { user, statistics, statusBreakdown, categoryBreakdown, priorityBreakdown, recentComplaints } = dashboardData;

  // Helper function to categorize complaints by status
  const categorizeComplaints = () => {
    const categories = {
      pending: complaints.filter(c => c.status === 'Pending'),
      inProgress: complaints.filter(c => c.status === 'Inprogress'),
      resolved: complaints.filter(c => c.status === 'Resolved')
    };
    return categories;
  };

  const complaintCategories = categorizeComplaints();
  const totalComplaintsFromAPI = complaints.length;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>👋 Welcome back, {user.name}!</h1>
          <p className="user-location">📍 {user.location}</p>
        </div>
        <div className="dashboard-controls">
          <button 
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`auto-refresh-toggle ${autoRefreshEnabled ? 'enabled' : 'disabled'}`}
            title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            {autoRefreshEnabled ? '🔄' : '⏸️'} Auto-refresh
          </button>
          <button 
            onClick={refreshDashboard} 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            disabled={refreshing}
          >
            🔄 {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{totalComplaintsFromAPI}</h3>
            <p>Total Complaints {complaintsLoading && '🔄'}</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{complaintCategories.pending.length}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card assigned">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <h3>{complaintCategories.assigned.length}</h3>
            <p>Assigned</p>
          </div>
        </div>

        <div className="stat-card progress">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{complaintCategories.inProgress.length}</h3>
            <p>In Progress</p>
          </div>
        </div>

        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{complaintCategories.resolved.length}</h3>
            <p>Resolved</p>
          </div>
        </div>

        {complaintCategories.completed.length > 0 && (
          <div className="stat-card completed">
            <div className="stat-icon">✔️</div>
            <div className="stat-content">
              <h3>{complaintCategories.completed.length}</h3>
              <p>Completed</p>
            </div>
          </div>
        )}

        {complaintCategories.rejected.length > 0 && (
          <div className="stat-card rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{complaintCategories.rejected.length}</h3>
              <p>Rejected</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts and Breakdowns */}
      <div className="dashboard-charts">
        {/* Status Breakdown */}
        <div className="chart-card">
          <h3>📊 Status Breakdown</h3>
          <div className="breakdown-list">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="breakdown-item">
                <span className={`status-indicator ${status.toLowerCase().replace(' ', '-')}`}></span>
                <span className="breakdown-label">
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </span>
                <span className="breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="chart-card">
          <h3>🏷️ Categories</h3>
          <div className="breakdown-list">
            {Object.entries(categoryBreakdown).length === 0 ? (
              <p className="no-data">No complaints yet</p>
            ) : (
              Object.entries(categoryBreakdown).map(([category, count]) => (
                <div key={category} className="breakdown-item">
                  <span className="category-indicator"></span>
                  <span className="breakdown-label">{category}</span>
                  <span className="breakdown-count">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="chart-card">
          <h3>⚡ Priority Levels</h3>
          <div className="breakdown-list">
            {Object.entries(priorityBreakdown).length === 0 ? (
              <p className="no-data">No complaints yet</p>
            ) : (
              Object.entries(priorityBreakdown).map(([priority, count]) => (
                <div key={priority} className="breakdown-item">
                  <span className={`priority-indicator ${priority.toLowerCase()}`}></span>
                  <span className="breakdown-label">{priority}</span>
                  <span className="breakdown-count">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All Complaints - Organized by Status */}
      <div className="all-complaints">
        <div className="section-header">
          <h3>📝 All Complaints ({totalComplaintsFromAPI})</h3>
          <div className="complaints-info">
            {complaintsLoading && <span className="loading-indicator">🔄 Updating...</span>}
            {autoRefreshEnabled && <span className="auto-refresh-indicator">✨ Auto-refresh ON</span>}
          </div>
        </div>
        
        {totalComplaintsFromAPI === 0 ? (
          <div className="no-complaints">
            <p>📝 No complaints yet. Lodge your first complaint to get started!</p>
            <button className="lodge-complaint-button" onClick={() => {
              // Navigate to complaint form - adjust based on your routing
              window.location.href = '/lodge-complaint';
            }}>
              Lodge Complaint
            </button>
          </div>
        ) : (
          <div className="complaints-by-status">
            {/* Pending Complaints */}
            {complaintCategories.pending.length > 0 && (
              <div className="status-section">
                <h4 className="status-title pending">
                  ⏳ Pending ({complaintCategories.pending.length})
                </h4>
                <div className="complaints-list">
                  {complaintCategories.pending.map((complaint) => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-header">
                        <h5>{complaint.title}</h5>
                        <span className="status-badge pending">Pending</span>
                      </div>
                      <p className="complaint-description">{complaint.description}</p>
                      <div className="complaint-meta">
                        <span className="category">{complaint.category}</span>
                        <span className={`priority ${complaint.priority?.toLowerCase()}`}>
                          {complaint.priority} Priority
                        </span>
                        <span className="location">📍 {complaint.location}</span>
                        <span className="date">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        {complaint.user && (
                          <span className="user">👤 {complaint.user.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Complaints */}
            {complaintCategories.assigned.length > 0 && (
              <div className="status-section">
                <h4 className="status-title assigned">
                  📄 Assigned ({complaintCategories.assigned.length})
                </h4>
                <div className="complaints-list">
                  {complaintCategories.assigned.map((complaint) => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-header">
                        <h5>{complaint.title}</h5>
                        <span className="status-badge assigned">Assigned</span>
                      </div>
                      <p className="complaint-description">{complaint.description}</p>
                      <div className="complaint-meta">
                        <span className="category">{complaint.category}</span>
                        <span className={`priority ${complaint.priority?.toLowerCase()}`}>
                          {complaint.priority} Priority
                        </span>
                        <span className="location">📍 {complaint.location}</span>
                        <span className="date">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        {complaint.user && (
                          <span className="user">👤 {complaint.user.name}</span>
                        )}
                        {complaint.assignedTo && (
                          <span className="assignedTo">🔨 {complaint.assignedTo.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Complaints */}
            {complaintCategories.inProgress.length > 0 && (
              <div className="status-section">
                <h4 className="status-title in-progress">
                  🔄 In Progress ({complaintCategories.inProgress.length})
                </h4>
                <div className="complaints-list">
                  {complaintCategories.inProgress.map((complaint) => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-header">
                        <h5>{complaint.title}</h5>
                        <span className="status-badge in-progress">In Progress</span>
                      </div>
                      <p className="complaint-description">{complaint.description}</p>
                      <div className="complaint-meta">
                        <span className="category">{complaint.category}</span>
                        <span className={`priority ${complaint.priority?.toLowerCase()}`}>
                          {complaint.priority} Priority
                        </span>
                        <span className="location">📍 {complaint.location}</span>
                        <span className="date">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        {complaint.user && (
                          <span className="user">👤 {complaint.user.name}</span>
                        )}
                        {complaint.assignedTo && (
                          <span className="assignedTo">🔨 {complaint.assignedTo.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Complaints */}
            {complaintCategories.completed.length > 0 && (
              <div className="status-section">
                <h4 className="status-title completed">
                  ✔️ Completed ({complaintCategories.completed.length})
                </h4>
                <div className="complaints-list">
                  {complaintCategories.completed.map((complaint) => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-header">
                        <h5>{complaint.title}</h5>
                        <span className="status-badge completed">Completed</span>
                      </div>
                      <p className="complaint-description">{complaint.description}</p>
                      <div className="complaint-meta">
                        <span className="category">{complaint.category}</span>
                        <span className={`priority ${complaint.priority?.toLowerCase()}`}>
                          {complaint.priority} Priority
                        </span>
                        <span className="location">📍 {complaint.location}</span>
                        <span className="date">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        {complaint.user && (
                          <span className="user">👤 {complaint.user.name}</span>
                        )}
                        {complaint.assignedTo && (
                          <span className="assignedTo">🔨 {complaint.assignedTo.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Complaints */}
            {complaintCategories.resolved.length > 0 && (
              <div className="status-section">
                <h4 className="status-title resolved">
                  ✅ Resolved ({complaintCategories.resolved.length})
                </h4>
                <div className="complaints-list">
                  {complaintCategories.resolved.map((complaint) => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-header">
                        <h5>{complaint.title}</h5>
                        <span className="status-badge resolved">Resolved</span>
                      </div>
                      <p className="complaint-description">{complaint.description}</p>
                      <div className="complaint-meta">
                        <span className="category">{complaint.category}</span>
                        <span className={`priority ${complaint.priority?.toLowerCase()}`}>
                          {complaint.priority} Priority
                        </span>
                        <span className="location">📍 {complaint.location}</span>
                        <span className="date">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        {complaint.user && (
                          <span className="user">👤 {complaint.user.name}</span>
                        )}
                        {complaint.assignedTo && (
                          <span className="assignedTo">🔨 {complaint.assignedTo.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Complaints */}
            {complaintCategories.rejected.length > 0 && (
              <div className="status-section">
                <h4 className="status-title rejected">
                  ❌ Rejected ({complaintCategories.rejected.length})
                </h4>
                <div className="complaints-list">
                  {complaintCategories.rejected.map((complaint) => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-header">
                        <h5>{complaint.title}</h5>
                        <span className="status-badge rejected">Rejected</span>
                      </div>
                      <p className="complaint-description">{complaint.description}</p>
                      <div className="complaint-meta">
                        <span className="category">{complaint.category}</span>
                        <span className={`priority ${complaint.priority?.toLowerCase()}`}>
                          {complaint.priority} Priority
                        </span>
                        <span className="location">📍 {complaint.location}</span>
                        <span className="date">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                        {complaint.user && (
                          <span className="user">👤 {complaint.user.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-button primary"
            onClick={() => {
              // Navigate to complaint form - adjust based on your routing
              window.location.href = '/lodge-complaint';
            }}
          >
            📝 Lodge New Complaint
          </button>
          <button 
            className="action-button secondary"
            onClick={() => {
              // Navigate to complaints list - adjust based on your routing
              window.location.href = '/my-complaints';
            }}
          >
            📋 View All Complaints
          </button>
          <button 
            className="action-button secondary"
            onClick={() => {
              // Navigate to profile - adjust based on your routing
              window.location.href = '/profile';
            }}
          >
            👤 Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
