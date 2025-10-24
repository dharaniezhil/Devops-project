import React, { useState, useEffect } from 'react';
import feedbackService from '../../../services/feedbackService';
import FeedbackForm from '../../../components/forms/FeedbackForm/FeedbackForm';
import './FeedbackManagement.css';

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    visible: null,
    satisfaction: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalFeedbacks: 0
  });

  useEffect(() => {
    fetchFeedbacks();
    fetchAnalytics();
  }, [filters]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.admin.getAllFeedback(filters);
      setFeedbacks(response.feedbacks || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const analyticsData = await feedbackService.admin.getFeedbackAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const handleModerateFeedback = async (feedbackId, isVisible, moderationNote = '') => {
    try {
      await feedbackService.admin.moderateFeedback(feedbackId, {
        isVisible,
        moderationNote
      });
      
      // Refresh feedbacks
      await fetchFeedbacks();
      await fetchAnalytics();
      
      // Close modal if open
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        setShowDetailModal(false);
      }
      
    } catch (error) {
      console.error('Error moderating feedback:', error);
      alert('Failed to moderate feedback. Please try again.');
    }
  };

  const getSatisfactionColor = (satisfaction) => {
    return feedbackService.utils.getSatisfactionColor(satisfaction);
  };

  const formatDate = (dateString) => {
    return feedbackService.utils.formatFeedbackDate(dateString);
  };

  if (loading && feedbacks.length === 0) {
    return (
      <div className="feedback-management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading feedback data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-management">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Feedback</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => fetchFeedbacks()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-management">
      <div className="feedback-header">
        <h1>Feedback Management</h1>
        <p>Monitor and manage user feedback to improve service quality</p>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="analytics-section">
          <h2>Feedback Analytics</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">📊</div>
              <div className="analytics-content">
                <h3>{analytics.totalFeedbacks}</h3>
                <p>Total Feedback</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">⭐</div>
              <div className="analytics-content">
                <h3>{analytics.averageSatisfaction?.toFixed(1) || 0}</h3>
                <p>Average Satisfaction</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">📈</div>
              <div className="analytics-content">
                <h3>
                  {Math.round((analytics.satisfactionDistribution?.filter(s => 
                    s === 'Very satisfied' || s === 'Satisfied'
                  ).length / analytics.satisfactionDistribution?.length) * 100) || 0}%
                </h3>
                <p>Positive Feedback</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <h3>Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Visibility Status:</label>
            <select 
              value={filters.visible === null ? '' : filters.visible} 
              onChange={(e) => handleFilterChange('visible', e.target.value === '' ? null : e.target.value === 'true')}
            >
              <option value="">All</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Satisfaction Level:</label>
            <select 
              value={filters.satisfaction} 
              onChange={(e) => handleFilterChange('satisfaction', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="Very satisfied">Very Satisfied</option>
              <option value="Satisfied">Satisfied</option>
              <option value="Neutral">Neutral</option>
              <option value="Unsatisfied">Unsatisfied</option>
              <option value="Very unsatisfied">Very Unsatisfied</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Items per page:</label>
            <select 
              value={filters.limit} 
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="feedback-list-section">
        <h3>Feedback Submissions ({pagination.totalFeedbacks})</h3>
        
        {feedbacks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Feedback Found</h3>
            <p>No feedback submissions match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="feedback-grid">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="feedback-card">
                  <div className="feedback-card-header">
                    <div className="user-info">
                      <strong>{feedback.user?.name || 'Anonymous'}</strong>
                      <span className="user-email">{feedback.user?.email}</span>
                    </div>
                    <div className="feedback-meta">
                      <span className="feedback-date">{formatDate(feedback.createdAt)}</span>
                      <span className={`visibility-badge ${feedback.isVisible ? 'visible' : 'hidden'}`}>
                        {feedback.isVisible ? '👁️ Visible' : '🚫 Hidden'}
                      </span>
                    </div>
                  </div>

                  <div className="complaint-info">
                    <h4>Complaint: {feedback.complaint?.title}</h4>
                    <p>Category: {feedback.complaint?.category} | Status: {feedback.complaint?.status}</p>
                  </div>

                  <div className="satisfaction-summary">
                    <span 
                      className="satisfaction-level"
                      style={{ 
                        backgroundColor: getSatisfactionColor(feedback.feedback.satisfaction),
                        color: 'white'
                      }}
                    >
                      {feedback.feedback.satisfaction}
                    </span>
                    <div className="quick-ratings">
                      <span>Resolution: {feedback.feedback.resolutionMet}</span>
                      <span>Timeliness: {feedback.feedback.timeliness}</span>
                      <span>Recommendation: {feedback.feedback.recommendation}</span>
                    </div>
                  </div>

                  {feedback.feedback.suggestion && (
                    <div className="feedback-text-preview">
                      <strong>Suggestion:</strong> 
                      <p>{feedback.feedback.suggestion.substring(0, 100)}
                        {feedback.feedback.suggestion.length > 100 && '...'}
                      </p>
                    </div>
                  )}

                  <div className="feedback-actions">
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(feedback)}
                    >
                      View Details
                    </button>
                    
                    {feedback.isVisible ? (
                      <button 
                        className="hide-btn"
                        onClick={() => handleModerateFeedback(feedback._id, false, 'Hidden by admin')}
                      >
                        Hide
                      </button>
                    ) : (
                      <button 
                        className="show-btn"
                        onClick={() => handleModerateFeedback(feedback._id, true, 'Approved by admin')}
                      >
                        Show
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current <= 1}
                >
                  Previous
                </button>
                
                <div className="page-info">
                  Page {pagination.current} of {pagination.total}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current >= pagination.total}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="feedback-detail-info">
                <div className="detail-section">
                  <h3>User Information</h3>
                  <p><strong>Name:</strong> {selectedFeedback.user?.name}</p>
                  <p><strong>Email:</strong> {selectedFeedback.user?.email}</p>
                  <p><strong>Submitted:</strong> {formatDate(selectedFeedback.createdAt)}</p>
                </div>

                <div className="detail-section">
                  <h3>Related Complaint</h3>
                  <p><strong>Title:</strong> {selectedFeedback.complaint?.title}</p>
                  <p><strong>Category:</strong> {selectedFeedback.complaint?.category}</p>
                  <p><strong>Status:</strong> {selectedFeedback.complaint?.status}</p>
                  <p><strong>Location:</strong> {selectedFeedback.complaint?.location}</p>
                </div>
              </div>

              <div className="feedback-display">
                <FeedbackForm 
                  complaint={selectedFeedback.complaint}
                  existingFeedback={selectedFeedback}
                  isReadOnly={true}
                />
              </div>

              <div className="moderation-section">
                <h3>Moderation</h3>
                <div className="moderation-actions">
                  <button 
                    className={`moderation-btn ${selectedFeedback.isVisible ? 'hide-btn' : 'show-btn'}`}
                    onClick={() => handleModerateFeedback(
                      selectedFeedback._id, 
                      !selectedFeedback.isVisible,
                      selectedFeedback.isVisible ? 'Hidden by admin' : 'Approved by admin'
                    )}
                  >
                    {selectedFeedback.isVisible ? 'Hide Feedback' : 'Show Feedback'}
                  </button>
                </div>
                
                {selectedFeedback.isModerated && (
                  <div className="moderation-history">
                    <p><strong>Moderated by:</strong> {selectedFeedback.moderatedBy?.name}</p>
                    <p><strong>Note:</strong> {selectedFeedback.moderationNote}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;