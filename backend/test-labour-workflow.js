const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_DATA = {
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'password123'
  },
  admin: {
    name: 'Test Admin',
    email: 'testadmin@test.com',
    password: 'password123'
  },
  labour: {
    name: 'Test Labour Worker',
    email: 'labour@test.com',
    password: 'password123',
    skills: ['Plumbing', 'Electrical', 'Road Repair']
  },
  user: {
    name: 'Test User',
    email: 'testuser@test.com',
    password: 'password123',
    phone: '1234567890',
    location: 'Test City'
  },
  complaint: {
    title: 'Broken Street Light',
    description: 'The street light on Main Street is not working properly',
    category: 'Electricity',
    priority: 'High',
    location: 'Main Street, Block 5'
  }
};

let tokens = {};
let ids = {};

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

// Test functions
async function testSuperAdminLogin() {
  console.log('\n🔐 Testing SuperAdmin Login...');
  const result = await apiCall('POST', '/admins/login', TEST_DATA.superAdmin);
  
  if (result.success && result.data.token) {
    tokens.superAdmin = result.data.token;
    console.log('✅ SuperAdmin login successful');
    console.log(`   Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log('❌ SuperAdmin login failed:', result.error);
    return false;
  }
}

async function testCreateLabour() {
  console.log('\n👷 Testing Labour Account Creation...');
  const result = await apiCall('POST', '/admins/labours', TEST_DATA.labour, tokens.superAdmin);
  
  if (result.success && result.data.labour) {
    ids.labour = result.data.labour.id;
    console.log('✅ Labour account created successfully');
    console.log(`   ID: ${ids.labour}`);
    console.log(`   Name: ${result.data.labour.name}`);
    console.log(`   Skills: ${result.data.labour.skills.join(', ')}`);
    return true;
  } else {
    console.log('❌ Labour creation failed:', result.error);
    return false;
  }
}

async function testCreateAdmin() {
  console.log('\n👨‍💼 Testing Admin Account Creation...');
  const result = await apiCall('POST', '/admins/create-admin', TEST_DATA.admin, tokens.superAdmin);
  
  if (result.success && result.data.user) {
    ids.admin = result.data.user.id;
    console.log('✅ Admin account created successfully');
    console.log(`   ID: ${ids.admin}`);
    console.log(`   Secret Key: ${result.data.secretKey}`);
    TEST_DATA.admin.secretKey = result.data.secretKey; // Store for login
    return true;
  } else {
    console.log('❌ Admin creation failed:', result.error);
    return false;
  }
}

async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  const result = await apiCall('POST', '/admins/login', {
    ...TEST_DATA.admin,
    secretKey: TEST_DATA.admin.secretKey
  });
  
  if (result.success && result.data.token) {
    tokens.admin = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
}

async function testLabourLogin() {
  console.log('\n🔐 Testing Labour Login...');
  const result = await apiCall('POST', '/labour/login', {
    email: TEST_DATA.labour.email,
    password: TEST_DATA.labour.password
  });
  
  if (result.success && result.data.token) {
    tokens.labour = result.data.token;
    console.log('✅ Labour login successful');
    console.log(`   Role: ${result.data.user.role}`);
    console.log(`   Redirect: ${result.data.redirect}`);
    return true;
  } else {
    console.log('❌ Labour login failed:', result.error);
    return false;
  }
}

async function testCreateUser() {
  console.log('\n👤 Testing User Account Creation...');
  const result = await apiCall('POST', '/auth/register', TEST_DATA.user);
  
  if (result.success && result.data.user) {
    ids.user = result.data.user.id;
    tokens.user = result.data.token;
    console.log('✅ User account created successfully');
    console.log(`   ID: ${ids.user}`);
    return true;
  } else {
    console.log('❌ User creation failed:', result.error);
    return false;
  }
}

async function testCreateComplaint() {
  console.log('\n📝 Testing Complaint Creation...');
  const result = await apiCall('POST', '/complaints', TEST_DATA.complaint, tokens.user);
  
  if (result.success && result.data.complaint) {
    ids.complaint = result.data.complaint.id;
    console.log('✅ Complaint created successfully');
    console.log(`   ID: ${ids.complaint}`);
    console.log(`   Status: ${result.data.complaint.status}`);
    return true;
  } else {
    console.log('❌ Complaint creation failed:', result.error);
    return false;
  }
}

async function testListLabours() {
  console.log('\n📋 Testing List Labours...');
  const result = await apiCall('GET', '/admins/labours', null, tokens.admin);
  
  if (result.success && result.data.labours) {
    console.log('✅ Labours retrieved successfully');
    console.log(`   Count: ${result.data.labours.length}`);
    result.data.labours.forEach(labour => {
      console.log(`   - ${labour.name} (${labour.email}) [${labour.status}]`);
    });
    return true;
  } else {
    console.log('❌ List labours failed:', result.error);
    return false;
  }
}

async function testAssignComplaint() {
  console.log('\n🎯 Testing Complaint Assignment to Labour...');
  const result = await apiCall('PUT', `/complaints/${ids.complaint}/assign`, {
    labourId: ids.labour,
    note: 'Assigned to experienced electrical worker'
  }, tokens.admin);
  
  if (result.success && result.data.complaint) {
    console.log('✅ Complaint assigned successfully');
    console.log(`   Status: ${result.data.complaint.status}`);
    console.log(`   Assigned To: ${result.data.complaint.assignedTo?.name}`);
    console.log(`   Assigned By: ${result.data.complaint.assignedBy?.name}`);
    return true;
  } else {
    console.log('❌ Complaint assignment failed:', result.error);
    return false;
  }
}

async function testLabourGetComplaints() {
  console.log('\n📋 Testing Labour Get Assigned Complaints...');
  const result = await apiCall('GET', '/labour/complaints', null, tokens.labour);
  
  if (result.success && result.data.complaints) {
    console.log('✅ Labour complaints retrieved successfully');
    console.log(`   Count: ${result.data.complaints.length}`);
    result.data.complaints.forEach(complaint => {
      console.log(`   - ${complaint.title} [${complaint.status}]`);
    });
    return true;
  } else {
    console.log('❌ Labour get complaints failed:', result.error);
    return false;
  }
}

async function testLabourStartWork() {
  console.log('\n🚀 Testing Labour Start Work (In Progress)...');
  const result = await apiCall('PUT', `/labour/complaints/${ids.complaint}/status`, {
    status: 'In Progress',
    remarks: 'Started working on the street light. Identified the issue with wiring.'
  }, tokens.labour);
  
  if (result.success && result.data.complaint) {
    console.log('✅ Labour started work successfully');
    console.log(`   Status: ${result.data.complaint.status}`);
    console.log(`   Work Started: ${result.data.complaint.workStartedAt ? 'Yes' : 'No'}`);
    return true;
  } else {
    console.log('❌ Labour start work failed:', result.error);
    return false;
  }
}

async function testLabourAddPhoto() {
  console.log('\n📷 Testing Labour Add Work Photo...');
  const result = await apiCall('POST', `/labour/complaints/${ids.complaint}/photos`, {
    url: 'https://example.com/work-photo.jpg',
    filename: 'street-light-repair.jpg',
    description: 'Photo showing the replaced electrical components'
  }, tokens.labour);
  
  if (result.success) {
    console.log('✅ Work photo added successfully');
    console.log(`   Photo: ${result.data.photo.filename}`);
    return true;
  } else {
    console.log('❌ Add work photo failed:', result.error);
    return false;
  }
}

async function testLabourCompleteWork() {
  console.log('\n✅ Testing Labour Complete Work...');
  const result = await apiCall('PUT', `/labour/complaints/${ids.complaint}/status`, {
    status: 'Completed',
    remarks: 'Street light has been fully repaired. All electrical connections are secure. Light is now functioning properly.'
  }, tokens.labour);
  
  if (result.success && result.data.complaint) {
    console.log('✅ Labour completed work successfully');
    console.log(`   Status: ${result.data.complaint.status}`);
    console.log(`   Work Completed: ${result.data.complaint.workCompletedAt ? 'Yes' : 'No'}`);
    return true;
  } else {
    console.log('❌ Labour complete work failed:', result.error);
    return false;
  }
}

async function testGetComplaintDetails() {
  console.log('\n🔍 Testing Get Complaint Details (Admin View)...');
  const result = await apiCall('GET', `/complaints/${ids.complaint}`, null, tokens.admin);
  
  if (result.success && result.data.complaint) {
    const complaint = result.data.complaint;
    console.log('✅ Complaint details retrieved successfully');
    console.log(`   Title: ${complaint.title}`);
    console.log(`   Status: ${complaint.status}`);
    console.log(`   Assigned To: ${complaint.assignedTo?.name || 'None'}`);
    console.log(`   Labour Remarks: ${complaint.labourRemarks || 'None'}`);
    console.log(`   Work Photos: ${complaint.workPhotos?.length || 0}`);
    console.log(`   Status History: ${complaint.statusHistory?.length || 0} entries`);
    return true;
  } else {
    console.log('❌ Get complaint details failed:', result.error);
    return false;
  }
}

async function testLabourProfile() {
  console.log('\n👤 Testing Labour Profile...');
  const result = await apiCall('GET', '/labour/profile', null, tokens.labour);
  
  if (result.success && result.data.labour) {
    const labour = result.data.labour;
    console.log('✅ Labour profile retrieved successfully');
    console.log(`   Name: ${labour.name}`);
    console.log(`   Email: ${labour.email}`);
    console.log(`   Skills: ${labour.skills.join(', ')}`);
    console.log(`   Status: ${labour.status}`);
    return true;
  } else {
    console.log('❌ Labour profile failed:', result.error);
    return false;
  }
}

async function testComplaintStats() {
  console.log('\n📊 Testing Complaint Statistics...');
  const result = await apiCall('GET', '/complaints/stats/overview', null, tokens.admin);
  
  if (result.success && result.data.stats) {
    const stats = result.data.stats;
    console.log('✅ Complaint statistics retrieved successfully');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Assigned: ${stats.assigned}`);
    console.log(`   In Progress: ${stats.inProgress}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Resolved: ${stats.resolved}`);
    return true;
  } else {
    console.log('❌ Complaint stats failed:', result.error);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('🧪 Starting Labour Role System Tests');
  console.log('=====================================');

  const tests = [
    { name: 'SuperAdmin Login', fn: testSuperAdminLogin },
    { name: 'Create Labour Account', fn: testCreateLabour },
    { name: 'Create Admin Account', fn: testCreateAdmin },
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Labour Login', fn: testLabourLogin },
    { name: 'Create User Account', fn: testCreateUser },
    { name: 'Create Complaint', fn: testCreateComplaint },
    { name: 'List Labours', fn: testListLabours },
    { name: 'Assign Complaint to Labour', fn: testAssignComplaint },
    { name: 'Labour Get Complaints', fn: testLabourGetComplaints },
    { name: 'Labour Start Work', fn: testLabourStartWork },
    { name: 'Labour Add Photo', fn: testLabourAddPhoto },
    { name: 'Labour Complete Work', fn: testLabourCompleteWork },
    { name: 'Get Complaint Details', fn: testGetComplaintDetails },
    { name: 'Labour Profile', fn: testLabourProfile },
    { name: 'Complaint Statistics', fn: testComplaintStats }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      failed++;
    }
  }

  console.log('\n📋 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Labour role system is working correctly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please check the output above for details.`);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, apiCall, TEST_DATA };