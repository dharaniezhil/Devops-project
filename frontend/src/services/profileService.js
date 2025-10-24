// src/services/profileService.js
import API from './api';

/**
 * Profile API Service
 * Handles all profile-related API calls to the backend
 */

/**
 * Get all profiles with optional filtering
 * @param {Object} filters - Query parameters (page, limit, city, state, etc.)
 * @returns {Promise} API response with profiles list and pagination
 */
export const getAllProfiles = async (filters = {}) => {
  try {
    console.log('🔍 Fetching all profiles with filters:', filters);
    
    const response = await API.get('/profiles', { params: filters });
    
    console.log('✅ Profiles fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching profiles:', error);
    throw error;
  }
};

/**
 * Get a specific profile by ID
 * @param {string} profileId - The profile ID to fetch
 * @returns {Promise} API response with profile data
 */
export const getProfileById = async (profileId) => {
  try {
    console.log(`🔍 Fetching profile with ID: ${profileId}`);
    
    const response = await API.get(`/profiles/${profileId}`);
    
    console.log('✅ Profile fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching profile ${profileId}:`, error);
    throw error;
  }
};

/**
 * Get current authenticated user's profile
 * @returns {Promise} API response with current user's profile or null if no profile exists
 */
export const getCurrentUserProfile = async () => {
  try {
    console.log('🔍 Fetching current user profile');
    
    const response = await API.get('/profile/me');
    
    console.log('✅ Current user profile fetched successfully:', response.data);
    
    // Check if profile data exists, return null if no profile found
    if (response.data.success && !response.data.data) {
      console.log('📝 No profile data found (this is normal for new users)');
      return null;
    }
    
    return response.data;
  } catch (error) {
    // Handle 404 gracefully - user doesn't have a profile yet
    if (error.response?.status === 404) {
      console.log('📝 No profile found for current user (this is normal for new users)');
      return null;
    }
    
    // For other errors, log and throw
    console.error('❌ Error fetching current user profile:', error);
    throw error;
  }
};

/**
 * Create or update profile (unified function)
 * @param {Object} profileData - The profile data to create or update
 * @returns {Promise} API response with profile data
 */
export const createProfile = async (profileData) => {
  try {
    console.log('📝 Creating profile:', { ...profileData, email: '[PROTECTED]' });
    
    // Transform frontend form data to backend expected format
    const transformedData = {
      name: profileData.name || '',
      email: profileData.email || '',
      bio: profileData.bio || '',
      dateOfBirth: profileData.dateOfBirth || null,
      gender: profileData.gender || null,
      nationality: profileData.nationality || '',
      occupation: profileData.occupation || '',
      phone: profileData.phone || '',
      alternatePhone: profileData.alternatePhone || '',
      languages: Array.isArray(profileData.languages) ? profileData.languages : [],
      interests: Array.isArray(profileData.interests) ? profileData.interests : [],
      emergencyContact: {
        name: profileData.emergencyContact?.name || '',
        phone: profileData.emergencyContact?.phone || '',
        relationship: profileData.emergencyContact?.relationship || ''
      },
      socialMedia: {
        twitter: profileData.socialMedia?.twitter || '',
        linkedin: profileData.socialMedia?.linkedin || '',
        facebook: profileData.socialMedia?.facebook || ''
      },
      // Transform address to location format expected by backend
      location: {
        country: profileData.location?.country || '',
        state: profileData.location?.state || '',
        city: profileData.location?.city || '',
        address: profileData.location?.address || '',
        pincode: profileData.location?.pincode || '',
        latitude: profileData.location?.latitude || null,
        longitude: profileData.location?.longitude || null
      }
    };
    
    console.log('🔄 Transformed data for backend:', { ...transformedData, email: '[PROTECTED]' });
    
    // Use POST endpoint for create/update
    const response = await API.post('/profile', transformedData);
    
    console.log('✅ Profile created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating profile:', error);
    throw error;
  }
};

/**
 * Update profile (alias for createProfile - same function)
 * @param {string} profileId - Ignored (kept for compatibility)
 * @param {Object} profileData - The profile data to update
 * @returns {Promise} API response with updated profile
 */
export const updateProfile = async (profileId, profileData) => {
  // Use the unified create/update function
  return createProfile(profileData);
};

/**
 * Update current user's profile (transforms frontend data to backend format)
 * @param {Object} profileData - The profile data from frontend form
 * @returns {Promise} API response with updated profile
 */
export const updateCurrentUserProfile = async (profileData) => {
  try {
    console.log('📝 Updating current user profile:', { ...profileData, email: '[PROTECTED]' });
    
    // Transform frontend form data to backend expected format
    const transformedData = {
      name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),

      bio: profileData.bio || '',
      // Transform address to location format expected by backend
      location: {
        country: profileData.address?.country || '',
        state: profileData.address?.state || '',
        city: profileData.address?.city || '',
        address: profileData.address?.street || ''
      },
      phone: profileData.phone || ''
    };
    
    console.log('🔄 Transformed data for backend:', { ...transformedData, email: '[PROTECTED]' });
    
    // Use POST endpoint for create/update with upsert
    const response = await API.post('/profile', transformedData);
    
    console.log('✅ Profile updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
};

/**
 * Delete a profile by ID
 * @param {string} profileId - The profile ID to delete
 * @returns {Promise} API response confirmation
 */
export const deleteProfile = async (profileId) => {
  try {
    console.log(`🗑️ Deleting profile: ${profileId}`);
    
    const response = await API.delete(`/profiles/${profileId}`);
    
    console.log('✅ Profile deleted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting profile ${profileId}:`, error);
    throw error;
  }
};

// Note: Privacy and stats endpoints have been removed in simplified version
// Use the basic profile update route for any profile modifications

// Example Profile Data Structure for reference (simplified version):
export const exampleProfileData = {
  name: "John Doe",
  email: "john.doe@example.com",
  bio: "Passionate about making communities better through technology.",
  location: {
    country: "India",
    state: "Maharashtra", 
    city: "Mumbai",
    address: "123 Marine Drive"
  },
  phone: "+91 98765 43210"
};

// Sample JSON for profile creation request:
export const sampleCreateRequest = {
  name: "Jane Smith",
  email: "jane.smith@email.com",
  bio: "Full-stack developer with 3+ years experience",
  location: {
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    address: "456 Connaught Place"
  },
  phone: "+91 87654 32109"
};

// Sample JSON response after profile creation:
export const sampleCreateResponse = {
  success: true,
  data: {
    _id: "507f1f77bcf86cd799439011",
    user: "507f1f77bcf86cd799439010",
    name: "Jane Smith",
    email: "jane.smith@email.com",
    bio: "Full-stack developer with 3+ years experience",
    location: {
      country: "India",
      state: "Delhi",
      city: "New Delhi",
      address: "456 Connaught Place"
    },
    phone: "+91 87654 32109",
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-15T10:30:00.000Z"
  },
  message: "Profile created successfully"
};

/**
 * Upload profile picture
 * @param {File} file - The image file to upload
 * @returns {Promise} API response with uploaded image data
 */
export const uploadProfilePicture = async (file) => {
  try {
    console.log('📸 Uploading profile picture');
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await API.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ Profile picture uploaded successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Remove profile picture
 * @returns {Promise} API response confirmation
 */
export const removeProfilePicture = async () => {
  try {
    console.log('🗑️ Removing profile picture');
    
    const response = await API.delete('/profile/picture');
    
    console.log('✅ Profile picture removed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error removing profile picture:', error);
    throw error;
  }
};

/**
 * Change password
 * @param {Object} passwordData - Current and new password
 * @returns {Promise} API response confirmation
 */
export const changePassword = async (passwordData) => {
  try {
    console.log('🔒 Changing password');
    
    const response = await API.post('/profile/change-password', passwordData);
    
    console.log('✅ Password changed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error changing password:', error);
    throw error;
  }
};

/**
 * Update notification settings
 * @param {Object} notificationSettings - Notification preferences
 * @returns {Promise} API response with updated settings
 */
export const updateNotifications = async (notificationSettings) => {
  try {
    console.log('🔔 Updating notification settings:', notificationSettings);
    
    const response = await API.post('/profile/notifications', notificationSettings);
    
    console.log('✅ Notification settings updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating notification settings:', error);
    throw error;
  }
};

/**
 * Update theme preference
 * @param {string} theme - Selected theme
 * @returns {Promise} API response with updated theme
 */
export const updateTheme = async (theme) => {
  try {
    console.log('🎨 Updating theme:', theme);
    
    const response = await API.post('/profile/theme', { theme });
    
    console.log('✅ Theme updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating theme:', error);
    throw error;
  }
};

/**
 * Get profile completion status
 * @returns {Promise} API response with completion data
 */
export const getProfileCompletion = async () => {
  try {
    console.log('📊 Getting profile completion status');
    
    const response = await API.get('/profile/completion');
    
    console.log('✅ Profile completion data retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting profile completion:', error);
    throw error;
  }
};

// Enhanced profile data structure example
export const enhancedProfileDataExample = {
  name: "John Doe",
  email: "john.doe@example.com",
  dateOfBirth: "1990-01-15",
  age: 34,
  role: "User", // Fixed, not editable
  status: "Active", // Read-only
  phone: "+91 98765 43210",
  emergencyContact: {
    name: "Jane Doe",
    phone: "+91 98765 43211",
    relationship: "Spouse"
  },
  address: "123 Main Street, Apartment 4B, Near Central Park",
  location: {
    country: "India",
    state: "Maharashtra", 
    city: "Mumbai",
    address: "123 Marine Drive"
  },
  profilePicture: {
    url: "https://cloudinary.com/image/upload/profile123.jpg",
    base64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    publicId: "profile_pictures/user123",
    uploadedAt: "2024-01-15T10:30:00.000Z"
  },
  notifications: {
    email: true,
    sms: false,
    push: true,
    complaints: true,
    updates: true
  },
  theme: "Light", // Light, Dark, Green+Gray, Orange+Blue, Blue+White
  bio: "Passionate about making communities better through technology.",
  isCompleted: true,
  completionPercentage: 95
};

// Export all functions as default object and individual exports
export default {
  getAllProfiles,
  getProfileById,
  getCurrentUserProfile,
  createProfile,
  updateProfile,
  updateCurrentUserProfile,
  deleteProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
  updateNotifications,
  updateTheme,
  getProfileCompletion,
  exampleProfileData,
  enhancedProfileDataExample,
  sampleCreateRequest,
  sampleCreateResponse
};
