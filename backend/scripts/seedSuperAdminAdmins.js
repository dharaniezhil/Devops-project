// backend/scripts/seedSuperAdminAdmins.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const Admin = require('../src/models/Admin');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is required');
    await mongoose.connect(uri, { dbName: 'fixitfast' });

    const email = 'superadmin@fixitfast.com';
    let admin = await Admin.findOne({ email });
    if (admin) {
      console.log('SuperAdmin already exists in admins collection.');
      process.exit(0);
    }

    // Do not pre-hash here; Admin model will hash on save
    admin = await Admin.create({
      name: 'System Super Admin',
      email,
      password: 'SuperAdmin@123',
      role: 'superadmin',
      status: 'active',
      emailVerified: true,
      permissions: ['manage_admins', 'manage_users', 'manage_complaints', 'system_settings']
    });

    console.log('✅ SuperAdmin created in admins collection');
  } catch (e) {
    console.error('Seed error:', e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
