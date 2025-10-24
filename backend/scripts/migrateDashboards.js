const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Complaint = require('../src/models/Complaint');
const Dashboard = require('../src/models/Dashboard');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harinimanikandan316:Harini2005@cluster0.dwmchqq.mongodb.net/fixitfast?retryWrites=true&w=majority&appName=Cluster0';

async function migrateDashboards() {
  try {
    console.log('🚀 Starting dashboard migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users`);
    
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        console.log(`\n👤 Processing user: ${user.name} (${user.email})`);
        
        // Check if dashboard already exists
        let dashboard = await Dashboard.findOne({ user: user._id });
        
        // Count complaints for this user by status
        const complaintStats = await Complaint.aggregate([
          {
            $match: { user: user._id }
          },
          {
            $group: {
              _id: null,
              totalComplaints: { $sum: 1 },
              pending: {
                $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
              },
              inProgress: {
                $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
              },
              resolved: {
                $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
              },
              rejected: {
                $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
              }
            }
          }
        ]);
        
        const stats = complaintStats[0] || {
          totalComplaints: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0,
          rejected: 0
        };
        
        console.log(`   📈 Complaint stats: Total=${stats.totalComplaints}, Pending=${stats.pending}, InProgress=${stats.inProgress}, Resolved=${stats.resolved}, Rejected=${stats.rejected}`);
        
        if (dashboard) {
          // Update existing dashboard
          dashboard.totalComplaints = stats.totalComplaints;
          dashboard.pending = stats.pending;
          dashboard.inProgress = stats.inProgress;
          dashboard.resolved = stats.resolved;
          dashboard.rejected = stats.rejected;
          
          await dashboard.save();
          console.log(`   ✅ Updated existing dashboard`);
          updatedCount++;
        } else {
          // Create new dashboard
          dashboard = await Dashboard.create({
            user: user._id,
            totalComplaints: stats.totalComplaints,
            pending: stats.pending,
            inProgress: stats.inProgress,
            resolved: stats.resolved,
            rejected: stats.rejected
          });
          console.log(`   ✅ Created new dashboard`);
          createdCount++;
        }
        
      } catch (userError) {
        console.error(`   ❌ Error processing user ${user.email}:`, userError.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Dashboards created: ${createdCount}`);
    console.log(`   - Dashboards updated: ${updatedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
    // Verify the migration
    const totalDashboards = await Dashboard.countDocuments();
    const totalUsers = await User.countDocuments();
    
    console.log(`\n🔍 Verification:`);
    console.log(`   - Total users: ${totalUsers}`);
    console.log(`   - Total dashboards: ${totalDashboards}`);
    
    if (totalDashboards === totalUsers) {
      console.log('   ✅ Perfect! Each user has a dashboard entry.');
    } else {
      console.log(`   ⚠️  Warning: Mismatch between users (${totalUsers}) and dashboards (${totalDashboards})`);
    }
    
    // Show sample dashboard data
    console.log(`\n📋 Sample dashboard entries:`);
    const sampleDashboards = await Dashboard.find()
      .populate('user', 'name email')
      .limit(5);
      
    sampleDashboards.forEach((dashboard, index) => {
      console.log(`   ${index + 1}. ${dashboard.user.name} (${dashboard.user.email})`);
      console.log(`      - Total: ${dashboard.totalComplaints}, Pending: ${dashboard.pending}, InProgress: ${dashboard.inProgress}, Resolved: ${dashboard.resolved}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Run the migration
if (require.main === module) {
  migrateDashboards()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateDashboards;
