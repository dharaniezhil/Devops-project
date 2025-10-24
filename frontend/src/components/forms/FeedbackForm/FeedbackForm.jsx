import React, { useState, useEffect } from 'react';
import feedbackService from '../../../services/feedbackService';
import './FeedbackForm.css';

const FeedbackForm = ({ 
  complaint, 
  onSubmitSuccess, 
  onCancel, 
  existingFeedback = null,
  isReadOnly = false 
}) => {
  const [formData, setFormData] = useState({
    satisfaction: '',
    resolutionMet: '',
    timeliness: '',
    communication: '',
    updates: '',
    easeOfUse: '',
    recommendation: '',
    likedMost: '',
    improvement: '',
    suggestion: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [characterCounts, setCharacterCounts] = useState({
    likedMost: 0,
    improvement: 0,
    suggestion: 0
  });

  // Populate form with existing feedback if provided
  useEffect(() => {
    if (existingFeedback) {
      const feedback = existingFeedback.feedback;
      setFormData({
        satisfaction: feedback.satisfaction || '',
        resolutionMet: feedback.resolutionMet || '',
        timeliness: feedback.timeliness || '',
        communication: feedback.communication || '',
        updates: feedback.updates || '',
        easeOfUse: feedback.easeOfUse || '',
        recommendation: feedback.recommendation || '',
        likedMost: feedback.likedMost || '',
        improvement: feedback.improvement || '',
        suggestion: feedback.suggestion || ''
      });
      
      // Update character counts
      setCharacterCounts({
        likedMost: (feedback.likedMost || '').length,
        improvement: (feedback.improvement || '').length,
        suggestion: (feedback.suggestion || '').length
      });
    }
  }, [existingFeedback]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update character count for text fields
    if (['likedMost', 'improvement', 'suggestion'].includes(field)) {
      setCharacterCounts(prev => ({
        ...prev,
        [field]: value.length
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    const required = [
      'satisfaction', 'resolutionMet', 'timeliness', 
      'communication', 'easeOfUse', 'recommendation'
    ];

    required.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Text field length validation
    ['likedMost', 'improvement', 'suggestion'].forEach(field => {
      if (formData[field] && formData[field].length > 500) {
        newErrors[field] = 'Maximum 500 characters allowed';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData = {
        complaintId: complaint._id,
        feedback: formData
      };

      // Validate data using service utility
      feedbackService.utils.validateFeedbackData(feedbackData);

      // Submit feedback
      const response = await feedbackService.createFeedback(feedbackData);
      
      if (onSubmitSuccess) {
        onSubmitSuccess(response.feedback);
      }

    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // Handle validation errors from backend
      if (error.errors && Array.isArray(error.errors)) {
        const backendErrors = {};
        error.errors.forEach(err => {
          const field = err.path || err.param;
          backendErrors[field] = err.msg || err.message;
        });
        setErrors(backendErrors);
      } else {
        // Generic error
        setErrors({
          general: error.message || 'Failed to submit feedback. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRadioGroup = (name, label, options, required = true) => (
    <div className="feedback-form-group">
      <label className="feedback-form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="radio-group">
        {options.map(option => (
          <label key={option} className="radio-option">
            <input
              type="radio"
              name={name}
              value={option}
              checked={formData[name] === option}
              onChange={(e) => handleInputChange(name, e.target.value)}
              disabled={isReadOnly}
            />
            <span className="radio-label">{option}</span>
          </label>
        ))}
      </div>
      {errors[name] && <span className="error-message">{errors[name]}</span>}
    </div>
  );

  const renderTextArea = (name, label, placeholder, required = false) => (
    <div className="feedback-form-group">
      <label className="feedback-form-label">
        {label}
        {required && <span className="required">*</span>}
        <span className="character-count">
          {characterCounts[name]}/500
        </span>
      </label>
      <textarea
        name={name}
        value={formData[name]}
        onChange={(e) => handleInputChange(name, e.target.value)}
        placeholder={placeholder}
        className="feedback-textarea"
        rows={3}
        maxLength={500}
        disabled={isReadOnly}
      />
      {errors[name] && <span className="error-message">{errors[name]}</span>}
    </div>
  );

  if (isReadOnly && existingFeedback) {
    return (
      <div className="feedback-form readonly-feedback">
        <div className="feedback-header">
          <h3>Your Feedback</h3>
          <span className="feedback-date">
            Submitted on {feedbackService.utils.formatFeedbackDate(existingFeedback.createdAt)}
          </span>
        </div>
        
        <div className="feedback-summary">
          <div className="feedback-rating">
            <span className="rating-label">Overall Satisfaction:</span>
            <span 
              className="rating-value"
              style={{ 
                color: feedbackService.utils.getSatisfactionColor(existingFeedback.feedback.satisfaction) 
              }}
            >
              {existingFeedback.feedback.satisfaction}
            </span>
          </div>
          
          <div className="feedback-details">
            <div className="detail-item">
              <strong>Resolution Met Expectations:</strong> {existingFeedback.feedback.resolutionMet}
            </div>
            <div className="detail-item">
              <strong>Timeliness Rating:</strong> {existingFeedback.feedback.timeliness}
            </div>
            <div className="detail-item">
              <strong>Communication Rating:</strong> {existingFeedback.feedback.communication}
            </div>
            <div className="detail-item">
              <strong>System Ease of Use:</strong> {existingFeedback.feedback.easeOfUse}
            </div>
            <div className="detail-item">
              <strong>Would Recommend:</strong> {existingFeedback.feedback.recommendation}
            </div>
          </div>

          {(existingFeedback.feedback.likedMost || 
            existingFeedback.feedback.improvement || 
            existingFeedback.feedback.suggestion) && (
            <div className="feedback-text">
              {existingFeedback.feedback.likedMost && (
                <div className="text-feedback">
                  <strong>What you liked most:</strong>
                  <p>{existingFeedback.feedback.likedMost}</p>
                </div>
              )}
              {existingFeedback.feedback.improvement && (
                <div className="text-feedback">
                  <strong>Suggestions for improvement:</strong>
                  <p>{existingFeedback.feedback.improvement}</p>
                </div>
              )}
              {existingFeedback.feedback.suggestion && (
                <div className="text-feedback">
                  <strong>Additional comments:</strong>
                  <p>{existingFeedback.feedback.suggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <div className="feedback-form-header">
        <h3>Provide Feedback</h3>
        <p>Help us improve our service by sharing your experience</p>
      </div>

      {errors.general && (
        <div className="error-message general-error">
          {errors.general}
        </div>
      )}

      <div className="feedback-sections">
        {/* Service Satisfaction */}
        <div className="feedback-section">
          <h4>🏆 Service Satisfaction</h4>
          
          {renderRadioGroup(
            'satisfaction',
            'How satisfied are you with the resolution of your complaint?',
            ['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied', 'Very unsatisfied']
          )}

          {renderRadioGroup(
            'resolutionMet',
            'Did the resolution meet your expectations?',
            ['Yes, completely', 'Partially', 'Not at all']
          )}

          {renderRadioGroup(
            'timeliness',
            'How would you rate the timeliness of the response?',
            ['Excellent', 'Good', 'Average', 'Poor']
          )}
        </div>

        {/* Communication & Transparency */}
        <div className="feedback-section">
          <h4>📢 Communication & Transparency</h4>
          
          {renderRadioGroup(
            'communication',
            'Was the communication regarding your complaint clear and helpful?',
            ['Yes', 'Somewhat', 'No']
          )}

          {renderRadioGroup(
            'updates',
            'Did you receive timely updates about the status of your complaint?',
            ['Always', 'Sometimes', 'Rarely', 'Never'],
            false
          )}
        </div>

        {/* Overall Experience */}
        <div className="feedback-section">
          <h4>👤 Overall Experience</h4>
          
          {renderRadioGroup(
            'easeOfUse',
            'How easy was it to use the complaint system to submit and track your issue?',
            ['Very easy', 'Easy', 'Average', 'Difficult', 'Very difficult']
          )}

          {renderRadioGroup(
            'recommendation',
            'Would you recommend using this complaint system to others?',
            ['Yes', 'Maybe', 'No']
          )}
        </div>

        {/* Open-ended Feedback */}
        <div className="feedback-section">
          <h4>✍️ Additional Feedback</h4>
          
          {renderTextArea(
            'likedMost',
            'What did you like most about how your complaint was handled?',
            'Share what impressed you about our service...'
          )}

          {renderTextArea(
            'improvement',
            'What can we improve in handling complaints in the future?',
            'Your suggestions help us serve you better...'
          )}

          {renderTextArea(
            'suggestion',
            'Any additional comments or suggestions?',
            'Any other thoughts you\'d like to share...'
          )}
        </div>
      </div>

      <div className="feedback-form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          className="btn-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </div>
    </form>
  );
};

export default FeedbackForm;