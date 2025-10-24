// Complete test script for Complaint API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'testpass123'
};

const testComplaint = {
  title: 'Broken Street Light on Main Road',
  description: 'The street light near the bus stop on Main Road has been non-functional for over a week, creating safety concerns for pedestrians during night hours.',
  category: 'Safety & Security',
  priority: 'High',
  location: 'Main Road, near Bus Stop 15'
};

let authToken = null;
let createdComplaintId = null;

async function loginAndGetToken() {
  try {
    console.log('🔐 Step 1: Logging in to get JWT token...');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    
    console.log('✅ Login successful!');
    console.log('🎫 Token:', authToken.substring(0, 30) + '...');
    
    return authToken;
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure you have a test user registered with:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    throw error;
  }
}

async function createComplaint() {
  try {
    console.log('\n📝 Step 2: Creating complaint...');
    console.log('📋 Complaint data:', testComplaint);
    
    const response = await axios.post(`${BASE_URL}/complaints`, testComplaint, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    createdComplaintId = response.data.data._id;
    
    console.log('✅ Complaint created successfully!');
    console.log('🆔 Complaint ID:', createdComplaintId);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error creating complaint:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
    throw error;
  }
}

async function fetchComplaints() {
  try {
    console.log('\n📋 Step 3: Fetching user complaints...');
    
    const response = await axios.get(`${BASE_URL}/complaints`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const complaints = response.data.data || response.data.complaints || [];
    
    console.log(`✅ Fetched ${complaints.length} complaints`);
    console.log('📊 Complaints summary:');
    complaints.forEach((complaint, index) => {
      console.log(`  ${index + 1}. ${complaint.title} - ${complaint.status} (${new Date(complaint.createdAt).toLocaleDateString()})`);
    });
    
    return complaints;
    
  } catch (error) {
    console.error('❌ Error fetching complaints:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchComplaintById() {
  if (!createdComplaintId) {
    console.log('⚠️ No complaint ID available, skipping fetch by ID test');
    return;
  }
  
  try {
    console.log('\n🔍 Step 4: Fetching complaint by ID...');
    console.log('🆔 Complaint ID:', createdComplaintId);
    
    const response = await axios.get(`${BASE_URL}/complaints/${createdComplaintId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Complaint fetched by ID successfully!');
    console.log('📄 Complaint details:', JSON.stringify(response.data.complaint, null, 2));
    
    return response.data.complaint;
    
  } catch (error) {
    console.error('❌ Error fetching complaint by ID:', error.response?.data || error.message);
    throw error;
  }
}

async function runFullTest() {
  console.log('🚀 Starting Complete Complaint API Test Suite');
  console.log('================================================\n');
  
  try {
    // Step 1: Login
    await loginAndGetToken();
    
    // Step 2: Create complaint
    await createComplaint();
    
    // Step 3: Fetch all complaints
    await fetchComplaints();
    
    // Step 4: Fetch complaint by ID
    await fetchComplaintById();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Your complaint system is working correctly');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Troubleshooting - 401 Unauthorized:');
      console.log('   - Check if JWT token is valid');
      console.log('   - Verify user is logged in');
      console.log('   - Check Authorization header format');
    }
    
    if (error.response?.status === 400) {
      console.log('\n🔧 Troubleshooting - 400 Bad Request:');
      console.log('   - Check required fields are provided');
      console.log('   - Verify field lengths and formats');
      console.log('   - Check category and priority values');
    }
  }
}

// Postman Collection Export (JSON)
function generatePostmanCollection() {
  const collection = {
    "info": {
      "name": "FixItFast Complaint API",
      "description": "Complete API collection for testing complaint functionality",
      "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "auth": {
      "type": "bearer",
      "bearer": [
        {
          "key": "token",
          "value": "{{authToken}}",
          "type": "string"
        }
      ]
    },
    "variable": [
      {
        "key": "baseUrl",
        "value": "http://localhost:5000/api"
      },
      {
        "key": "authToken",
        "value": ""
      }
    ],
    "item": [
      {
        "name": "Auth",
        "item": [
          {
            "name": "Login",
            "request": {
              "method": "POST",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "body": {
                "mode": "raw",
                "raw": JSON.stringify({
                  "email": "testuser@example.com",
                  "password": "testpass123"
                })
              },
              "url": {
                "raw": "{{baseUrl}}/auth/login",
                "host": ["{{baseUrl}}"],
                "path": ["auth", "login"]
              }
            },
            "response": []
          }
        ]
      },
      {
        "name": "Complaints",
        "item": [
          {
            "name": "Create Complaint",
            "request": {
              "auth": {
                "type": "bearer",
                "bearer": [
                  {
                    "key": "token",
                    "value": "{{authToken}}",
                    "type": "string"
                  }
                ]
              },
              "method": "POST",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "body": {
                "mode": "raw",
                "raw": JSON.stringify(testComplaint)
              },
              "url": {
                "raw": "{{baseUrl}}/complaints",
                "host": ["{{baseUrl}}"],
                "path": ["complaints"]
              }
            },
            "response": []
          },
          {
            "name": "Get All Complaints",
            "request": {
              "auth": {
                "type": "bearer",
                "bearer": [
                  {
                    "key": "token",
                    "value": "{{authToken}}",
                    "type": "string"
                  }
                ]
              },
              "method": "GET",
              "header": [],
              "url": {
                "raw": "{{baseUrl}}/complaints",
                "host": ["{{baseUrl}}"],
                "path": ["complaints"]
              }
            },
            "response": []
          },
          {
            "name": "Get Complaint by ID",
            "request": {
              "auth": {
                "type": "bearer",
                "bearer": [
                  {
                    "key": "token",
                    "value": "{{authToken}}",
                    "type": "string"
                  }
                ]
              },
              "method": "GET",
              "header": [],
              "url": {
                "raw": "{{baseUrl}}/complaints/{{complaintId}}",
                "host": ["{{baseUrl}}"],
                "path": ["complaints", "{{complaintId}}"]
              }
            },
            "response": []
          }
        ]
      }
    ]
  };
  
  console.log('\n📦 Postman Collection (copy and import this JSON):');
  console.log('='.repeat(60));
  console.log(JSON.stringify(collection, null, 2));
}

// Individual test functions for manual testing
async function testCreateOnly() {
  try {
    await loginAndGetToken();
    await createComplaint();
    console.log('✅ Create test completed successfully');
  } catch (error) {
    console.error('❌ Create test failed:', error.message);
  }
}

async function testFetchOnly() {
  try {
    await loginAndGetToken();
    await fetchComplaints();
    console.log('✅ Fetch test completed successfully');
  } catch (error) {
    console.error('❌ Fetch test failed:', error.message);
  }
}

// Run the test based on command line argument
const command = process.argv[2];

switch (command) {
  case 'create':
    testCreateOnly();
    break;
  case 'fetch':
    testFetchOnly();
    break;
  case 'postman':
    generatePostmanCollection();
    break;
  default:
    runFullTest();
}

module.exports = {
  loginAndGetToken,
  createComplaint,
  fetchComplaints,
  testComplaint,
  generatePostmanCollection
};
