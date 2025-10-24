// Test script for Dashboard API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  email: 'testuser@example.com',
  password: 'testpass123'
};

let authToken = null;

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

async function testDashboardEndpoint() {
  try {
    console.log('\n📊 Step 2: Testing Dashboard Statistics...');
    console.log('🔗 Endpoint: GET /api/dashboard/me');
    
    const response = await axios.get(`${BASE_URL}/dashboard/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dashboard data fetched successfully!');
    console.log('📄 Response Status:', response.status);
    
    const data = response.data.data;
    
    console.log('\n👤 User Info:');
    console.log(`   Name: ${data.user.name}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Location: ${data.user.location}`);
    
    console.log('\n📊 Statistics:');
    console.log(`   Total Complaints: ${data.statistics.totalComplaints}`);
    console.log(`   Pending: ${data.statistics.pendingComplaints}`);
    console.log(`   In Progress: ${data.statistics.inProgressComplaints}`);
    console.log(`   Resolved: ${data.statistics.resolvedComplaints}`);
    console.log(`   Rejected: ${data.statistics.rejectedComplaints}`);
    
    console.log('\n📈 Status Breakdown:');
    Object.entries(data.statusBreakdown).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log('\n🏷️  Category Breakdown:');
    if (Object.keys(data.categoryBreakdown).length === 0) {
      console.log('   No complaints by category yet');
    } else {
      Object.entries(data.categoryBreakdown).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
    }
    
    console.log('\n⚡ Priority Breakdown:');
    if (Object.keys(data.priorityBreakdown).length === 0) {
      console.log('   No complaints by priority yet');
    } else {
      Object.entries(data.priorityBreakdown).forEach(([priority, count]) => {
        console.log(`   ${priority}: ${count}`);
      });
    }
    
    console.log('\n🕐 Recent Complaints:');
    if (data.recentComplaints.length === 0) {
      console.log('   No recent complaints');
    } else {
      data.recentComplaints.forEach((complaint, index) => {
        console.log(`   ${index + 1}. ${complaint.title} (${complaint.status})`);
        console.log(`      Category: ${complaint.category} | Priority: ${complaint.priority}`);
        console.log(`      Location: ${complaint.location}`);
        console.log(`      Date: ${new Date(complaint.createdAt).toLocaleDateString()}`);
        console.log('');
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Dashboard API test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Troubleshooting - 401 Unauthorized:');
      console.log('   - Check if JWT token is valid');
      console.log('   - Verify user is logged in');
      console.log('   - Check Authorization header format');
    }
    
    throw error;
  }
}

async function testAdminDashboard() {
  try {
    console.log('\n👑 Step 3: Testing Admin Dashboard (if admin user)...');
    console.log('🔗 Endpoint: GET /api/dashboard/admin/stats');
    
    const response = await axios.get(`${BASE_URL}/dashboard/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin dashboard data fetched successfully!');
    
    const data = response.data.data;
    
    console.log('\n📊 System Statistics:');
    console.log(`   Total Complaints: ${data.statistics.totalComplaints}`);
    console.log(`   Pending: ${data.statistics.pendingComplaints}`);
    console.log(`   In Progress: ${data.statistics.inProgressComplaints}`);
    console.log(`   Resolved: ${data.statistics.resolvedComplaints}`);
    console.log(`   Rejected: ${data.statistics.rejectedComplaints}`);
    console.log(`   Total Users: ${data.statistics.totalUsers}`);
    console.log(`   Active Users: ${data.statistics.activeUsers}`);
    
    console.log('\n🏆 Top Categories:');
    data.topCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat._id}: ${cat.count} complaints`);
    });
    
    return data;
    
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('ℹ️  Admin dashboard access denied (user not admin)');
    } else {
      console.error('❌ Admin dashboard test failed:', error.response?.data || error.message);
    }
  }
}

async function runFullDashboardTest() {
  console.log('🚀 Starting Dashboard API Test Suite');
  console.log('=====================================\n');
  
  try {
    // Step 1: Login
    await loginAndGetToken();
    
    // Step 2: Test user dashboard
    await testDashboardEndpoint();
    
    // Step 3: Test admin dashboard (if admin)
    await testAdminDashboard();
    
    console.log('\n🎉 All dashboard tests completed successfully!');
    console.log('✅ Your dashboard system is working correctly');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Generate Postman collection
function generatePostmanCollection() {
  const collection = {
    "info": {
      "name": "FixItFast Dashboard API",
      "description": "Dashboard API endpoints for user statistics and admin overview",
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
                "raw": JSON.stringify(testUser)
              },
              "url": {
                "raw": "{{baseUrl}}/auth/login",
                "host": ["{{baseUrl}}"],
                "path": ["auth", "login"]
              }
            }
          }
        ]
      },
      {
        "name": "Dashboard",
        "item": [
          {
            "name": "Get User Dashboard Stats",
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
                "raw": "{{baseUrl}}/dashboard/me",
                "host": ["{{baseUrl}}"],
                "path": ["dashboard", "me"]
              },
              "description": "Get dashboard statistics for the logged-in user"
            }
          },
          {
            "name": "Get Admin Dashboard Stats",
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
                "raw": "{{baseUrl}}/dashboard/admin/stats",
                "host": ["{{baseUrl}}"],
                "path": ["dashboard", "admin", "stats"]
              },
              "description": "Get system-wide dashboard statistics (admin only)"
            }
          }
        ]
      }
    ]
  };
  
  console.log('\n📦 Postman Collection (copy and import this JSON):');
  console.log('='.repeat(60));
  console.log(JSON.stringify(collection, null, 2));
}

// Manual testing instructions
function printManualTestingInstructions() {
  console.log('\n📋 Manual Testing Instructions:');
  console.log('==============================\n');
  
  console.log('1. Start your backend server:');
  console.log('   cd backend && npm start\n');
  
  console.log('2. Test with curl commands:\n');
  
  console.log('   # Login first:');
  console.log('   curl -X POST http://localhost:5000/api/auth/login \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log(`     -d '${JSON.stringify(testUser)}'\n`);
  
  console.log('   # Get user dashboard (replace TOKEN with actual token):');
  console.log('   curl -X GET http://localhost:5000/api/dashboard/me \\');
  console.log('     -H "Authorization: Bearer TOKEN"\n');
  
  console.log('   # Get admin dashboard (if admin user):');
  console.log('   curl -X GET http://localhost:5000/api/dashboard/admin/stats \\');
  console.log('     -H "Authorization: Bearer TOKEN"\n');
  
  console.log('3. Check your MongoDB Atlas dashboard:');
  console.log('   - Database: fixitfast');
  console.log('   - Collections: users, complaints');
  console.log('   - Users should have complaintCount field\n');
  
  console.log('4. Run migration script (if needed):');
  console.log('   cd backend/scripts');
  console.log('   node migrate-user-complaint-counts.js\n');
}

// Run based on command line argument
const command = process.argv[2];

switch (command) {
  case 'postman':
    generatePostmanCollection();
    break;
  case 'instructions':
    printManualTestingInstructions();
    break;
  default:
    runFullDashboardTest();
}

module.exports = {
  runFullDashboardTest,
  testDashboardEndpoint,
  loginAndGetToken,
  generatePostmanCollection
};
