import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AdminsList = () => {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.listAdmins();
        setAdmins(res.data.admins || []);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Admins</h2>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Name</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Email</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Role</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Status</th>
            <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Last Login</th>
            {currentUser?.role === 'superadmin' && (
              <th style={{ textAlign:'left', borderBottom:'1px solid #333' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {admins.map(a => (
            <tr key={a._id}>
              <td>{a.name}</td>
              <td>{a.email}</td>
              <td>{a.role}</td>
              <td>{a.status}</td>
              <td>{a.lastLogin ? new Date(a.lastLogin).toLocaleString() : '—'}</td>
              {currentUser?.role === 'superadmin' && (
                <td>
                  <button onClick={async () => {
                    if (!confirm(`Delete admin ${a.email}?`)) return;
                    try {
                      await adminAPI.deleteAdmin(a._id);
                      const res = await adminAPI.listAdmins();
                      setAdmins(res.data?.admins || res.admins || []);
                    } catch (e) {
                      alert(e.response?.data?.message || e.message || 'Failed to delete admin');
                    }
                  }}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminsList;
