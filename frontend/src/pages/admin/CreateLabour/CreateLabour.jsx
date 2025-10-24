import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import './CreateLabour.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const CreateLabour = () => {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();

  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    identityKey: '',
    password: '',
    district: '',
    pincode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [adminCity, setAdminCity] = useState('');

  // Fetch admin details to get city information
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const response = await axios.get(`${API_BASE_URL}/admin/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.user) {
          setAdminCity(response.data.user.assignedCity || 'Not Assigned');
        }
      } catch (error) {
        console.error('Error fetching admin details:', error);
        if (admin) {
          setAdminCity(admin.assignedCity || 'Not Assigned');
        }
      }
    };

    fetchAdminDetails();
  }, [admin]);

  const generateIdentityKey = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData(prev => ({ ...prev, identityKey: result }));
  };

  const generatePassword = () => {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26));
    password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
    password += '0123456789'.charAt(Math.floor(Math.random() * 10));
    password += '@#$%&*'.charAt(Math.floor(Math.random() * 6));
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({ ...prev, password }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-capitalize and limit identityKey
    if (name === 'identityKey') {
      const uppercased = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: uppercased.slice(0, 6)
      }));
    }
    // Limit phone to numbers only
    else if (name === 'phone') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly.slice(0, 10)
      }));
    }
    // Limit pincode to numbers only
    else if (name === 'pincode') {
      const numbersOnly = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly.slice(0, 6)
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Identity Key validation
    if (!formData.identityKey) {
      newErrors.identityKey = 'Identity Key is required';
    } else if (!/^[A-Z0-9]{6}$/.test(formData.identityKey)) {
      newErrors.identityKey = 'Identity Key must be exactly 6 alphanumeric characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Pincode validation (optional)
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/admin/labours/create`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('✅ Labour created successfully. Login credentials are ready.');
        
        // Show credentials in a formatted message
        const credentials = `
Name: ${response.data.labour.name}
Email: ${response.data.labour.email}
Identity Key: ${response.data.labour.identityKey}
Password: ${formData.password}
City: ${response.data.labour.city}
        `.trim();
        
        console.log('Labour Credentials:\n' + credentials);
        
        // Optionally navigate to labour list or stay for creating another
        setTimeout(() => {
          navigate('/admin/labours');
        }, 2000);
      }
    } catch (error) {
      console.error('Create labour error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create labour account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      identityKey: '',
      password: '',
      district: '',
      pincode: ''
    });
    setErrors({});
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  return (
    <div className="create-labour-container">
      <div className="create-labour-card">
        <div className="create-labour-header">
          <h2>Create Labour Account</h2>
          <p>Create a new labour account with login credentials</p>
        </div>

        <div className="admin-city-info">
          <span className="info-label">Auto-filled City:</span>
          <span className="info-value">{adminCity}</span>
        </div>

        <form onSubmit={handleSubmit} className="create-labour-form">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className={errors.name ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              className={errors.phone ? 'error' : ''}
              disabled={isLoading}
              maxLength="10"
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="labour@example.com"
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Identity Key */}
          <div className="form-group">
            <label htmlFor="identityKey">
              Identity Key (6 characters) <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <input
                type="text"
                id="identityKey"
                name="identityKey"
                value={formData.identityKey}
                onChange={handleChange}
                placeholder="ABC123"
                className={errors.identityKey ? 'error' : ''}
                disabled={isLoading}
                maxLength="6"
              />
              <button
                type="button"
                onClick={generateIdentityKey}
                className="btn-generate"
                disabled={isLoading}
                title="Generate random 6-character ID"
              >
                Generate
              </button>
              {formData.identityKey && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.identityKey)}
                  className="btn-copy"
                  disabled={isLoading}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              )}
            </div>
            {errors.identityKey && <span className="error-message">{errors.identityKey}</span>}
            <small className="field-hint">Labour can login using this 6-character code</small>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-toggle"
                disabled={isLoading}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="btn-generate"
                disabled={isLoading}
                title="Generate strong password"
              >
                Generate
              </button>
              {formData.password && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.password)}
                  className="btn-copy"
                  disabled={isLoading}
                  title="Copy to clipboard"
                >
                  📋
                </button>
              )}
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* District (Optional) */}
          <div className="form-group">
            <label htmlFor="district">District (Optional)</label>
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="Enter district"
              disabled={isLoading}
            />
          </div>

          {/* Pincode (Optional) */}
          <div className="form-group">
            <label htmlFor="pincode">Pincode (Optional)</label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="6-digit pincode"
              className={errors.pincode ? 'error' : ''}
              disabled={isLoading}
              maxLength="6"
            />
            {errors.pincode && <span className="error-message">{errors.pincode}</span>}
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Labour'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={isLoading}
            >
              Reset Form
            </button>
          </div>
        </form>

        <div className="create-labour-footer">
          <p className="info-text">
            <strong>Note:</strong> The labour can login using either their Email or Identity Key along with the password you set.
          </p>
          <p className="info-text">
            City will be automatically set to: <strong>{adminCity}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateLabour;
