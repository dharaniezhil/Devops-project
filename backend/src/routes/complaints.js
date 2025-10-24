// src/routes/complaints.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const Complaint = require('../models/Complaint');
const {
  authenticateToken,
  requireAdmin,
  requireLabour,
  checkRole
} = require('../middleware/auth');
const {
  validateComplaintCreation,
  validateStatusUpdate
} = require('../middleware/validation');
const {
  createComplaint,
  getUserComplaints,
  getComplaint,
  updateComplaintStatus,
  getAllComplaints,
  toggleComplaintLike,
  deleteComplaint
} = require('../controllers/complaintController');
const Labour = require('../models/Labour');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/') // Temporary storage before cloudinary upload
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
    file.mimetype.startsWith('image/') || 
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('document');
  
  console.log('📄 File filter:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    extname: path.extname(file.originalname).toLowerCase(),
    passed: mimetype && extname
  });
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

/**
 * GET /api/complaints
 * Private - Get user's complaints or all complaints (admin)
 */
router.get('/', authenticateToken, (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return getAllComplaints(req, res);
  } else {
    return getUserComplaints(req, res);
  }
});

/**
 * POST /api/complaints
 * Private (Bearer token)
 */
router.post('/', authenticateToken, (req, res, next) => {
  upload.array('supportingFiles', 5)(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    }
    next();
  });
}, createComplaint);

/**
 * GET /api/complaints/:id
 * Private
 */
router.get('/:id', authenticateToken, getComplaint);
/**
 * GET /api/complaints/my
 * Private - Get logged-in user's complaints
 */


// PUT /api/complaints/:id - Update complaint fields (owner only, editable statuses)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.actorType !== 'user') {
      return res.status(403).json({ success: false, message: 'Users only' });
    }

    const id = req.params.id;
    const userId = req.user.id;

    const complaint = await Complaint.findOne({ _id: id, user: userId });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Restrict editing to certain statuses
    const editableStatuses = ['Pending'];
    if (!editableStatuses.includes(complaint.status)) {
      return res.status(400).json({ success: false, message: 'Complaint cannot be edited in the current status' });
    }

    const allowed = ['title', 'description', 'category', 'priority', 'location'];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        complaint[key] = String(req.body[key] ?? '').trim();
      }
    }

    await complaint.save();

    return res.json({ success: true, message: 'Complaint updated successfully', complaint });
  } catch (error) {
    console.error('Update complaint error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update complaint' });
  }
});

/**
 * PUT /api/complaints/:id/status
 * Private (Admin only)
 */
router.put('/:id/status', authenticateToken, updateComplaintStatus);

/**
 * GET /api/complaints/available-labours
 * Private (Admin or SuperAdmin) - Get labours available for assignment
 */
router.get('/available-labours', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const availableLabours = await Complaint.getAvailableLaboursForAssignment();
    
    return res.json({
      success: true,
      availableLabours,
      total: availableLabours.length
    });
  } catch (err) {
    console.error('Get available labours error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get available labours' });
  }
});

/**
 * PUT /api/complaints/:id/assign
 * Private (Admin or SuperAdmin)
 */
router.put('/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { labourId, note } = req.body || {};
    if (!labourId) {
      return res.status(400).json({ success: false, message: 'labourId is required' });
    }

    const labour = await Labour.findById(labourId);
    if (!labour || labour.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Labour not found or inactive' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Check if labour has checked in today
    const Attendance = require('../models/Attendance');
    const attendanceStatus = await Attendance.getCurrentStatus(labourId);
    
    if (!attendanceStatus || attendanceStatus.status !== 'check_in') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign complaint: Labour must be checked in to receive assignments',
        details: {
          currentStatus: attendanceStatus?.status || 'not_checked_in',
          required: 'check_in'
        }
      });
    }
    
    // Check if labour already has 4 active tasks
    const activeTaskCount = await Complaint.getActiveTaskCount(labourId);
    if (activeTaskCount >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign complaint: Labour already has maximum tasks (4/4)',
        details: {
          currentTasks: activeTaskCount,
          maxTasks: 4
        }
      });
    }

    // Set assignment details
    complaint.assignedTo = labour._id;
    complaint.assignedBy = req.user.id;
    complaint.assignedAt = new Date();
    complaint.status = 'Assigned';
    complaint.statusHistory.push({
      status: 'Assigned',
      updatedBy: req.user.id,
      note: note || `Assigned to ${labour.name} (${activeTaskCount + 1}/4 tasks)`
    });

    await complaint.save();

    await complaint.populate('user', 'name email');
    await complaint.populate('assignedTo', 'name email skills');
    await complaint.populate('assignedBy', 'name email');

    return res.json({
      success: true,
      message: `Labour assigned successfully. ${activeTaskCount + 1}/4 tasks.`,
      complaint,
      assignmentInfo: {
        tasksAfterAssignment: activeTaskCount + 1,
        maxTasks: 4,
        remainingSlots: 4 - activeTaskCount - 1
      }
    });
  } catch (err) {
    console.error('Assign complaint error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign complaint' });
  }
});

/**
 * PUT /api/complaints/:id/like
 * Private
 */
router.put('/:id/like', authenticateToken, toggleComplaintLike);

/**
 * DELETE /api/complaints/:id
 * Private
 */
router.delete('/:id', authenticateToken, deleteComplaint);

/**
 * GET /api/complaints/stats/overview
 * Private (Admin/Moderator)
 */

/**
 * GET /api/complaints/my
 * Private - Get logged-in user's complaints
 */

router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const assigned = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });

    const byCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recent = await Complaint.find()
      .populate('user', 'name location')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ 
      success: true, 
      stats: { 
        total, 
        pending, 
        assigned, 
        inProgress, 
        resolved, 
        byCategory, 
        recent 
      } 
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// Record access explicitly (optional endpoint if clients want to ping without loading full details)
router.post('/:id/access', authenticateToken, async (req, res) => {
  
  try {
    if (req.user.actorType !== 'user') {
      return res.status(403).json({ success: false, message: 'Users only' });
    }
    const userId = req.user.id;
    const complaintId = req.params.id;
    const exists = await Complaint.findOne({ _id: complaintId, user: userId }).select('_id');
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    const User = require('../models/User');
    const user = await User.findById(userId).select('recentlyAccessed');
    if (user) {
      const list = Array.isArray(user.recentlyAccessed) ? user.recentlyAccessed : [];
      const filtered = list.filter((e) => String(e.complaint) !== String(complaintId));
      filtered.unshift({ complaint: complaintId, accessedAt: new Date() });
      user.recentlyAccessed = filtered.slice(0, 5);
      await user.save({ validateBeforeSave: false });
    }
    return res.json({ success: true, message: 'Recorded access' });
  } catch (err) {
    console.error('Record access error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record access' });
  }
});

module.exports = router;
