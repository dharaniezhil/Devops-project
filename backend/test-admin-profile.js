// Test script for Admin Profile API (No Image Upload)
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const adminCredentials = {
  email: 'admin@fixitfast.com',
  password: 'admin123',
  secretKey: process.env.ADMIN_SECRET_KEY || 'fixitfast_admin_secret_2024'
};

const profileUpdateData = {
  fullName: 'John Admin',
  contactNumber: '+1234567890',
  department: 'IT Management',
  bio: 'Experienced administrator with expertise in system management and user support.'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status 
    };
  }
};

async function testAdminProfileAPI() {
  console.log('🧪 Testing Admin Profile API (Professional Profile Only)\n');

  try {
    // Step 1: Admin Login
    console.log('1. Testing Admin Login...');
    const loginResult = await makeRequest('POST', '/admins/login', adminCredentials);
    
    if (!loginResult.success) {
      console.error('❌ Admin login failed:', loginResult.error);
      console.log('Please ensure:');
      console.log('- The backend server is running on http://localhost:5000');
      console.log('- An admin account exists with the provided credentials');
      console.log('- MongoDB Atlas is connected');
      console.log('- ADMIN_SECRET_KEY environment variable is set');
      return;
    }

    authToken = loginResult.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${authToken.substring(0, 50)}...`);
    console.log(`   User: ${loginResult.data.user.name} (${loginResult.data.user.role})\n`);

    // Step 2: Get Admin Profile
    console.log('2. Testing Get Admin Profile...');
    const getProfileResult = await makeRequest('GET', '/admin/profile');
    
    if (!getProfileResult.success) {
      console.error('❌ Get profile failed:', getProfileResult.error);
    } else {
      console.log('✅ Get profile successful');
      console.log('   Profile data:', JSON.stringify(getProfileResult.data.data, null, 2));
    }
    console.log('');

    // Step 3: Update Admin Profile
    console.log('3. Testing Update Admin Profile...');
    const updateProfileResult = await makeRequest('PUT', '/admin/profile', profileUpdateData);
    
    if (!updateProfileResult.success) {
      console.error('❌ Update profile failed:', updateProfileResult.error);
    } else {
      console.log('✅ Update profile successful');
      console.log('   Updated profile:', JSON.stringify(updateProfileResult.data.data, null, 2));
    }
    console.log('');

    // Step 4: Test Profile Validation
    console.log('4. Testing Profile Validation...');
    const invalidData = {
      fullName: '', // Invalid: too short
      contactNumber: 'invalid-phone', // Invalid: bad format
      bio: 'x'.repeat(501) // Invalid: too long
    };

    const validationResult = await makeRequest('PUT', '/admin/profile', invalidData);
    
    if (!validationResult.success) {
      console.log('✅ Validation working correctly - rejected invalid data');
      console.log(`   Error: ${validationResult.error}`);
    } else {
      console.log('⚠️  Validation might not be working - accepted invalid data');
    }
    console.log('');

    // Step 6: Test Change Password
    console.log('6. Testing Change Password...');
    const passwordChangeData = {
      currentPassword: adminCredentials.password,
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123'
    };

    const changePasswordResult = await makeRequest('POST', '/admin/profile/change-password', passwordChangeData);
    
    if (!changePasswordResult.success) {
      console.log('⚠️  Change password test skipped or failed:', changePasswordResult.error);
      console.log('   This is expected if you want to keep your current password');
    } else {
      console.log('✅ Change password successful');
      console.log('   Password updated successfully');
    }
    console.log('');

    // Step 7: Verify the AdminProfile model is working
    console.log('7. Testing Database Model...');
    const AdminProfile = require('./src/models/AdminProfile');
    const Admin = require('./src/models/Admin');

    try {
      // Check if the collection exists and can be queried
      const profileCount = await AdminProfile.countDocuments();
      const adminCount = await Admin.countDocuments();
      
      console.log('✅ Database models working');
      console.log(`   AdminProfile documents: ${profileCount}`);
      console.log(`   Admin documents: ${adminCount}`);
    } catch (dbError) {
      console.error('❌ Database model error:', dbError.message);
    }

  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  testAdminProfileAPI().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test crashed:', error.message);
    process.exit(1);
  });
}

module.exports = { testAdminProfileAPI };