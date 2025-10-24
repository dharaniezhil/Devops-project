import API from './api';

const feedbackService = {
  // Create new feedback for a complaint
  createFeedback: async (feedbackData) => {
    try {
      console.log('Creating feedback:', feedbackData);
      const { data } = await API.post('/feedback', feedbackData);
      console.log('Feedback created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  },

  // Get feedback for a specific complaint
  getComplaintFeedback: async (complaintId, options = {}) => {
    try {
      const { page = 1, limit = 10 } = options;
      console.log(`Getting feedback for complaint ${complaintId}`);
      const { data } = await API.get(`/feedback/complaint/${complaintId}`, { params: { page, limit } });
      console.log('Complaint feedback retrieved:', data);
      return data;
    } catch (error) {
      console.error(`Error getting feedback for complaint ${complaintId}:`, error);
      throw error;
    }
  },

  // Get current user's feedback submissions
  getUserFeedback: async (options = {}) => {
    try {
      const { page = 1, limit = 10 } = options;
      console.log('Getting user feedback submissions');
      const { data } = await API.get('/feedback/my', { params: { page, limit } });
      console.log('User feedback retrieved:', data);
      return data;
    } catch (error) {
      console.error('Error getting user feedback:', error);
      throw error;
    }
  },

  // Check if user can provide feedback for a complaint
  canProvideFeedback: async (complaintId) => {
    try {
      // This is a simple check - you might want to implement a specific endpoint for this
      // For now, we'll try to get the complaint feedback and see if user already provided feedback
      const response = await feedbackService.getComplaintFeedback(complaintId);
      
      // If we can access it and there's no feedback yet, user can provide feedback
      return response.feedbacks && response.feedbacks.length === 0;
    } catch (error) {
      // If we get a 403, user might not have access or already provided feedback
      if (error.status === 403) {
        return false;
      }
      console.error('Error checking feedback eligibility:', error);
      return false;
    }
  },

  // Delete feedback (user can delete their own feedback)
  deleteFeedback: async (feedbackId) => {
    try {
      console.log(`Deleting feedback ${feedbackId}`);
      const { data } = await API.delete(`/feedback/${feedbackId}`);
      console.log('Feedback deleted successfully:', data);
      return data;
    } catch (error) {
      console.error(`Error deleting feedback ${feedbackId}:`, error);
      throw error;
    }
  },

  // Admin functions
  admin: {
    // Get all feedback (admin only)
    getAllFeedback: async (options = {}) => {
      try {
        const { 
          page = 1, 
          limit = 20, 
          visible = null, 
          satisfaction = null 
        } = options;
        
        console.log('Getting all feedback (admin)');
        
        const params = { page, limit };
        if (visible !== null) params.visible = visible;
        if (satisfaction) params.satisfaction = satisfaction;
        
        const { data } = await API.get('/feedback/admin/all', { params });
        console.log('All feedback retrieved (admin):', data);
        return data;
      } catch (error) {
        console.error('Error getting all feedback (admin):', error);
        throw error;
      }
    },

    // Moderate feedback (admin only)
    moderateFeedback: async (feedbackId, moderationData) => {
      try {
        console.log(`Moderating feedback ${feedbackId}:`, moderationData);
        const response = await apiCall(`/feedback/${feedbackId}/moderate`, {
          method: 'PUT',
          data: moderationData
        });
        console.log('Feedback moderated successfully:', response);
        return response;
      } catch (error) {
        console.error(`Error moderating feedback ${feedbackId}:`, error);
        throw error;
      }
    },

    // Get feedback analytics
    getFeedbackAnalytics: async () => {
      try {
        console.log('Getting feedback analytics');
        const response = await feedbackService.admin.getAllFeedback({ page: 1, limit: 1 });
        
        // Extract analytics from the response
        return {
          totalFeedbacks: response.overallStats?.totalFeedbacks || 0,
          averageSatisfaction: response.overallStats?.avgSatisfaction || 0,
          satisfactionDistribution: response.overallStats?.satisfactionDistribution || []
        };
      } catch (error) {
        console.error('Error getting feedback analytics:', error);
        throw error;
      }
    }
  },

  // Utility functions
  utils: {
    // Map satisfaction level to numeric score
    getSatisfactionScore: (satisfaction) => {
      const satisfactionMap = {
        'Very satisfied': 5,
        'Satisfied': 4,
        'Neutral': 3,
        'Unsatisfied': 2,
        'Very unsatisfied': 1
      };
      return satisfactionMap[satisfaction] || 0;
    },

    // Get satisfaction color for UI
    getSatisfactionColor: (satisfaction) => {
      const colorMap = {
        'Very satisfied': '#4CAF50', // Green
        'Satisfied': '#8BC34A',      // Light Green
        'Neutral': '#FFC107',        // Amber
        'Unsatisfied': '#FF9800',    // Orange
        'Very unsatisfied': '#F44336' // Red
      };
      return colorMap[satisfaction] || '#757575'; // Default Gray
    },

    // Format feedback date
    formatFeedbackDate: (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Validate feedback form data
    validateFeedbackData: (feedbackData) => {
      const required = [
        'satisfaction',
        'resolutionMet',
        'timeliness',
        'communication',
        'easeOfUse',
        'recommendation'
      ];

      const missing = required.filter(field => 
        !feedbackData.feedback || !feedbackData.feedback[field]
      );

      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      // Validate complaintId
      if (!feedbackData.complaintId) {
        throw new Error('Complaint ID is required');
      }

      // Validate text fields length
      const textFields = ['likedMost', 'improvement', 'suggestion'];
      textFields.forEach(field => {
        if (feedbackData.feedback[field] && feedbackData.feedback[field].length > 500) {
          throw new Error(`${field} cannot exceed 500 characters`);
        }
      });

      return true;
    }
  }
};

export default feedbackService;