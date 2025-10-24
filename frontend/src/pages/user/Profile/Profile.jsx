import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ProfileForm from '../../../components/forms/ProfileForm/ProfileForm';
import { getCurrentUserProfile, updateCurrentUserProfile, createProfile } from '../../../services/profileService';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch current user's profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await getCurrentUserProfile();
        console.log('✅ Profile loaded:', response);
        
        setProfile(response.profile);
      } catch (err) {
        console.error('❌ Error loading profile:', err);
        
        if (err.response?.status === 404) {
          // No profile exists, show form to create one
          setError('No profile found. Please create your profile.');
          setShowForm(true);
        } else {
          setError(err.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Handle form submission (create/update profile)
  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      console.log('📤 Submitting profile data:', formData);
      
      // Use the correct function based on whether profile exists
      let response;
      if (profile) {
        // Profile exists - update it
        response = await updateCurrentUserProfile(formData);
        console.log('✅ Profile updated:', response);
      } else {
        // No profile exists - create new one
        response = await createProfile(formData);
        console.log('✅ Profile created:', response);
      }
      
      setProfile(response.data);
      setSuccess(response.message || 'Profile saved successfully!');
      setShowForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleFormView = () => {
    setShowForm(!showForm);
    setError('');
    setSuccess('');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show ProfileForm if editing or no profile exists
  if (showForm || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1 className="page-title">
            {profile ? '✏️ Edit Profile' : '👤 Create Profile'}
          </h1>
          <p className="page-subtitle">
            {profile ? 'Update your personal information' : 'Set up your profile to get started'}
          </p>
          
          {profile && (
            <button className="btn-back" onClick={toggleFormView}>
              ← Back to Profile
            </button>
          )}
        </div>
        
        {/* Show error if any */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}
        
        <ProfileForm
          initialData={profile}
          onSubmit={handleSubmit}
          loading={saving}
          isEdit={!!profile}
          submitButtonText={profile ? 'Update Profile' : 'Create Profile'}
        />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Floating Background Elements */}
      <div className="floating-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>

      <div className="profile-container">
        {/* Success/Error Messages */}
        {success && (
          <div className="success-banner">
            <span>✅ {success}</span>
          </div>
        )}
        
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}
        
        <div className="profile-header">
          <div className="header-decoration">
            <span className="decoration-star">✨</span>
            <span className="decoration-heart">💖</span>
            <span className="decoration-star">✨</span>
          </div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and preferences</p>
        </div>
        
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-container">
              <div className="avatar-circle">
                <span className="avatar-text">
                  {profile?.fullName?.charAt(0)?.toUpperCase() || 
                   profile?.firstName?.charAt(0)?.toUpperCase() || 
                   user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              {profile?.isVerified && (
                <div className="avatar-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className="user-info">
              <h2 className="user-name">
                {profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || user?.name || 'User'}
              </h2>
              <p className="user-role">{user?.role === 'admin' ? '👑 Administrator' : '🏠 Community Member'}</p>
              {profile?.occupation && (
                <p className="user-occupation">💼 {profile.occupation}</p>
              )}
            </div>
          </div>
          
          {/* Profile Information Display */}
          <div className="profile-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-icon">📧</span>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">{profile?.email || 'Not provided'}</span>
                </div>
              </div>
              
              {profile?.phone && (
                <div className="info-item">
                  <span className="info-icon">📱</span>
                  <div className="info-content">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{profile.phone}</span>
                  </div>
                </div>
              )}
              
              <div className="info-item">
                <span className="info-icon">📍</span>
                <div className="info-content">
                  <span className="info-label">Location</span>
                  <span className="info-value">
                    {profile?.fullAddress || `${profile?.address?.city || ''}, ${profile?.address?.state || ''}`.trim() || 'Not provided'}
                  </span>
                </div>
              </div>
              
              {profile?.age && (
                <div className="info-item">
                  <span className="info-icon">🎂</span>
                  <div className="info-content">
                    <span className="info-label">Age</span>
                    <span className="info-value">{profile.age} years old</span>
                  </div>
                </div>
              )}
              
              {profile?.website && (
                <div className="info-item">
                  <span className="info-icon">🌐</span>
                  <div className="info-content">
                    <span className="info-label">Website</span>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="info-link">
                      {profile.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {profile?.bio && (
              <div className="bio-section">
                <h3>About Me</h3>
                <p className="bio-text">{profile.bio}</p>
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <div className="profile-actions">
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={toggleFormView}
            >
              <span className="btn-icon">✏️</span>
              <span className="btn-text">Edit Profile</span>
            </button>
          </div>

          {/* Profile Stats */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-icon">📝</span>
              <div className="stat-info">
                <span className="stat-number">{profile?.totalComplaints || 0}</span>
                <span className="stat-label">Complaints Filed</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">✅</span>
              <div className="stat-info">
                <span className="stat-number">{profile?.resolvedComplaints || 0}</span>
                <span className="stat-label">Issues Resolved</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⭐</span>
              <div className="stat-info">
                <span className="stat-number">{profile?.reputationScore || 0}</span>
                <span className="stat-label">Reputation Score</span>
              </div>
            </div>
          </div>
          
          {/* Join Date */}
          {profile?.joinDate && (
            <div className="profile-footer">
              <p className="join-date">
                🎉 Member since {new Date(profile.joinDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
