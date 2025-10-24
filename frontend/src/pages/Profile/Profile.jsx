// src/pages/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getCurrentUserProfile, 
  createProfile, 
  updateProfile 
} from '../../services/profileService';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state with enhanced structure
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    occupation: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    location: {
      country: '',
      state: '',
      city: '',
      address: '',
      pincode: '',
      latitude: null,
      longitude: null
    },
    phone: '',
    alternatePhone: '',
    languages: [],
    interests: [],
    socialMedia: {
      twitter: '',
      linkedin: '',
      facebook: ''
    }
  });

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getCurrentUserProfile();
      
      // Handle both null response and response with null data
      if (response === null || !response.data || response.data === null) {
        // No profile exists, show create form
        console.log('🔄 No profile found, showing create form');
        setProfile(null);
        setIsEditing(true);
        // Pre-fill with user data if available
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || ''
          }));
        }
      } else {
        // Profile exists, load it
        console.log('✅ Profile loaded:', response);
        setProfile(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          bio: response.data.bio || '',
          dateOfBirth: response.data.dateOfBirth || '',
          gender: response.data.gender || '',
          nationality: response.data.nationality || '',
          occupation: response.data.occupation || '',
          emergencyContact: {
            name: response.data.emergencyContact?.name || '',
            phone: response.data.emergencyContact?.phone || '',
            relationship: response.data.emergencyContact?.relationship || ''
          },
          location: {
            country: response.data.location?.country || '',
            state: response.data.location?.state || '',
            city: response.data.location?.city || '',
            address: response.data.location?.address || '',
            pincode: response.data.location?.pincode || '',
            latitude: response.data.location?.latitude || null,
            longitude: response.data.location?.longitude || null
          },
          phone: response.data.phone || '',
          alternatePhone: response.data.alternatePhone || '',
          languages: response.data.languages || [],
          interests: response.data.interests || [],
          socialMedia: {
            twitter: response.data.socialMedia?.twitter || '',
            linkedin: response.data.socialMedia?.linkedin || '',
            facebook: response.data.socialMedia?.facebook || ''
          }
        });
      }
    } catch (error) {
      // Only real errors reach here now (not 404)
      console.error('❌ Error loading profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? (value === '' ? null : Number(value)) : value;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parentField, childField] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField],
          [childField]: processedValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  };
  
  // Function to get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };
  
  // Function to calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Function to initialize simple map display
  const initializeMap = () => {
    if (!profile?.location?.latitude || !profile?.location?.longitude) return;
    
    const mapContainer = document.getElementById('location-map');
    if (!mapContainer) return;

    // Clear existing content
    mapContainer.innerHTML = '';
    
    // Create a simple map placeholder with coordinates
    const mapContent = document.createElement('div');
    mapContent.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: var(--font-family);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    `;
    
    mapContent.innerHTML = `
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)" /></svg>') repeat; opacity: 0.3;"></div>
      <div style="text-align: center; z-index: 1;">
        <i class="fas fa-map-marker-alt" style="font-size: 2rem; margin-bottom: 8px; color: #fff;"></i>
        <div style="font-size: 1rem; font-weight: 600;">Location</div>
        <div style="font-size: 0.875rem; margin-top: 4px; opacity: 0.9;">
          ${profile.location.latitude.toFixed(4)}°, ${profile.location.longitude.toFixed(4)}°
        </div>
        <div style="font-size: 0.75rem; margin-top: 8px; opacity: 0.7;">
          Click to view on maps
        </div>
      </div>
    `;
    
    // Add click handler to open in Google Maps
    mapContent.style.cursor = 'pointer';
    mapContent.addEventListener('click', () => {
      const url = `https://www.google.com/maps?q=${profile.location.latitude},${profile.location.longitude}`;
      window.open(url, '_blank');
    });
    
    mapContainer.appendChild(mapContent);
  };

  // Initialize map when profile loads
  useEffect(() => {
    if (profile && !isEditing) {
      // Small delay to ensure DOM is ready
      setTimeout(initializeMap, 100);
    }
  }, [profile, isEditing]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      // Always use createProfile which handles both create and update via upsert
      console.log('🔄 Saving profile');
      response = await createProfile(formData);

      console.log('✅ Profile saved successfully:', response);
      
      setProfile(response.data);
      // Use the message from the backend response
      setSuccess(response.message || (profile ? 'Profile updated successfully!' : 'Profile created successfully!'));
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      // Reset form to current profile data
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        occupation: profile.occupation || '',
        emergencyContact: {
          name: profile.emergencyContact?.name || '',
          phone: profile.emergencyContact?.phone || '',
          relationship: profile.emergencyContact?.relationship || ''
        },
        location: {
          country: profile.location?.country || '',
          state: profile.location?.state || '',
          city: profile.location?.city || '',
          address: profile.location?.address || '',
          pincode: profile.location?.pincode || '',
          latitude: profile.location?.latitude || null,
          longitude: profile.location?.longitude || null
        },
        phone: profile.phone || '',
        alternatePhone: profile.alternatePhone || '',
        languages: profile.languages || [],
        interests: profile.interests || [],
        socialMedia: {
          twitter: profile.socialMedia?.twitter || '',
          linkedin: profile.socialMedia?.linkedin || '',
          facebook: profile.socialMedia?.facebook || ''
        }
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // Helper function to format location for display
  const formatLocation = (location) => {
    if (!location) return 'No location provided';
    
    const parts = [location.address, location.city, location.state, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No location provided';
  };

  if (loading) {
    return (
      <div className="modern-profile-container">
        <div className="modern-loading">
          <div className="modern-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-profile-container">
      {/* Background Elements */}
      <div className="profile-bg-gradient"></div>
      <div className="profile-floating-shapes">
        <div className="profile-shape profile-shape-1"></div>
        <div className="profile-shape profile-shape-2"></div>
        <div className="profile-shape profile-shape-3"></div>
      </div>

      {/* Modern Navigation */}
      <nav className="modern-profile-nav">
        <div className="nav-brand">
          <div className="brand-icon">
            <i className="fas fa-user-circle"></i>
          </div>
          <span className="brand-text">My Profile</span>
        </div>
        <div className="nav-actions">
          {profile && !isEditing && (
            <button 
              className="modern-btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <i className="fas fa-edit"></i>
              Edit Profile
            </button>
          )}
        </div>
      </nav>

      {/* Success Message */}
      {success && (
        <div className="modern-alert modern-alert-success fade-in">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="modern-alert modern-alert-error fade-in">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      {/* Profile Display or Form */}
      {!isEditing && profile ? (
        // Display mode
        <div className="modern-profile-display fade-in">
          {/* Profile Header Card */}
          <div className="modern-header-card slide-up">
            <div className="profile-avatar-section">
              <div className="avatar-wrapper default-avatar">
                <div className="avatar-initials">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="avatar-status"></div>
              </div>
            </div>
            <div className="profile-info-section">
              <h1 className="profile-name">{profile.name}</h1>
              <p className="profile-subtitle">Welcome to your modern profile!</p>
              <div className="profile-badges">
                <span className="modern-badge badge-user">
                  <i className="fas fa-user"></i> Profile User
                </span>
                <span className="modern-badge badge-verified">
                  <i className="fas fa-check-circle"></i> Verified
                </span>
                <span className="modern-badge badge-active">
                  <i className="fas fa-circle"></i> Active
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="modern-details-grid">
            {/* Personal Information Cards */}
            <div className="detail-card slide-up" style={{animationDelay: '0.1s'}}>
              <div className="card-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <div className="card-content">
                <label>Email Address</label>
                <p>{profile.email}</p>
              </div>
            </div>
            
            <div className="detail-card slide-up" style={{animationDelay: '0.2s'}}>
              <div className="card-icon">
                <i className="fas fa-phone"></i>
              </div>
              <div className="card-content">
                <label>Phone Number</label>
                <p>{profile.phone || 'Not provided'}</p>
              </div>
            </div>

            {/* Date of Birth with Age */}
            {profile.dateOfBirth && (
              <div className="detail-card slide-up" style={{animationDelay: '0.25s'}}>
                <div className="card-icon">
                  <i className="fas fa-birthday-cake"></i>
                </div>
                <div className="card-content">
                  <label>Date of Birth</label>
                  <p>{new Date(profile.dateOfBirth).toLocaleDateString()}</p>
                  {calculateAge(profile.dateOfBirth) && (
                    <p style={{fontSize: '0.875rem', color: '#6b7280'}}>Age: {calculateAge(profile.dateOfBirth)} years</p>
                  )}
                </div>
              </div>
            )}

            {/* Gender */}
            {profile.gender && (
              <div className="detail-card slide-up" style={{animationDelay: '0.3s'}}>
                <div className="card-icon">
                  <i className="fas fa-venus-mars"></i>
                </div>
                <div className="card-content">
                  <label>Gender</label>
                  <p>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).replace('-', ' ')}</p>
                </div>
              </div>
            )}

            {/* Nationality */}
            {profile.nationality && (
              <div className="detail-card slide-up" style={{animationDelay: '0.35s'}}>
                <div className="card-icon">
                  <i className="fas fa-flag"></i>
                </div>
                <div className="card-content">
                  <label>Nationality</label>
                  <p>{profile.nationality}</p>
                </div>
              </div>
            )}

            {/* Occupation */}
            {profile.occupation && (
              <div className="detail-card slide-up" style={{animationDelay: '0.4s'}}>
                <div className="card-icon">
                  <i className="fas fa-briefcase"></i>
                </div>
                <div className="card-content">
                  <label>Occupation</label>
                  <p>{profile.occupation}</p>
                </div>
              </div>
            )}

            {/* Alternate Phone */}
            {profile.alternatePhone && (
              <div className="detail-card slide-up" style={{animationDelay: '0.45s'}}>
                <div className="card-icon">
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <div className="card-content">
                  <label>Alternate Phone</label>
                  <p>{profile.alternatePhone}</p>
                </div>
              </div>
            )}
            
            {/* Bio */}
            <div className="detail-card full-width slide-up" style={{animationDelay: '0.5s'}}>
              <div className="card-icon">
                <i className="fas fa-user-edit"></i>
              </div>
              <div className="card-content">
                <label>Bio</label>
                <p>{profile.bio || 'No bio provided yet. Add your story!'}</p>
              </div>
            </div>
            
            {/* Detailed Location Information */}
            <div className="detail-card full-width slide-up" style={{animationDelay: '0.55s'}}>
              <div className="card-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="card-content">
                <label>Location Details</label>
                {profile.location ? (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '8px'}}>
                    {profile.location.address && (
                      <div>
                        <strong>Address:</strong> {profile.location.address}
                      </div>
                    )}
                    {profile.location.city && (
                      <div>
                        <strong>City:</strong> {profile.location.city}
                      </div>
                    )}
                    {profile.location.state && (
                      <div>
                        <strong>State:</strong> {profile.location.state}
                      </div>
                    )}
                    {profile.location.country && (
                      <div>
                        <strong>Country:</strong> {profile.location.country}
                      </div>
                    )}
                    {profile.location.pincode && (
                      <div>
                        <strong>Pincode:</strong> {profile.location.pincode}
                      </div>
                    )}
                    {profile.location.latitude && profile.location.longitude && (
                      <div style={{gridColumn: '1 / -1'}}>
                        <strong>Coordinates:</strong> {profile.location.latitude.toFixed(6)}, {profile.location.longitude.toFixed(6)}
                        <div id="location-map" style={{width: '100%', height: '200px', marginTop: '10px', border: '1px solid #e5e7eb', borderRadius: '8px'}}></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No location provided</p>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {(profile.emergencyContact?.name || profile.emergencyContact?.phone) && (
              <div className="detail-card full-width slide-up" style={{animationDelay: '0.6s'}}>
                <div className="card-icon">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <div className="card-content">
                  <label>Emergency Contact</label>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '8px'}}>
                    {profile.emergencyContact.name && (
                      <div>
                        <strong>Name:</strong> {profile.emergencyContact.name}
                      </div>
                    )}
                    {profile.emergencyContact.phone && (
                      <div>
                        <strong>Phone:</strong> {profile.emergencyContact.phone}
                      </div>
                    )}
                    {profile.emergencyContact.relationship && (
                      <div>
                        <strong>Relationship:</strong> {profile.emergencyContact.relationship}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="detail-card slide-up" style={{animationDelay: '0.65s'}}>
                <div className="card-icon">
                  <i className="fas fa-language"></i>
                </div>
                <div className="card-content">
                  <label>Languages</label>
                  <p>{profile.languages.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="detail-card slide-up" style={{animationDelay: '0.7s'}}>
                <div className="card-icon">
                  <i className="fas fa-heart"></i>
                </div>
                <div className="card-content">
                  <label>Interests</label>
                  <p>{profile.interests.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Social Media Links */}
            {(profile.socialMedia?.twitter || profile.socialMedia?.linkedin || profile.socialMedia?.facebook) && (
              <div className="detail-card full-width slide-up" style={{animationDelay: '0.75s'}}>
                <div className="card-icon">
                  <i className="fas fa-share-alt"></i>
                </div>
                <div className="card-content">
                  <label>Social Media</label>
                  <div style={{display: 'flex', gap: '15px', marginTop: '8px', flexWrap: 'wrap'}}>
                    {profile.socialMedia.twitter && (
                      <a href={profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" style={{color: '#1da1f2', textDecoration: 'none'}}>
                        <i className="fab fa-twitter"></i> Twitter
                      </a>
                    )}
                    {profile.socialMedia.linkedin && (
                      <a href={profile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" style={{color: '#0077b5', textDecoration: 'none'}}>
                        <i className="fab fa-linkedin"></i> LinkedIn
                      </a>
                    )}
                    {profile.socialMedia.facebook && (
                      <a href={profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" style={{color: '#1877f2', textDecoration: 'none'}}>
                        <i className="fab fa-facebook"></i> Facebook
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Edit/Create mode
        <div className="modern-profile-form fade-in">
          <div className="form-header">
            <h2>
              <i className="fas fa-edit"></i>
              {profile ? 'Edit Your Profile' : 'Create Your Profile'}
            </h2>
            <p>Update your information to keep your profile current</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="form-section slide-up">
              <div className="section-header">
                <h3><i className="fas fa-user"></i> Personal Information</h3>
              </div>
              
              <div className="modern-form-group">
                <label htmlFor="name">
                  <i className="fas fa-user"></i>
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="modern-form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i>
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className="modern-form-group">
                <label htmlFor="phone">
                  <i className="fas fa-phone"></i>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g., +91 98765 43210"
                />
              </div>

              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label htmlFor="dateOfBirth">
                    <i className="fas fa-calendar-alt"></i>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="modern-form-group">
                  <label htmlFor="gender">
                    <i className="fas fa-venus-mars"></i>
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label htmlFor="nationality">
                    <i className="fas fa-flag"></i>
                    Nationality
                  </label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    placeholder="e.g., Indian"
                  />
                </div>

                <div className="modern-form-group">
                  <label htmlFor="occupation">
                    <i className="fas fa-briefcase"></i>
                    Occupation
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label htmlFor="alternatePhone">
                  <i className="fas fa-mobile-alt"></i>
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  id="alternatePhone"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  placeholder="e.g., +91 87654 32109"
                />
              </div>

              <div className="modern-form-group">
                <label htmlFor="bio">
                  <i className="fas fa-user-edit"></i>
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="form-section slide-up" style={{animationDelay: '0.1s'}}>
              <div className="section-header">
                <h3><i className="fas fa-map-marker-alt"></i> Location Details</h3>
              </div>
              
              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label htmlFor="country">
                    <i className="fas fa-globe"></i>
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleInputChange}
                    placeholder="e.g., India"
                  />
                </div>

                <div className="modern-form-group">
                  <label htmlFor="state">
                    <i className="fas fa-map"></i>
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    placeholder="e.g., Tamil Nadu"
                  />
                </div>
              </div>

              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label htmlFor="city">
                    <i className="fas fa-city"></i>
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Chennai"
                  />
                </div>

                <div className="modern-form-group">
                  <label htmlFor="pincode">
                    <i className="fas fa-map-pin"></i>
                    Pincode/ZIP
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="location.pincode"
                    value={formData.location.pincode}
                    onChange={handleInputChange}
                    placeholder="e.g., 600001"
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label htmlFor="address">
                  <i className="fas fa-home"></i>
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Gandhi Street"
                />
              </div>

              <div className="modern-form-group">
                <button
                  type="button"
                  className="modern-btn-secondary"
                  onClick={getCurrentLocation}
                  style={{ marginTop: '10px' }}
                >
                  <i className="fas fa-location-arrow"></i>
                  Get Current Location
                </button>
                {formData.location.latitude && formData.location.longitude && (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '8px' }}>
                    📍 Location captured: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="form-section slide-up" style={{animationDelay: '0.2s'}}>
              <div className="section-header">
                <h3><i className="fas fa-phone-alt"></i> Emergency Contact</h3>
              </div>
              
              <div className="modern-form-row">
                <div className="modern-form-group">
                  <label htmlFor="emergencyContactName">
                    <i className="fas fa-user-friends"></i>
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergencyContactName"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div className="modern-form-group">
                  <label htmlFor="emergencyContactPhone">
                    <i className="fas fa-phone"></i>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergencyContactPhone"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +91 98765 43210"
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label htmlFor="emergencyContactRelationship">
                  <i className="fas fa-heart"></i>
                  Relationship
                </label>
                <input
                  type="text"
                  id="emergencyContactRelationship"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  placeholder="e.g., Father, Mother, Spouse, Friend"
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="form-section slide-up" style={{animationDelay: '0.3s'}}>
              <div className="section-header">
                <h3><i className="fas fa-info-circle"></i> Additional Information</h3>
              </div>
              
              <div className="modern-form-group">
                <label htmlFor="languages">
                  <i className="fas fa-language"></i>
                  Languages (comma-separated)
                </label>
                <input
                  type="text"
                  id="languages"
                  name="languages"
                  value={Array.isArray(formData.languages) ? formData.languages.join(', ') : ''}
                  onChange={(e) => {
                    const languages = e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang);
                    setFormData(prev => ({ ...prev, languages }));
                  }}
                  placeholder="e.g., English, Hindi, Tamil"
                />
              </div>

              <div className="modern-form-group">
                <label htmlFor="interests">
                  <i className="fas fa-heart"></i>
                  Interests (comma-separated)
                </label>
                <input
                  type="text"
                  id="interests"
                  name="interests"
                  value={Array.isArray(formData.interests) ? formData.interests.join(', ') : ''}
                  onChange={(e) => {
                    const interests = e.target.value.split(',').map(interest => interest.trim()).filter(interest => interest);
                    setFormData(prev => ({ ...prev, interests }));
                  }}
                  placeholder="e.g., Reading, Traveling, Photography"
                />
              </div>
            </div>

            {/* Social Media Section */}
            <div className="form-section slide-up" style={{animationDelay: '0.4s'}}>
              <div className="section-header">
                <h3><i className="fas fa-share-alt"></i> Social Media Links</h3>
              </div>
              
              <div className="modern-form-group">
                <label htmlFor="twitter">
                  <i className="fab fa-twitter"></i>
                  Twitter Profile
                </label>
                <input
                  type="url"
                  id="twitter"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="modern-form-group">
                <label htmlFor="linkedin">
                  <i className="fab fa-linkedin"></i>
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  id="linkedin"
                  name="socialMedia.linkedin"
                  value={formData.socialMedia.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="modern-form-group">
                <label htmlFor="facebook">
                  <i className="fab fa-facebook"></i>
                  Facebook Profile
                </label>
                <input
                  type="url"
                  id="facebook"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/username"
                />
              </div>
            </div>

            <div className="modern-form-actions">
              <button
                type="submit"
                className="modern-btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="btn-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {profile ? 'Update Profile' : 'Create Profile'}
                  </>
                )}
              </button>
              
              {profile && (
                <button
                  type="button"
                  className="modern-btn-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;