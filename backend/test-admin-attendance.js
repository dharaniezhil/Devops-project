// Test script for admin attendance API endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testAdmin = {
  email: 'admin@test.com',
  password: 'admin123'
};

let adminToken = '';

async function testAdminAttendance() {
  console.log('🧪 Testing Admin Attendance API endpoints...\n');
  
  try {
    // 1. Admin Login
    console.log('1. Testing Admin Login...');
    const loginResponse = await axios.post(`${API_BASE}/admins/login`, testAdmin);
    adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // 2. Test Get Currently On Duty
    console.log('\n2. Testing Get Currently On Duty...');
    const onDutyResponse = await axios.get(`${API_BASE}/admin/attendance/on-duty`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ On duty endpoint successful. Found ${onDutyResponse.data.labours?.length || 0} labours on duty`);
    console.log('Sample data structure:', onDutyResponse.data.labours?.[0] || 'No data');
    
    // 3. Test Get All Attendance
    console.log('\n3. Testing Get All Attendance...');
    const allAttendanceResponse = await axios.get(`${API_BASE}/admin/attendance?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ All attendance endpoint successful. Found ${allAttendanceResponse.data.attendance?.length || 0} records`);
    console.log('Sample attendance record:', allAttendanceResponse.data.attendance?.[0] || 'No data');
    
    // 4. Test Get All Attendance with filters
    console.log('\n4. Testing Get All Attendance with status filter...');
    const filteredResponse = await axios.get(`${API_BASE}/admin/attendance?status=check_in&limit=3`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Filtered attendance endpoint successful. Found ${filteredResponse.data.attendance?.length || 0} check_in records`);
    
    // 5. Test Get Labour Status
    console.log('\n5. Testing Get Labour Status...');
    const statusResponse = await axios.get(`${API_BASE}/admin/attendance/labour-status`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Labour status endpoint successful. Found ${statusResponse.data.labours?.length || 0} labours`);
    console.log('Sample labour with status:', statusResponse.data.labours?.[0] || 'No data');
    
    console.log('\n🎉 All admin attendance API tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run tests
testAdminAttendance();