const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testAPI() {
  try {
    console.log('🧪 Testing FixItFast API...\n');

    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    try {
      const healthResponse = await api.get('/health');
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (err) {
      console.log('❌ Health check failed:', err.message);
    }

    // Test 2: Register a test user
    console.log('\n2. Creating test user...');
    const testUser = {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'testpass123',
      location: 'Test City, Test State'
    };

    let authToken = '';
    try {
      const registerResponse = await api.post('/auth/register', testUser);
      console.log('✅ User registration successful');
      authToken = registerResponse.data.token;
      console.log('Token received:', authToken ? 'Yes' : 'No');
    } catch (err) {
      console.log('❌ User registration failed:', err.response?.data?.message || err.message);
      
      // Try to login with existing user instead
      try {
        console.log('   Attempting login instead...');
        const loginResponse = await api.post('/auth/login', {
          email: testUser.email,
          password: testUser.password
        });
        authToken = loginResponse.data.token;
        console.log('✅ Login successful');
      } catch (loginErr) {
        console.log('❌ Login also failed:', loginErr.response?.data?.message || loginErr.message);
        return;
      }
    }

    if (!authToken) {
      console.log('❌ No auth token available. Stopping tests.');
      return;
    }

    // Set auth header for subsequent requests
    api.defaults.headers.Authorization = `Bearer ${authToken}`;

    // Test 3: Create a complaint
    console.log('\n3. Creating test complaint...');
    const testComplaint = {
      title: 'Street Light Not Working',
      description: 'The street light on Main Road has been off for 3 days, causing safety concerns for pedestrians at night.',
      category: 'Roads & Infrastructure',
      priority: 'High',
      location: 'Main Road, Near Central Park'
    };

    let complaintId = '';
    try {
      const complaintResponse = await api.post('/complaints', testComplaint);
      console.log('✅ Complaint created successfully');
      complaintId = complaintResponse.data.complaint._id;
      console.log('Complaint ID:', complaintId);
    } catch (err) {
      console.log('❌ Complaint creation failed:', err.response?.data?.message || err.message);
      console.log('Error details:', err.response?.data);
    }

    // Test 4: Get all complaints
    console.log('\n4. Fetching complaints...');
    try {
      const complaintsResponse = await api.get('/complaints');
      console.log('✅ Complaints fetched successfully');
      console.log(`Found ${complaintsResponse.data.complaints?.length || 0} complaints`);
      
      if (complaintsResponse.data.complaints?.length > 0) {
        console.log('Sample complaint:', {
          title: complaintsResponse.data.complaints[0].title,
          status: complaintsResponse.data.complaints[0].status,
          category: complaintsResponse.data.complaints[0].category
        });
      }
    } catch (err) {
      console.log('❌ Fetching complaints failed:', err.response?.data?.message || err.message);
    }

    // Test 5: Get specific complaint (if we have an ID)
    if (complaintId) {
      console.log('\n5. Fetching specific complaint...');
      try {
        const singleComplaintResponse = await api.get(`/complaints/${complaintId}`);
        console.log('✅ Single complaint fetched successfully');
        console.log('Complaint details:', {
          title: singleComplaintResponse.data.complaint.title,
          status: singleComplaintResponse.data.complaint.status,
          user: singleComplaintResponse.data.complaint.user?.name
        });
      } catch (err) {
        console.log('❌ Fetching single complaint failed:', err.response?.data?.message || err.message);
      }
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
  }
}

// Run the tests
testAPI();
