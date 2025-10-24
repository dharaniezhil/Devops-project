import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  console.log('ProtectedRoute - Auth status:', { isAuthenticated, loading });
  
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
    const isLabourArea = location.pathname.startsWith('/labour');
    return <Navigate to={isLabourArea ? '/labour/login' : '/signin'} state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
