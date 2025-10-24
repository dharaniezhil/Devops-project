import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import './AdminChangePassword.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
console.log("API baseURL:", API_BASE_URL);


const AdminChangePassword = () => {
  const navigate = useNavigate();
  const { updateAdminAfterPasswordChange, admin } = useAdminAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    } else if (formData.newPassword === 'SuperAdmin@123') {
      newErrors.newPassword = 'Cannot use the temporary password as your new password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation is required';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get the temporary token from localStorage
      const tempToken = localStorage.getItem('adminToken');
      
      if (!tempToken) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/admin/change-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      }, {
        headers: {
          'Authorization': `Bearer ${tempToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Password changed successfully!');
        
        // Update admin context
        updateAdminAfterPasswordChange(response.data.token, response.data.user);
        
        // Navigate based on user role
        const redirectPath = response.data.user.role === 'superadmin' 
          ? '/admin/super-dashboard' 
          : '/admin/dashboard';
        
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-change-password-container">
      <div className="admin-change-password-card">
        <div className="admin-change-password-header">
          <h2>Change Password</h2>
          <p>You must change your password before accessing the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter your current password"
              className={errors.currentPassword ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.currentPassword && (
              <span className="error-message">{errors.currentPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter your new password (min 6 characters)"
              className={errors.newPassword ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="change-password-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>

        <div className="admin-change-password-footer">
          <p>
            <strong>Note:</strong> After changing your password, you will no longer need a secret key to login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminChangePassword;