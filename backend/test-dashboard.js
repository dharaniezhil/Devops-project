// Test script for Dashboard API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Sample test data
const testDashboardData = {
  stats: {
    totalComplaints: 5,
    resolvedComplaints: 3,
    pendingComplaints: 2,
    averageResolutionTime: '2 days'
  },
  notifications: [
    {
      id: 1,
      message: 'Your complaint #123 has been resolved',
      type: 'success',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      message: 'New update on complaint #124',
      type: 'info',
      timestamp: new Date().toISOString()
    }
  ],
  settings: {
    theme: 'light',
    emailNotifications: true,
    smsNotifications: false,
    language: 'en'
  }
};

async function testDashboardAPI() {
  try {
    console.log('🧪 Testing Dashboard API...\n');

    // First, you need to login and get a token
    console.log('📝 Please make sure you have a valid JWT token from login');
    console.log('💡 You can get a token by calling POST /api/auth/login first\n');

    // Replace this with an actual JWT token from a logged-in user
    const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

    if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
      console.log('⚠️  Please update JWT_TOKEN in the test script with a real token');
      console.log('   You can get a token by logging in through the API first\n');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Create dashboard
    console.log('🚀 Test 1: Creating dashboard...');
    try {
      const createResponse = await axios.post(`${BASE_URL}/dashboard`, testDashboardData, { headers });
      console.log('✅ Dashboard created successfully:', createResponse.data.message);
      console.log('📊 Dashboard ID:', createResponse.data.data._id);
    } catch (error) {
      console.log('ℹ️  Dashboard creation response:', error.response?.data || error.message);
    }

    console.log('\n⏳ Waiting 1 second...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Update dashboard (should update existing one)
    console.log('🔄 Test 2: Updating dashboard...');
    const updatedData = {
      ...testDashboardData,
      stats: {
        ...testDashboardData.stats,
        totalComplaints: 7,
        resolvedComplaints: 5
      },
      notifications: [
        ...testDashboardData.notifications,
        {
          id: 3,
          message: 'System maintenance scheduled',
          type: 'warning',
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const updateResponse = await axios.post(`${BASE_URL}/dashboard`, updatedData, { headers });
      console.log('✅ Dashboard updated successfully:', updateResponse.data.message);
    } catch (error) {
      console.log('ℹ️  Dashboard update response:', error.response?.data || error.message);
    }

    console.log('\n⏳ Waiting 1 second...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Get dashboard
    console.log('📥 Test 3: Retrieving dashboard...');
    try {
      const getResponse = await axios.get(`${BASE_URL}/dashboard`, { headers });
      console.log('✅ Dashboard retrieved successfully');
      console.log('📊 Dashboard stats:', JSON.stringify(getResponse.data.data.stats, null, 2));
      console.log('🔔 Notifications count:', getResponse.data.data.notifications.length);
    } catch (error) {
      console.log('ℹ️  Dashboard retrieval response:', error.response?.data || error.message);
    }

    console.log('\n🎉 Dashboard API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions for manual testing
console.log('📋 Manual Testing Instructions:');
console.log('================================\n');
console.log('1. Start your backend server: npm start (in backend directory)');
console.log('2. Register/Login to get a JWT token');
console.log('3. Update JWT_TOKEN in this script with the real token');
console.log('4. Run this test script: node test-dashboard.js\n');
console.log('Or test manually with curl:');
console.log('curl -X POST http://localhost:5000/api/dashboard \\');
console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"stats":{"totalComplaints":5},"notifications":[],"settings":{}}\'\n');

// testDashboardAPI();

module.exports = { testDashboardAPI, testDashboardData };
