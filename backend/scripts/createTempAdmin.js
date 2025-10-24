// Script to create an admin with temporary password
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');

async function createTempAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
      dbName: 'fixitfast'
    });
    console.log('✅ Connected to MongoDB');

    // Get input from command line
    const args = process.argv.slice(2);
    if (args.length < 3) {
      console.log('❌ Usage: node scripts/createTempAdmin.js <name> <email> <city>');
      console.log('Example: node scripts/createTempAdmin.js "John Smith" john@example.com Mumbai');
      process.exit(1);
    }

    const [name, email, city] = args;

    // Check if admin already exists
    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      console.log('❌ Admin with this email already exists');
      process.exit(1);
    }

    // Create admin with temporary password
    const admin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: 'SuperAdmin@123', // This will be hashed but we set temporaryPassword flag
      role: 'admin',
      assignedCity: city.trim(),
      temporaryPassword: true,
      isFirstLogin: true,
      mustChangePassword: true,
      status: 'active'
    });

    await admin.save();

    console.log('\n🎉 Admin created successfully!');
    console.log('📋 Details:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   City: ${admin.assignedCity}`);
    console.log(`   Temporary Password: SuperAdmin@123`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n📝 Instructions for the admin:');
    console.log('1. Login with email and password: SuperAdmin@123');
    console.log('2. System will force password change on first login');
    console.log('3. No secret key is required for temporary password login');
    console.log('4. After password change, secret key requirement is removed');
    console.log(`5. Admin can only manage labours in: ${admin.assignedCity}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

// Run the script
createTempAdmin();