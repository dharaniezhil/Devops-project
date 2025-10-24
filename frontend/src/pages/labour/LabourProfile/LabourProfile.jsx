import React, { useEffect, useState } from 'react';
import { labourAPI } from '../../../services/api';
import './LabourProfile.css';

const LabourProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Labour',
    status: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      zipcode: ''
    }
  });

  const [form, setForm] = useState({
    phone: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      zipcode: ''
    }
  });

  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await labourAPI.getProfile();
        const p = data?.labour || {};
        const combined = {
          name: p.name || '',
          email: p.email || '',
          phone: p.phone || '',
          role: (p.role || 'labour').charAt(0).toUpperCase() + (p.role || 'labour').slice(1),
          status: p.status || 'active',
          profilePicture: p.profilePicture || '',
          location: p.location || {
            address: '',
            city: '',
            state: '',
            country: '',
            pincode: '',
            zipcode: ''
          }
        };
        setProfile(combined);
        setForm({ 
          phone: combined.phone,
          location: { ...combined.location }
        });
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  const onSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = { 
        phone: form.phone,
        location: form.location
      };
      const { data } = await labourAPI.updateProfile(payload);
      const updated = data?.labour || {};
      setProfile((p) => ({
        ...p,
        phone: updated.phone || p.phone,
        location: updated.location || p.location
      }));
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const validatePw = () => {
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmNewPassword) {
      setError('Please fill all password fields');
      return false;
    }
    if (pwForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setError('New password and confirm password must match');
      return false;
    }
    return true;
  };

  const onUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validatePw()) return;

    try {
      setChangingPw(true);
      await labourAPI.changePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      setShowPw(false);
      setPwForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      setSuccess('Password updated successfully');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="labour-profile-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="labour-profile-container">
      <h1 className="page-title">Labour Profile</h1>

      {success && <div className="alert success">✅ {success}</div>}
      {error && <div className="alert error">❌ {error}</div>}

      <div className="card">
        <div className="card-header">Profile Information</div>
        <div className="card-body profile-layout">
          <div className="avatar-section">
            <div className="avatar-display">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'L'}
                </div>
              )}
            </div>
            <div className="avatar-info">
              <h3>{profile.name || 'Labour User'}</h3>
              <p className="role-badge">{profile.role}</p>
            </div>
          </div>

          <form onSubmit={onSave} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={profile.name} readOnly className="readonly" />
              </div>
              <div className="form-group">
                <label>Email ID</label>
                <input type="email" value={profile.email} readOnly className="readonly" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" value={profile.role} readOnly className="readonly" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Account Status</label>
                <div className="status-display">
                  <span className={`status-badge status-${profile.status.toLowerCase()}`}>
                    {profile.status === 'active' ? '✅ Active' : profile.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Information Section */}
            <div className="section-header">
              <h4>📍 Location Information</h4>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={form.location.address}
                  onChange={(e) => setForm((f) => ({ 
                    ...f, 
                    location: { ...f.location, address: e.target.value } 
                  }))}
                  placeholder="Enter your address"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={form.location.city}
                  onChange={(e) => setForm((f) => ({ 
                    ...f, 
                    location: { ...f.location, city: e.target.value } 
                  }))}
                  placeholder="Enter your city"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={form.location.state}
                  onChange={(e) => setForm((f) => ({ 
                    ...f, 
                    location: { ...f.location, state: e.target.value } 
                  }))}
                  placeholder="Enter your state"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  value={form.location.country}
                  onChange={(e) => setForm((f) => ({ 
                    ...f, 
                    location: { ...f.location, country: e.target.value } 
                  }))}
                  placeholder="Enter your country"
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={form.location.pincode}
                  onChange={(e) => setForm((f) => ({ 
                    ...f, 
                    location: { ...f.location, pincode: e.target.value } 
                  }))}
                  placeholder="Enter pincode (4-10 digits)"
                  pattern="[0-9]{4,10}"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Zipcode</label>
                <input
                  type="text"
                  value={form.location.zipcode}
                  onChange={(e) => setForm((f) => ({ 
                    ...f, 
                    location: { ...f.location, zipcode: e.target.value } 
                  }))}
                  placeholder="Enter zipcode (3-10 characters)"
                  pattern="[A-Za-z0-9\\s\\-]{3,10}"
                />
              </div>
            </div>

            {/* Change Password Section */}
            <div className="change-password-inline">
              <div className="section-header-inline">
                <h4>🔐 Security Settings</h4>
                {!showPw ? (
                  <button className="btn-outline" type="button" onClick={() => { setShowPw(true); setError(''); }}>
                    Change Password
                  </button>
                ) : null}
              </div>

              {showPw && (
                <div className="password-form-inline">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Current Password *</label>
                      <input
                        type="password"
                        value={pwForm.oldPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, oldPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password *</label>
                      <input
                        type="password"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder="At least 8 characters"
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password *</label>
                      <input
                        type="password"
                        value={pwForm.confirmNewPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>
                  <div className="password-actions-inline">
                    <button className="btn-success" type="button" onClick={onUpdatePassword} disabled={changingPw}>
                      {changingPw ? 'Updating...' : 'Update Password'}
                    </button>
                    <button className="btn-secondary" type="button" onClick={() => setShowPw(false)} disabled={changingPw}>
                      Cancel
                    </button>
                  </div>
                  <div className="password-info">
                    <p>🔒 Password Requirements:</p>
                    <ul>
                      <li>Minimum 8 characters long</li>
                      <li>Different from your current password</li>
                      <li>You'll need to log in again after changing your password</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="actions">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LabourProfile;
