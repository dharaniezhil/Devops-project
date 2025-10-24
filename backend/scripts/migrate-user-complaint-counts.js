// Migration script to update user complaint counts
// Run this script once to update all existing users with their actual complaint counts

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Models
const User = require('../src/models/User');
const Complaint = require('../src/models/Complaint');

// MongoDB connection
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB Atlas!');
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Migration function
const migrateUserComplaintCounts = async () => {
  try {
    console.log('\n🚀 Starting User Complaint Count Migration...');
    console.log('=' .repeat(50));

    // Step 1: Get complaint counts per user using aggregation
    console.log('\n📊 Step 1: Calculating complaint counts per user...');
    
    const complaintCounts = await Complaint.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`✅ Found complaint data for ${complaintCounts.length} users`);
    
    // Step 2: Update each user with their actual complaint count
    console.log('\n🔄 Step 2: Updating user complaint counts...');
    
    let updatedUsers = 0;
    let newUsers = 0;
    let errors = 0;

    for (const item of complaintCounts) {
      try {
        const userId = item._id;
        const count = item.count;

        // Find and update user
        const user = await User.findById(userId);
        
        if (user) {
          const oldCount = user.complaintCount || 0;
          
          if (oldCount !== count) {
            await User.findByIdAndUpdate(userId, { complaintCount: count });
            console.log(`  📝 Updated ${user.name} (${user.email}): ${oldCount} → ${count} complaints`);
            updatedUsers++;
          } else {
            console.log(`  ✓ ${user.name} already has correct count: ${count}`);
          }
        } else {
          console.log(`  ⚠️  User with ID ${userId} not found`);
          errors++;
        }
      } catch (error) {
        console.error(`  ❌ Error updating user ${item._id}:`, error.message);
        errors++;
      }
    }

    // Step 3: Set complaint count to 0 for users with no complaints
    console.log('\n🔄 Step 3: Setting zero counts for users with no complaints...');
    
    const userIdsWithComplaints = complaintCounts.map(item => item._id);
    
    const result = await User.updateMany(
      { 
        _id: { $nin: userIdsWithComplaints },
        $or: [
          { complaintCount: { $exists: false } },
          { complaintCount: { $ne: 0 } }
        ]
      },
      { complaintCount: 0 }
    );

    const zeroCountUpdates = result.modifiedCount;
    console.log(`  📝 Set complaint count to 0 for ${zeroCountUpdates} users`);

    // Step 4: Summary
    console.log('\n📈 Migration Summary:');
    console.log('=' .repeat(30));
    console.log(`✅ Users with updated counts: ${updatedUsers}`);
    console.log(`✅ Users set to zero complaints: ${zeroCountUpdates}`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log(`📊 Total users processed: ${complaintCounts.length}`);

    // Step 5: Verification
    console.log('\n🔍 Step 5: Verification...');
    
    const totalUsers = await User.countDocuments();
    const usersWithCounts = await User.countDocuments({ complaintCount: { $exists: true } });
    const totalComplaints = await Complaint.countDocuments();
    
    // Calculate total complaint count from users
    const userCountSum = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: '$complaintCount' }
        }
      }
    ]);
    
    const totalFromUsers = userCountSum[0]?.totalCount || 0;
    
    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`📊 Users with complaint counts: ${usersWithCounts}`);
    console.log(`📊 Total complaints in DB: ${totalComplaints}`);
    console.log(`📊 Total from user counts: ${totalFromUsers}`);
    
    if (totalComplaints === totalFromUsers) {
      console.log('✅ Verification passed: Counts match!');
    } else {
      console.log('⚠️  Verification warning: Counts do not match. Please investigate.');
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};

// Rollback function (optional)
const rollbackMigration = async () => {
  try {
    console.log('\n🔄 Rolling back migration...');
    
    const result = await User.updateMany(
      {},
      { $unset: { complaintCount: 1 } }
    );
    
    console.log(`✅ Removed complaintCount from ${result.modifiedCount} users`);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
};

// Main execution function
const main = async () => {
  try {
    await connectDatabase();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'rollback':
        await rollbackMigration();
        break;
      case 'migrate':
      default:
        await migrateUserComplaintCounts();
        break;
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// Handle script interruption
process.on('SIGINT', async () => {
  console.log('\n🛑 Script interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  console.log('📋 User Complaint Count Migration Script');
  console.log('Usage:');
  console.log('  node migrate-user-complaint-counts.js          # Run migration');
  console.log('  node migrate-user-complaint-counts.js migrate  # Run migration');
  console.log('  node migrate-user-complaint-counts.js rollback # Rollback migration\n');
  
  main();
}

module.exports = {
  migrateUserComplaintCounts,
  rollbackMigration,
  connectDatabase
};
