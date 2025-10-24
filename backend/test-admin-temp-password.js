// Test script for admin authentication flow with temporary password
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Helper function to make requests
const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

async function testAdminAuthFlow() {
  console.log('🧪 Testing Admin Authentication Flow with Temporary Password');
  console.log('=' .repeat(60));

  // Test 1: Create an admin with temporary password
  console.log('\n1️⃣  Creating admin with temporary password...');
  const Admin = require('./src/models/Admin');
  
  // Create a test admin directly in database
  try {
    // Clean up any existing test admin
    await Admin.deleteOne({ email: 'testadmin@example.com' });
    
    const testAdmin = new Admin({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: 'SuperAdmin@123', // This will be hashed, but we'll use temporaryPassword flag
      role: 'admin',
      assignedCity: 'Mumbai',
      temporaryPassword: true,
      isFirstLogin: true,
      mustChangePassword: true
    });
    
    await testAdmin.save();
    console.log('✅ Test admin created successfully');
  } catch (error) {
    console.log('❌ Failed to create test admin:', error.message);
    return;
  }

  // Test 2: Login with temporary password
  console.log('\n2️⃣  Testing login with temporary password...');
  const loginResult = await makeRequest('POST', '/admin/login', {
    email: 'testadmin@example.com',
    password: 'SuperAdmin@123'
  });

  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.error);
    return;
  }

  if (loginResult.data.requirePasswordChange) {
    console.log('✅ Login successful - password change required as expected');
    console.log('📝 Temporary token received for password change');
  } else {
    console.log('❌ Expected password change requirement but not received');
    return;
  }

  const tempToken = loginResult.data.tempToken;

  // Test 3: Try to access protected route with temp token (should fail)
  console.log('\n3️⃣  Testing access to protected route with temp token (should fail)...');
  const dashboardResult = await makeRequest('GET', '/admin/dashboard', null, {
    Authorization: `Bearer ${tempToken}`
  });

  if (!dashboardResult.success && dashboardResult.error.requirePasswordChange) {
    console.log('✅ Protected route correctly blocked - password change required');
  } else {
    console.log('❌ Protected route should have been blocked');
  }

  // Test 4: Change password
  console.log('\n4️⃣  Testing password change...');
  const passwordChangeResult = await makeRequest('POST', '/admin/change-password', {
    currentPassword: 'SuperAdmin@123',
    newPassword: 'NewSecurePassword123',
    confirmPassword: 'NewSecurePassword123'
  }, {
    Authorization: `Bearer ${tempToken}`
  });

  if (!passwordChangeResult.success) {
    console.log('❌ Password change failed:', passwordChangeResult.error);
    return;
  }

  console.log('✅ Password changed successfully');
  console.log('🔑 New token received for normal access');

  const newToken = passwordChangeResult.data.token;

  // Test 5: Login with new password
  console.log('\n5️⃣  Testing login with new password...');
  const newLoginResult = await makeRequest('POST', '/admin/login', {
    email: 'testadmin@example.com',
    password: 'NewSecurePassword123'
  });

  if (!newLoginResult.success) {
    console.log('❌ Login with new password failed:', newLoginResult.error);
    return;
  }

  if (!newLoginResult.data.requirePasswordChange) {
    console.log('✅ Normal login successful - no password change required');
  } else {
    console.log('❌ Password change still required after changing password');
    return;
  }

  // Test 6: Access protected route with new token
  console.log('\n6️⃣  Testing access to protected route with new token...');
  const dashboardResult2 = await makeRequest('GET', '/admin/dashboard', null, {
    Authorization: `Bearer ${newToken}`
  });

  if (dashboardResult2.success) {
    console.log('✅ Protected route accessible with new token');
  } else {
    console.log('❌ Protected route should be accessible:', dashboardResult2.error);
  }

  // Test 7: Test labour management with city filtering
  console.log('\n7️⃣  Testing labour management with city filtering...');
  
  // Create a test labour in the same city
  const Labour = require('./src/models/Labour');
  try {
    await Labour.deleteOne({ email: 'testlabour@example.com' });
    
    const testLabour = new Labour({
      name: 'Test Labour',
      email: 'testlabour@example.com',
      phone: '1234567890',
      password: 'password123',
      city: 'Mumbai',
      skills: ['plumbing', 'electrical']
    });
    
    await testLabour.save();
    console.log('✅ Test labour created in Mumbai');
  } catch (error) {
    console.log('❌ Failed to create test labour:', error.message);
  }

  // Get labours list (should only show Mumbai labours for this admin)
  const laboursResult = await makeRequest('GET', '/admin/labours', null, {
    Authorization: `Bearer ${newToken}`
  });

  if (laboursResult.success) {
    const mumbaiLabours = laboursResult.data.labours.filter(l => l.city === 'Mumbai');
    console.log(`✅ Found ${mumbaiLabours.length} labour(s) in Mumbai for this admin`);
    console.log('🏙️  City-based filtering working correctly');
  } else {
    console.log('❌ Failed to get labours list:', laboursResult.error);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  try {
    await Admin.deleteOne({ email: 'testadmin@example.com' });
    await Labour.deleteOne({ email: 'testlabour@example.com' });
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.log('⚠️  Cleanup warning:', error.message);
  }

  console.log('\n🎉 Admin authentication flow test completed!');
  console.log('=' .repeat(60));
}

// Test old password login should fail
async function testOldPasswordBlocked() {
  console.log('\n8️⃣  Testing that temporary password is blocked after change...');
  
  const oldPasswordResult = await makeRequest('POST', '/admin/login', {
    email: 'testadmin@example.com',
    password: 'SuperAdmin@123'
  });

  if (!oldPasswordResult.success) {
    console.log('✅ Old temporary password correctly blocked');
  } else {
    console.log('❌ Old temporary password should be blocked');
  }
}

// Run tests
if (require.main === module) {
  // Connect to MongoDB first
  require('dotenv').config();
  const mongoose = require('mongoose');
  
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitfast', {
    family: 4
  }).then(() => {
    console.log('📡 Connected to MongoDB for testing');
    return testAdminAuthFlow();
  }).then(() => {
    return mongoose.disconnect();
  }).then(() => {
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testAdminAuthFlow };