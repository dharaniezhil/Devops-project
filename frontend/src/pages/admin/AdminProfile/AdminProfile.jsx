// AdminProfile.jsx
import React, { useState, useEffect } from 'react';
import { adminProfileAPI } from '../../../services/adminProfileService';
import './AdminProfile.css';

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    department: '',
    bio: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      zipcode: ''
    }
  });

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await adminProfileAPI.getProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          fullName: response.data.fullName || '',
          contactNumber: response.data.contactNumber || '',
          department: response.data.department || '',
          bio: response.data.bio || '',
          location: response.data.location || {
            address: '',
            city: '',
            state: '',
            country: '',
            pincode: '',
            zipcode: ''
          }
        });
      }
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested location fields
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Full name validation
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters long';
    }

    // Phone number validation
    if (formData.contactNumber && !adminProfileAPI.validatePhone(formData.contactNumber)) {
      errors.contactNumber = 'Please enter a valid phone number (7-15 digits)';
    }

    // Bio length validation
    if (formData.bio && formData.bio.length > 500) {
      errors.bio = 'Bio cannot exceed 500 characters';
    }

    // Location validation
    if (formData.location.pincode && !/^[0-9]{4,10}$/.test(formData.location.pincode)) {
      errors['location.pincode'] = 'Pincode must be 4-10 digits';
    }
    
    if (formData.location.zipcode && !/^[A-Za-z0-9\s\-]{3,10}$/.test(formData.location.zipcode)) {
      errors['location.zipcode'] = 'Zipcode must be 3-10 alphanumeric characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const response = await adminProfileAPI.updateProfile(formData);
      
      if (response.success) {
        setProfile(response.data);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName || '',
      contactNumber: profile.contactNumber || '',
      department: profile.department || '',
      bio: profile.bio || '',
      location: profile.location || {
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        zipcode: ''
      }
    });
    setIsEditing(false);
    setValidationErrors({});
    setError('');
  };


  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear password errors when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    const newPasswordValidation = adminProfileAPI.validatePassword(passwordData.newPassword);
    if (!newPasswordValidation.isValid) {
      errors.newPassword = newPasswordValidation.message;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await adminProfileAPI.changePassword(passwordData);
      
      if (response.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowChangePassword(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      setError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowChangePassword(false);
    setError('');
  };


  if (isLoading) {
    return (
      <div className="admin-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-profile-container">
        <div className="error-state">
          <h2>Profile Not Found</h2>
          <p>Unable to load your profile data.</p>
          <button onClick={loadProfile} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-header">
        <h1>Admin Profile</h1>
        <div className="profile-actions">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-success"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={handleCancel}
                disabled={isSaving}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="admin-profile-content">
        {/* Profile Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            {profile.profilePicture && profile.profilePicture.url ? (
              <div className="profile-picture">
                <img 
                  src={profile.profilePicture.url} 
                  alt={`${profile.fullName}'s profile`}
                  className="profile-image"
                />
              </div>
            ) : (
              <div className="default-avatar">
                <span>{profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'A'}</span>
              </div>
            )}
          </div>
          
          <div className="avatar-info">
            <h3>{profile.fullName || 'Admin User'}</h3>
            <p className="avatar-role">
              {profile.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
            </p>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="profile-info-section">
          <h2>Profile Information</h2>
          
          <div className="form-grid">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              {isEditing ? (
                <div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={validationErrors.fullName ? 'error' : ''}
                  />
                  {validationErrors.fullName && (
                    <span className="error-message">{validationErrors.fullName}</span>
                  )}
                </div>
              ) : (
                <p className="field-value">{profile.fullName || 'Not specified'}</p>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <p className="field-value email-readonly">
                {profile.email}
                <span className="readonly-note">(cannot be changed)</span>
              </p>
            </div>

            {/* Role */}
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <p className="field-value role-badge">
                {profile.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                <span className="readonly-note">(fixed role)</span>
              </p>
            </div>

            {/* Contact Number */}
            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              {isEditing ? (
                <div>
                  <input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., +1234567890"
                    className={validationErrors.contactNumber ? 'error' : ''}
                  />
                  {validationErrors.contactNumber && (
                    <span className="error-message">{validationErrors.contactNumber}</span>
                  )}
                </div>
              ) : (
                <p className="field-value">{profile.contactNumber || 'Not specified'}</p>
              )}
            </div>

            {/* Department */}
            <div className="form-group">
              <label htmlFor="department">Department</label>
              {isEditing ? (
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., IT, Support, Management"
                />
              ) : (
                <p className="field-value">{profile.department || 'Not specified'}</p>
              )}
            </div>

            {/* Bio */}
            <div className="form-group full-width">
              <label htmlFor="bio">Bio</label>
              {isEditing ? (
                <div>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                    className={validationErrors.bio ? 'error' : ''}
                  />
                  <div className="character-count">
                    {formData.bio.length}/500
                  </div>
                  {validationErrors.bio && (
                    <span className="error-message">{validationErrors.bio}</span>
                  )}
                </div>
              ) : (
                <p className="field-value bio-value">{profile.bio || 'No bio provided'}</p>
              )}
            </div>
            
            {/* Location Information */}
            <div className="location-section full-width">
              <h3 className="section-title">📍 Location Information</h3>
              
              {/* Address */}
              <div className="form-group full-width">
                <label htmlFor="location-address">Address</label>
                {isEditing ? (
                  <input
                    id="location-address"
                    name="location.address"
                    type="text"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="field-value">{profile.location?.address || 'Not specified'}</p>
                )}
              </div>
              
              {/* City and State */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location-city">City</label>
                  {isEditing ? (
                    <input
                      id="location-city"
                      name="location.city"
                      type="text"
                      value={formData.location.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                    />
                  ) : (
                    <p className="field-value">{profile.location?.city || 'Not specified'}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="location-state">State</label>
                  {isEditing ? (
                    <input
                      id="location-state"
                      name="location.state"
                      type="text"
                      value={formData.location.state}
                      onChange={handleInputChange}
                      placeholder="Enter your state"
                    />
                  ) : (
                    <p className="field-value">{profile.location?.state || 'Not specified'}</p>
                  )}
                </div>
              </div>
              
              {/* Country and Pincode */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location-country">Country</label>
                  {isEditing ? (
                    <input
                      id="location-country"
                      name="location.country"
                      type="text"
                      value={formData.location.country}
                      onChange={handleInputChange}
                      placeholder="Enter your country"
                    />
                  ) : (
                    <p className="field-value">{profile.location?.country || 'Not specified'}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="location-pincode">Pincode</label>
                  {isEditing ? (
                    <div>
                      <input
                        id="location-pincode"
                        name="location.pincode"
                        type="text"
                        value={formData.location.pincode}
                        onChange={handleInputChange}
                        placeholder="Enter pincode (4-10 digits)"
                        className={validationErrors['location.pincode'] ? 'error' : ''}
                      />
                      {validationErrors['location.pincode'] && (
                        <span className="error-message">{validationErrors['location.pincode']}</span>
                      )}
                    </div>
                  ) : (
                    <p className="field-value">{profile.location?.pincode || 'Not specified'}</p>
                  )}
                </div>
              </div>
              
              {/* Zipcode */}
              <div className="form-group">
                <label htmlFor="location-zipcode">Zipcode</label>
                {isEditing ? (
                  <div>
                    <input
                      id="location-zipcode"
                      name="location.zipcode"
                      type="text"
                      value={formData.location.zipcode}
                      onChange={handleInputChange}
                      placeholder="Enter zipcode (3-10 characters)"
                      className={validationErrors['location.zipcode'] ? 'error' : ''}
                    />
                    {validationErrors['location.zipcode'] && (
                      <span className="error-message">{validationErrors['location.zipcode']}</span>
                    )}
                  </div>
                ) : (
                  <p className="field-value">{profile.location?.zipcode || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Metadata */}
          <div className="profile-metadata">
            <div className="metadata-item">
              <strong>Last Updated:</strong> 
              {profile.lastProfileUpdate ? 
                new Date(profile.lastProfileUpdate).toLocaleDateString() : 
                'Never'
              }
            </div>
            <div className="metadata-item">
              <strong>Member Since:</strong> 
              {new Date(profile.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Change Password Section */}
          <div className="change-password-section-inline">
            <div className="section-header">
              <h3>Security Settings</h3>
              {!showChangePassword ? (
                <button 
                  onClick={() => setShowChangePassword(true)}
                  className="btn btn-outline"
                >
                  Change Password
                </button>
              ) : (
                <div className="password-actions">
                  <button 
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="btn btn-success"
                  >
                    {isChangingPassword ? 'Changing...' : 'Save New Password'}
                  </button>
                  <button 
                    onClick={handleCancelPasswordChange}
                    disabled={isChangingPassword}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {showChangePassword && (
              <div className="password-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password *</label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.currentPassword ? 'error' : ''}
                      placeholder="Enter your current password"
                    />
                    {passwordErrors.currentPassword && (
                      <span className="error-message">{passwordErrors.currentPassword}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password *</label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.newPassword ? 'error' : ''}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    {passwordErrors.newPassword && (
                      <span className="error-message">{passwordErrors.newPassword}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password *</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.confirmPassword ? 'error' : ''}
                      placeholder="Confirm your new password"
                    />
                    {passwordErrors.confirmPassword && (
                      <span className="error-message">{passwordErrors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                <div className="password-info">
                  <p>🔒 Password Requirements:</p>
                  <ul>
                    <li>Minimum 6 characters long</li>
                    <li>Different from your current password</li>
                    <li>You'll need to log in again after changing your password</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;