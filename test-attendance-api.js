// Simple test script to verify attendance endpoints work
const API_BASE = 'http://localhost:5000/api';

// Replace this with a real labour user token
const LABOUR_TOKEN = 'YOUR_LABOUR_TOKEN_HERE';

async function testAttendanceEndpoints() {
  console.log('🧪 Testing Attendance API Endpoints...\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LABOUR_TOKEN}`
  };

  try {
    // Test 1: Get current attendance status
    console.log('1. Testing GET /api/labour/attendance/status');
    const statusResponse = await fetch(`${API_BASE}/labour/attendance/status`, { headers });
    console.log('Status:', statusResponse.status);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('Response:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('Error:', await statusResponse.text());
    }
    console.log('');

    // Test 2: Mark check in
    console.log('2. Testing POST /api/labour/attendance (check_in)');
    const checkinResponse = await fetch(`${API_BASE}/labour/attendance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'check_in',
        location: 'Test Location',
        remarks: 'API test check in'
      })
    });
    console.log('Status:', checkinResponse.status);
    if (checkinResponse.ok) {
      const checkinData = await checkinResponse.json();
      console.log('Response:', JSON.stringify(checkinData, null, 2));
    } else {
      console.log('Error:', await checkinResponse.text());
    }
    console.log('');

    // Test 3: Get attendance history
    console.log('3. Testing GET /api/labour/attendance');
    const historyResponse = await fetch(`${API_BASE}/labour/attendance?limit=5`, { headers });
    console.log('Status:', historyResponse.status);
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('Response:', JSON.stringify(historyData, null, 2));
    } else {
      console.log('Error:', await historyResponse.text());
    }
    console.log('');

    // Test 4: Get attendance stats
    console.log('4. Testing GET /api/labour/attendance/stats');
    const statsResponse = await fetch(`${API_BASE}/labour/attendance/stats`, { headers });
    console.log('Status:', statsResponse.status);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('Response:', JSON.stringify(statsData, null, 2));
    } else {
      console.log('Error:', await statsResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('⚠️  Before running this test:');
console.log('1. Make sure your backend server is running on port 5000');
console.log('2. Replace LABOUR_TOKEN with a real labour user token');
console.log('3. You can get a token by logging in as a labour user and checking localStorage.authToken');
console.log('');

if (LABOUR_TOKEN === 'YOUR_LABOUR_TOKEN_HERE') {
  console.log('❌ Please update the LABOUR_TOKEN in this script first!');
} else {
  testAttendanceEndpoints();
}