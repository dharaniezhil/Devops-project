// Test script to verify login works correctly after password change
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

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

async function testLoginAfterPasswordChange() {
  console.log('🧪 Testing Admin Login After Password Change');
  console.log('=' .repeat(50));

  const Admin = require('./src/models/Admin');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      dbName: 'fixitfast'
    });
    console.log('📡 Connected to MongoDB');

    // Clean up any existing test admin
    await Admin.deleteOne({ email: 'logintest@example.com' });

    // Create test admin with temporary password
    const testAdmin = new Admin({
      name: 'Login Test Admin',
      email: 'logintest@example.com',
      password: 'SuperAdmin@123',
      role: 'admin',
      assignedCity: 'TestCity',
      temporaryPassword: true,
      isFirstLogin: true,
      mustChangePassword: true
    });
    
    await testAdmin.save();
    console.log('✅ Test admin created with temporary password');

    // Step 1: Login with temporary password
    console.log('\\n1️⃣  Testing login with temporary password...');
    const tempLogin = await makeRequest('POST', '/admin/login', {
      email: 'logintest@example.com',
      password: 'SuperAdmin@123'
    });

    if (!tempLogin.success || !tempLogin.data.requirePasswordChange) {
      console.log('❌ Temporary password login failed:', tempLogin.error);
      return;
    }
    console.log('✅ Temporary password login successful - password change required');

    // Step 2: Change password
    console.log('\\n2️⃣  Changing password...');
    const passwordChange = await makeRequest('POST', '/admin/change-password', {
      currentPassword: 'SuperAdmin@123',
      newPassword: 'MyNewPassword123',
      confirmPassword: 'MyNewPassword123'
    }, {
      Authorization: `Bearer ${tempLogin.data.tempToken}`
    });

    if (!passwordChange.success) {
      console.log('❌ Password change failed:', passwordChange.error);
      return;
    }
    console.log('✅ Password changed successfully');

    // Step 3: Try to login with old temporary password (should fail)
    console.log('\\n3️⃣  Testing login with old temporary password (should fail)...');
    const oldPasswordLogin = await makeRequest('POST', '/admin/login', {
      email: 'logintest@example.com',
      password: 'SuperAdmin@123'
    });

    if (oldPasswordLogin.success) {
      console.log('❌ Old temporary password should be blocked but was accepted');
      return;
    }
    console.log('✅ Old temporary password correctly blocked:', oldPasswordLogin.error.message);

    // Step 4: Login with new password (should work and go directly to dashboard)
    console.log('\\n4️⃣  Testing login with new password...');
    const newPasswordLogin = await makeRequest('POST', '/admin/login', {
      email: 'logintest@example.com',
      password: 'MyNewPassword123'
      // No secret key should be required
    });

    if (!newPasswordLogin.success) {
      console.log('❌ New password login failed:', newPasswordLogin.error);
      return;
    }

    if (newPasswordLogin.data.requirePasswordChange) {
      console.log('❌ Password change should not be required after changing password');
      return;
    }

    if (newPasswordLogin.data.redirect !== '/admin/dashboard') {
      console.log('❌ Should redirect to dashboard but got:', newPasswordLogin.data.redirect);
      return;
    }

    console.log('✅ New password login successful');
    console.log('✅ Redirects to dashboard:', newPasswordLogin.data.redirect);
    console.log('✅ No secret key required');

    // Step 5: Test dashboard access with new token
    console.log('\\n5️⃣  Testing dashboard access...');
    const dashboardAccess = await makeRequest('GET', '/admin/dashboard', null, {
      Authorization: `Bearer ${newPasswordLogin.data.token}`
    });

    if (!dashboardAccess.success) {
      console.log('❌ Dashboard access failed:', dashboardAccess.error);
      return;
    }
    console.log('✅ Dashboard access successful');

    // Cleanup
    await Admin.deleteOne({ email: 'logintest@example.com' });
    console.log('\\n🧹 Test data cleaned up');

    console.log('\\n🎉 All tests passed! Admin login after password change works correctly.');
    console.log('\\n📋 Summary:');
    console.log('  ✓ Temporary password works initially');
    console.log('  ✓ Password change process works');
    console.log('  ✓ Old temporary password is blocked');
    console.log('  ✓ New password allows direct dashboard access');
    console.log('  ✓ No secret key required after password change');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n📡 Disconnected from MongoDB');
  }
}

// Run the test
testLoginAfterPasswordChange().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});