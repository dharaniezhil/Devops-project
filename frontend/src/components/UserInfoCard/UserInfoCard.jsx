// src/components/UserInfoCard/UserInfoCard.jsx
// Reusable component for displaying comprehensive user information in admin and labour interfaces

import React from 'react';
import './UserInfoCard.css';

const UserInfoCard = ({ user, complaint, compact = false, showContactInfo = true }) => {
  if (!user && !complaint?.user) {
    return (
      <div className={`user-info-card ${compact ? 'compact' : ''} user-missing`}>
        <div className="user-avatar">
          👤
        </div>
        <div className="user-details">
          <div className="user-name">Unknown User</div>
          <div className="user-meta">No user information available</div>
        </div>
      </div>
    );
  }

  const userInfo = user || complaint?.user;
  const userLocation = user?.location || complaint?.location;

  // Generate user initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Format user ID for display
  const formatUserId = (id) => {
    if (!id) return 'N/A';
    return id.length > 12 ? `...${id.slice(-8)}` : id;
  };

  return (
    <div className={`user-info-card ${compact ? 'compact' : ''}`}>
      <div className="user-avatar">
        {userInfo?.profilePicture ? (
          <img src={userInfo.profilePicture} alt={userInfo.name} />
        ) : (
          <div className="avatar-initials">
            {getInitials(userInfo?.name)}
          </div>
        )}
      </div>

      <div className="user-details">
        <div className="user-main-info">
          <div className="user-name">
            {userInfo?.name || 'Anonymous User'}
          </div>
          <div className="user-id">
            <span className="label">ID:</span>
            <span className="value" title={userInfo?._id}>
              {formatUserId(userInfo?._id)}
            </span>
          </div>
        </div>

        <div className="user-meta">
          {showContactInfo && userInfo?.email && (
            <div className="contact-info">
              <span className="contact-icon">📧</span>
              <span className="contact-value">{userInfo.email}</span>
            </div>
          )}
          
          {showContactInfo && userInfo?.phone && (
            <div className="contact-info">
              <span className="contact-icon">📱</span>
              <span className="contact-value">{userInfo.phone}</span>
            </div>
          )}

          {userLocation && (
            <div className="location-info">
              <span className="location-icon">📍</span>
              <span className="location-value">{userLocation}</span>
            </div>
          )}

          {!compact && userInfo?.createdAt && (
            <div className="user-since">
              <span className="label">Member since:</span>
              <span className="value">
                {new Date(userInfo.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {!compact && (
          <div className="user-stats">
            {userInfo?.totalComplaints !== undefined && (
              <div className="stat-item">
                <span className="stat-value">{userInfo.totalComplaints}</span>
                <span className="stat-label">Complaints</span>
              </div>
            )}
            
            {userInfo?.resolvedComplaints !== undefined && (
              <div className="stat-item">
                <span className="stat-value">{userInfo.resolvedComplaints}</span>
                <span className="stat-label">Resolved</span>
              </div>
            )}

            {userInfo?.pendingComplaints !== undefined && (
              <div className="stat-item">
                <span className="stat-value">{userInfo.pendingComplaints}</span>
                <span className="stat-label">Pending</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!compact && (
        <div className="user-actions">
          {showContactInfo && userInfo?.email && (
            <button 
              className="contact-btn email-btn" 
              title="Send Email"
              onClick={() => window.open(`mailto:${userInfo.email}`)}
            >
              📧
            </button>
          )}
          
          {showContactInfo && userInfo?.phone && (
            <button 
              className="contact-btn phone-btn" 
              title="Call User"
              onClick={() => window.open(`tel:${userInfo.phone}`)}
            >
              📞
            </button>
          )}

          <button 
            className="contact-btn profile-btn" 
            title="View User Profile"
            onClick={() => {
              // You can implement user profile navigation here
              console.log('Navigate to user profile:', userInfo?._id);
            }}
          >
            👤
          </button>
        </div>
      )}
    </div>
  );
};

export default UserInfoCard;