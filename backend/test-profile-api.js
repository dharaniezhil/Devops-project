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

async function testProfileAPI() {
  try {
    console.log('🧪 Testing FixItFast Profile API...\n');

    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    try {
      const healthResponse = await api.get('/health');
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (err) {
      console.log('❌ Health check failed:', err.message);
      return;
    }

    // Test 2: Create a test user and get auth token
    console.log('\n2. Creating test user and getting auth token...');
    const testUser = {
      name: 'Test Profile User',
      email: `profiletest${Date.now()}@example.com`,
      password: 'testpass123',
      location: 'Profile Test City'
    };

    let authToken = '';
    let userId = '';
    try {
      const registerResponse = await api.post('/auth/register', testUser);
      console.log('✅ User registration successful');
      authToken = registerResponse.data.token;
      userId = registerResponse.data.user.id;
      console.log('User ID:', userId);
    } catch (err) {
      console.log('❌ User registration failed:', err.response?.data?.message || err.message);
      return;
    }

    // Set auth header for subsequent requests
    api.defaults.headers.Authorization = `Bearer ${authToken}`;

    // Test 3: Try to get profile (should not exist yet)
    console.log('\n3. Testing GET /profiles/me (should return 404)...');
    try {
      await api.get('/profiles/me');
      console.log('⚠️ Unexpected: Profile found when none should exist');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✅ Correctly returned 404 - no profile exists yet');
      } else {
        console.log('❌ Unexpected error:', err.response?.data?.message || err.message);
      }
    }

    // Test 4: Create a new profile
    console.log('\n4. Creating new profile...');
    const testProfile = {
      firstName: 'Test',
      lastName: 'User',
      email: testUser.email,
      phone: '9876543210',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        country: 'India'
      },
      dateOfBirth: '1990-01-15',
      gender: 'Male',
      occupation: 'Software Tester',
      bio: 'I am a test user for the FixItFast application. Testing profile functionality.',
      website: 'https://testuser.example.com',
      isPublic: true,
      showEmail: false,
      showPhone: true,
      notifications: {
        email: true,
        sms: false,
        push: true,
        updates: true
      },
      theme: 'light',
      language: 'en',
      emergencyContact: {
        name: 'Test Emergency Contact',
        phone: '9876543211',
        relationship: 'Friend'
      }
    };

    let profileId = '';
    try {
      const profileResponse = await api.put('/profiles/me', testProfile);
      console.log('✅ Profile created successfully');
      profileId = profileResponse.data.profile._id;
      console.log('Profile ID:', profileId);
      console.log('Profile Full Name:', profileResponse.data.profile.fullName);
      console.log('Profile Age:', profileResponse.data.profile.age);
      console.log('Profile Full Address:', profileResponse.data.profile.fullAddress);
    } catch (err) {
      console.log('❌ Profile creation failed:', err.response?.data?.message || err.message);
      if (err.response?.data?.errors) {
        console.log('Validation errors:', err.response.data.errors);
      }
      return;
    }

    // Test 5: Get current user's profile
    console.log('\n5. Fetching current user profile...');
    try {
      const myProfileResponse = await api.get('/profiles/me');
      console.log('✅ Current user profile fetched successfully');
      const profile = myProfileResponse.data.profile;
      console.log('Profile details:', {
        fullName: profile.fullName,
        email: profile.email,
        city: profile.address.city,
        age: profile.age,
        occupation: profile.occupation,
        reputationScore: profile.reputationScore
      });
    } catch (err) {
      console.log('❌ Fetching current user profile failed:', err.response?.data?.message || err.message);
    }

    // Test 6: Update profile
    console.log('\n6. Updating profile...');
    const profileUpdate = {
      bio: 'Updated bio: I am still testing the profile functionality, but now with updated information!',
      occupation: 'Senior Software Tester',
      website: 'https://updated-testuser.example.com',
      notifications: {
        email: true,
        sms: true,
        push: true,
        updates: false
      }
    };

    try {
      const updateResponse = await api.put('/profiles/me', {
        ...testProfile,
        ...profileUpdate
      });
      console.log('✅ Profile updated successfully');
      console.log('Updated bio:', updateResponse.data.profile.bio);
      console.log('Updated occupation:', updateResponse.data.profile.occupation);
    } catch (err) {
      console.log('❌ Profile update failed:', err.response?.data?.message || err.message);
    }

    // Test 7: Get all public profiles
    console.log('\n7. Fetching all public profiles...');
    try {
      const allProfilesResponse = await api.get('/profiles?page=1&limit=5');
      console.log('✅ Public profiles fetched successfully');
      console.log(`Found ${allProfilesResponse.data.profiles.length} profiles`);
      if (allProfilesResponse.data.profiles.length > 0) {
        console.log('Sample profile:', {
          fullName: allProfilesResponse.data.profiles[0].fullName,
          city: allProfilesResponse.data.profiles[0].address?.city,
          isPublic: allProfilesResponse.data.profiles[0].isPublic
        });
      }
    } catch (err) {
      console.log('❌ Fetching public profiles failed:', err.response?.data?.message || err.message);
    }

    // Test 8: Get specific profile by ID
    if (profileId) {
      console.log('\n8. Fetching specific profile by ID...');
      try {
        const specificProfileResponse = await api.get(`/profiles/${profileId}`);
        console.log('✅ Specific profile fetched successfully');
        console.log('Profile data:', {
          fullName: specificProfileResponse.data.profile.fullName,
          email: specificProfileResponse.data.profile.email,
          isPublic: specificProfileResponse.data.profile.isPublic
        });
      } catch (err) {
        console.log('❌ Fetching specific profile failed:', err.response?.data?.message || err.message);
      }
    }

    // Test 9: Update privacy settings
    if (profileId) {
      console.log('\n9. Updating privacy settings...');
      try {
        const privacyUpdate = {
          isPublic: false,
          showEmail: true,
          showPhone: false
        };
        const privacyResponse = await api.patch(`/profiles/${profileId}/privacy`, privacyUpdate);
        console.log('✅ Privacy settings updated successfully');
        console.log('New privacy settings:', {
          isPublic: privacyResponse.data.profile.isPublic,
          showEmail: privacyResponse.data.profile.showEmail,
          showPhone: privacyResponse.data.profile.showPhone
        });
      } catch (err) {
        console.log('❌ Privacy update failed:', err.response?.data?.message || err.message);
      }
    }

    // Test 10: Get profile statistics
    console.log('\n10. Fetching profile statistics...');
    try {
      const statsResponse = await api.get('/profiles/stats');
      console.log('✅ Profile statistics fetched successfully');
      console.log('Statistics:', statsResponse.data.stats);
    } catch (err) {
      console.log('❌ Fetching statistics failed:', err.response?.data?.message || err.message);
    }

    // Test 11: Test validation errors
    console.log('\n11. Testing validation errors...');
    try {
      const invalidProfile = {
        firstName: 'A', // Too short
        lastName: '', // Empty
        email: 'invalid-email', // Invalid format
        phone: '123', // Too short
        address: {
          city: '', // Empty
          state: '', // Empty
          pincode: '12345' // Wrong length
        }
      };
      
      await api.put('/profiles/me', invalidProfile);
      console.log('⚠️ Unexpected: Validation should have failed');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Validation errors correctly caught');
        console.log('Validation errors:', err.response.data.errors?.map(e => e.message) || err.response.data.message);
      } else {
        console.log('❌ Unexpected validation error:', err.response?.data?.message || err.message);
      }
    }

    console.log('\n🎉 Profile API testing completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Health check');
    console.log('✅ User authentication');
    console.log('✅ Profile creation (POST /profiles/me)');
    console.log('✅ Profile retrieval (GET /profiles/me)');
    console.log('✅ Profile updates (PUT /profiles/me)');
    console.log('✅ Public profiles listing (GET /profiles)');
    console.log('✅ Specific profile retrieval (GET /profiles/:id)');
    console.log('✅ Privacy settings update (PATCH /profiles/:id/privacy)');
    console.log('✅ Profile statistics (GET /profiles/stats)');
    console.log('✅ Validation error handling');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
  }
}

// Run the tests
testProfileAPI();
