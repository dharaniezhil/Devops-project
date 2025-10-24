const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const { requireLabour } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const Labour = require('../models/Labour');
const Attendance = require('../models/Attendance');
const { validateAttendanceTime } = require('../utils/timeUtils');

const router = express.Router();

// POST /api/labour/login
// Supports login with either email OR identityKey (6-character code)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    
    // Also support legacy 'email' field for backward compatibility
    const loginId = identifier || req.body.email;
    
    if (!loginId || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email/Identity Key and password are required' 
      });
    }

    // Determine if input is email or identityKey (6 alphanumeric characters)
    const isIdentityKey = /^[A-Z0-9]{6}$/i.test(loginId.trim());
    
    let labour;
    if (isIdentityKey) {
      // Login with Identity Key
      labour = await Labour.findOne({ 
        identityKey: String(loginId).trim().toUpperCase() 
      }).select('+password');
    } else {
      // Login with Email
      labour = await Labour.findOne({ 
        email: String(loginId).toLowerCase().trim() 
      }).select('+password');
    }

    if (!labour || labour.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials or account is inactive' 
      });
    }
    
    const ok = await labour.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { id: labour._id, role: 'labour', actorType: 'labour' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    console.log(`Labour login successful: ${labour.name} (${isIdentityKey ? labour.identityKey : labour.email})`);
    
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { 
        id: labour._id, 
        name: labour.name, 
        email: labour.email, 
        identityKey: labour.identityKey,
        role: 'labour' 
      },
      redirect: '/labour/dashboard'
    });
  } catch (err) {
    console.error('Labour login error:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again.' 
    });
  }
});

// GET /api/labour/complaints - labour's assigned complaints
router.get('/complaints', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const complaints = await Complaint.find({ assignedTo: labourId })
      .populate('user', 'name email')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ success: true, complaints });
  } catch (err) {
    console.error('Fetch labour complaints error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// GET /api/labour/complaints/stats - stats for logged-in labour
router.get('/complaints/stats', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const [total, inProgress, completed, assigned] = await Promise.all([
      Complaint.countDocuments({ assignedTo: labourId }),
      Complaint.countDocuments({ assignedTo: labourId, status: 'In Progress' }),
      Complaint.countDocuments({ assignedTo: labourId, status: 'Completed' }),
      Complaint.countDocuments({ assignedTo: labourId, status: 'Assigned' }),
    ]);
    return res.json({ success: true, stats: { total, inProgress, pending: assigned, completed } });
  } catch (err) {
    console.error('Fetch labour stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// PUT /api/labour/complaints/:id/status - Request status update (requires admin approval)
router.put('/complaints/:id/status', authenticateToken, requireLabour, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body || {};
    const labourId = req.user.id;

    // Validate status
    const allowedStatuses = ['In Progress', 'Resolved'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status must be either "In Progress" or "Resolved"' 
      });
    }

    // Find complaint and verify it's assigned to this labour
    const complaint = await Complaint.findOne({ _id: id, assignedTo: labourId });
    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found or not assigned to you' 
      });
    }

    // Check if there's already a pending status update
    if (complaint.pendingStatusUpdate && 
        complaint.pendingStatusUpdate.newStatus && 
        !complaint.pendingStatusUpdate.isApproved) {
      return res.status(400).json({ 
        success: false, 
        message: 'There is already a pending status update request. Please wait for admin approval.' 
      });
    }

    // Create status update request
    complaint.pendingStatusUpdate = {
      newStatus: status,
      requestedBy: labourId,
      requestedAt: new Date(),
      remarks: remarks || '',
      isApproved: false,
      reviewedBy: null,
      reviewedAt: null,
      adminNote: ''
    };

    // Set work timestamps for tracking purposes
    if (status === 'In Progress' && complaint.status !== 'In Progress') {
      complaint.workStartedAt = new Date();
    } else if (status === 'Resolved' && complaint.status !== 'Resolved') {
      complaint.workCompletedAt = new Date();
    }

    await complaint.save();

    // Populate and return
    await complaint.populate('user', 'name email');
    await complaint.populate('assignedBy', 'name email');
    await complaint.populate('pendingStatusUpdate.requestedBy', 'name email');
    
    return res.json({ 
      success: true, 
      message: `Status update request submitted. Waiting for admin approval.`,
      complaint 
    });
  } catch (err) {
    console.error('Request status update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit status update request' });
  }
});

// POST /api/labour/complaints/:id/photos - Add work photos
router.post('/complaints/:id/photos', authenticateToken, requireLabour, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, filename, description } = req.body || {};
    const labourId = req.user.id;

    if (!url || !filename) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL and filename are required' 
      });
    }

    // Find complaint and verify it's assigned to this labour
    const complaint = await Complaint.findOne({ _id: id, assignedTo: labourId });
    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found or not assigned to you' 
      });
    }

    // Add photo
    complaint.workPhotos.push({
      url: url,
      filename: filename,
      description: description || '',
      uploadedAt: new Date()
    });

    await complaint.save();

    return res.json({ 
      success: true, 
      message: 'Work photo added successfully',
      photo: complaint.workPhotos[complaint.workPhotos.length - 1]
    });
  } catch (err) {
    console.error('Add work photo error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add work photo' });
  }
});

// GET /api/labour/complaints/:id - Get specific complaint details
router.get('/complaints/:id', authenticateToken, requireLabour, async (req, res) => {
  try {
    const { id } = req.params;
    const labourId = req.user.id;

    const complaint = await Complaint.findOne({ _id: id, assignedTo: labourId })
      .populate('user', 'name email phone location')
      .populate('assignedBy', 'name email');
      
    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found or not assigned to you' 
      });
    }

    return res.json({ success: true, complaint });
  } catch (err) {
    console.error('Get complaint details error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaint details' });
  }
});

// GET /api/labour/profile - Get labour profile (with extended page details)
router.get('/profile', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const labour = await Labour.findById(labourId);
    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour not found' });
    }

    // Pull any extended info from labour-profile collection
    const LabourProfile = require('../models/LabourProfile');
    const extended = await LabourProfile.findOne({ labour: labourId }).lean();

    return res.json({ 
      success: true, 
      labour: {
        id: labour._id,
        name: labour.name,
        email: labour.email,
        phone: labour.phone,
        skills: labour.skills,
        status: labour.status,
        role: 'labour',
        profilePicture: extended?.profilePicture || '',
        location: extended?.location || {
          address: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          zipcode: ''
        },
        createdAt: labour.createdAt,
        updatedAt: labour.updatedAt,
      }
    });
  } catch (err) {
    console.error('Get labour profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PUT /api/labour/profile - Update labour editable fields: phone, profilePicture, location
router.put('/profile', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { phone, profilePicture, location } = req.body || {};

    const labour = await Labour.findById(labourId);
    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour not found' });
    }

    // Validate location fields if provided
    if (location) {
      if (location.pincode && !/^[0-9]{4,10}$/.test(location.pincode)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Pincode must be 4-10 digits' 
        });
      }
      if (location.zipcode && !/^[A-Za-z0-9\s\-]{3,10}$/.test(location.zipcode)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Zipcode must be 3-10 alphanumeric characters' 
        });
      }
    }

    // Update allowed fields only
    if (typeof phone === 'string') {
      labour.phone = phone.trim();
    }
    await labour.save();

    // Upsert into labour-profile for page details
    const LabourProfile = require('../models/LabourProfile');
    const updateData = {
      labour: labourId,
      phone: labour.phone,
    };
    
    if (typeof profilePicture === 'string') {
      updateData.profilePicture = profilePicture;
    }
    
    if (location) {
      updateData.location = {
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        pincode: location.pincode || '',
        zipcode: location.zipcode || ''
      };
    }
    
    const updatedProfile = await LabourProfile.findOneAndUpdate(
      { labour: labourId },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      labour: {
        id: labour._id,
        name: labour.name,
        email: labour.email,
        phone: labour.phone,
        role: 'labour',
        status: labour.status,
        profilePicture: updatedProfile?.profilePicture || '',
        location: updatedProfile?.location || {
          address: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          zipcode: ''
        }
      }
    });
  } catch (err) {
    console.error('Update labour profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// POST /api/labour/profile/update - alias for update (per spec)
router.post('/profile/update', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { phone, profilePicture, location } = req.body || {};

    const labour = await Labour.findById(labourId);
    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour not found' });
    }

    // Validate location fields if provided
    if (location) {
      if (location.pincode && !/^[0-9]{4,10}$/.test(location.pincode)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Pincode must be 4-10 digits' 
        });
      }
      if (location.zipcode && !/^[A-Za-z0-9\s\-]{3,10}$/.test(location.zipcode)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Zipcode must be 3-10 alphanumeric characters' 
        });
      }
    }

    if (typeof phone === 'string') {
      labour.phone = phone.trim();
    }
    await labour.save();

    const LabourProfile = require('../models/LabourProfile');
    const updateData = {
      labour: labourId,
      phone: labour.phone,
    };
    
    if (typeof profilePicture === 'string') {
      updateData.profilePicture = profilePicture;
    }
    
    if (location) {
      updateData.location = {
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || '',
        pincode: location.pincode || '',
        zipcode: location.zipcode || ''
      };
    }
    
    const updatedProfile = await LabourProfile.findOneAndUpdate(
      { labour: labourId },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      labour: {
        id: labour._id,
        name: labour.name,
        email: labour.email,
        phone: labour.phone,
        role: 'labour',
        status: labour.status,
        profilePicture: updatedProfile?.profilePicture || '',
        location: updatedProfile?.location || {
          address: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          zipcode: ''
        }
      }
    });
  } catch (err) {
    console.error('Update labour profile (alias) error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// POST /api/labour/change-password - Change password with old password verification
router.post('/change-password', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old and new password are required' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    // Need password field, so select explicitly
    const labour = await Labour.findById(labourId).select('+password');
    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour not found' });
    }

    const ok = await labour.comparePassword(oldPassword);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    labour.password = String(newPassword);
    await labour.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password (labour) error:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// ============ ATTENDANCE ROUTES ============

// POST /api/labour/attendance - Mark attendance
router.post('/attendance', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { type, location = '', remarks = '' } = req.body || {};
    
    // Validate attendance type
    const allowedTypes = ['check_in', 'check_out', 'break', 'on_duty', 'overtime', 'leave'];
    if (!type || !allowedTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid attendance type is required (check_in, check_out, break, on_duty, overtime, leave)' 
      });
    }
    
    // Validate office hours - attendance can only be marked between 9 AM - 5 PM
    const currentTime = new Date();
    const timeValidation = validateAttendanceTime(currentTime);
    
    // Log attempt for audit purposes
    console.log(`⏰ Attendance attempt by labour ${labourId} at ${currentTime.toLocaleString()}: ${timeValidation.isValid ? 'ALLOWED' : 'BLOCKED'}`);
    
    if (!timeValidation.isValid) {
      console.log(`❌ BLOCKED: Attendance marking outside office hours - Labour: ${labourId}, Time: ${timeValidation.details.currentTime}, Type: ${type}`);
      return res.status(403).json({
        success: false,
        message: timeValidation.message,
        timeRestriction: true,
        blocked: true,
        details: {
          ...timeValidation.details,
          attemptTime: currentTime.toISOString(),
          labourId: labourId,
          actionType: type
        }
      });
    }
    
    // Double check - another validation before database operation
    const doubleCheckTime = new Date();
    if (doubleCheckTime.getHours() < 9 || doubleCheckTime.getHours() >= 17) {
      console.log(`❌ DOUBLE-CHECK BLOCKED: Attendance marking outside office hours - Labour: ${labourId}, Hour: ${doubleCheckTime.getHours()}`);
      return res.status(403).json({
        success: false,
        message: 'Attendance can only be marked during office hours (9:00 AM – 5:00 PM)',
        timeRestriction: true,
        blocked: true,
        details: {
          currentTime: doubleCheckTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          officeHours: '9:00 AM - 5:00 PM',
          currentHour: doubleCheckTime.getHours()
        }
      });
    }
    
    // Check if labour is on leave (prevent other actions if on leave)
    if (type !== 'leave') {
      const isOnLeave = await Attendance.isLabourOnLeave(labourId);
      if (isOnLeave) {
        return res.status(400).json({
          success: false,
          message: 'Cannot perform attendance actions while on leave. Please contact admin if this is incorrect.'
        });
      }
    }
    
    // Check for duplicate actions on the same day
    if (type === 'check_in' || type === 'leave') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      const existingRecord = await Attendance.findOne({
        labour: labourId,
        type: type,
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      });
      
      if (existingRecord) {
        const actionName = type === 'check_in' ? 'checked in' : 'marked as on leave';
        return res.status(400).json({
          success: false,
          message: `You have already ${actionName} today`,
          existingRecord: {
            timestamp: existingRecord.timestamp,
            location: existingRecord.location
          }
        });
      }
    }
    
    // Special validation for leave - check if already has other attendance today
    if (type === 'leave') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      const todayAttendance = await Attendance.find({
        labour: labourId,
        type: { $ne: 'leave' },
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      });
      
      if (todayAttendance.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot mark leave after other attendance actions today. Contact admin for assistance.'
        });
      }
    }

    // Get IP and device info for tracking
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'] || '';
    
    // Create attendance record
    const attendance = new Attendance({
      labour: labourId,
      type: type,
      location: location.trim(),
      remarks: remarks.trim(),
      ipAddress: ipAddress,
      deviceInfo: {
        userAgent: userAgent,
        platform: req.headers['sec-ch-ua-platform'] || 'unknown',
        device: req.headers['sec-ch-ua-mobile'] === '?1' ? 'mobile' : 'desktop'
      },
      createdBy: labourId,
      createdByModel: 'Labour'
    });
    
    await attendance.save();
    
    // Populate labour info
    await attendance.populate('labour', 'name email phone');
    
    // Check if this is a half-day check-in (after 12 PM)
    let isHalfDay = false;
    let message = `Successfully marked ${type.replace('_', ' ')}`;
    
    if (type === 'check_in') {
      const checkInTime = new Date(attendance.timestamp);
      isHalfDay = checkInTime.getHours() >= 12;
      
      if (isHalfDay) {
        message += ' (Half Day - checked in after 12 PM)';
      }
    }
    
    return res.json({
      success: true,
      message: message,
      attendance: {
        id: attendance._id,
        type: attendance.type,
        timestamp: attendance.timestamp,
        location: attendance.location,
        remarks: attendance.remarks,
        isHalfDay: isHalfDay
      }
    });
  } catch (err) {
    console.error('Mark attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
});

// POST /api/labour/attendance/break-toggle - Toggle break status
router.post('/attendance/break-toggle', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { location = '', remarks = '' } = req.body || {};
    
    // Validate office hours
    const currentTime = new Date();
    const timeValidation = validateAttendanceTime(currentTime);
    
    // Log attempt for audit purposes
    console.log(`⏰ Break toggle attempt by labour ${labourId} at ${currentTime.toLocaleString()}: ${timeValidation.isValid ? 'ALLOWED' : 'BLOCKED'}`);
    
    if (!timeValidation.isValid) {
      console.log(`❌ BLOCKED: Break toggle outside office hours - Labour: ${labourId}, Time: ${timeValidation.details.currentTime}`);
      return res.status(403).json({
        success: false,
        message: timeValidation.message,
        timeRestriction: true,
        blocked: true,
        details: {
          ...timeValidation.details,
          attemptTime: currentTime.toISOString(),
          labourId: labourId,
          actionType: 'break_toggle'
        }
      });
    }
    
    // Double check for break toggle
    const doubleCheckTime = new Date();
    if (doubleCheckTime.getHours() < 9 || doubleCheckTime.getHours() >= 17) {
      console.log(`❌ DOUBLE-CHECK BLOCKED: Break toggle outside office hours - Labour: ${labourId}, Hour: ${doubleCheckTime.getHours()}`);
      return res.status(403).json({
        success: false,
        message: 'Break actions can only be performed during office hours (9:00 AM – 5:00 PM)',
        timeRestriction: true,
        blocked: true,
        details: {
          currentTime: doubleCheckTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          officeHours: '9:00 AM - 5:00 PM',
          currentHour: doubleCheckTime.getHours()
        }
      });
    }
    
    // Check if labour is on leave
    const isOnLeave = await Attendance.isLabourOnLeave(labourId);
    if (isOnLeave) {
      return res.status(400).json({
        success: false,
        message: 'Cannot take break while on leave.'
      });
    }
    
    // Get current status
    const currentStatus = await Attendance.getCurrentStatus(labourId);
    
    // Determine the action based on current status
    let actionType;
    let message;
    
    if (currentStatus.status === 'break') {
      // If currently on break, mark as on_duty (end break)
      actionType = 'on_duty';
      message = 'Break ended - Back on duty';
    } else {
      // If not on break, start break
      actionType = 'break';
      message = 'Break started';
    }
    
    // Get IP and device info for tracking
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'] || '';
    
    // Create attendance record
    const attendance = new Attendance({
      labour: labourId,
      type: actionType,
      location: location.trim(),
      remarks: remarks.trim() || `${actionType === 'break' ? 'Started' : 'Ended'} break`,
      ipAddress: ipAddress,
      deviceInfo: {
        userAgent: userAgent,
        platform: req.headers['sec-ch-ua-platform'] || 'unknown',
        device: req.headers['sec-ch-ua-mobile'] === '?1' ? 'mobile' : 'desktop'
      },
      createdBy: labourId,
      createdByModel: 'Labour'
    });
    
    await attendance.save();
    
    // Populate labour info
    await attendance.populate('labour', 'name email phone');
    
    return res.json({
      success: true,
      message: message,
      attendance: {
        id: attendance._id,
        type: attendance.type,
        timestamp: attendance.timestamp,
        location: attendance.location,
        remarks: attendance.remarks,
        previousStatus: currentStatus.status,
        newStatus: actionType
      }
    });
  } catch (err) {
    console.error('Break toggle error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle break status' });
  }
});

// GET /api/labour/attendance/status - Get current attendance status
router.get('/attendance/status', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const status = await Attendance.getCurrentStatus(labourId);
    
    return res.json({
      success: true,
      status: status
    });
  } catch (err) {
    console.error('Get attendance status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get attendance status' });
  }
});

// GET /api/labour/attendance/today - Get today's attendance records
router.get('/attendance/today', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    // Get today's attendance records
    const todayRecords = await Attendance.find({
      labour: labourId,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    })
    .sort({ timestamp: 1 })
    .lean();
    
    // Determine current status
    const latestEntry = todayRecords.length > 0 ? todayRecords[todayRecords.length - 1] : null;
    const hasCheckedIn = todayRecords.some(record => record.type === 'check_in');
    const hasCheckedOut = todayRecords.some(record => record.type === 'check_out');
    
    // Check if it's a half-day (check-in after 12 PM)
    let isHalfDay = false;
    if (hasCheckedIn) {
      const checkInRecord = todayRecords.find(record => record.type === 'check_in');
      if (checkInRecord) {
        const checkInTime = new Date(checkInRecord.timestamp);
        isHalfDay = checkInTime.getHours() >= 12;
      }
    }
    
    return res.json({
      success: true,
      todayRecords,
      hasCheckedIn,
      hasCheckedOut,
      isHalfDay,
      currentStatus: latestEntry?.type || null,
      lastAction: latestEntry?.timestamp || null
    });
  } catch (err) {
    console.error('Get today attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get today\'s attendance' });
  }
});

// GET /api/labour/attendance/recent - Get recent attendance history (last 7 days)
router.get('/attendance/recent', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { days = 7 } = req.query;
    
    // Get date range for the last N days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    // Get attendance records
    const attendance = await Attendance.find({
      labour: labourId,
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();
    
    // Group by date for easier processing
    const groupedByDate = {};
    attendance.forEach(record => {
      const date = record.timestamp.toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(record);
    });
    
    return res.json({
      success: true,
      attendance,
      groupedByDate,
      totalRecords: attendance.length
    });
  } catch (err) {
    console.error('Get recent attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get recent attendance' });
  }
});

// GET /api/labour/attendance - Get attendance history
router.get('/attendance', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      month, 
      year, 
      startDate, 
      endDate, 
      type 
    } = req.query;
    
    // Build query
    const query = { labour: labourId };
    
    // Date filtering
    if (month && year) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      query.timestamp = { $gte: monthStart, $lte: monthEnd };
    } else if (startDate && endDate) {
      query.timestamp = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    // Type filtering
    if (type) {
      query.type = type;
    }
    
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;
    
    // Get attendance records
    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('labour', 'name email phone')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Attendance.countDocuments(query)
    ]);
    
    return res.json({
      success: true,
      attendance: attendance,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / pageSize),
        totalRecords: total,
        pageSize: pageSize
      }
    });
  } catch (err) {
    console.error('Get attendance history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get attendance history' });
  }
});

// GET /api/labour/attendance/stats - Get attendance statistics
router.get('/attendance/stats', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { month, year } = req.query;
    
    const stats = await Attendance.getAttendanceStats(labourId, { 
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined
    });
    
    return res.json({
      success: true,
      stats: stats
    });
  } catch (err) {
    console.error('Get attendance stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get attendance stats' });
  }
});

// GET /api/labour/attendance/leave-status - Check if labour is on leave today
router.get('/attendance/leave-status', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { date } = req.query;
    
    const checkDate = date ? new Date(date) : new Date();
    const isOnLeave = await Attendance.isLabourOnLeave(labourId, checkDate);
    
    return res.json({
      success: true,
      isOnLeave,
      date: checkDate.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error('Check leave status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check leave status' });
  }
});

// GET /api/labour/attendance/monthly-chart - Get monthly attendance data for charts
router.get('/attendance/monthly-chart', authenticateToken, requireLabour, async (req, res) => {
  try {
    const labourId = req.user.id;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : (currentDate.getMonth() + 1);
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Create date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    
    // Get all attendance records for the month
    const attendanceRecords = await Attendance.find({
      labour: labourId,
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .sort({ timestamp: 1 })
    .lean();
    
    // Group data by date and type for chart
    const dailyData = {};
    const typeStats = {
      check_in: 0,
      check_out: 0,
      break: 0,
      on_duty: 0,
      overtime: 0,
      leave: 0
    };
    
    // Initialize all days of the month
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyData[dateStr] = {
        date: dateStr,
        check_in: 0,
        check_out: 0,
        break: 0,
        on_duty: 0,
        overtime: 0,
        leave: 0,
        total: 0,
        isHalfDay: false,
        isOnLeave: false,
        workingHours: 0
      };
    }
    
    // Process attendance records
    attendanceRecords.forEach(record => {
      const date = record.timestamp.toISOString().split('T')[0];
      const type = record.type;
      
      if (dailyData[date]) {
        dailyData[date][type]++;
        dailyData[date].total++;
        typeStats[type]++;
        
        // Check for leave
        if (type === 'leave') {
          dailyData[date].isOnLeave = true;
        }
        
        // Check for half-day (check-in after 12 PM)
        if (type === 'check_in' && record.timestamp.getHours() >= 12) {
          dailyData[date].isHalfDay = true;
        }
      }
    });
    
    // Calculate working hours for each day
    Object.keys(dailyData).forEach(date => {
      const dayData = dailyData[date];
      if (dayData.check_in > 0 && dayData.check_out > 0) {
        // Find first check-in and last check-out for the day
        const dayRecords = attendanceRecords.filter(r => 
          r.timestamp.toISOString().split('T')[0] === date
        );
        
        const checkIns = dayRecords.filter(r => r.type === 'check_in');
        const checkOuts = dayRecords.filter(r => r.type === 'check_out');
        
        if (checkIns.length > 0 && checkOuts.length > 0) {
          const firstCheckIn = new Date(checkIns[0].timestamp);
          const lastCheckOut = new Date(checkOuts[checkOuts.length - 1].timestamp);
          const hours = (lastCheckOut - firstCheckIn) / (1000 * 60 * 60);
          dailyData[date].workingHours = Math.round(hours * 100) / 100;
        }
      }
    });
    
    // Convert to arrays for chart consumption
    const chartData = Object.values(dailyData).map(day => ({
      date: day.date,
      day: parseInt(day.date.split('-')[2]),
      checkIn: day.check_in,
      checkOut: day.check_out,
      breaks: day.break,
      onDuty: day.on_duty,
      overtime: day.overtime,
      leave: day.leave || 0,
      workingHours: day.workingHours,
      isHalfDay: day.isHalfDay,
      isOnLeave: day.isOnLeave || false,
      present: day.check_in > 0 || day.leave > 0
    }));
    
    // Calculate summary stats
    const totalDays = daysInMonth;
    const workingDays = chartData.filter(day => day.present).length;
    const halfDays = chartData.filter(day => day.isHalfDay).length;
    const totalHours = chartData.reduce((sum, day) => sum + day.workingHours, 0);
    const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;
    
    return res.json({
      success: true,
      month: targetMonth,
      year: targetYear,
      chartData,
      typeStats,
      summary: {
        totalDays,
        workingDays,
        halfDays,
        totalHours: Math.round(totalHours * 100) / 100,
        avgHoursPerDay: Math.round(avgHoursPerDay * 100) / 100
      }
    });
  } catch (err) {
    console.error('Get monthly chart data error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get monthly chart data' });
  }
});

module.exports = router;
