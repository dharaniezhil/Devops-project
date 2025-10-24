import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { labourAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const LabourLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authenticate } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') + '/labour/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>({ message: 'Login failed' }));
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      authenticate(data.token, data.user);
      navigate(data.redirect || '/labour/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Labour Login</h2>
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
        <button type="submit" disabled={loading} style={{ padding:'10px 14px' }}>{loading?'Logging in...':'Login'}</button>
      </form>
    </div>
  );
};

export default LabourLogin;
