// backend/scripts/fixAdminPassword.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const Admin = require('../src/models/Admin');

(async () => {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];
    if (!email || !newPassword) {
      console.error('Usage: node scripts/fixAdminPassword.js <email> <newPassword>');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'fixitfast' });

    const updated = await Admin.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { $set: { password: newPassword } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.log('Admin not found');
      process.exit(0);
    }

    console.log('✅ Password updated and hashed for', updated.email);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
