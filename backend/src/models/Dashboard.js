const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true // Ensure each user has only one dashboard
  },
  totalComplaints: {
    type: Number,
    default: 0,
    min: [0, 'Total complaints cannot be negative']
  },
  pending: {
    type: Number,
    default: 0,
    min: [0, 'Pending count cannot be negative']
  },
  inProgress: {
    type: Number,
    default: 0,
    min: [0, 'In progress count cannot be negative']
  },
  resolved: {
    type: Number,
    default: 0,
    min: [0, 'Resolved count cannot be negative']
  },
  rejected: {
    type: Number,
    default: 0,
    min: [0, 'Rejected count cannot be negative']
  }
}, {
  collection: 'dashboards',
  timestamps: true
});

// Create index on user for fast lookup
dashboardSchema.index({ user: 1 });

// Method to increment complaint count based on status
dashboardSchema.methods.incrementComplaint = function(status = 'Pending') {
  this.totalComplaints += 1;
  
  switch (status.toLowerCase()) {
    case 'pending':
      this.pending += 1;
      break;
    case 'in progress':
      this.inProgress += 1;
      break;
    case 'resolved':
      this.resolved += 1;
      break;
    case 'rejected':
      this.rejected += 1;
      break;
    default:
      this.pending += 1; // Default to pending
  }
  
  return this.save();
};

// Method to update complaint status counts
dashboardSchema.methods.updateComplaintStatus = function(oldStatus, newStatus) {
  // Decrement old status
  switch (oldStatus.toLowerCase()) {
    case 'pending':
      this.pending = Math.max(0, this.pending - 1);
      break;
    case 'in progress':
      this.inProgress = Math.max(0, this.inProgress - 1);
      break;
    case 'resolved':
      this.resolved = Math.max(0, this.resolved - 1);
      break;
    case 'rejected':
      this.rejected = Math.max(0, this.rejected - 1);
      break;
  }
  
  // Increment new status
  switch (newStatus.toLowerCase()) {
    case 'pending':
      this.pending += 1;
      break;
    case 'in progress':
      this.inProgress += 1;
      break;
    case 'resolved':
      this.resolved += 1;
      break;
    case 'rejected':
      this.rejected += 1;
      break;
  }
  
  return this.save();
};

// Static method to create or find dashboard for user
dashboardSchema.statics.findOrCreateForUser = async function(userId) {
  let dashboard = await this.findOne({ user: userId });
  if (!dashboard) {
    dashboard = await this.create({ user: userId });
  }
  return dashboard;
};

module.exports = mongoose.model('Dashboard', dashboardSchema);
