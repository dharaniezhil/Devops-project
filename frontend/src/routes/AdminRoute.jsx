import React, { useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, admin, loading, requirePasswordChange } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log('🟢 AdminRoute - Path:', location.pathname, '- Auth status:', { 
    isAuthenticated, 
    admin: admin?.role, 
    adminEmail: admin?.email,
    loading, 
    requirePasswordChange 
  });
  
  // Redirect to password change if required
  useEffect(() => {
    if (!loading && isAuthenticated && requirePasswordChange && location.pathname !== '/admin/change-password') {
      console.log('Password change required, redirecting...');
      navigate('/admin/change-password', { replace: true });
    }
  }, [isAuthenticated, requirePasswordChange, loading, location.pathname]); // Remove navigate from deps
  
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
    // Double-check localStorage before redirecting (safeguard against race conditions)
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('❌ Not authenticated, redirecting to admin login');
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    console.log('⚠️ isAuthenticated is false but token exists - context may be updating');
    // Return loading state while context catches up
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
          <div>Verifying authentication...</div>
        </div>
      </div>
    );
  }
  
  // If password change is required and not on change password page, redirect
  if (requirePasswordChange && location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }
  
  if (!(admin?.role === 'admin' || admin?.role === 'superadmin')) {
    console.log('Not an admin, redirecting');
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

export default AdminRoute;
