// backend/scripts/debugFindAdmin.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'fixitfast' });
    const email = process.argv[2] || 'superadmin@fixitfast.com';
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      console.log('NOT_FOUND');
      process.exit(0);
    }
    const ok = await bcrypt.compare(process.argv[3] || 'SuperAdmin@123', admin.password);
    console.log(JSON.stringify({ id: String(admin._id), email: admin.email, role: admin.role, ok }, null, 2));
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
