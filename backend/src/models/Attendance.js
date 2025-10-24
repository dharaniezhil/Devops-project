const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labour',
    required: [true, 'Labour is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['check_in', 'check_out', 'break', 'on_duty', 'overtime', 'leave'],
    required: [true, 'Attendance type is required'],
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  // Coordinates for location tracking (optional)
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  // IP address for security tracking
  ipAddress: {
    type: String,
    trim: true
  },
  // Device info for tracking
  deviceInfo: {
    userAgent: String,
    platform: String,
    device: String
  },
  // System fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    enum: ['Labour', 'Admin'],
    default: 'Labour'
  },
  // For admin edits/corrections
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  editedAt: {
    type: Date
  },
  editReason: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true, 
  collection: 'attendance' 
});

// Compound indexes for efficient querying
attendanceSchema.index({ labour: 1, timestamp: -1 });
attendanceSchema.index({ labour: 1, type: 1, timestamp: -1 });
attendanceSchema.index({ timestamp: -1, type: 1 });
attendanceSchema.index({ 'timestamp': 1, 'labour': 1, 'type': 1 });

// Create index for date-based queries
attendanceSchema.index({ 
  labour: 1, 
  timestamp: -1 
}, { 
  name: 'labour_date_desc' 
});

// Virtual for formatted date
attendanceSchema.virtual('dateFormatted').get(function() {
  return this.timestamp.toLocaleDateString();
});

// Virtual for formatted time
attendanceSchema.virtual('timeFormatted').get(function() {
  return this.timestamp.toLocaleTimeString();
});

// Static method to get current status for a labour
attendanceSchema.statics.getCurrentStatus = async function(labourId) {
  try {
    const latestEntry = await this.findOne({ 
      labour: labourId 
    })
    .sort({ timestamp: -1 })
    .populate('labour', 'name email phone')
    .lean();
    
    if (!latestEntry) {
      return {
        status: null,
        lastAction: null,
        location: null
      };
    }
    
    return {
      status: latestEntry.type,
      lastAction: latestEntry.timestamp,
      location: latestEntry.location,
      remarks: latestEntry.remarks
    };
  } catch (error) {
    throw error;
  }
};

// Static method to get attendance stats for a labour
attendanceSchema.statics.getAttendanceStats = async function(labourId, options = {}) {
  try {
    const { month, year } = options;
    const now = new Date();
    const currentMonth = month || (now.getMonth() + 1);
    const currentYear = year || now.getFullYear();
    
    // Create date range for the month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    const pipeline = [
      {
        $match: {
          labour: new mongoose.Types.ObjectId(labourId),
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            type: "$type"
          },
          count: { $sum: 1 },
          timestamps: { $push: "$timestamp" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          entries: {
            $push: {
              type: "$_id.type",
              count: "$count",
              timestamps: "$timestamps"
            }
          }
        }
      },
      {
        $project: {
          date: "$_id",
          entries: 1,
          hasCheckIn: {
            $in: ["check_in", "$entries.type"]
          },
          hasCheckOut: {
            $in: ["check_out", "$entries.type"]
          }
        }
      }
    ];
    
    const dailyStats = await this.aggregate(pipeline);
    
    // Calculate total stats
    let totalDays = 0;
    let totalHours = 0;
    let overtimeHours = 0;
    
    for (const day of dailyStats) {
      if (day.hasCheckIn && day.hasCheckOut) {
        totalDays++;
        // Calculate hours worked (simplified - just check-in to check-out)
        const checkInEntry = day.entries.find(e => e.type === 'check_in');
        const checkOutEntry = day.entries.find(e => e.type === 'check_out');
        
        if (checkInEntry && checkOutEntry && 
            checkInEntry.timestamps.length > 0 && checkOutEntry.timestamps.length > 0) {
          const checkInTime = new Date(checkInEntry.timestamps[0]);
          const checkOutTime = new Date(checkOutEntry.timestamps[checkOutEntry.timestamps.length - 1]);
          const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          
          totalHours += hoursWorked;
          
          // Consider overtime if worked more than 8 hours
          if (hoursWorked > 8) {
            overtimeHours += (hoursWorked - 8);
          }
        }
      }
      
      // Add overtime entries
      const overtimeEntry = day.entries.find(e => e.type === 'overtime');
      if (overtimeEntry) {
        // Assume 2 hours of overtime per overtime entry (configurable)
        overtimeHours += 2 * overtimeEntry.count;
      }
    }
    
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    
    return {
      totalDays,
      totalHours: Math.round(totalHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100,
      workingDays: dailyStats.length,
      month: currentMonth,
      year: currentYear
    };
  } catch (error) {
    throw error;
  }
};

// Static method to check if labour is on leave for a specific date
attendanceSchema.statics.isLabourOnLeave = async function(labourId, date = new Date()) {
  try {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    
    const leaveRecord = await this.findOne({
      labour: labourId,
      type: 'leave',
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).lean();
    
    return !!leaveRecord;
  } catch (error) {
    throw error;
  }
};

// Static method to get available labours (not on leave)
attendanceSchema.statics.getAvailableLabours = async function(date = new Date()) {
  try {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    
    // Get labours who are on leave today
    const laboursOnLeave = await this.find({
      type: 'leave',
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).distinct('labour');
    
    return laboursOnLeave;
  } catch (error) {
    throw error;
  }
};

// Static method to get all current on-duty labours
attendanceSchema.statics.getCurrentlyOnDuty = async function() {
  try {
    // Get latest entry for each labour
    const pipeline = [
      {
        $sort: { labour: 1, timestamp: -1 }
      },
      {
        $group: {
          _id: "$labour",
          latestEntry: { $first: "$$ROOT" }
        }
      },
      {
        $match: {
          "latestEntry.type": { $in: ["check_in", "on_duty", "overtime"] }
        }
      },
      {
        $lookup: {
          from: "labours",
          localField: "_id",
          foreignField: "_id",
          as: "labour"
        }
      },
      {
        $unwind: "$labour"
      },
      {
        $project: {
          _id: "$labour._id",
          name: "$labour.name",
          email: "$labour.email",
          phone: "$labour.phone",
          employeeId: "$labour.employeeId",
          department: "$labour.department",
          currentStatus: "$latestEntry.type",
          lastCheckIn: "$latestEntry.timestamp",
          location: "$latestEntry.location",
          remarks: "$latestEntry.remarks"
        }
      }
    ];
    
    return await this.aggregate(pipeline);
  } catch (error) {
    throw error;
  }
};

// Instance method to validate attendance flow
attendanceSchema.methods.validateAttendanceFlow = function() {
  // Add business logic for attendance validation
  // For example: can't check out without checking in
  return true;
};

// Pre-save hook to enforce office hours (final database-level protection)
attendanceSchema.pre('save', function(next) {
  // Skip validation for admin-created entries or system corrections
  if (this.createdByModel === 'Admin' || this.editedBy) {
    return next();
  }
  
  const saveTime = this.timestamp || new Date();
  const hour = saveTime.getHours();
  
  // Office hours: 9 AM to 5 PM (9-16 inclusive, since 17 is 5 PM)
  if (hour < 9 || hour >= 17) {
    const error = new Error(
      `DATABASE PROTECTION: Attendance records can only be created during office hours (9:00 AM - 5:00 PM). ` +
      `Attempted save at: ${saveTime.toLocaleString()}, Hour: ${hour}`
    );
    error.name = 'OfficeHoursViolation';
    error.code = 'OFFICE_HOURS_VIOLATION';
    error.attemptTime = saveTime.toISOString();
    error.attemptHour = hour;
    
    console.log(`❌ DATABASE PROTECTION TRIGGERED: Attendance save blocked - Time: ${saveTime.toLocaleString()}, Hour: ${hour}`);
    return next(error);
  }
  
  console.log(`✅ DATABASE SAVE ALLOWED: Attendance record saved - Time: ${saveTime.toLocaleString()}, Hour: ${hour}`);
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
