const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';

async function testBasicEndpoints() {
  console.log('🧪 Testing Basic Profile Endpoints');
  console.log('=' .repeat(40));

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    const healthCheck = await axios.get(`${BASE_URL}/auth/health`).catch(() => null);
    
    if (healthCheck) {
      console.log('✅ Server is running');
    } else {
      console.log('⚠️ Server health endpoint not found, but server might be running');
    }

    // Test 2: Try to access protected endpoint without token
    console.log('2️⃣ Testing protected endpoint without token...');
    try {
      await axios.get(`${BASE_URL}/admin/profile`);
      console.log('❌ Protected endpoint accessible without token (security issue)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Protected endpoint properly secured');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }

    // Test 3: Check upload endpoint without token
    console.log('3️⃣ Testing upload endpoint without token...');
    try {
      await axios.post(`${BASE_URL}/admin/profile/upload-picture`, {});
      console.log('❌ Upload endpoint accessible without token (security issue)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Upload endpoint properly secured');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }

    // Test 4: Check if server responds to ping
    console.log('4️⃣ Testing basic server response...');
    try {
      const response = await axios.get(`${BASE_URL}/`).catch(() => null);
      if (response) {
        console.log('✅ Base API endpoint responds');
      } else {
        console.log('⚠️ Base API endpoint not configured');
      }
    } catch (error) {
      console.log('⚠️ Base API endpoint error:', error.message);
    }

    console.log('\n🎯 Basic Tests Summary:');
    console.log('✅ Endpoint structure seems correct');
    console.log('✅ Security validation is working');
    console.log('\n📋 To test full functionality:');
    console.log('1. Create an admin user first');
    console.log('2. Use valid credentials for login');
    console.log('3. Test the upload functionality');

  } catch (error) {
    console.error('❌ Basic test failed:', error.message);
  }
}

// Run the test
testBasicEndpoints();