// frontend/src/service/api.js
import axios from 'axios';

// Resolve API base URL across Vite and CRA-style envs
const resolveApiBaseUrl = () => {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined;
  const craUrl = typeof process !== 'undefined' ? (process.env?.REACT_APP_API_URL || process.env?.REACT_APP_BACKEND_URL) : undefined;
  const raw = viteUrl || craUrl || 'http://localhost:5000/api';
  const cleaned = String(raw).replace(/\/$/, '');
  // Ensure trailing /api for consistent backend mount
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

// Create axios instance with base configuration
const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug base URL once at startup
try {
  // eslint-disable-next-line no-console
  console.log('API baseURL:', API.defaults.baseURL);
} catch (_) {}

// Request interceptor to add token to requests
API.interceptors.request.use(
  (config) => {
    // Check for both user token and admin token
    const path = config.url || '';
    const isAdminRequest = path.includes('/admin') || path.includes('/admins');
    
    // For admin requests, prioritize adminToken
    let token = isAdminRequest 
      ? localStorage.getItem('adminToken') || localStorage.getItem('authToken')
      : localStorage.getItem('authToken') || localStorage.getItem('adminToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = (typeof window !== 'undefined' && window.location?.pathname) || '';
      const isAdminArea = path.startsWith('/admin');
      const isLabourArea = path.startsWith('/labour');
      
      // Clear appropriate tokens based on the area
      if (isAdminArea) {
        console.log('🔐 API Interceptor: 401 in admin area, clearing admin tokens');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        const target = '/admin/login';
        if (path !== target && path !== '/admin/change-password') {
          window.location.href = target;
        }
      } else if (isLabourArea) {
        console.log('🔐 API Interceptor: 401 in labour area, clearing labour tokens');
        localStorage.removeItem('labourToken');
        localStorage.removeItem('labourUser');
        const target = '/labour/login';
        if (path !== target) {
          window.location.href = target;
        }
      } else {
        console.log('🔐 API Interceptor: 401 in user area, clearing user tokens');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        const target = '/signin';
        if (path !== target) {
          window.location.href = target;
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls (users)
export const authAPI = {
  // Credentials login: email/password
  login: (credentials) => API.post('/auth/login', credentials),
  // Standardize under /api/auth
  register: (userData) => API.post('/auth/register', userData),
  getMe: () => API.get('/auth/me'),
};

// Labour API calls
export const labourAPI = {
  getAssignedComplaints: () => API.get('/labour/complaints'),
  updateComplaintStatus: (id, status, remarks = '') => API.put(`/complaints/${id}/status`, { status, remarks }),
  getProfile: () => API.get('/labour/profile'),
  updateProfile: (data) => API.post('/labour/profile/update', data),
  changePassword: ({ oldPassword, newPassword }) => API.post('/labour/change-password', { oldPassword, newPassword }),
  getStats: () => API.get('/labour/complaints/stats'),
  
  // Attendance API calls
  markAttendance: (type, location = '', remarks = '') => API.post('/labour/attendance', { type, location, remarks }),
  getAttendanceHistory: (params = {}) => API.get('/labour/attendance', { params }),
  getCurrentAttendanceStatus: () => API.get('/labour/attendance/status'),
  getAttendanceStats: (params = {}) => API.get('/labour/attendance/stats', { params }),
  toggleBreak: (location = '', remarks = '') => API.post('/labour/attendance/break-toggle', { location, remarks }),
  getTodayAttendance: () => API.get('/labour/attendance/today'),
  getRecentAttendance: (days = 7) => API.get('/labour/attendance/recent', { params: { days } }),
  getMonthlyChart: (month, year) => API.get('/labour/attendance/monthly-chart', { params: { month, year } }),
  getLeaveStatus: (date) => API.get('/labour/attendance/leave-status', { params: date ? { date } : {} }),
  markLeave: (location = '', remarks = '') => API.post('/labour/attendance', { type: 'leave', location, remarks }),
};

// Admin API calls (admins)
export const adminAPI = {
  login: (credentials) => API.post('/admins/login', credentials),
  register: (data) => API.post('/admins/register', data),
  dashboard: () => API.get('/admins/dashboard'),
  superDashboard: () => API.get('/admins/super-dashboard'),
  listUsers: () => API.get('/admins/users'),
  listAdmins: () => API.get('/admins/admins'),
  // Admin-labour management (kept for compatibility if needed)
  listLabours: () => API.get('/admins/labours'),
  createLabour: (data) => API.post('/admins/labours', data),
  createAdmin: (data) => API.post('/admins/create-admin', data),
  deleteAdmin: (id) => API.delete(`/admins/admins/${id}`),
  deleteUser: (id) => API.delete(`/admins/users/${id}`),
  getMe: () => API.get('/admins/me'),
  // Complaints (admin-specific helpers)
  getAllComplaints: (params) => API.get('/admin/complaints', { params }),
  getAllComplaintsFromMain: (params) => API.get('/complaints', { params }), // Uses main complaints endpoint
  getPendingComplaints: () => API.get('/admin/complaints/pending'),
  assignComplaint: (id, labourId) => API.put(`/complaints/${id}/assign`, { labourId }),
  getAvailableLabours: () => API.get('/complaints/available-labours'),
  getLabourStatus: () => API.get('/admin/attendance/labour-status'),
  
  // Attendance management (admin-specific)
  getAllAttendance: (params = {}) => API.get('/admin/attendance', { params }),
  getLabourAttendance: (labourId, params = {}) => API.get(`/admin/attendance/labour/${labourId}`, { params }),
  getCurrentlyOnDuty: () => API.get('/admin/attendance/on-duty'),
  getAttendanceReport: (params = {}) => API.get('/admin/attendance/report', { params }),
  updateAttendance: (id, data) => API.put(`/admin/attendance/${id}`, data),
  deleteAttendance: (id) => API.delete(`/admin/attendance/${id}`),
};

// SuperAdmin API calls
export const superadminAPI = {
  createLabour: (data) => API.post('/superadmin/labours/create', data),
  listLabours: () => API.get('/superadmin/labours'),
};

// Complaints API calls
export const complaintsAPI = {
  getAll: (params) => API.get('/complaints', { params }),
  create: (complaintData) => {
    // Handle FormData for file uploads
    const isFormData = complaintData instanceof FormData;
    const config = {};
    
    // For FormData, don't set Content-Type - let browser set it with proper boundary
    if (!isFormData) {
      config.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    return API.post('/complaints', complaintData, config);
  },
  update: (id, data) => API.put(`/complaints/${id}`, data),
  updateStatus: (id, status, note) => API.put(`/complaints/${id}/status`, { status, note }),
  assign: (id, labourId, note='') => API.put(`/complaints/${id}/assign`, { labourId, note }),
  delete: (id) => API.delete(`/complaints/${id}`),
  like: (id) => API.post(`/complaints/${id}/like`),
  getUserComplaints: (filters) => API.get('/complaints', { params: filters }),

};

// Reports API calls (Admin & SuperAdmin only)
export const reportsAPI = {
  getMetrics: (params = {}) => API.get('/admins/reports/metrics', { params }),
  regenerate: (params = {}) => API.post('/admins/reports/regenerate', params),
  exportCSV: (params = {}) => API.get('/admins/reports/export.csv', { params, responseType: 'blob' }),
  exportExcel: (params = {}) => API.get('/admins/reports/export.xlsx', { params, responseType: 'blob' }),
  exportPDF: (params = {}) => API.get('/admins/reports/export.pdf', { params, responseType: 'blob' }),
};

// Dashboard API calls
export const dashboardAPI = {
  // Get dashboard statistics for the logged-in user
  getDashboardData: async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      const response = await API.get('/dashboard/me');
      console.log('✅ Dashboard data fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error.response?.data || error.message);
      throw error;
      
    }
  },

  // Get admin dashboard statistics (admin only)
  getAdminStats: async () => {
    try {
      console.log('🔄 Fetching admin dashboard stats...');
      const response = await API.get('/dashboard/admin/stats');
      console.log('✅ Admin dashboard data fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching admin dashboard data:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Contact API calls
export const contactAPI = {
  // Send contact message (public)
  sendMessage: async (data) => {
    try {
      console.log('🔄 Sending contact message...');
      const response = await API.post('/contact', data);
      console.log('✅ Contact message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending contact message:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all contact messages (admin only)
  getMessages: async (params = {}) => {
    try {
      console.log('🔄 Fetching contact messages...');
      const response = await API.get('/contact', { params });
      console.log('✅ Contact messages fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching contact messages:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update contact message status (admin only)
  updateStatus: async (id, status, adminResponse = '') => {
    try {
      console.log(`🔄 Updating contact status for ID: ${id}`);
      const response = await API.put(`/contact/${id}/status`, { status, adminResponse });
      console.log('✅ Contact status updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating contact status:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get contact statistics (admin only)
  getStats: async () => {
    try {
      console.log('🔄 Fetching contact statistics...');
      const response = await API.get('/contact/stats');
      console.log('✅ Contact statistics fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching contact statistics:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Users API calls
export const usersAPI = {
  getAll: (params) => API.get('/users', { params }),
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  updateStatus: (id, status) => API.put(`/users/${id}/status`, { status }),
};

// Current User (self) helpers
export const meAPI = {
  getRecentlyAccessed: () => API.get('/user/recently-accessed'),
};

// Extra complaints helpers
export const complaintExtrasAPI = {
  recordAccess: (id) => API.post(`/complaints/${id}/access`),
};

// API Helper functions
export const apiHelpers = {
  // Handle API errors consistently
  handleError: (error) => {
    if (error.response) {
      const message = error.response.data?.message || 
                     error.response.data?.errors?.[0] || 
                     `Server error: ${error.response.status}`;
      return { message, status: error.response.status };
    } else if (error.request) {
      return { message: 'Network error - please check your connection', status: 0 };
    } else {
      return { message: error.message || 'An unexpected error occurred', status: -1 };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

// Legacy export for backward compatibility
export const sendContactMessage = contactAPI.sendMessage;

export default API;