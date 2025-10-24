// backend/scripts/seedSuperAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const User = require('../src/models/User');

async function createSuperAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required in .env');
  await mongoose.connect(uri, { dbName: 'fixitfast' });
  try {
    const email = 'superadmin@fixitfast.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Super Admin already exists. Skipping.');
      return;
    }
    // Do NOT pre-hash here; the model pre-save hook will hash once
    const superAdmin = new User({
      name: 'System Super Admin',
      email,
      password: 'SuperAdmin@123',
      role: 'superadmin',
      location: 'System'
    });
    await superAdmin.save();
    console.log('✅ Super Admin created successfully!');
  } finally {
    await mongoose.disconnect();
  }
}

createSuperAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
