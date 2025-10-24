import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import { useAdminAuth } from '../../../context/AdminAuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Use AdminAuthContext login method
      const result = await adminLogin({
        email: email.trim().toLowerCase(),
        password,
        secretKey: secretKey.trim() || undefined
      });

      if (result.success) {
        // Check if password change is required
        if (result.requirePasswordChange) {
          console.log('Password change required, redirecting to change password page');
          navigate('/admin/change-password', { replace: true });
        } else {
          // Normal login - navigate to dashboard based on role
          const dashboardPath = result.user.role === 'superadmin' 
            ? '/admin/super-dashboard' 
            : '/admin/dashboard';
          console.log('Login successful, redirecting to:', dashboardPath);
          navigate(dashboardPath, { replace: true });
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Admin Login</h2>
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Secret Key (Admins only)</label>
          <input type="password" placeholder="Enter your admin secret key" value={secretKey} onChange={(e)=>setSecretKey(e.target.value)} style={{ width:'100%', padding:10 }} />
          <small style={{ color:'#718096' }}>Super Admins can leave this blank.</small>
        </div>
        <button type="submit" disabled={isLoading} style={{ padding:'10px 14px' }}>{isLoading?'Logging in...':'Login'}</button>
      </form>
    </div>
  );
};

export default AdminLogin;
