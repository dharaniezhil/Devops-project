import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get('token');
    if (token) {
      // Store token for API client
      localStorage.setItem('authToken', token);
    }
    // Redirect to dashboard (the app can load user info after)
    navigate('/dashboard', { replace: true });
  }, [search, navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.15)', padding: '1.25rem 1.5rem', borderRadius: 12,
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
      }}>
        Finishing sign-in...
      </div>
    </div>
  );
};

export default OAuthCallback;
