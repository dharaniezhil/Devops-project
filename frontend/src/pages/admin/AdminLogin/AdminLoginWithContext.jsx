import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAdminAuth } from '../../../context/AdminAuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, loading } = useAdminAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    secretKey: ''
  });
  const [errors, setErrors] = useState({});
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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

    try {
      const result = await adminLogin({
        email: formData.email,
        password: formData.password,
        secretKey: formData.secretKey || undefined
      });

      if (result.success) {
        if (result.requirePasswordChange) {
          toast.info('Password change required. Redirecting...');
          navigate('/admin/change-password');
        } else {
          toast.success('Login successful!');
          
          // Navigate based on role
          const redirectPath = result.user.role === 'superadmin' 
            ? '/admin/super-dashboard' 
            : '/admin/dashboard';
          
          navigate(redirectPath);
        }
      } else {
        // Check if secret key is required
        if (result.error && result.error.includes('Secret key is required') && !showSecretKey) {
          setShowSecretKey(true);
          toast.error('Secret key is required for admin login');
        } else {
          toast.error(result.error || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
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
              disabled={loading}
              autoComplete="email"
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
              disabled={loading}
              autoComplete="current-password"
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
                disabled={loading}
                autoComplete="off"
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
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
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