// Migration script to add assignedCity to existing admins
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');

async function migrateAdminCity() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
      dbName: 'fixitfast'
    });
    console.log('✅ Connected to MongoDB');

    // Find all admins without assignedCity
    const adminsWithoutCity = await Admin.find({ 
      $or: [
        { assignedCity: { $exists: false } },
        { assignedCity: null },
        { assignedCity: '' }
      ]
    });

    console.log(`\n📊 Found ${adminsWithoutCity.length} admin(s) without assigned city`);

    if (adminsWithoutCity.length === 0) {
      console.log('✅ All admins already have assigned cities');
      process.exit(0);
    }

    for (const admin of adminsWithoutCity) {
      console.log(`\n🔧 Updating admin: ${admin.email}`);
      
      // Set default city
      admin.assignedCity = 'DefaultCity';
      
      // Also ensure other new fields are set
      if (admin.temporaryPassword === undefined) {
        admin.temporaryPassword = false;
      }
      if (admin.isFirstLogin === undefined) {
        admin.isFirstLogin = false;
      }
      if (admin.mustChangePassword === undefined) {
        admin.mustChangePassword = false;
      }

      await admin.save();
      console.log(`   ✅ Updated: ${admin.email} → City: ${admin.assignedCity}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`   Updated ${adminsWithoutCity.length} admin(s)`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run migration
migrateAdminCity();