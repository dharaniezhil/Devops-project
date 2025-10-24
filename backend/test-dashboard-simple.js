// Simple test script for Dashboard API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/dashboard';

// Test data samples
const testData = [
  {
    title: 'Website Performance',
    description: 'Monitor website loading times and user engagement metrics',
    status: 'active'
  },
  {
    title: 'Sales Report',
    description: 'Weekly sales performance analysis and trends',
    status: 'completed'
  },
  {
    title: 'User Feedback',
    description: 'Collect and analyze user feedback from support tickets',
    status: 'pending'
  }
];

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API...\n');

  try {
    // Test 1: Create dashboard entries
    console.log('📝 Test 1: Creating dashboard entries...');
    const createdEntries = [];
    
    for (let i = 0; i < testData.length; i++) {
      const data = testData[i];
      console.log(`\n  Creating entry ${i + 1}: "${data.title}"`);
      
      try {
        const response = await axios.post(BASE_URL, data);
        console.log(`  ✅ Success: ${response.data.message}`);
        console.log(`  🆔 ID: ${response.data.data._id}`);
        createdEntries.push(response.data.data);
      } catch (error) {
        console.log(`  ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log(`\n📊 Created ${createdEntries.length} dashboard entries\n`);

    // Test 2: Get all dashboard entries
    console.log('📋 Test 2: Getting all dashboard entries...');
    try {
      const response = await axios.get(BASE_URL);
      console.log(`✅ Retrieved ${response.data.count} entries`);
      console.log('📄 Entries:');
      response.data.data.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.title} (${entry.status}) - ${new Date(entry.createdAt).toLocaleString()}`);
      });
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Get specific dashboard entry
    if (createdEntries.length > 0) {
      console.log('\n🔍 Test 3: Getting specific dashboard entry...');
      const firstEntry = createdEntries[0];
      try {
        const response = await axios.get(`${BASE_URL}/${firstEntry._id}`);
        console.log(`✅ Retrieved entry: ${response.data.data.title}`);
        console.log(`📝 Description: ${response.data.data.description}`);
        console.log(`📊 Status: ${response.data.data.status}`);
      } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 All tests completed!\n');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
console.log('🚀 Starting Dashboard API Tests');
console.log('Make sure your server is running on http://localhost:5000\n');

testDashboardAPI();

module.exports = { testDashboardAPI, testData };
