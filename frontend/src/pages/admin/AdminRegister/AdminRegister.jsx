import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AdminRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authenticate } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminAPI.register({ name, email: email.trim().toLowerCase(), password, secretKey });
      const { token, user, redirect } = res.data;
      authenticate(token, user);
      navigate(redirect || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Create Admin (Secret Key Required)</h2>
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Full Name</label>
          <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Secret Access Key</label>
          <input type="password" value={secretKey} onChange={(e)=>setSecretKey(e.target.value)} required style={{ width:'100%', padding:10 }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding:'10px 14px' }}>{loading?'Creating...':'Create Admin'}</button>
      </form>
    </div>
  );
};

export default AdminRegister;
