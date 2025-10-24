// backend/scripts/fixSuperAdminPassword.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const User = require('../src/models/User');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is required');
    await mongoose.connect(uri, { dbName: 'fixitfast' });

    const email = 'superadmin@fixitfast.com';

    const result = await User.findOneAndUpdate(
      { email },
      { $set: { password: 'SuperAdmin@123' } },
      { new: true, runValidators: true }
    );

    if (!result) {
      console.log('Super Admin not found.');
    } else {
      console.log('✅ Super Admin password reset and hashed by pre-update hook.');
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
