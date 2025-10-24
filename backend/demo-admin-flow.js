// Demo script showing the complete admin authentication flow
require('dotenv').config();
const mongoose = require('mongoose');

async function demoAdminFlow() {
  console.log('🎬 Admin Authentication Flow Demo');
  console.log('=' .repeat(40));

  const Admin = require('./src/models/Admin');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      dbName: 'fixitfast'
    });

    // Clean up any existing demo admin
    await Admin.deleteOne({ email: 'demo@admin.com' });

    console.log('\\n📋 SCENARIO: Creating a new admin account');
    console.log('Creating admin with temporary password...');

    // Step 1: Create admin with temporary password
    const admin = new Admin({
      name: 'Demo Admin',
      email: 'demo@admin.com',
      password: 'SuperAdmin@123',
      role: 'admin',
      assignedCity: 'Mumbai',
      temporaryPassword: true,
      isFirstLogin: true,
      mustChangePassword: true
    });

    await admin.save();
    console.log('✅ Admin created successfully');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   City: ${admin.assignedCity}`);
    console.log(`   Temporary Password: SuperAdmin@123`);

    console.log('\\n🔑 STEP 1: Admin tries to login with temporary password');
    console.log('POST /api/admin/login');
    console.log('Body: { email: "demo@admin.com", password: "SuperAdmin@123" }');
    console.log('(No secretKey required for temporary password)');
    console.log('\\n✅ Expected Response:');
    console.log('{');
    console.log('  "success": true,');
    console.log('  "requirePasswordChange": true,');
    console.log('  "message": "Password change required on first login",');
    console.log('  "tempToken": "jwt_token_for_password_change",');
    console.log('  "redirect": "/admin/change-password"');
    console.log('}');

    console.log('\\n🔄 STEP 2: Admin changes password');
    console.log('POST /api/admin/change-password');
    console.log('Headers: { Authorization: "Bearer temp_token" }');
    console.log('Body: {');
    console.log('  "currentPassword": "SuperAdmin@123",');
    console.log('  "newPassword": "MySecurePassword123",');
    console.log('  "confirmPassword": "MySecurePassword123"');
    console.log('}');
    console.log('\\n✅ Expected Response:');
    console.log('{');
    console.log('  "success": true,');
    console.log('  "message": "Password changed successfully",');
    console.log('  "token": "permanent_jwt_token",');
    console.log('  "redirect": "/admin/dashboard"');
    console.log('}');

    console.log('\\n❌ STEP 3: Admin tries old temporary password (BLOCKED)');
    console.log('POST /api/admin/login');
    console.log('Body: { email: "demo@admin.com", password: "SuperAdmin@123" }');
    console.log('\\n❌ Expected Response:');
    console.log('{');
    console.log('  "success": false,');
    console.log('  "message": "Temporary password is no longer valid. Please use your current password."');
    console.log('}');

    console.log('\\n✅ STEP 4: Admin logs in with new password');
    console.log('POST /api/admin/login');
    console.log('Body: { email: "demo@admin.com", password: "MySecurePassword123" }');
    console.log('(No secretKey required - removed after first password change)');
    console.log('\\n✅ Expected Response:');
    console.log('{');
    console.log('  "success": true,');
    console.log('  "token": "jwt_token",');
    console.log('  "redirect": "/admin/dashboard"  ← DIRECT TO DASHBOARD');
    console.log('}');

    console.log('\\n🎯 STEP 5: Admin accesses dashboard');
    console.log('GET /api/admin/dashboard');
    console.log('Headers: { Authorization: "Bearer jwt_token" }');
    console.log('\\n✅ Expected Response:');
    console.log('{');
    console.log('  "section": "Admin Dashboard",');
    console.log('  "features": ["User Management", "Complaint Management", ...]');
    console.log('}');

    console.log('\\n🏙️  STEP 6: Admin manages labours in their city');
    console.log('GET /api/admin/labours');
    console.log('Headers: { Authorization: "Bearer jwt_token" }');
    console.log('\\n✅ Expected: Only labours from Mumbai city');

    // Cleanup
    await Admin.deleteOne({ email: 'demo@admin.com' });

    console.log('\\n🎉 SUMMARY:');
    console.log('✓ First login requires password change');
    console.log('✓ Temporary password blocked after change');
    console.log('✓ New password works without secret key');
    console.log('✓ Direct navigation to /admin/dashboard');
    console.log('✓ City-based labour management');

    console.log('\\n💡 To test this flow:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Create admin: npm run create:temp-admin "Test Admin" test@admin.com Mumbai');
    console.log('3. Test login: npm run test:login-after-change');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the demo
demoAdminFlow().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Demo execution failed:', error);
  process.exit(1);
});