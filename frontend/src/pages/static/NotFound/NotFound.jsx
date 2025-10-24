import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '8rem', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" style={{
        background: 'white',
        color: '#667eea',
        padding: '1rem 2rem',
        borderRadius: '25px',
        textDecoration: 'none',
        fontWeight: 'bold'
      }}>
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
