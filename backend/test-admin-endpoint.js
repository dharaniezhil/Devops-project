// Quick test to check admin login endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api'; // Using port 5000

async function testEndpoints() {
  console.log('🧪 Testing Admin Login Endpoints');
  console.log('================================');

  // Test available endpoints
  const endpoints = [
    '/admin/login',
    '/admins/login'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${BASE_URL}${endpoint}`);
      
      const response = await axios.post(`${BASE_URL}${endpoint}`, {
        email: 'test@example.com',
        password: 'SuperAdmin@123'
      });
      
      console.log('✅ Endpoint exists and responds');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Endpoint exists but returned error (expected):');
        console.log(`Status: ${error.response.status}`);
        console.log('Response:', error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server not running or connection refused');
      } else {
        console.log('❌ Endpoint not found or other error:', error.message);
      }
    }
  }

  // Test root endpoint
  try {
    console.log(`\n🔍 Testing: ${BASE_URL}/`);
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ API root responds:', response.data);
  } catch (error) {
    console.log('❌ API root error:', error.message);
  }

  console.log('\n💡 If you see "404" for admin endpoints, check server.js route mounting');
}

testEndpoints();