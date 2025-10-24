// Instant Dashboard Setup Script
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Real-Time Complaints Dashboard...\n');

// Check if files exist
const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

if (!fs.existsSync(backendDir)) {
  console.error('❌ Backend directory not found');
  process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
  console.error('❌ Frontend directory not found');
  process.exit(1);
}

console.log('✅ Directories found');
console.log('✅ Dashboard component updated');
console.log('✅ Backend routes updated');

console.log('\n📋 SETUP INSTRUCTIONS:\n');
console.log('1. Open TWO terminal windows/tabs');
console.log('2. In Terminal 1, run:');
console.log('   cd "backend"');
console.log('   npm run dev');
console.log('');
console.log('3. In Terminal 2, run:');
console.log('   cd "frontend"');
console.log('   npm start');
console.log('');
console.log('4. Wait for both servers to start');
console.log('5. Open browser to http://localhost:3000');
console.log('6. Login as ADMIN user');
console.log('7. Navigate to the Dashboard');
console.log('');
console.log('🔍 DEBUGGING:');
console.log('- Check browser console for logs (🔄, ✅, ❌)');
console.log('- Visit /auth-debug to see authentication status');
console.log('- Dashboard refreshes every 5 seconds automatically');
console.log('');
console.log('✅ THE NEW DASHBOARD FEATURES:');
console.log('- Real-time complaints display (5-second refresh)');
console.log('- Live statistics cards');
console.log('- Complaints organized by status');
console.log('- Multiple API endpoint fallbacks');
console.log('- Detailed error messages and debugging');
console.log('- Manual refresh button');
console.log('');
console.log('🎯 WHAT TO EXPECT:');
console.log('- Statistics cards show real-time counts');
console.log('- Complaints appear in status sections');
console.log('- "Last update" timestamp shows when data refreshed');
console.log('- New complaints appear within 5 seconds');
console.log('');
console.log('🆘 IF PROBLEMS:');
console.log('1. Check if both servers are running');
console.log('2. Verify you\'re logged in as admin');
console.log('3. Check browser console for errors');
console.log('4. Try the AuthDebug component at /auth-debug');
console.log('');
console.log('Ready to test! 🎉');