// Test script to check admin complaints API
const axios = require('axios');

async function testAdminComplaintsAPI() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🔄 Testing admin complaints API...');
    
    // First, test if server is running
    try {
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.error('❌ Server is not running or not responding');
      return;
    }
    
    // Try to get admin complaints without auth (should fail with 401)
    try {
      const response = await axios.get(`${baseURL}/admin/complaints`);
      console.log('⚠️  Unexpected success without auth:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly requires authentication (401)');
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
    
    // Try regular complaints endpoint without auth (should also fail with 401)
    try {
      const response = await axios.get(`${baseURL}/complaints`);
      console.log('⚠️  Unexpected success without auth:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Regular complaints also requires authentication (401)');
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n💡 To fix the real-time complaints issue:');
    console.log('1. Make sure you are logged in as an admin in the frontend');
    console.log('2. Check the browser console for authentication errors');
    console.log('3. Verify the JWT token is being sent in requests');
    console.log('4. Start the backend server: cd backend && npm run dev');
    console.log('5. Start the frontend: cd frontend && npm start');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminComplaintsAPI();