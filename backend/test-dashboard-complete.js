const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models for direct testing
const User = require('./src/models/User');
const Complaint = require('./src/models/Complaint');
const Dashboard = require('./src/models/Dashboard');

const BASE_URL = 'http://localhost:3000/api';

// Test user credentials
const testUser = {
  name: 'Dashboard Test User',
  email: 'dashboard-test@example.com',
  password: 'testpass123',
  phone: '1234567890',
  location: 'Test City'
};

const testAdmin = {
  email: 'admin@example.com',
  password: 'admin123'
};

let userToken = null;
let adminToken = null;
let testUserId = null;

async function makeRequest(method, endpoint, data = {}, token = null) {
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${endpoint}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Error:`, error.message);
      throw error;
    }
  }
}

async function testUserRegistration() {
  console.log('\n🧪 Testing User Registration and Dashboard Creation...');
  
  try {
    // Clean up any existing test user
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harinimanikandan316:Harini2005@cluster0.dwmchqq.mongodb.net/fixitfast?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGODB_URI);
    
    // Remove test user and their dashboard if they exist
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      await Dashboard.deleteOne({ user: existingUser._id });
      await Complaint.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('   🧹 Cleaned up existing test data');
    }
    
    await mongoose.connection.close();
    
    // Register new user
    const registerResponse = await makeRequest('POST', '/auth/register', testUser);
    console.log('   ✅ User registered successfully');
    
    userToken = registerResponse.token;
    testUserId = registerResponse.user.id;
    
    // Verify dashboard was created
    await mongoose.connect(MONGODB_URI);
    const dashboard = await Dashboard.findOne({ user: testUserId });
    await mongoose.connection.close();
    
    if (dashboard) {
      console.log('   ✅ Dashboard created automatically for new user');
      console.log(`      User: ${dashboard.user}`);
      console.log(`      Total: ${dashboard.totalComplaints}, Pending: ${dashboard.pending}, InProgress: ${dashboard.inProgress}, Resolved: ${dashboard.resolved}`);
      
      // Verify counts are all zero for new user
      if (dashboard.totalComplaints === 0 && dashboard.pending === 0 && dashboard.inProgress === 0 && dashboard.resolved === 0) {
        console.log('   ✅ All counts correctly initialized to 0');
        return true;
      } else {
        console.log('   ❌ Dashboard counts not properly initialized');
        return false;
      }
    } else {
      console.log('   ❌ Dashboard not created for new user');
      return false;
    }
    
  } catch (error) {
    console.error('   ❌ Registration test failed:', error.message);
    return false;
  }
}

async function testDashboardAPI() {
  console.log('\n🧪 Testing Dashboard API Endpoints...');
  
  try {
    // Test simple dashboard endpoint
    const simpleResponse = await makeRequest('GET', '/dashboard/simple', {}, userToken);
    console.log('   ✅ Simple dashboard endpoint working');
    console.log('      Response:', JSON.stringify(simpleResponse, null, 2));
    
    // Verify response format matches requirements
    const requiredFields = ['user', 'totalComplaints', 'pending', 'inProgress', 'resolved'];
    const hasAllFields = requiredFields.every(field => simpleResponse.hasOwnProperty(field));
    
    if (hasAllFields) {
      console.log('   ✅ Response contains all required fields');
    } else {
      console.log('   ❌ Response missing required fields');
      return false;
    }
    
    // Test enhanced dashboard endpoint
    const enhancedResponse = await makeRequest('GET', '/dashboard/me', {}, userToken);
    console.log('   ✅ Enhanced dashboard endpoint working');
    
    return true;
  } catch (error) {
    console.error('   ❌ Dashboard API test failed:', error.message);
    return false;
  }
}

async function testComplaintCreationAndDashboardUpdate() {
  console.log('\n🧪 Testing Complaint Creation and Dashboard Updates...');
  
  try {
    const complaint1 = {
      title: 'Test Complaint 1',
      description: 'This is a test complaint for dashboard verification',
      category: 'Roads & Infrastructure',
      priority: 'Medium',
      location: 'Test Location 1'
    };
    
    const complaint2 = {
      title: 'Test Complaint 2',
      description: 'Another test complaint for dashboard verification',
      category: 'Water Supply',
      priority: 'High',
      location: 'Test Location 2'
    };
    
    // Create first complaint
    const response1 = await makeRequest('POST', '/complaints', complaint1, userToken);
    console.log('   ✅ First complaint created');
    
    // Create second complaint  
    const response2 = await makeRequest('POST', '/complaints', complaint2, userToken);
    console.log('   ✅ Second complaint created');
    
    // Check dashboard updates
    const dashboardAfterCreation = await makeRequest('GET', '/dashboard/simple', {}, userToken);
    console.log('   📊 Dashboard after creating 2 complaints:');
    console.log('      ', JSON.stringify(dashboardAfterCreation, null, 2));
    
    // Verify counts
    if (dashboardAfterCreation.totalComplaints === 2 && dashboardAfterCreation.pending === 2) {
      console.log('   ✅ Dashboard correctly updated after complaint creation');
      return { success: true, complaint1Id: response1.complaint.id, complaint2Id: response2.complaint.id };
    } else {
      console.log('   ❌ Dashboard counts incorrect after complaint creation');
      console.log(`      Expected: Total=2, Pending=2`);
      console.log(`      Got: Total=${dashboardAfterCreation.totalComplaints}, Pending=${dashboardAfterCreation.pending}`);
      return { success: false };
    }
    
  } catch (error) {
    console.error('   ❌ Complaint creation test failed:', error.message);
    return { success: false };
  }
}

async function testComplaintStatusUpdate(complaintId) {
  console.log('\n🧪 Testing Complaint Status Updates...');
  
  try {
    // First, log in as admin
    const adminLoginResponse = await makeRequest('POST', '/auth/login', {
      email: testAdmin.email,
      password: testAdmin.password
    });
    adminToken = adminLoginResponse.token;
    console.log('   ✅ Admin logged in');
    
    // Update complaint status from Pending to In Progress
    await makeRequest('PUT', `/complaints/${complaintId}/status`, {
      status: 'In Progress',
      adminNote: 'Starting work on this complaint'
    }, adminToken);
    console.log('   ✅ Complaint status updated to In Progress');
    
    // Check dashboard
    let dashboard = await makeRequest('GET', '/dashboard/simple', {}, userToken);
    console.log('   📊 Dashboard after status update to In Progress:');
    console.log('      ', JSON.stringify(dashboard, null, 2));
    
    // Verify counts
    if (dashboard.totalComplaints === 2 && dashboard.pending === 1 && dashboard.inProgress === 1) {
      console.log('   ✅ Dashboard correctly updated after status change to In Progress');
    } else {
      console.log('   ❌ Dashboard counts incorrect after status change');
      return false;
    }
    
    // Update status to Resolved
    await makeRequest('PUT', `/complaints/${complaintId}/status`, {
      status: 'Resolved',
      adminNote: 'Complaint has been resolved'
    }, adminToken);
    console.log('   ✅ Complaint status updated to Resolved');
    
    // Check dashboard again
    dashboard = await makeRequest('GET', '/dashboard/simple', {}, userToken);
    console.log('   📊 Dashboard after status update to Resolved:');
    console.log('      ', JSON.stringify(dashboard, null, 2));
    
    // Verify counts
    if (dashboard.totalComplaints === 2 && dashboard.pending === 1 && dashboard.inProgress === 0 && dashboard.resolved === 1) {
      console.log('   ✅ Dashboard correctly updated after status change to Resolved');
      return true;
    } else {
      console.log('   ❌ Dashboard counts incorrect after status change to Resolved');
      return false;
    }
    
  } catch (error) {
    console.error('   ❌ Status update test failed:', error.message);
    return false;
  }
}

async function runMigration() {
  console.log('\n🧪 Testing Migration Script...');
  
  try {
    const migrateDashboards = require('./scripts/migrateDashboards');
    await migrateDashboards();
    console.log('   ✅ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('   ❌ Migration test failed:', error.message);
    return false;
  }
}

async function testAdminDashboardEndpoints() {
  console.log('\n🧪 Testing Admin Dashboard Endpoints...');
  
  try {
    if (!adminToken) {
      const adminLoginResponse = await makeRequest('POST', '/auth/login', {
        email: testAdmin.email,
        password: testAdmin.password
      });
      adminToken = adminLoginResponse.token;
    }
    
    // Test admin dashboard endpoint
    const allDashboards = await makeRequest('GET', '/dashboard/all', {}, adminToken);
    console.log('   ✅ Admin dashboard endpoint working');
    console.log(`   📊 Found ${allDashboards.count} user dashboards`);
    
    // Show sample dashboard data
    if (allDashboards.data && allDashboards.data.length > 0) {
      console.log('   📋 Sample dashboard entries:');
      allDashboards.data.slice(0, 3).forEach((dashboard, index) => {
        console.log(`      ${index + 1}. User: ${dashboard.user}`);
        console.log(`         Total: ${dashboard.totalComplaints}, Pending: ${dashboard.pending}, InProgress: ${dashboard.inProgress}, Resolved: ${dashboard.resolved}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Admin dashboard test failed:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harinimanikandan316:Harini2005@cluster0.dwmchqq.mongodb.net/fixitfast?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGODB_URI);
    
    if (testUserId) {
      await Dashboard.deleteOne({ user: testUserId });
      await Complaint.deleteMany({ user: testUserId });
      await User.deleteOne({ _id: testUserId });
      console.log('   ✅ Test data cleaned up');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('   ❌ Cleanup failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive dashboard system tests...');
  console.log(`🔗 Testing against: ${BASE_URL}`);
  
  const results = [];
  
  // Test 1: User registration and dashboard creation
  results.push(await testUserRegistration());
  
  // Test 2: Dashboard API endpoints
  results.push(await testDashboardAPI());
  
  // Test 3: Complaint creation and dashboard updates
  const complaintResult = await testComplaintCreationAndDashboardUpdate();
  results.push(complaintResult.success);
  
  // Test 4: Complaint status updates
  if (complaintResult.success && complaintResult.complaint1Id) {
    results.push(await testComplaintStatusUpdate(complaintResult.complaint1Id));
  } else {
    results.push(false);
  }
  
  // Test 5: Migration script
  results.push(await runMigration());
  
  // Test 6: Admin dashboard endpoints
  results.push(await testAdminDashboardEndpoints());
  
  // Clean up
  await cleanup();
  
  // Summary
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log('\n📊 Test Summary:');
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Success rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Dashboard system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
  
  return passed === total;
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
