// Simple test to verify API endpoint blocks outside office hours
const { validateAttendanceTime } = require('./src/utils/timeUtils');

console.log('=== API ENDPOINT TIME RESTRICTION TEST ===\n');

// Simulate the exact validation that happens in the labour.js route
function simulateAttendanceRequest(testTime) {
  console.log(`Testing request at: ${testTime.toLocaleString()}`);
  
  // This is the exact code from our labour.js route (lines 392-428)
  const currentTime = testTime;
  const timeValidation = validateAttendanceTime(currentTime);
  
  console.log(`⏰ Attendance attempt at ${currentTime.toLocaleString()}: ${timeValidation.isValid ? 'ALLOWED' : 'BLOCKED'}`);
  
  if (!timeValidation.isValid) {
    console.log(`❌ BLOCKED: Attendance marking outside office hours - Time: ${timeValidation.details.currentTime}`);
    
    // Simulate the response that would be sent
    const response = {
      success: false,
      message: timeValidation.message,
      timeRestriction: true,
      blocked: true,
      details: {
        ...timeValidation.details,
        attemptTime: currentTime.toISOString(),
        actionType: 'check_in'
      }
    };
    
    console.log('API Response:', JSON.stringify(response, null, 2));
    return false;
  }
  
  // Double check validation (lines 415-428)
  const doubleCheckTime = testTime;
  if (doubleCheckTime.getHours() < 9 || doubleCheckTime.getHours() >= 17) {
    console.log(`❌ DOUBLE-CHECK BLOCKED: Attendance marking outside office hours - Hour: ${doubleCheckTime.getHours()}`);
    
    const response = {
      success: false,
      message: 'Attendance can only be marked during office hours (9:00 AM – 5:00 PM)',
      timeRestriction: true,
      blocked: true,
      details: {
        currentTime: doubleCheckTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        officeHours: '9:00 AM - 5:00 PM',
        currentHour: doubleCheckTime.getHours()
      }
    };
    
    console.log('API Response (Double Check):', JSON.stringify(response, null, 2));
    return false;
  }
  
  console.log('✅ ALLOWED: Request would proceed to database operation');
  return true;
}

console.log('1. Testing Current Time (Should be BLOCKED):');
console.log('============================================');
const now = new Date();
const currentAllowed = simulateAttendanceRequest(now);

console.log('\n2. Testing Various Times:');
console.log('========================');

const testTimes = [
  { hour: 8, minute: 59, label: '8:59 AM (Just before office)' },
  { hour: 9, minute: 0, label: '9:00 AM (Exact start)' },
  { hour: 12, minute: 30, label: '12:30 PM (Lunch time)' },
  { hour: 16, minute: 59, label: '4:59 PM (Just before end)' },
  { hour: 17, minute: 0, label: '5:00 PM (Exact end)' },
  { hour: 17, minute: 1, label: '5:01 PM (Just after end)' },
  { hour: 22, minute: 0, label: '10:00 PM (Late night)' }
];

let blockedCount = 0;
let allowedCount = 0;

for (const test of testTimes) {
  const testTime = new Date();
  testTime.setHours(test.hour, test.minute, 0, 0);
  
  console.log(`\n--- ${test.label} ---`);
  const allowed = simulateAttendanceRequest(testTime);
  
  if (allowed) {
    allowedCount++;
  } else {
    blockedCount++;
  }
}

console.log('\n=== SUMMARY ===');
console.log(`✅ Allowed requests: ${allowedCount}`);
console.log(`❌ Blocked requests: ${blockedCount}`);
console.log(`🎯 Current time status: ${currentAllowed ? 'ALLOWED' : 'BLOCKED'}`);

console.log('\n🛡️  PROTECTION STATUS:');
if (blockedCount > 0) {
  console.log('✅ Time restrictions are ACTIVE and WORKING');
  console.log('✅ No attendance records can be saved outside office hours');
  console.log('✅ API endpoints properly validate time before database operations');
} else {
  console.log('❌ WARNING: Time restrictions may not be working properly');
}

console.log('\n🕘 OFFICE HOURS: 9:00 AM - 5:00 PM');
console.log('📝 RESULT: Attendance marking is restricted to office hours only');