import React, { useState } from 'react';
import './Feedback.css';

const Feedback = () => {
  const [feedbackData, setFeedbackData] = useState({
    complaintId: '',
    rating: 0,
    comments: '',
    wouldRecommend: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const resolvedComplaints = [
    { id: 1, title: "Street Light Fixed", date: "2024-01-10" },
    { id: 2, title: "Water Supply Restored", date: "2024-01-08" },
    { id: 3, title: "Road Pothole Filled", date: "2024-01-05" }
  ];

  const handleChange = (e) => {
    setFeedbackData({
      ...feedbackData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingClick = (rating) => {
    setFeedbackData({
      ...feedbackData,
      rating: rating
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Feedback data:', feedbackData);
    setIsSubmitting(false);
  };

  const getStarClass = (starIndex) => {
    if (hoveredStar > 0) {
      return starIndex <= hoveredStar ? 'star filled hovered' : 'star';
    }
    return starIndex <= feedbackData.rating ? 'star filled' : 'star';
  };

  const getRatingText = () => {
    const rating = hoveredStar || feedbackData.rating;
    const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return rating > 0 ? texts[rating] : '';
  };

  return (
    <main className="feedback-container">
      {/* Floating Background Blobs */}
      <div className="floating-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      <div className="feedback-wrapper">
        {/* Header Section */}
        <header className="page-header">
          <div className="header-icon">💝</div>
          <h1 className="page-title">
            Share Your <span className="gradient-text">Experience</span>
          </h1>
          <p className="page-subtitle">
            Help us improve our service by sharing your valuable feedback ✨
          </p>
        </header>

        {/* Feedback Form */}
        <form className="feedback-form glass-card" onSubmit={handleSubmit}>
          {/* Complaint Selection */}
          <div className="form-group animate-up" style={{'--delay': '0.1s'}}>
            <label htmlFor="complaintId" className="form-label">
              <span className="label-icon">📋</span>
              Select Resolved Complaint
            </label>
            <div className="select-wrapper">
              <select
                id="complaintId"
                name="complaintId"
                value={feedbackData.complaintId}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Choose a complaint...</option>
                {resolvedComplaints.map(complaint => (
                  <option key={complaint.id} value={complaint.id}>
                    {complaint.title} - {complaint.date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Star Rating */}
          <div className="form-group animate-up" style={{'--delay': '0.2s'}}>
            <label className="form-label">
              <span className="label-icon">⭐</span>
              Rate Your Satisfaction
            </label>
            <div className="rating-container">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={getStarClass(star)}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                  >
                    <span className="star-icon">⭐</span>
                    <div className="star-glow"></div>
                  </button>
                ))}
              </div>
              <div className="rating-text">
                {getRatingText() && (
                  <span className="rating-label">{getRatingText()}</span>
                )}
                {feedbackData.rating > 0 && (
                  <small className="rating-count">{feedbackData.rating} out of 5 stars</small>
                )}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="form-group animate-up" style={{'--delay': '0.3s'}}>
            <label htmlFor="comments" className="form-label">
              <span className="label-icon">💭</span>
              Additional Comments
            </label>
            <div className="textarea-wrapper">
              <textarea
                id="comments"
                name="comments"
                value={feedbackData.comments}
                onChange={handleChange}
                rows="4"
                className="form-textarea"
                placeholder="Share your experience, suggestions, or concerns... ✨"
              ></textarea>
            </div>
          </div>

          {/* Recommendation */}
          <div className="form-group animate-up" style={{'--delay': '0.4s'}}>
            <label className="form-label">
              <span className="label-icon">🤝</span>
              Would you recommend FixItFast to others?
            </label>
            <div className="recommendation-group">
              {[
                { value: 'yes', label: 'Yes, definitely', icon: '💚', color: '#34d399' },
                { value: 'maybe', label: 'Maybe', icon: '💛', color: '#fbbf24' },
                { value: 'no', label: 'No', icon: '💔', color: '#f87171' }
              ].map(option => (
                <label key={option.value} className="recommendation-option">
                  <input
                    type="radio"
                    name="wouldRecommend"
                    value={option.value}
                    checked={feedbackData.wouldRecommend === option.value}
                    onChange={handleChange}
                  />
                  <span 
                    className="recommendation-pill"
                    style={{'--option-color': option.color}}
                  >
                    <span className="pill-icon">{option.icon}</span>
                    <span className="pill-text">{option.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-group animate-up" style={{'--delay': '0.5s'}}>
            <button 
              type="submit" 
              className={`submit-btn ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              <span className="btn-content">
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <span className="btn-icon">🚀</span>
                  </>
                )}
              </span>
              <div className="btn-glow"></div>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Feedback;