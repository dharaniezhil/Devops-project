import React, { useState, useEffect } from 'react';
import './ProfileForm.css';

/**
 * ProfileForm Component
 * Reusable form component for creating and editing profiles
 * @param {Object} props - Component props
 * @param {Object} props.initialData - Initial profile data for editing
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {boolean} props.loading - Loading state
 * @param {string} props.submitButtonText - Text for submit button
 * @param {boolean} props.isEdit - Whether this is an edit form
 */
const ProfileForm = ({ 
  initialData = {}, 
  onSubmit, 
  loading = false, 
  submitButtonText = 'Save Profile',
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    dateOfBirth: '',
    gender: 'Prefer not to say',
    occupation: '',
    bio: '',
    website: '',
    isPublic: true,
    showEmail: false,
    showPhone: false,
    notifications: {
      email: true,
      sms: false,
      push: true,
      updates: true
    },
    theme: 'auto',
    language: 'en',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('📝 Loading initial profile data:', initialData);
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: {
          street: initialData.address?.street || '',
          city: initialData.address?.city || '',
          state: initialData.address?.state || '',
          pincode: initialData.address?.pincode || '',
          country: initialData.address?.country || 'India'
        },
        dateOfBirth: initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
        gender: initialData.gender || 'Prefer not to say',
        occupation: initialData.occupation || '',
        bio: initialData.bio || '',
        website: initialData.website || '',
        isPublic: initialData.isPublic !== undefined ? initialData.isPublic : true,
        showEmail: initialData.showEmail !== undefined ? initialData.showEmail : false,
        showPhone: initialData.showPhone !== undefined ? initialData.showPhone : false,
        notifications: {
          email: initialData.notifications?.email !== undefined ? initialData.notifications.email : true,
          sms: initialData.notifications?.sms !== undefined ? initialData.notifications.sms : false,
          push: initialData.notifications?.push !== undefined ? initialData.notifications.push : true,
          updates: initialData.notifications?.updates !== undefined ? initialData.notifications.updates : true
        },
        theme: initialData.theme || 'auto',
        language: initialData.language || 'en',
        emergencyContact: {
          name: initialData.emergencyContact?.name || '',
          phone: initialData.emergencyContact?.phone || '',
          relationship: initialData.emergencyContact?.relationship || ''
        }
      });
    }
  }, [initialData]);

  // Gender options
  const genderOptions = [
    { value: 'Male', label: '👨 Male' },
    { value: 'Female', label: '👩 Female' },
    { value: 'Other', label: '🧑 Other' },
    { value: 'Prefer not to say', label: '🤐 Prefer not to say' }
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: '☀️ Light' },
    { value: 'dark', label: '🌙 Dark' },
    { value: 'auto', label: '🔄 Auto' }
  ];

  // Validation function
  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.address.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (formData.address.pincode && !/^[0-9]{6}$/.test(formData.address.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (include http:// or https://)';
    }
    
    if (formData.emergencyContact.phone && !/^[0-9]{10}$/.test(formData.emergencyContact.phone)) {
      newErrors.emergencyPhone = 'Emergency contact phone must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (address, notifications, emergencyContact)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear errors for this field
    if (errors[name] || errors[name.split('.')[1]]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        delete newErrors[name.split('.')[1]];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      console.log('📤 Submitting profile form:', { ...formData, email: '[PROTECTED]' });
      onSubmit(formData);
    } else {
      console.log('❌ Form validation failed:', errors);
    }
  };

  return (
    <div className="profile-form-container">
      <form onSubmit={handleSubmit} className="profile-form">
        
        {/* Basic Information Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">👤</span>
            Basic Information
          </h3>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className={errors.firstName ? 'error' : ''}
                required
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>
            
            <div className="form-field">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className={errors.lastName ? 'error' : ''}
                required
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className={errors.email ? 'error' : ''}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-field">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                className={errors.phone ? 'error' : ''}
                maxLength="10"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📍</span>
            Address Information
          </h3>
          
          <div className="form-field">
            <label htmlFor="address.street">Street Address</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              placeholder="Enter your street address"
            />
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="address.city">City *</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder="Enter your city"
                className={errors.city ? 'error' : ''}
                required
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>
            
            <div className="form-field">
              <label htmlFor="address.state">State *</label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                placeholder="Enter your state"
                className={errors.state ? 'error' : ''}
                required
              />
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="address.pincode">Pincode</label>
              <input
                type="text"
                id="address.pincode"
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                className={errors.pincode ? 'error' : ''}
                maxLength="6"
              />
              {errors.pincode && <span className="error-message">{errors.pincode}</span>}
            </div>
            
            <div className="form-field">
              <label htmlFor="address.country">Country</label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                placeholder="Enter your country"
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">ℹ️</span>
            Personal Information
          </h3>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-field">
            <label htmlFor="occupation">Occupation</label>
            <input
              type="text"
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="Enter your occupation"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself... (max 500 characters)"
              rows="4"
              maxLength="500"
            />
            <div className="char-count">
              {formData.bio.length}/500 characters
            </div>
          </div>
          
          <div className="form-field">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              className={errors.website ? 'error' : ''}
            />
            {errors.website && <span className="error-message">{errors.website}</span>}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🔒</span>
            Privacy Settings
          </h3>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
              />
              <span className="checkbox-text">Make my profile public</span>
              <span className="help-text">Others can view your profile information</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="showEmail"
                checked={formData.showEmail}
                onChange={handleChange}
              />
              <span className="checkbox-text">Show my email address</span>
              <span className="help-text">Display email on your public profile</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="showPhone"
                checked={formData.showPhone}
                onChange={handleChange}
              />
              <span className="checkbox-text">Show my phone number</span>
              <span className="help-text">Display phone on your public profile</span>
            </label>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="form-section">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>{showAdvanced ? '🔼' : '🔽'}</span>
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="advanced-settings">
              {/* Notification Preferences */}
              <div className="subsection">
                <h4 className="subsection-title">🔔 Notification Preferences</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.email"
                      checked={formData.notifications.email}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">Email notifications</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.sms"
                      checked={formData.notifications.sms}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">SMS notifications</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.push"
                      checked={formData.notifications.push}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">Push notifications</span>
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.updates"
                      checked={formData.notifications.updates}
                      onChange={handleChange}
                    />
                    <span className="checkbox-text">System updates</span>
                  </label>
                </div>
              </div>
              
              {/* App Preferences */}
              <div className="subsection">
                <h4 className="subsection-title">⚙️ App Preferences</h4>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="theme">Theme</label>
                    <select
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                    >
                      {themeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="language">Language</label>
                    <input
                      type="text"
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      placeholder="en"
                      maxLength="2"
                    />
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              <div className="subsection">
                <h4 className="subsection-title">🚨 Emergency Contact</h4>
                <div className="form-field">
                  <label htmlFor="emergencyContact.name">Name</label>
                  <input
                    type="text"
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    placeholder="Emergency contact name"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="emergencyContact.phone">Phone</label>
                    <input
                      type="tel"
                      id="emergencyContact.phone"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      placeholder="10-digit phone number"
                      className={errors.emergencyPhone ? 'error' : ''}
                      maxLength="10"
                    />
                    {errors.emergencyPhone && <span className="error-message">{errors.emergencyPhone}</span>}
                  </div>
                  
                  <div className="form-field">
                    <label htmlFor="emergencyContact.relationship">Relationship</label>
                    <input
                      type="text"
                      id="emergencyContact.relationship"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleChange}
                      placeholder="e.g., Spouse, Parent, Friend"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                address: { street: '', city: '', state: '', pincode: '', country: 'India' },
                dateOfBirth: '',
                gender: 'Prefer not to say',
                occupation: '',
                bio: '',
                website: '',
                isPublic: true,
                showEmail: false,
                showPhone: false,
                notifications: { email: true, sms: false, push: true, updates: true },
                theme: 'auto',
                language: 'en',
                emergencyContact: { name: '', phone: '', relationship: '' }
              });
              setErrors({});
            }}
            disabled={loading}
          >
            🗑️ Clear Form
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <span className="btn-icon">{isEdit ? '✏️' : '💾'}</span>
                {submitButtonText}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
