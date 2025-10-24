import React, { useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, admin, loading, requirePasswordChange } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to password change if required
  useEffect(() => {
    if (!loading && isAuthenticated && requirePasswordChange && location.pathname !== '/admin/change-password') {
      navigate('/admin/change-password', { replace: true });
    }
  }, [isAuthenticated, requirePasswordChange, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If password change is required, redirect
  if (requirePasswordChange && location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }

  if (admin?.role !== 'superadmin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default SuperAdminRoute;
