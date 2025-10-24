const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'Roads & Infrastructure',
        'Water Supply',
        'Electricity',
        'Sanitation',
        'Public Transport',
        'Healthcare',
        'Education',
        'Environment',
        'Safety & Security',
        'Other'
      ],
      message: '{VALUE} is not a valid category'
    }
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: '{VALUE} is not a valid priority level'
    },
    default: 'Medium'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    minlength: [3, 'Location must be at least 3 characters'],
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  // Location-based routing fields (inherited from user)
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{6}$/.test(v);
      },
      message: 'Pincode must be exactly 6 digits'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
      message: '{VALUE} is not a valid status. Only Pending, Assigned, In Progress, and Resolved are allowed'
    },
    default: 'Pending'
  },
  adminNote: {
    type: String,
    default: '',
    maxlength: [500, 'Admin note cannot exceed 500 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labour',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  labourRemarks: {
    type: String,
    default: '',
    maxlength: [1000, 'Labour remarks cannot exceed 1000 characters']
  },
  workPhotos: [{
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Photo description cannot exceed 200 characters']
    }
  }],
  workStartedAt: {
    type: Date,
    default: null
  },
  workCompletedAt: {
    type: Date,
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  feedbackCount: {
    type: Number,
    default: 0,
    min: 0
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: ''
    }
  }],
  attachments: [{
    url: String,
    filename: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pendingStatusUpdate: {
    newStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending"
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      default: null
    },
    requestedAt: {
      type: Date,
      default: null
    },
    remarks: {
      type: String,
      default: '',
      maxlength: [1000, 'Remarks cannot exceed 1000 characters']
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    adminNote: {
      type: String,
      default: '',
      maxlength: [500, 'Admin note cannot exceed 500 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for likes count
complaintSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Method to toggle like
complaintSchema.methods.toggleLike = async function(userId) {
  const userIndex = this.likes.indexOf(userId);
  if (userIndex === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(userIndex, 1);
  }
  return this.save();
};

// Pre-save middleware to add initial status to history
complaintSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.user,
      note: 'Complaint created'
    });
  }
  next();
});

// Static method to get active task count for a labour
complaintSchema.statics.getActiveTaskCount = async function(labourId) {
  try {
    const activeCount = await this.countDocuments({
      assignedTo: labourId,
      status: { $in: ['Assigned', 'In Progress'] }
    });
    return activeCount;
  } catch (error) {
    throw error;
  }
};

// Static method to check if labour can take more tasks
complaintSchema.statics.canAssignToLabour = async function(labourId) {
  try {
    const Attendance = require('./Attendance');
    
    // Check if labour is on leave today
    const isOnLeave = await Attendance.isLabourOnLeave(labourId);
    if (isOnLeave) {
      return { 
        canAssign: false, 
        reason: 'Labour is on leave today',
        currentTasks: 0,
        maxTasks: 4
      };
    }
    
    // Check active task count
    const activeTaskCount = await this.getActiveTaskCount(labourId);
    const canAssign = activeTaskCount < 4;
    
    return {
      canAssign,
      reason: canAssign ? 'Available for assignment' : 'Maximum task limit reached (4 tasks)',
      currentTasks: activeTaskCount,
      maxTasks: 4
    };
  } catch (error) {
    throw error;
  }
};

// Static method to get available labours for assignment
complaintSchema.statics.getAvailableLaboursForAssignment = async function() {
  try {
    const Labour = require('./Labour');
    const Attendance = require('./Attendance');
    
    // Get all active labours
    const allLabours = await Labour.find({ status: 'active' }).lean();
    
    // Get labours on leave today
    const laboursOnLeave = await Attendance.getAvailableLabours();
    
    const availableLabours = [];
    
    for (const labour of allLabours) {
      // Skip if on leave
      if (laboursOnLeave.includes(labour._id.toString())) {
        continue;
      }
      
      // Check task count
      const activeTaskCount = await this.getActiveTaskCount(labour._id);
      if (activeTaskCount < 4) {
        availableLabours.push({
          ...labour,
          currentTasks: activeTaskCount,
          availableSlots: 4 - activeTaskCount
        });
      }
    }
    
    return availableLabours;
  } catch (error) {
    throw error;
  }
};

// Index for better performance
complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, priority: 1 });
complaintSchema.index({ location: 'text' });
complaintSchema.index({ assignedTo: 1, status: 1 }); // For task counting

module.exports = mongoose.model('Complaint', complaintSchema);
