import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    secretKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSecretKey, setShowSecretKey] = useState(false);

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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    // Secret key is only required if not using temporary password
    if (showSecretKey && !formData.secretKey) {
      newErrors.secretKey = 'Secret key is required';
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
      const loginData = {
        email: formData.email,
        password: formData.password
      };

      // Only include secretKey if it's provided
      if (formData.secretKey) {
        loginData.secretKey = formData.secretKey;
      }

      const response = await axios.post(`${API_BASE_URL}/admin/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Handle password change requirement
        if (response.data.requirePasswordChange) {
          toast.info('Password change required. Redirecting...');
          
          // Store temporary token
          localStorage.setItem('adminToken', response.data.tempToken);
          
          // Navigate to password change page
          navigate('/admin/change-password');
          return;
        }

        // Normal login success
        toast.success('Login successful!');
        
        // Store the token
        localStorage.setItem('adminToken', response.data.token);
        
        // Navigate based on user role
        const redirectPath = response.data.user.role === 'superadmin' 
          ? '/admin/super-dashboard' 
          : '/admin/dashboard';
        
        navigate(redirectPath);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // If secret key is required but not provided, show secret key field
        if (errorMessage.includes('Secret key is required') && !showSecretKey) {
          setShowSecretKey(true);
          toast.error('Secret key is required for admin login');
          return;
        }
        
        toast.error(errorMessage);
      } else if (error.code === 'ECONNREFUSED') {
        toast.error('Unable to connect to server. Please check if the backend is running.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h2>Admin Login</h2>
          <p>Access the FixItFast admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your admin email"
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
            {formData.password === '' && (
              <small className="help-text">
                Use "SuperAdmin@123" if this is your first login
              </small>
            )}
          </div>

          {showSecretKey && (
            <div className="form-group">
              <label htmlFor="secretKey">Secret Key</label>
              <input
                type="password"
                id="secretKey"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                placeholder="Enter your secret key"
                className={errors.secretKey ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.secretKey && (
                <span className="error-message">{errors.secretKey}</span>
              )}
              <small className="help-text">
                Secret key is not required for first-time login with temporary password
              </small>
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>
            Need help? Contact your system administrator.
          </p>
          <Link to="/" className="back-to-home">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;