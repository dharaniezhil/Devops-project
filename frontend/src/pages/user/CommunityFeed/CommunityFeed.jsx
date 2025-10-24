import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import complaintService from '../../../services/complaintService'
import feedbackService from '../../../services/feedbackService'
import FeedbackForm from '../../../components/forms/FeedbackForm/FeedbackForm'
import { COMPLAINT_STATUSES } from '../../../utils/constants'
import { normalizeComplaintStatuses } from '../../../utils/statusVerification'
import './CommunityFeed.css'

const CommunityFeed = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState({});
  const [animateCards, setAnimateCards] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUserComplaints();
  }, []);
  
  // Listen for admin status updates
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      console.log('🌐 CommunityFeed: Status updated, refreshing...', event.detail);
      fetchUserComplaints(); // Refresh complaints data
    };
    
    window.addEventListener('complaintStatusUpdated', handleStatusUpdate);
    
    return () => {
      window.removeEventListener('complaintStatusUpdated', handleStatusUpdate);
    };
  }, []);

  useEffect(() => {
    if (complaints.length > 0) {
      setTimeout(() => setAnimateCards(true), 100);
    }
  }, [complaints]);

  const fetchUserComplaints = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await complaintService.getUserComplaints();
      
      console.log('📥 CommunityFeed received response:', response);
      
      if (response.success && Array.isArray(response.complaints)) {
        const normalizedComplaints = normalizeComplaintStatuses(response.complaints);
        setComplaints(normalizedComplaints);
        // Fetch existing feedback for resolved complaints
        await fetchExistingFeedback(response.complaints);
      } else {
        console.error('❌ Invalid response structure:', response);
        setComplaints([]);
        setError('Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to load your complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingFeedback = async (userComplaints) => {
    const feedbackMap = {};
    
    // Only check feedback for resolved complaints
    const resolvedComplaints = userComplaints.filter(c => c.status === COMPLAINT_STATUSES.RESOLVED);
    
    for (const complaint of resolvedComplaints) {
      try {
        const response = await feedbackService.getComplaintFeedback(complaint._id);
        if (response.feedbacks && response.feedbacks.length > 0) {
          feedbackMap[complaint._id] = response.feedbacks[0]; // User can only have one feedback per complaint
        }
      } catch (error) {
        // If error is 403, user might not have provided feedback yet, which is fine
        if (error.status !== 403) {
          console.error(`Error fetching feedback for complaint ${complaint._id}:`, error);
        }
      }
    }
    
    setExistingFeedback(feedbackMap);
  };

  const handleProvideFeedback = (complaint) => {
    setSelectedComplaint(complaint);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmitSuccess = async (feedback) => {
    // Update existing feedback state
    setExistingFeedback(prev => ({
      ...prev,
      [selectedComplaint._id]: feedback
    }));

    // Success notice
    setSuccessMessage('Your feedback helps us improve! Saved successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);

    // Close form
    setShowFeedbackForm(false);
    setSelectedComplaint(null);

    // Refresh complaints to get updated feedback count
    await fetchUserComplaints();
  };

  const handleCancelFeedback = () => {
    setShowFeedbackForm(false);
    setSelectedComplaint(null);
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase().replace(' ', '-')) {
      case 'pending': return '⏳';
      case 'inprogress': return '⚙️';
      case 'resolved': return '✅';
      case 'rejected': return '❌';
      default: return '📋';
    }
  };

  const getRandomDelay = (index) => {
    return `${index * 0.1}s`;
  };

  const canProvideFeedback = (complaint) => {
    return complaint.status === COMPLAINT_STATUSES.RESOLVED && !existingFeedback[complaint._id];
  };

  const hasProvidedFeedback = (complaint) => {
    return existingFeedback[complaint._id];
  };

  if (loading) {
    return (
      <div className="communityfeed-page theme-page-bg">
        <div className="loading-state theme-card">
          <div className="loading-spinner"></div>
          <p className="theme-text-primary">Loading your complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="communityfeed-page theme-page-bg">
        <div className="error-state theme-card">
          <div className="error-icon">⚠️</div>
          <h3 className="theme-text-primary">Error Loading Complaints</h3>
          <p className="theme-text-secondary">{error}</p>
          <button className="retry-btn theme-btn-primary" onClick={fetchUserComplaints}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showFeedbackForm && selectedComplaint) {
    return (
      <div className="communityfeed-page theme-page-bg">
        <div className="feedback-container theme-card">
          <div className="complaint-context theme-card">
            <h2 className="theme-text-primary">Provide Feedback for:</h2>
            <div className="complaint-summary">
              <h3 className="theme-text-primary">{selectedComplaint.title}</h3>
              <p className="theme-text-secondary">{selectedComplaint.description}</p>
              <div className="complaint-meta">
                <span className="status-badge resolved">✅ Resolved</span>
                <span className="location">📍 {selectedComplaint.location}</span>
              </div>
            </div>
          </div>
          
          <FeedbackForm 
            complaint={selectedComplaint}
            onSubmitSuccess={handleFeedbackSubmitSuccess}
            onCancel={handleCancelFeedback}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="communityfeed-page theme-page-bg">
      <div className="feed-header">
        <div className="header-decoration"></div>
        <h1>Your Complaints & Feedback</h1>
        <p>View your lodged complaints and provide feedback on resolved issues</p>
        {successMessage && (
          <div className="success-banner" style={{ background:'#ecfdf5', color:'#065f46', border:'1px solid #10b981', padding:'10px 12px', borderRadius:8, marginTop:12 }}>
            {successMessage}
          </div>
        )}
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{complaints.length}</span>
            <span className="stat-label">Total Complaints</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{complaints.filter(c => c.status === COMPLAINT_STATUSES.RESOLVED).length}</span>
            <span className="stat-label">Resolved</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{Object.keys(existingFeedback).length}</span>
            <span className="stat-label">Feedback Given</span>
          </div>
        </div>
      </div>

      <div className="feed-list">
        {complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Complaints Yet</h3>
            <p>You haven't lodged any complaints yet. When you do, you'll be able to track their progress and provide feedback once they're resolved.</p>
          </div>
        ) : (
          complaints.map((complaint, index) => {
            const feedback = existingFeedback[complaint._id];
            
            return (
              <div
                className={`feed-card ${animateCards ? 'animate-in' : ''}`}
                key={complaint._id}
                style={{
                  animationDelay: getRandomDelay(index)
                }}
              >
                <div className="card-glow"></div>
                <div className="feed-card-header">
                  <h3>{complaint.title}</h3>
                  <div className={`status status-${complaint.status.toLowerCase().replace(' ', '-')}`}>
                    <span className="status-icon">{getStatusIcon(complaint.status)}</span>
                    <span className="status-text">{complaint.status}</span>
                  </div>
                </div>
                
                <p className="feed-card-desc">{complaint.description}</p>
                
                <div className="feed-card-meta">
                  <div className="meta-item location">
                    <span className="meta-icon">📍</span>
                    <span className="meta-text">{complaint.location}</span>
                  </div>
                  <div className="meta-item category">
                    <span className="meta-icon">🏷️</span>
                    <span className="meta-text">{complaint.category}</span>
                  </div>
                  <div className="meta-item priority">
                    <span className="meta-icon">⚡</span>
                    <span className="meta-text">{complaint.priority}</span>
                  </div>
                </div>

                {complaint.adminNote && (
                  <div className="admin-note">
                    <strong>Admin Note:</strong> {complaint.adminNote}
                  </div>
                )}

                {/* Feedback Section */}
                <div className="feedback-section">
                  {hasProvidedFeedback(complaint) ? (
                    <div className="feedback-provided">
                      <div className="feedback-status">
                        <span className="feedback-icon">✅</span>
                        <span className="feedback-text">Feedback Provided</span>
                        <span className="feedback-date">
                          {feedbackService.utils.formatFeedbackDate(feedback.createdAt)}
                        </span>
                      </div>
                      <FeedbackForm 
                        complaint={complaint}
                        existingFeedback={feedback}
                        isReadOnly={true}
                      />
                    </div>
                  ) : canProvideFeedback(complaint) ? (
                    <div className="feedback-actions">
                      <div className="feedback-prompt">
                        <span className="feedback-icon">💭</span>
                        <span className="feedback-text">Your complaint has been resolved! Help us improve by providing feedback.</span>
                      </div>
                      <button 
                        className="feedback-btn"
                        onClick={() => handleProvideFeedback(complaint)}
                      >
                        <span>📝</span>
                        Provide Feedback
                      </button>
                    </div>
                  ) : complaint.status === 'Resolved' ? (
                    <div className="feedback-disabled">
                      <span className="feedback-icon">📝</span>
                      <span className="feedback-text">Feedback can be provided once per resolved complaint</span>
                    </div>
                  ) : (
                    <div className="feedback-disabled">
                      <span className="feedback-icon">⏳</span>
                      <span className="feedback-text">Feedback available once complaint is resolved</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}

export default CommunityFeed
