import React, { createContext, useContext, useState, useEffect } from 'react';
import { complaintsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { COMPLAINT_STATUSES, getStatusDisplayName } from '../utils/constants';

const ComplaintContext = createContext();

export const useComplaint = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaint must be used within a ComplaintProvider');
  }
  return context;
};

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  // Fetch complaints when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchComplaints();
    }
  }, [isAuthenticated, user]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching complaints for user role:', user?.role);
      const response = await complaintsAPI.getAll();
      
      console.log('✅ Complaints response:', response.data);
      
      // Handle different response formats safely
      let complaintsData = [];
      
      if (response.data.success) {
        // Handle both 'data' and 'complaints' properties
        let rawData = response.data.data || response.data.complaints || [];
        
        // Normalize status values to handle legacy data
        complaintsData = rawData.map(complaint => {
          let normalizedStatus = complaint.status;
          
          // Handle legacy status values
          if (normalizedStatus === 'In Progress') {
            normalizedStatus = COMPLAINT_STATUSES.IN_PROGRESS; // 'Inprogress'
          }
          
          return {
            ...complaint,
            status: normalizedStatus
          };
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch complaints');
      }
      
      // Ensure complaintsData is always an array
      if (!Array.isArray(complaintsData)) {
        console.warn('⚠️  Complaints data is not an array:', complaintsData);
        complaintsData = [];
      }
      
      setComplaints(complaintsData);
      console.log(`✅ Set ${complaintsData.length} complaints`);
      
    } catch (err) {
      console.error('❌ Error fetching complaints:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch complaints';
      setError(errorMessage);
      
      // Set empty array on error to prevent crashes
      setComplaints([]);
      
      // Optional: Set sample data for development/testing
      if (process.env.NODE_ENV === 'development') {
        console.log('🛠️  Setting sample data for development');
        setComplaints([
          {
            _id: 'sample1',
            id: 1,
            title: 'Sample: Street Light Not Working',
            description: 'This is sample data - Street light on Main Road has been off for 3 days',
            status: COMPLAINT_STATUSES.PENDING,
            location: 'Main Road, Near Park',
            createdAt: new Date('2025-08-20').toISOString(),
            user: { name: 'John Doe' },
            category: 'Safety & Security',
            priority: 'High'
          },
          {
            _id: 'sample2',
            id: 2,
            title: 'Sample: Water Supply Issue',
            description: 'This is sample data - Low water pressure affecting multiple households',
            status: COMPLAINT_STATUSES.IN_PROGRESS,
            location: 'Gandhi Street',
            createdAt: new Date('2025-08-19').toISOString(),
            user: { name: 'Jane Smith' },
            category: 'Water Supply',
            priority: 'Medium'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createComplaint = async (complaintData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Creating complaint:', complaintData);
      const response = await complaintsAPI.create(complaintData);
      
      console.log('✅ Complaint creation response:', response.data);
      
      if (response.data.success) {
        const newComplaint = response.data.data || response.data.complaint;
        
        if (newComplaint) {
          // Safely add to existing complaints array
          setComplaints(prev => {
            const safeArray = Array.isArray(prev) ? prev : [];
            return [newComplaint, ...safeArray];
          });
          
          // Broadcast complaint creation event for real-time updates
          window.dispatchEvent(new CustomEvent('complaintCreated', { 
            detail: { complaint: newComplaint, timestamp: new Date() }
          }));
        }
        
        return { success: true, data: newComplaint };
      } else {
        throw new Error(response.data.message || 'Failed to create complaint');
      }
    } catch (err) {
      console.error('❌ Error creating complaint:', err);
      
      let errorMessage = 'Failed to create complaint';
      
      // Handle validation errors specifically
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationErrors = err.response.data.errors.map(error => error.msg).join(', ');
        errorMessage = `Validation Error: ${validationErrors}`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (id, status, note) => {
    try {
      const response = await complaintsAPI.updateStatus(id, status, note);
      
      if (response.data.success) {
        setComplaints(prev => 
          prev.map(complaint => 
            complaint.id === id 
              ? { ...complaint, status, lastUpdated: new Date().toISOString() }
              : complaint
          )
        );
        
        // Broadcast complaint status update event for real-time updates
        window.dispatchEvent(new CustomEvent('complaintStatusUpdated', { 
          detail: { complaintId: id, newStatus: status, timestamp: new Date() }
        }));
        
        return { success: true };
      }
    } catch (err) {
      console.error('Error updating complaint status:', err);
      return { success: false, error: err.response?.data?.message || 'Failed to update status' };
    }
  };

  // Safe stats calculation - ensure complaints is always an array
  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  
  const stats = {
    total: safeComplaints.length,
    pending: safeComplaints.filter(c => c?.status === COMPLAINT_STATUSES.PENDING).length,
    inProgress: safeComplaints.filter(c => c?.status === COMPLAINT_STATUSES.IN_PROGRESS).length,
    resolved: safeComplaints.filter(c => c?.status === COMPLAINT_STATUSES.RESOLVED).length
  };

  // Helper functions
  const clearError = () => setError(null);
  
  const refreshComplaints = async () => {
    return await fetchComplaints();
  };
  
  const getComplaintById = (id) => {
    if (!Array.isArray(complaints)) return null;
    return complaints.find(complaint => complaint._id === id || complaint.id === id) || null;
  };
  
  const hasComplaints = () => {
    return Array.isArray(complaints) && complaints.length > 0;
  };

  const value = {
    // State
    complaints: safeComplaints, // Always return safe array
    loading,
    error,
    stats,
    
    // Actions
    setComplaints,
    fetchComplaints,
    refreshComplaints,
    createComplaint,
    updateComplaintStatus,
    clearError,
    
    // Helpers
    getComplaintById,
    hasComplaints,
    complaintsCount: safeComplaints.length
  };

  return (
    <ComplaintContext.Provider value={value}>
      {children}
    </ComplaintContext.Provider>
  );
};
