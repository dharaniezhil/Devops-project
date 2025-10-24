// apiUtils.js - Simple utility functions for API calls
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Get JWT token from localStorage (adjust based on how you store it)
const getAuthToken = () => {
  return localStorage.getItem('authToken') || 
         localStorage.getItem('token') || 
         sessionStorage.getItem('token');
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding token to request:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️  No auth token found!');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      console.warn('🚫 Unauthorized - redirecting to login');
      localStorage.removeItem('authToken');
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Complaint API functions
export const complaintAPI = {
  
  // Create a new complaint
  create: async (complaintData) => {
    try {
      console.log('📝 Creating complaint:', complaintData);
      const response = await api.post('/complaints', complaintData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating complaint:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all complaints for the user
  getAll: async (params = {}) => {
    try {
      console.log('📋 Fetching complaints with params:', params);
      const response = await api.get('/complaints', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching complaints:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific complaint by ID
  getById: async (complaintId) => {
    try {
      console.log('🔍 Fetching complaint:', complaintId);
      const response = await api.get(`/complaints/${complaintId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching complaint:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update a complaint
  update: async (complaintId, updateData) => {
    try {
      console.log('✏️ Updating complaint:', complaintId, updateData);
      const response = await api.put(`/complaints/${complaintId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating complaint:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a complaint
  delete: async (complaintId) => {
    try {
      console.log('🗑️ Deleting complaint:', complaintId);
      const response = await api.delete(`/complaints/${complaintId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting complaint:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Example usage in React component:
export const useComplaintAPI = () => {
  
  const submitComplaint = async (formData) => {
    try {
      const result = await complaintAPI.create(formData);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  const fetchUserComplaints = async () => {
    try {
      const result = await complaintAPI.getAll();
      return { 
        success: true, 
        data: result.data || result.complaints || [] 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  };

  return {
    submitComplaint,
    fetchUserComplaints
  };
};

// Test function - run this to check if API is working
export const testComplaintAPI = async () => {
  console.log('🧪 Testing Complaint API...');
  
  const testData = {
    title: 'Test Complaint from Frontend',
    description: 'This is a test complaint to verify API integration works correctly.',
    category: 'Other',
    priority: 'Medium',
    location: 'Test Location'
  };

  try {
    // Test create
    const createResult = await complaintAPI.create(testData);
    console.log('✅ Create test passed:', createResult);

    // Test get all
    const getAllResult = await complaintAPI.getAll();
    console.log('✅ Get all test passed:', getAllResult);

    return { success: true, message: 'All API tests passed!' };
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export default api;
