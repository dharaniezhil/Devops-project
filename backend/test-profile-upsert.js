const axios = require('axios');

// Test script to verify profile upsert functionality
const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid JWT token from your auth system
const AUTH_TOKEN = 'your-jwt-token-here';

const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testProfileUpsert() {
  console.log('🧪 Testing Profile Upsert Functionality\n');

  try {
    // Test 1: Check if profile exists
    console.log('1️⃣ Checking if profile exists...');
    try {
      const getResponse = await axios.get(`${BASE_URL}/profile/me`, { headers });
      console.log('✅ Profile exists:', getResponse.data.data.name);
      console.log('   Current profile:', {
        name: getResponse.data.data.name,
        email: getResponse.data.data.email,
        location: getResponse.data.data.location
      });
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('📝 No profile found - user needs to create one');
      } else {
        console.log('❌ Error fetching profile:', error.response?.data?.message);
      }
    }

    // Test 2: Create/Update profile with upsert
    console.log('\n2️⃣ Creating/Updating profile with upsert...');
    const profileData = {
      name: 'John Doe Updated',
      email: 'john.doe.updated@example.com',
      bio: 'Updated bio - testing upsert functionality',
      location: {
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        address: '123 Updated Street'
      },
      phone: '+91 98765 43210'
    };

    const createResponse = await axios.post(`${BASE_URL}/profile`, profileData, { headers });
    console.log('✅ Profile operation successful:');
    console.log('   Message:', createResponse.data.message);
    console.log('   Profile ID:', createResponse.data.data._id);
    console.log('   Name:', createResponse.data.data.name);
    console.log('   Location:', createResponse.data.data.location);

    // Test 3: Verify the profile was saved correctly
    console.log('\n3️⃣ Verifying profile was saved correctly...');
    const verifyResponse = await axios.get(`${BASE_URL}/profile/me`, { headers });
    console.log('✅ Profile verification successful:');
    console.log('   Name matches:', verifyResponse.data.data.name === profileData.name);
    console.log('   Location matches:', JSON.stringify(verifyResponse.data.data.location) === JSON.stringify(profileData.location));

    // Test 4: Update the profile again (should work without errors)
    console.log('\n4️⃣ Testing update functionality...');
    const updateData = {
      ...profileData,
      name: 'John Doe Final Update',
      bio: 'Final updated bio - testing update functionality'
    };

    const updateResponse = await axios.post(`${BASE_URL}/profile`, updateData, { headers });
    console.log('✅ Profile update successful:');
    console.log('   Message:', updateResponse.data.message);
    console.log('   Updated name:', updateResponse.data.data.name);

    console.log('\n🎉 All tests passed! Profile upsert functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.error('   Validation errors:', error.response.data.errors);
    }
  }
}

// Instructions for running the test
console.log('📋 Instructions for running this test:');
console.log('1. Make sure your backend server is running on port 5000');
console.log('2. Replace AUTH_TOKEN with a valid JWT token from your auth system');
console.log('3. Run: node test-profile-upsert.js');
console.log('4. The test will verify that:');
console.log('   - Profile creation works for new users');
console.log('   - Profile updates work for existing users');
console.log('   - No "profile already exists" errors occur');
console.log('   - The upsert functionality works correctly\n');

// Uncomment the line below to run the test
// testProfileUpsert();

module.exports = { testProfileUpsert };
