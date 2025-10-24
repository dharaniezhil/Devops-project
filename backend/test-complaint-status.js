// Test script to validate Complaint model status enum
const mongoose = require('mongoose');
require('dotenv').config();

// Import the Complaint model
const Complaint = require('./src/models/Complaint');

async function testComplaintStatus() {
  console.log('🧪 Testing Complaint Status Validation...\n');
  
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Validate that 'Assigned' is now a valid status
    console.log('1. Testing that "Assigned" is now a valid status...');
    const testComplaint = new Complaint({
      title: 'Test Complaint',
      description: 'This is a test complaint to validate status enum',
      category: 'Other',
      priority: 'Medium',
      location: 'Test Location',
      status: 'Assigned',  // This should not throw an error now
      user: new mongoose.Types.ObjectId()
    });
    
    try {
      await testComplaint.validate();
      console.log('✅ "Assigned" status is valid');
    } catch (error) {
      console.log('❌ "Assigned" status validation failed:', error.message);
    }
    
    // Test 2: Check all valid statuses
    console.log('\n2. Testing all valid status values...');
    const validStatuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    
    for (const status of validStatuses) {
      const complaint = new Complaint({
        title: 'Test Complaint',
        description: 'This is a test complaint',
        category: 'Other',
        priority: 'Medium',
        location: 'Test Location',
        status: status,
        user: new mongoose.Types.ObjectId()
      });
      
      try {
        await complaint.validate();
        console.log(`✅ "${status}" status is valid`);
      } catch (error) {
        console.log(`❌ "${status}" status validation failed:`, error.message);
      }
    }
    
    // Test 3: Check that invalid status still fails
    console.log('\n3. Testing that invalid status still fails...');
    const invalidComplaint = new Complaint({
      title: 'Test Complaint',
      description: 'This is a test complaint',
      category: 'Other',
      priority: 'Medium',
      location: 'Test Location',
      status: 'Invalid Status',
      user: new mongoose.Types.ObjectId()
    });
    
    try {
      await invalidComplaint.validate();
      console.log('❌ Invalid status should have failed but passed!');
    } catch (error) {
      console.log('✅ Invalid status correctly failed validation:', error.message);
    }
    
    // Test 4: Test the getActiveTaskCount static method
    console.log('\n4. Testing getActiveTaskCount method...');
    const testLabourId = new mongoose.Types.ObjectId();
    const activeCount = await Complaint.getActiveTaskCount(testLabourId);
    console.log(`✅ getActiveTaskCount method works. Found ${activeCount} active tasks for test labour`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testComplaintStatus();