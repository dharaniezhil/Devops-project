import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComplaint } from '../../../context/ComplaintContext';
import { complaintsAPI, dashboardAPI } from '../../../services/api';
import { COMPLAINT_STATUSES } from '../../../utils/constants';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { complaints: contextComplaints, refreshComplaints } = useComplaint();
  const [complaints, setComplaints] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch admin dashboard statistics
  const fetchAdminStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      console.log('🔄 Admin Dashboard: Fetching admin statistics...');
      
      const responseData = await dashboardAPI.getAdminStats();
      console.log('✅ Admin Dashboard: Admin stats fetched:', responseData);
      
      if (responseData.success) {
        setAdminStats(responseData.data);
        console.log('📊 Admin Dashboard: Admin stats updated');
      } else {
        throw new Error(responseData.message || 'Failed to fetch admin stats');
      }
    } catch (err) {
      console.error('❌ Admin Dashboard: Error fetching admin stats:', err);
      setStatsError(err.response?.data?.message || err.message || 'Failed to fetch admin stats');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch all complaints for admin
  const fetchAllComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Admin Dashboard: Fetching all complaints...');
      
      const response = await complaintsAPI.getAll();
      console.log('✅ Admin Dashboard: Complaints fetched:', response.data);
      
      if (response.data.success) {
        const complaintsData = response.data.complaints || response.data.data || [];
        setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
        setLastUpdated(new Date());
        console.log(`📊 Admin Dashboard: Set ${complaintsData.length} complaints`);
      } else {
        throw new Error(response.data.message || 'Failed to fetch complaints');
      }
    } catch (err) {
      console.error('❌ Admin Dashboard: Error fetching complaints:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch complaints');
      // Fallback to context complaints if direct fetch fails
      setComplaints(Array.isArray(contextComplaints) ? contextComplaints : []);
    } finally {
      setLoading(false);
    }
  };

  // Fetch both complaints and stats
  const fetchAllData = async () => {
    await Promise.all([fetchAllComplaints(), fetchAdminStats()]);
  };

  // Auto-refresh mechanism
  useEffect(() => {
    // Initial fetch
    fetchAllData();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      console.log('🔄 Admin Dashboard: Auto-refreshing data...');
      fetchAllData();
    }, 30000); // 30 seconds

    // Listen for complaint creation events
    const handleComplaintCreated = (event) => {
      console.log('🚀 Admin Dashboard: New complaint created, refreshing data...', event.detail);
      fetchAllData(); // Immediately refresh data when new complaint is created
    };

    // Listen for complaint status update events
    const handleComplaintStatusUpdated = (event) => {
      console.log('🔄 Admin Dashboard: Complaint status updated, refreshing data...', event.detail);
      fetchAllData(); // Immediately refresh data when complaint status changes
    };

    window.addEventListener('complaintCreated', handleComplaintCreated);
    window.addEventListener('complaintStatusUpdated', handleComplaintStatusUpdated);

    // Cleanup interval and event listeners on unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('complaintCreated', handleComplaintCreated);
      window.removeEventListener('complaintStatusUpdated', handleComplaintStatusUpdated);
    };
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 Admin Dashboard: Manual refresh triggered');
    await fetchAllData();
  };

  // Calculate dashboard stats - prioritize admin stats API, fallback to calculated stats
  const dashboardStats = React.useMemo(() => {
    if (adminStats && adminStats.statistics) {
      // Use admin stats from API for accurate system-wide counts
      const stats = adminStats.statistics;
      return {
        totalComplaints: stats.totalComplaints || 0,
        pending: stats.pendingComplaints || 0,
        inProgress: stats.inProgressComplaints || 0,
        resolved: stats.resolvedComplaints || 0,
        newToday: complaints.filter(c => {
          const today = new Date().toDateString();
          const complaintDate = new Date(c.createdAt || c.date).toDateString();
          return today === complaintDate;
        }).length
      };
    } else {
      // Fallback to calculated stats from complaints array
      return {
        totalComplaints: complaints.length,
        pending: complaints.filter(c => c.status === COMPLAINT_STATUSES.PENDING).length,
        inProgress: complaints.filter(c => c.status === COMPLAINT_STATUSES.IN_PROGRESS).length,
        resolved: complaints.filter(c => c.status === COMPLAINT_STATUSES.RESOLVED).length,
        newToday: complaints.filter(c => {
          const today = new Date().toDateString();
          const complaintDate = new Date(c.createdAt || c.date).toDateString();
          return today === complaintDate;
        }).length
      };
    }
  }, [adminStats, complaints]);

  // Button click handlers
  const handleViewAllComplaints = () => {
    navigate('/admin/complaints');
  };

  const handleAssignTasks = () => {
    // For now, show available complaints that need assignment
    const pendingComplaints = complaints.filter(c => c.status === COMPLAINT_STATUSES.PENDING);
    if (pendingComplaints.length === 0) {
      alert('✅ No pending complaints to assign!');
    } else {
      alert(`📋 ${pendingComplaints.length} complaints are pending assignment. Redirecting to manage complaints...`);
      navigate('/admin/complaints');
    }
  };

  const handleGenerateReports = () => {
    navigate('/admin/reports');
  };

  const handleManageUsers = () => {
    // For now, show user management info
     navigate('/admin/users');
  };

  return (
    <main className="admin-dashboard-container theme-page-bg">
      <header className="dashboard-header theme-card">
        <div className="header-content">
          <div>
            <h1 className="theme-text-primary">Admin Dashboard</h1>
            <p className="theme-text-secondary">Manage complaints and monitor community issues</p>
          </div>
          <div className="header-controls">
            <button 
              className="refresh-button theme-btn-primary"
              onClick={handleRefresh}
              disabled={loading || statsLoading}
              title="Refresh complaints and statistics"
            >
              {(loading || statsLoading) ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            <div className="last-updated theme-text-light">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            {(error || statsError) && (
              <div className="error-indicator" title={error || statsError}>
                ⚠️ Error loading data
              </div>
            )}
            {statsLoading && (
              <div className="loading-indicator">
                🔄 Loading stats...
              </div>
            )}
          </div>
        </div>
      </header>

      {/* New Today Section */}
      <section className="new-today-section">
        <div className="new-today-card theme-card-elevated">
          <div className="today-content">
            <span className="today-label theme-text-secondary">New Today</span>
            <span className="today-number theme-text-primary">{dashboardStats.newToday}</span>
          </div>
        </div>
      </section>

      <section className="admin-stats">
        <div className="stats-grid">
          <div className="stat-card total theme-card-elevated">
            <h3 className="theme-text-primary">Total Complaints</h3>
            <span className="stat-number theme-text-primary">{dashboardStats.totalComplaints}</span>
          </div>
          <div className="stat-card pending theme-card-elevated">
            <h3 className="theme-text-primary">Pending</h3>
            <span className="stat-number theme-text-primary">{dashboardStats.pending}</span>
          </div>
          <div className="stat-card progress theme-card-elevated">
            <h3 className="theme-text-primary">Inprogress</h3>
            <span className="stat-number theme-text-primary">{dashboardStats.inProgress}</span>
          </div>
          <div className="stat-card resolved theme-card-elevated">
            <h3 className="theme-text-primary">Resolved</h3>
            <span className="stat-number theme-text-primary">{dashboardStats.resolved}</span>
          </div>
        </div>
      </section>

      {/* Quick Actions Section - Now Functional */}
      <section className="quick-actions theme-card">
        <h2 className="theme-text-primary">Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="btn-primary theme-btn-primary"
            onClick={handleViewAllComplaints}
          >
            View All Complaints
          </button>
          <button 
            className="btn-secondary theme-btn-secondary"
            onClick={handleAssignTasks}
          >
            Assign Tasks
          </button>
          <button 
            className="btn-secondary theme-btn-secondary"
            onClick={handleGenerateReports}
          >
            Generate Reports
          </button>
          <button 
            className="btn-secondary theme-btn-secondary"
            onClick={handleManageUsers}
          >
            Manage Users
          </button>
        </div>
      </section>

      <section className="recent-activity theme-card">
        <h2 className="theme-text-primary">Recent Activity</h2>
        <div className="activity-list">
          {complaints.slice(0, 3).map((complaint, index) => (
            <div key={complaint.id} className="activity-item theme-hover">
              <div className="activity-icon">
                {complaint.status === COMPLAINT_STATUSES.RESOLVED ? '✅' : 
                 complaint.status === COMPLAINT_STATUSES.IN_PROGRESS ? '🔄' : '📝'}
              </div>
              <div className="activity-content">
                <h4 className="theme-text-primary">{complaint.title}</h4>
                <p className="theme-text-secondary">{complaint.location} - {complaint.status}</p>
              </div>
            </div>
          ))}
          {complaints.length === 0 && (
            <div className="activity-item theme-hover">
              <div className="activity-icon">📋</div>
              <div className="activity-content">
                <h4 className="theme-text-primary">No recent activity</h4>
                <p className="theme-text-secondary">Complaint activities will appear here</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="priority-alerts theme-card">
        <h2 className="theme-text-primary">Priority Alerts</h2>
        <div className="alerts-list">
          {complaints
            .filter(c => c.priority === 'High' || c.priority === 'Urgent')
            .slice(0, 2)
            .map((complaint) => (
              <div key={complaint.id} className={`alert-item theme-card ${complaint.priority?.toLowerCase()}`}>
                <h4 className="theme-text-primary">{complaint.priority} Priority: {complaint.title}</h4>
                <p className="theme-text-secondary">{complaint.location} - {complaint.likes || 0} likes - Requires attention</p>
              </div>
            ))}
          {complaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length === 0 && (
            <div className="alert-item theme-card medium">
              <h4 className="theme-text-primary">No Priority Alerts</h4>
              <p className="theme-text-secondary">All complaints are being handled normally</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
export default AdminDashboard;

