import React, { useEffect, useState } from 'react';
import { adminAPI, superadminAPI } from '../../../services/api';

const SuperDashboard = () => {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSecret, setLastSecret] = useState('');

  // Labour form state
  const [labourName, setLabourName] = useState('');
  const [labourEmail, setLabourEmail] = useState('');
  const [labourPhone, setLabourPhone] = useState('');
  const [labourPassword, setLabourPassword] = useState('');
  const [labourCreating, setLabourCreating] = useState(false);
  const [labourMessage, setLabourMessage] = useState('');
  const [labourError, setLabourError] = useState('');
  const [labours, setLabours] = useState([]);

  const loadUsers = async () => {
    try {
      const res = await adminAPI.listUsers();
      setUsers(res.data.users || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setCreating(true);
    try {
      const res = await adminAPI.createAdmin({ name: name.trim(), email: email.trim().toLowerCase(), password });
      const secret = res.data?.secretKey;
      setLastSecret(secret || '');
      setMessage('Admin created successfully. Save the secret key below now — it is shown only once.');
      setName(''); setEmail(''); setPassword('');
      await loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    adminAPI.superDashboard()
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.message || e.message));

    loadUsers();
    // Load labours for table
    superadminAPI.listLabours()
      .then((res) => setLabours(res.data.labours || res.data || []))
      .catch((e) => setLabourError(e.response?.data?.message || e.message));
  }, []);


  return (
    <div style={{ padding: 16 }}>
      <h2>Super Admin Dashboard</h2>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {message && <div style={{ color: '#10b981' }}>{message}</div>}

      <div style={{ margin:'16px 0', padding:12, border:'1px solid #333', borderRadius:8 }}>
        <h3>👑 Create Admin (Super Admin Only)</h3>
        <form onSubmit={createAdmin}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
            <input placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} required style={{ padding:8, flex:'1 1 220px' }} />
            <input placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ padding:8, flex:'1 1 220px' }} />
            <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ padding:8, flex:'1 1 220px' }} />
          </div>
          <button type="submit" disabled={creating} style={{ padding:'8px 12px' }}>{creating ? 'Creating...' : 'Create Admin'}</button>
        </form>
        {lastSecret && (
          <div style={{ marginTop:12, padding:10, background:'#0b1220', color:'#e5e7eb', border:'1px solid #333', borderRadius:8 }}>
            <strong>Admin Secret Key (copy and share securely now):</strong>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:6 }}>
              <code style={{ userSelect:'all' }}>{lastSecret}</code>
              <button onClick={() => navigator.clipboard.writeText(lastSecret)} style={{ padding:'6px 10px' }}>Copy</button>
            </div>
            <div style={{ color:'#f59e0b', marginTop:6 }}>Note: This key is shown only once and will not be displayed again.</div>
          </div>
        )}
      </div>

      {/* Labour creation section */}
      <div style={{ margin:'16px 0', padding:12, border:'1px solid #333', borderRadius:8 }}>
        <h3>👷 Create Labour (Super Admin Only)</h3>
        {labourError && <div style={{ color: '#b91c1c', marginBottom:8 }}>{labourError}</div>}
        {labourMessage && <div style={{ color: '#10b981', marginBottom:8 }}>{labourMessage}</div>}
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLabourError('');
          setLabourMessage('');
          setLabourCreating(true);
          try {
            const payload = {
              name: labourName.trim(),
              email: labourEmail.trim().toLowerCase(),
              phone: labourPhone.trim(),
              password: labourPassword
            };
            const res = await superadminAPI.createLabour(payload);
            setLabourMessage(res.data?.message || 'Labour account created successfully');
            setLabourName(''); setLabourEmail(''); setLabourPhone(''); setLabourPassword('');
            // Refresh labour list
            const list = await superadminAPI.listLabours();
            setLabours(list.data.labours || list.data || []);
          } catch (e) {
            setLabourError(e.response?.data?.message || e.message);
          } finally {
            setLabourCreating(false);
          }
        }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
            <input placeholder="Full name" value={labourName} onChange={(e)=>setLabourName(e.target.value)} required style={{ padding:8, flex:'1 1 220px' }} />
            <input placeholder="Email" type="email" value={labourEmail} onChange={(e)=>setLabourEmail(e.target.value)} required style={{ padding:8, flex:'1 1 220px' }} />
            <input placeholder="Phone" value={labourPhone} onChange={(e)=>setLabourPhone(e.target.value)} required style={{ padding:8, flex:'1 1 160px' }} />
            <input placeholder="Password" type="password" value={labourPassword} onChange={(e)=>setLabourPassword(e.target.value)} required style={{ padding:8, flex:'1 1 200px' }} />
          </div>
          <button type="submit" disabled={labourCreating} style={{ padding:'8px 12px' }}>{labourCreating ? 'Creating...' : 'Create Labour'}</button>
        </form>
      </div>

      {/* Labours table */}
      <h3>Labours</h3>
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Name</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Email</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Phone</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Role</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {labours.map(l => (
            <tr key={l._id || l.id}>
              <td>{l.name}</td>
              <td>{l.email}</td>
              <td>{l.phone || '-'}</td>
              <td>{l.role || 'labour'}</td>
              <td>{l.status || 'active'}</td>
            </tr>
          ))}
          {labours.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding:8, color:'#9ca3af' }}>No labours found</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>Users</h3>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Name</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Email</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SuperDashboard;
