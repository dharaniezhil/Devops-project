// Test script for time validation
const { validateAttendanceTime, isWithinOfficeHours } = require('./src/utils/timeUtils');

console.log('=== Time Validation Test ===\n');

// Test current time
const currentTime = new Date();
console.log(`Current time: ${currentTime.toLocaleString()}`);

const currentValidation = validateAttendanceTime(currentTime);
console.log('Current time validation:', {
  isValid: currentValidation.isValid,
  message: currentValidation.message,
  details: currentValidation.details
});

console.log('\n=== Test Different Times ===');

// Test 8:30 AM (before office hours)
const beforeOffice = new Date();
beforeOffice.setHours(8, 30, 0, 0);
console.log(`\n8:30 AM test:`, validateAttendanceTime(beforeOffice));

// Test 9:00 AM (start of office hours)
const startOffice = new Date();
startOffice.setHours(9, 0, 0, 0);
console.log(`\n9:00 AM test:`, validateAttendanceTime(startOffice));

// Test 2:00 PM (during office hours)
const duringOffice = new Date();
duringOffice.setHours(14, 0, 0, 0);
console.log(`\n2:00 PM test:`, validateAttendanceTime(duringOffice));

// Test 4:59 PM (end of office hours)
const endOffice = new Date();
endOffice.setHours(16, 59, 0, 0);
console.log(`\n4:59 PM test:`, validateAttendanceTime(endOffice));

// Test 5:00 PM (after office hours)
const afterOffice = new Date();
afterOffice.setHours(17, 0, 0, 0);
console.log(`\n5:00 PM test:`, validateAttendanceTime(afterOffice));

// Test 6:00 PM (well after office hours)
const eveningTime = new Date();
eveningTime.setHours(18, 0, 0, 0);
console.log(`\n6:00 PM test:`, validateAttendanceTime(eveningTime));

console.log('\n=== Test Complete ===');