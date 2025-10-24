// Test admin login endpoint to resolve "page not found" issue
const axios = require('axios');

// Try both possible ports
const BASE_URLS = [
  'http://localhost:5000/api',
  'http://localhost:5001/api'
];

// Try both possible admin endpoints
const ADMIN_ENDPOINTS = [
  '/admin/login',
  '/admins/login'
];

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login Endpoints');
  console.log('==================================');

  for (const baseUrl of BASE_URLS) {
    console.log(`\n📡 Testing server at: ${baseUrl}`);
    
    // First test if server is running
    try {
      const healthResponse = await axios.get(`${baseUrl.replace('/api', '')}/api/health`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server not responding at this URL');
      continue;
    }

    // Test admin login endpoints
    for (const endpoint of ADMIN_ENDPOINTS) {
      try {
        console.log(`\n🔍 Testing: ${baseUrl}${endpoint}`);
        
        const response = await axios.post(`${baseUrl}${endpoint}`, {
          email: 'test@example.com',
          password: 'SuperAdmin@123'
        });
        
        console.log('✅ Endpoint works! Response:', response.data);
        
      } catch (error) {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 404) {
            console.log('❌ 404 - Endpoint not found');
          } else if (status === 401) {
            console.log('✅ Endpoint exists! (401 - Invalid credentials, which is expected)');
            console.log('Response:', data);
          } else if (status === 400) {
            console.log('✅ Endpoint exists! (400 - Bad request)');
            console.log('Response:', data);
          } else {
            console.log(`✅ Endpoint exists! (${status})`, data);
          }
        } else {
          console.log('❌ Network error:', error.message);
        }
      }
    }
  }

  console.log('\n📋 SOLUTION:');
  console.log('If you are getting "page not found", the issue is likely:');
  console.log('1. Wrong URL - Make sure to use the correct server port and endpoint');
  console.log('2. Frontend making request to wrong endpoint');
  console.log('');
  console.log('✅ Correct endpoints for admin login:');
  console.log('   • http://localhost:5000/api/admin/login');
  console.log('   • http://localhost:5000/api/admins/login');
  console.log('');
  console.log('📝 Request format:');
  console.log('POST /api/admin/login');
  console.log('Content-Type: application/json');
  console.log('{');
  console.log('  "email": "admin@example.com",');
  console.log('  "password": "SuperAdmin@123"');
  console.log('}');
}

testAdminLogin().catch(console.error);