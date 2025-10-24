import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuthDebug = () => {
  const [authInfo, setAuthInfo] = useState(null);
  const [testing, setTesting] = useState(false);

  const checkAuth = async () => {
    setTesting(true);
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    const info = {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 50) + '...' : 'None',
      userInfo: user ? JSON.parse(user) : null,
      endpoints: []
    };

    // Test different endpoints
    const endpoints = [
      { name: 'Health Check', url: 'http://localhost:5000/api/health', needsAuth: false },
      { name: 'Admin Me', url: 'http://localhost:5000/api/admins/me', needsAuth: true },
      { name: 'Admin Complaints', url: 'http://localhost:5000/api/admin/complaints', needsAuth: true },
      { name: 'Regular Complaints', url: 'http://localhost:5000/api/complaints', needsAuth: true }
    ];

    for (let endpoint of endpoints) {
      try {
        const config = {
          timeout: 5000
        };
        
        if (endpoint.needsAuth && token) {
          config.headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
        }

        const response = await axios.get(endpoint.url, config);
        info.endpoints.push({
          ...endpoint,
          status: 'SUCCESS',
          statusCode: response.status,
          data: response.data
        });
      } catch (error) {
        info.endpoints.push({
          ...endpoint,
          status: 'ERROR',
          statusCode: error.response?.status || 0,
          error: error.response?.data || error.message
        });
      }
    }

    setAuthInfo(info);
    setTesting(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (testing) {
    return <div style={{padding: '20px'}}>🔄 Testing authentication and endpoints...</div>;
  }

  if (!authInfo) {
    return <div style={{padding: '20px'}}>Loading auth debug info...</div>;
  }

  return (
    <div style={{padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5'}}>
      <h2>🔍 Authentication Debug Info</h2>
      
      <div style={{marginBottom: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '5px'}}>
        <h3>Local Storage</h3>
        <p><strong>Has Token:</strong> {authInfo.hasToken ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Token Length:</strong> {authInfo.tokenLength}</p>
        <p><strong>Token Preview:</strong> {authInfo.tokenPreview}</p>
        <p><strong>User Info:</strong> {authInfo.userInfo ? JSON.stringify(authInfo.userInfo, null, 2) : 'None'}</p>
      </div>

      <div style={{marginBottom: '20px'}}>
        <h3>Endpoint Tests</h3>
        {authInfo.endpoints.map((endpoint, index) => (
          <div key={index} style={{
            padding: '10px', 
            marginBottom: '10px', 
            backgroundColor: endpoint.status === 'SUCCESS' ? '#d4edda' : '#f8d7da',
            borderRadius: '5px'
          }}>
            <p><strong>{endpoint.name}</strong></p>
            <p>URL: {endpoint.url}</p>
            <p>Status: {endpoint.status === 'SUCCESS' ? '✅' : '❌'} {endpoint.statusCode}</p>
            <p>Needs Auth: {endpoint.needsAuth ? 'Yes' : 'No'}</p>
            {endpoint.status === 'SUCCESS' ? (
              <details>
                <summary>Response Data</summary>
                <pre>{JSON.stringify(endpoint.data, null, 2)}</pre>
              </details>
            ) : (
              <details>
                <summary>Error Details</summary>
                <pre>{JSON.stringify(endpoint.error, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <button onClick={checkAuth} style={{
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}>
        🔄 Re-test All Endpoints
      </button>

      <div style={{marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px'}}>
        <h4>💡 Next Steps:</h4>
        <ul>
          <li>If "Has Token" is ❌, you need to login as admin first</li>
          <li>If token exists but endpoints fail with 401, the token might be expired</li>
          <li>If health check fails, the backend server is not running</li>
          <li>If admin endpoints fail but regular ones work, check user role permissions</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthDebug;