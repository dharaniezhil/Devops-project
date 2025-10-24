// backend/src/routes/admins.js (new grouping)
const express = require('express');
const { authenticateToken, requireAdmin, requireSuperAdmin, checkPasswordChangeRequired } = require('../middleware/auth');
const {
  adminLogin,
  changePassword,
  adminRegisterWithSecret,
  createAdminBySuper,
  listAdmins,
  listUsers,
  getAdminMe,
  updateAdminBySuper,
  deleteAdminBySuper,
  createUserBySuper,
  updateUserBySuper,
  deleteUserBySuper,
  createLabourBySuper,
  createLabour,
  listLabours,
  updateLabourBySuper,
  deleteLabourBySuper,
  adminDashboard,
  superDashboard
} = require('../controllers/adminController');

const router = express.Router();

// Auth
router.post('/login', adminLogin);
router.post('/change-password', authenticateToken, changePassword);
// Optional legacy secret-key registration (can be removed if not needed)
router.post('/register', adminRegisterWithSecret);

// Me - No password change check here, so it works for token verification after password change
router.get('/me', authenticateToken, requireAdmin, getAdminMe);

// Dashboards
router.get('/dashboard', authenticateToken, checkPasswordChangeRequired, requireAdmin, adminDashboard);
router.get('/super-dashboard', authenticateToken, checkPasswordChangeRequired, requireSuperAdmin, superDashboard);

// Reports (Admin & SuperAdmin)
const reportsController = require('../controllers/reportsController');
router.get('/reports/metrics', authenticateToken, requireAdmin, reportsController.getMetrics);
router.post('/reports/regenerate', authenticateToken, requireAdmin, reportsController.regenerate);
router.get('/reports/export.csv', authenticateToken, requireAdmin, reportsController.exportCSV);
router.get('/reports/export.xlsx', authenticateToken, requireAdmin, reportsController.exportExcel);
router.get('/reports/export.pdf', authenticateToken, requireAdmin, reportsController.exportPDF);

// Admins management
router.get('/admins', authenticateToken, requireAdmin, listAdmins); // list admins (admin/superadmin)
router.post('/create-admin', authenticateToken, requireSuperAdmin, createAdminBySuper);
router.patch('/admins/:id', authenticateToken, requireSuperAdmin, updateAdminBySuper);
router.delete('/admins/:id', authenticateToken, requireSuperAdmin, deleteAdminBySuper);

// Users management
router.get('/users', authenticateToken, requireAdmin, listUsers);
router.post('/users', authenticateToken, requireSuperAdmin, createUserBySuper);
router.patch('/users/:id', authenticateToken, requireSuperAdmin, updateUserBySuper);
router.delete('/users/:id', authenticateToken, requireSuperAdmin, deleteUserBySuper);

// Labour management
router.get('/labours', authenticateToken, requireAdmin, listLabours);
router.post('/labours', authenticateToken, requireSuperAdmin, createLabourBySuper);
// Admin-specific labour creation endpoint with auto-location fill
router.post('/labours/create', authenticateToken, requireAdmin, createLabour);
router.patch('/labours/:id', authenticateToken, requireSuperAdmin, updateLabourBySuper);
router.delete('/labours/:id', authenticateToken, requireSuperAdmin, deleteLabourBySuper);

// Admin-specific complaint routes
const Complaint = require('../models/Complaint');
const Labour = require('../models/Labour');
const Attendance = require('../models/Attendance');

// GET /api/admin/complaints - Get all complaints for admin dashboard
router.get('/complaints', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Fetch admin to get location
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // High limit for dashboard
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const category = req.query.category;
    const priority = req.query.priority;

    // Filter by admin's city
    let filter = { city: admin.city };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email phone location')
      .populate('assignedTo', 'name email skills')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Complaint.countDocuments(filter);

    return res.json({
      success: true,
      complaints,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: complaints.length,
        totalComplaints: total
      }
    });
  } catch (err) {
    console.error('Admin get all complaints error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// GET /api/admin/complaints/pending
router.get('/complaints/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Fetch admin to get location
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const list = await Complaint.find({ status: 'Pending', city: admin.city })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json({ complaints: list });
  } catch (err) {
    console.error('Admin get pending complaints error:', err);
    return res.status(500).json({ message: 'Failed to fetch pending complaints' });
  }
});

// GET /api/admin/complaints/:id
router.get('/complaints/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email phone location')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    return res.json({ complaint });
  } catch (err) {
    console.error('Admin get complaint error:', err);
    return res.status(500).json({ message: 'Failed to fetch complaint' });
  }
});

// PUT /api/admin/complaints/:id/assign
// Body: { labourId }
// Admin or SuperAdmin only
router.put('/complaints/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Fetch admin to get location
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const complaintId = req.params.id;
    const { labourId } = req.body || {};
    if (!labourId) {
      return res.status(400).json({ message: 'labourId is required' });
    }

    const labour = await Labour.findById(labourId);
    if (!labour || labour.status !== 'active') {
      return res.status(404).json({ message: 'Labour not found or inactive' });
    }
    
    // Verify labour is from same city as admin
    if (labour.city !== admin.city) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot assign labour from different city. Admin city: ' + admin.city + ', Labour city: ' + labour.city 
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if labour has checked in today
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

    // Apply assignment
    complaint.assignedTo = labour._id;
    complaint.assignedBy = req.user.id;
    complaint.assignedAt = new Date();
    complaint.status = 'Assigned';
    complaint.statusHistory.push({
      status: 'Assigned',
      updatedBy: req.user.id,
      note: `Assigned to ${labour.name} (${activeTaskCount + 1}/4 tasks)`
    });

    await complaint.save();

    await complaint.populate('user', 'name email');
    await complaint.populate('assignedTo', 'name email');

    return res.json({
      success: true,
      message: `Complaint assigned successfully. ${activeTaskCount + 1}/4 tasks.`,
      complaint,
      assignmentInfo: {
        tasksAfterAssignment: activeTaskCount + 1,
        maxTasks: 4,
        remainingSlots: 4 - activeTaskCount - 1
      }
    });
  } catch (err) {
    console.error('Admin assign complaint error:', err);
    return res.status(500).json({ message: 'Failed to assign complaint' });
  }
});

// ============ ATTENDANCE MANAGEMENT ROUTES ============

// GET /api/admin/attendance/on-duty - Get currently on duty labours
router.get('/attendance/on-duty', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const onDutyLabours = await Attendance.getCurrentlyOnDuty();
    
    return res.json({
      success: true,
      labours: onDutyLabours
    });
  } catch (err) {
    console.error('Get on duty labours error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get on duty labours' });
  }
});

// GET /api/admin/attendance/labour-status - Get all labours with their current status
router.get('/attendance/labour-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allLabours = await Labour.find({ status: 'active' }).select('name email phone skills').lean();
    
    const laboursWithStatus = [];
    
    for (const labour of allLabours) {
      // Get current attendance status
      const currentStatus = await Attendance.getCurrentStatus(labour._id);
      
      // Check if on leave today
      const isOnLeave = await Attendance.isLabourOnLeave(labour._id);
      
      // Get active task count
      const activeTaskCount = await Complaint.getActiveTaskCount(labour._id);
      
      // Check availability for assignment
      const canAssign = await Complaint.canAssignToLabour(labour._id);
      
      laboursWithStatus.push({
        ...labour,
        currentAttendanceStatus: currentStatus?.status || null,
        lastAction: currentStatus?.lastAction || null,
        isOnLeave,
        activeTaskCount,
        canAssign: canAssign.canAssign,
        assignmentReason: canAssign.reason,
        maxTasks: canAssign.maxTasks
      });
    }
    
    return res.json({
      success: true,
      labours: laboursWithStatus,
      total: laboursWithStatus.length
    });
  } catch (err) {
    console.error('Get labour status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get labour status' });
  }
});

// GET /api/admin/attendance - Get all attendance records
router.get('/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      labourName,
      date,
      month,
      year,
      status,
      startDate,
      endDate
    } = req.query;
    
    // Build query
    let query = {};
    let labourIds = [];
    
    // Filter by labour name if provided
    if (labourName && labourName.trim()) {
      const labours = await Labour.find({
        name: { $regex: labourName.trim(), $options: 'i' }
      }).select('_id');
      labourIds = labours.map(l => l._id);
      if (labourIds.length > 0) {
        query.labour = { $in: labourIds };
      } else {
        // No matching labours found
        return res.json({
          success: true,
          attendance: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalRecords: 0,
            pageSize: parseInt(limit)
          }
        });
      }
    }
    
    // Date filtering
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: startOfDay, $lte: endOfDay };
    } else if (month && year) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      query.timestamp = { $gte: monthStart, $lte: monthEnd };
    } else if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Status filtering
    if (status) {
      query.type = status;
    }
    
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;
    
    // Get attendance records
    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('labour', 'name email phone employeeId department')
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
    console.error('Get all attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get attendance records' });
  }
});

// GET /api/admin/attendance/labour/:id - Get specific labour's attendance
router.get('/attendance/labour/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const labourId = req.params.id;
    const { page = 1, limit = 20, month, year } = req.query;
    
    // Verify labour exists
    const labour = await Labour.findById(labourId);
    if (!labour) {
      return res.status(404).json({ success: false, message: 'Labour not found' });
    }
    
    // Build query
    const query = { labour: labourId };
    
    // Date filtering
    if (month && year) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
      query.timestamp = { $gte: monthStart, $lte: monthEnd };
    }
    
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;
    
    // Get attendance records
    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('labour', 'name email phone employeeId')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Attendance.countDocuments(query)
    ]);
    
    return res.json({
      success: true,
      labour: {
        id: labour._id,
        name: labour.name,
        email: labour.email,
        phone: labour.phone
      },
      attendance: attendance,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / pageSize),
        totalRecords: total,
        pageSize: pageSize
      }
    });
  } catch (err) {
    console.error('Get labour attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get labour attendance' });
  }
});

// GET /api/admin/attendance/report - Get attendance report
router.get('/attendance/report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : (new Date().getMonth() + 1);
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Get all active labours
    const labours = await Labour.find({ status: 'active' })
      .select('_id name email employeeId department')
      .lean();
    
    // Get attendance stats for each labour
    const labourReports = await Promise.all(
      labours.map(async (labour) => {
        const stats = await Attendance.getAttendanceStats(labour._id, {
          month: currentMonth,
          year: currentYear
        });
        
        return {
          labourId: labour._id,
          name: labour.name,
          email: labour.email,
          employeeId: labour.employeeId || 'N/A',
          department: labour.department || 'General',
          daysWorked: stats.totalDays,
          totalHours: stats.totalHours,
          overtimeHours: stats.overtimeHours,
          attendanceRate: stats.totalDays > 0 
            ? Math.round((stats.totalDays / 30) * 100) // Assuming 30 working days per month
            : 0
        };
      })
    );
    
    // Calculate summary stats
    const summary = {
      totalLabours: labours.length,
      avgAttendanceRate: labourReports.length > 0 
        ? Math.round(labourReports.reduce((sum, l) => sum + l.attendanceRate, 0) / labourReports.length)
        : 0,
      totalHours: labourReports.reduce((sum, l) => sum + l.totalHours, 0),
      overtimeHours: labourReports.reduce((sum, l) => sum + l.overtimeHours, 0),
      month: currentMonth,
      year: currentYear
    };
    
    return res.json({
      success: true,
      report: {
        summary: summary,
        details: labourReports
      }
    });
  } catch (err) {
    console.error('Get attendance report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get attendance report' });
  }
});

// PUT /api/admin/attendance/:id - Update attendance record
router.put('/attendance/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const attendanceId = req.params.id;
    const { type, location, remarks } = req.body || {};
    
    // Validate attendance type
    const allowedTypes = ['check_in', 'check_out', 'break', 'overtime'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid attendance type' 
      });
    }
    
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    
    // Update fields
    if (type) attendance.type = type;
    if (location !== undefined) attendance.location = location.trim();
    if (remarks !== undefined) attendance.remarks = remarks.trim();
    
    // Add admin edit tracking
    attendance.editedBy = req.user.id;
    attendance.editedAt = new Date();
    attendance.editReason = 'Admin correction';
    
    await attendance.save();
    
    // Populate and return
    await attendance.populate('labour', 'name email phone');
    await attendance.populate('editedBy', 'name email');
    
    return res.json({
      success: true,
      message: 'Attendance record updated successfully',
      attendance: attendance
    });
  } catch (err) {
    console.error('Update attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update attendance record' });
  }
});

// DELETE /api/admin/attendance/:id - Delete attendance record
router.delete('/attendance/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const attendanceId = req.params.id;
    
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }
    
    await Attendance.findByIdAndDelete(attendanceId);
    
    return res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (err) {
    console.error('Delete attendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete attendance record' });
  }
});

// GET /api/admin/complaints/pending-updates - Get complaints with pending status updates
router.get('/complaints/pending-updates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      'pendingStatusUpdate.newStatus': { $exists: true, $ne: null },
      'pendingStatusUpdate.isApproved': false
    })
      .populate('user', 'name email phone location')
      .populate('assignedTo', 'name email')
      .populate('pendingStatusUpdate.requestedBy', 'name email')
      .sort({ 'pendingStatusUpdate.requestedAt': -1 })
      .limit(100);

    return res.json({
      success: true,
      complaints,
      count: complaints.length
    });
  } catch (err) {
    console.error('Get pending status updates error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending status updates' });
  }
});

// PUT /api/admin/complaints/:id/approve-status - Approve or reject status update
router.put('/complaints/:id/approve-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { approve, adminNote } = req.body || {};
    const adminId = req.user.id;

    if (approve === undefined) {
      return res.status(400).json({
        success: false,
        message: 'approve field is required (true or false)'
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!complaint.pendingStatusUpdate || !complaint.pendingStatusUpdate.newStatus) {
      return res.status(400).json({
        success: false,
        message: 'No pending status update found for this complaint'
      });
    }

    if (complaint.pendingStatusUpdate.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Status update has already been reviewed'
      });
    }

    // Update the pending status
    complaint.pendingStatusUpdate.isApproved = approve;
    complaint.pendingStatusUpdate.reviewedBy = adminId;
    complaint.pendingStatusUpdate.reviewedAt = new Date();
    complaint.pendingStatusUpdate.adminNote = adminNote || '';

    if (approve) {
      // Apply the status change
      const oldStatus = complaint.status;
      complaint.status = complaint.pendingStatusUpdate.newStatus;

      // Add to status history
      complaint.statusHistory.push({
        status: complaint.pendingStatusUpdate.newStatus,
        updatedBy: complaint.pendingStatusUpdate.requestedBy,
        note: `Status approved by admin: ${complaint.pendingStatusUpdate.remarks}${adminNote ? ` (Admin note: ${adminNote})` : ''}`
      });

      // Set completion timestamp if resolving
      if (complaint.status === 'Resolved' && oldStatus !== 'Resolved') {
        complaint.workCompletedAt = new Date();
      }
    } else {
      // Rejection - add note to history
      complaint.statusHistory.push({
        status: complaint.status, // Keep current status
        updatedBy: adminId,
        note: `Status update request rejected${adminNote ? `: ${adminNote}` : ''}`
      });
    }

    await complaint.save();

    // Populate for response
    await complaint.populate('user', 'name email');
    await complaint.populate('assignedTo', 'name email');
    await complaint.populate('pendingStatusUpdate.requestedBy', 'name email');
    await complaint.populate('pendingStatusUpdate.reviewedBy', 'name email');

    return res.json({
      success: true,
      message: approve ? 'Status update approved successfully' : 'Status update rejected',
      complaint
    });
  } catch (err) {
    console.error('Approve/reject status update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process status update request' });
  }
});

module.exports = router;
