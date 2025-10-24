import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AdminAuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [skipVerification, setSkipVerification] = useState(false);
  
  console.log('🔵 AdminAuthProvider RENDER - isAuthenticated:', isAuthenticated, 'admin:', admin?.email);
  
  // Log when isAuthenticated changes
  useEffect(() => {
    console.log('🟡 AdminAuthContext: isAuthenticated changed to:', isAuthenticated, 'admin:', admin?.email);
  }, [isAuthenticated, admin]);

  // Check for existing admin authentication on app start
  useEffect(() => {
    let mounted = true;
    
    const checkAdminAuth = async () => {
      try {
        // Skip verification if we just completed password change
        if (skipVerification) {
          console.log('⏭️ AdminAuthContext: Skipping verification (just changed password)');
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        const token = localStorage.getItem('adminToken');
        console.log('🔍 AdminAuthContext: Checking auth - token exists:', !!token);
        
        if (!token) {
          console.log('⚠️ AdminAuthContext: No token found in localStorage');
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Decode token to check expiry and password change requirement
        try {
          const decoded = jwtDecode(token);
          
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            console.log('⚠️ AdminAuthContext: Token expired, clearing localStorage');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            if (mounted) {
              setLoading(false);
            }
            return;
          }
          console.log('✅ AdminAuthContext: Token valid until', new Date(decoded.exp * 1000).toLocaleString());

          // Check if password change is required
          if (decoded.requirePasswordChange) {
            if (mounted) {
              setRequirePasswordChange(true);
              setIsAuthenticated(true);
              setAdmin({
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name
              });
              setLoading(false);
            }
            return;
          }

        } catch (err) {
          console.error('Error decoding admin token:', err);
        }

        // Verify token with backend
        try {
          const response = await axios.get(`${API_BASE_URL}/admin/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!mounted) return;
          
          if (response.data.user) {
            console.log('✅ AdminAuthContext: Setting isAuthenticated = TRUE for', response.data.user.email);
            setAdmin(response.data.user);
            setIsAuthenticated(true);
            setRequirePasswordChange(false);
            console.log('✅ Admin authenticated:', response.data.user.email);
          }
        } catch (error) {
          console.error('Error verifying admin token:', error);
          
          // Only clear token if it's actually invalid (401/403), not on network errors
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error('❌ AdminAuthContext: Token invalid (401/403), clearing auth');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            
            if (!mounted) return;
            
            console.log('❌ AdminAuthContext: Setting isAuthenticated = FALSE due to 401/403');
            setIsAuthenticated(false);
            setAdmin(null);
            setRequirePasswordChange(false);
          } else {
            // Network error or server error - keep token and try again later
            console.warn('Token verification failed temporarily, keeping session');
            if (!mounted) return;
            
            // Try to use cached user data
            const cachedUser = localStorage.getItem('adminUser');
            if (cachedUser) {
              try {
                const user = JSON.parse(cachedUser);
                setAdmin(user);
                setIsAuthenticated(true);
                setRequirePasswordChange(false);
              } catch (e) {
                console.error('Error parsing cached user:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking admin auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdminAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const adminLogin = async (credentials) => {
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        email: credentials.email,
        password: credentials.password,
        secretKey: credentials.secretKey
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Handle password change requirement
        if (response.data.requirePasswordChange) {
          localStorage.setItem('adminToken', response.data.tempToken);
          localStorage.setItem('adminUser', JSON.stringify(response.data.user));
          
          setAdmin(response.data.user);
          setIsAuthenticated(true);
          setRequirePasswordChange(true);
          
          return { 
            success: true, 
            requirePasswordChange: true,
            user: response.data.user 
          };
        }

        // Normal login success
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        
        setAdmin(response.data.user);
        setIsAuthenticated(true);
        setRequirePasswordChange(false);
        
        return { 
          success: true, 
          requirePasswordChange: false,
          user: response.data.user 
        };
      }

      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('Admin login error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      setIsAuthenticated(false);
      setAdmin(null);
      setRequirePasswordChange(false);
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    setAdmin(null);
    setIsAuthenticated(false);
    setRequirePasswordChange(false);
    
    return { success: true };
  };

  const updateAdminAfterPasswordChange = (token, user) => {
    console.log('🔄 AdminAuthContext: Updating after password change');
    console.log('📝 New token length:', token?.length);
    console.log('👤 User:', user?.email, 'Role:', user?.role);
    
    // Store new token and user data
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    
    // Verify storage
    const storedToken = localStorage.getItem('adminToken');
    console.log('✅ Token stored in localStorage:', storedToken?.substring(0, 20) + '...');
    
    // Update state immediately to prevent re-verification
    setAdmin(user);
    setIsAuthenticated(true);
    setRequirePasswordChange(false);
    setSkipVerification(true); // Skip next verification check
    
    // Reset skip flag after 5 seconds to allow future verifications
    setTimeout(() => {
      setSkipVerification(false);
      console.log('🔓 AdminAuthContext: Re-enabled verification checks');
    }, 5000);
    
    console.log('✅ Password changed successfully. Admin authenticated:', user.email);
  };

  const value = useMemo(() => ({
    admin,
    loading,
    isAuthenticated,
    requirePasswordChange,
    adminLogin,
    adminLogout,
    updateAdminAfterPasswordChange
  }), [admin, loading, isAuthenticated, requirePasswordChange]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;