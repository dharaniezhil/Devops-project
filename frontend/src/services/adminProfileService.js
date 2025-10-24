// frontend/src/services/adminProfileService.js
import API from './api.js';

export const adminProfileAPI = {
  /**
   * Get current admin's profile
   * @returns {Promise} API response with profile data
   */
  getProfile: async () => {
    try {
      console.log('🔄 Fetching admin profile...');
      const response = await API.get('/admin/profile');
      console.log('✅ Admin profile fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching admin profile:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update admin profile information
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} API response
   */
  updateProfile: async (profileData) => {
    try {
      console.log('🔄 Updating admin profile...', profileData);
      const response = await API.put('/admin/profile', profileData);
      console.log('✅ Admin profile updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating admin profile:', error.response?.data || error.message);
      throw error;
    }
  },


  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validatePhone: (phone) => {
    if (!phone || phone.trim() === '') return true; // Optional field
    const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Change admin password
   * @param {Object} passwordData - Current and new password data
   * @returns {Promise} API response
   */
  changePassword: async (passwordData) => {
    try {
      console.log('🔄 Changing admin password...');
      const response = await API.post('/admin/profile/change-password', passwordData);
      console.log('✅ Admin password changed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error changing admin password:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Upload admin profile picture
   * @param {File} imageFile - Image file to upload
   * @returns {Promise} API response
   */
  uploadProfilePicture: async (imageFile) => {
    try {
      console.log('🔄 Uploading profile picture...');
      
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('profilePicture', imageFile);
      
      // Upload with multipart/form-data content type
      const response = await API.post('/admin/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Profile picture uploaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {Object} Validation result with isValid and message
   */
  validateImageFile: (file) => {
    if (!file) {
      return { isValid: false, message: 'Please select an image file' };
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, message: 'Please select a valid image file' };
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return { isValid: false, message: 'Image file must be less than 5MB' };
    }
    
    return { isValid: true, message: '' };
  },

  /**
   * Validate password
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with isValid and message
   */
  validatePassword: (password) => {
    if (!password || password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }
    return { isValid: true, message: '' };
  }
};

export default adminProfileAPI;