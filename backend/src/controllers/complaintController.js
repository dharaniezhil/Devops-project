const { validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const Dashboard = require('../models/Dashboard');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

// POST /api/complaints - Create new complaint
const createComplaint = async (req, res) => {
  try {
    console.log('📥 Creating complaint request received');
    console.log('📥 Body:', req.body);
    console.log('📥 Files:', req.files ? req.files.length : 0);
    
    // Basic validation first
    const { title, description, category, priority, location } = req.body;
     const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "fixitfast_complaints",
        });
        uploadedFiles.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    const userId = req.user.id;

    
    if (!title || !description || !category || !location) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    console.log('🔄 Basic validation passed');
    
    
    
    // Simple file handling
    if (req.files && req.files.length > 0) {
      console.log('📋 Processing', req.files.length, 'files');
      
      for (const file of req.files) {
        console.log('📁 File:', file.originalname, file.size, 'bytes');
        
        // Simple filename creation
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const uniqueFilename = `${userId}_${timestamp}${extension}`;
        
        attachments.push({
          url: `http://localhost:5000/uploads/temp/${file.filename}`,
          filename: file.originalname,
          uploadedAt: new Date()
        });
      }
      
      console.log('✅ Files processed:', attachments.length);
    }
    
    console.log('💾 Creating complaint in database...');
    
    // Fetch user to get location details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Validate user has required location fields
    if (!user.city || !user.district || !user.pincode) {
      return res.status(400).json({ 
        success: false, 
        message: 'User profile is missing location details. Please update your profile.' 
      });
    }
    
    // Create complaint with inherited location
    const complaint = new Complaint({
      user: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority || 'Medium',
      location: location.trim(),
      city: user.city,
      district: user.district,
      pincode: user.pincode,
      status: 'Pending',
      attachments: uploadedFiles,
    });
    
    await complaint.save();
    console.log('✅ Complaint saved to database');
    
    // Update dashboard (don't fail if this errors)
    try {
      let dashboard = await Dashboard.findOne({ user: userId });
      if (!dashboard) {
        dashboard = await Dashboard.create({ user: userId });
      }
      await dashboard.incrementComplaint('Pending');
      console.log('✅ Dashboard updated');
    } catch (dashboardError) {
      console.warn('⚠️ Dashboard update failed:', dashboardError.message);
    }
    
    // Get user info
    await complaint.populate('user', 'name email');
    
    console.log('✅ Complaint created successfully with ID:', complaint._id);
    
    return res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      complaint: {
        id: complaint._id,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        priority: complaint.priority,
        location: complaint.location,
        status: complaint.status,
        user: complaint.user,
        attachments: complaint.attachments,
        createdAt: complaint.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    console.error('❌ Stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error: ' + error.message
    });
  }
};

// GET /api/complaints - Get user's complaints
const getUserComplaints = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, complaintId, category } = req.query || {};

    const filter = { user: userId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (complaintId) {
      if (!mongoose.Types.ObjectId.isValid(String(complaintId))) {
        return res.status(400).json({ success: false, message: 'Invalid complaintId' });
      }
      filter._id = complaintId;
    }

    const complaints = await Complaint.find(filter)
      .populate('user', 'name email')
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
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch complaints' 
    });
  }
};

// GET /api/complaints/:id - Get specific complaint
const getComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    let complaint;
    if (userRole === 'admin' || userRole === 'superadmin') {
      // Admin can see all complaints
      complaint = await Complaint.findById(complaintId)
        .populate('user', 'name email phone location')
        .populate('assignedTo', 'name email skills')
        .populate('assignedBy', 'name email')
        .populate('statusHistory.updatedBy', 'name email');
    } else {
      // User can only see their own complaints
      complaint = await Complaint.findOne({ _id: complaintId, user: userId })
        .populate('user', 'name email phone location')
        .populate('assignedTo', 'name email skills')
        .populate('assignedBy', 'name email')
        .populate('statusHistory.updatedBy', 'name email');
    }

    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }

    // Record recent access for normal users only
    if (req.user.actorType === 'user' && (userRole === 'user' || !userRole)) {
      try {
        const user = await User.findById(userId).select('recentlyAccessed');
        if (user) {
          const list = Array.isArray(user.recentlyAccessed) ? user.recentlyAccessed : [];
          // Remove if exists
          const filtered = list.filter((e) => String(e.complaint) !== String(complaint._id));
          // Add to front
          filtered.unshift({ complaint: complaint._id, accessedAt: new Date() });
          // Cap at 5
          user.recentlyAccessed = filtered.slice(0, 5);
          await user.save({ validateBeforeSave: false });
        }
      } catch (e) {
        console.warn('Failed to record recently accessed complaint:', e.message);
      }
    }

    return res.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch complaint' 
    });
  }
};

// PUT /api/complaints/:id/status - Update complaint status (Admin only)
const updateComplaintStatus = async (req, res) => {
  try {
    const complaintId = req.params.id;
    let { status, adminNote } = req.body || {};

    // Only admin can update complaint status
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admins can update complaint status.' 
      });
    }

    // Only allow the 3 valid statuses
    const allowedStatuses = ['Pending', 'In Progress', 'Resolved'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Only Pending, In Progress, and Resolved are allowed.' 
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const updaterId = req.user.id;
    const oldStatus = complaint.status;
    const newStatus = status;

    // Update complaint
    complaint.status = newStatus;
    complaint.adminNote = adminNote || complaint.adminNote;
    
    complaint.statusHistory.push({
      status: newStatus,
      updatedBy: updaterId,
      note: adminNote || `Status changed from ${oldStatus} to ${newStatus}`
    });

    await complaint.save();

    // Update dashboard counts for the original user
    try {
      let dashboard = await Dashboard.findOne({ user: complaint.user });
      if (!dashboard) {
        dashboard = await Dashboard.create({ user: complaint.user });
        await dashboard.incrementComplaint(oldStatus);
      }
      await dashboard.updateComplaintStatus(oldStatus, newStatus);
    } catch (dashboardError) {
      console.error('Failed to update dashboard for status change:', dashboardError);
    }

    await complaint.populate('user', 'name email');
    await complaint.populate('assignedTo', 'name email skills');
    await complaint.populate('assignedBy', 'name email');

    return res.json({ success: true, message: 'Complaint status updated successfully', complaint });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update complaint status' });
  }
};

// GET /api/complaints/admin/all - Get all complaints (Admin only)
const getAllComplaints = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const category = req.query.category;
    const priority = req.query.priority;

    let filter = {};
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
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch complaints' 
    });
  }
};

// PUT /api/complaints/:id/like - Toggle like on complaint
const toggleComplaintLike = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }

    await complaint.toggleLike(userId);
    await complaint.populate('user', 'name email');

    return res.json({
      success: true,
      message: 'Like toggled successfully',
      complaint,
      likesCount: complaint.likesCount
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle like' 
    });
  }
};

// DELETE /api/complaints/:id - Delete complaint (User can delete their own, Admin can delete any)
const deleteComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    let complaint;
    if (userRole === 'admin' || userRole === 'superadmin') {
      complaint = await Complaint.findById(complaintId);
    } else {
      complaint = await Complaint.findOne({ _id: complaintId, user: userId });
    }

    if (!complaint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found or access denied' 
      });
    }

    const complaintUserId = complaint.user;
    const complaintStatus = complaint.status;

    await Complaint.findByIdAndDelete(complaintId);

    // Update dashboard - decrement counts
    try {
      const dashboard = await Dashboard.findOne({ user: complaintUserId });
      if (dashboard) {
        dashboard.totalComplaints = Math.max(0, dashboard.totalComplaints - 1);
        
        switch (complaintStatus.toLowerCase()) {
          case 'pending':
            dashboard.pending = Math.max(0, dashboard.pending - 1);
            break;
          case 'in progress':
            dashboard.inProgress = Math.max(0, dashboard.inProgress - 1);
            break;
          case 'resolved':
            dashboard.resolved = Math.max(0, dashboard.resolved - 1);
            break;
          case 'rejected':
            dashboard.rejected = Math.max(0, dashboard.rejected - 1);
            break;
        }
        
        await dashboard.save();
      }
    } catch (dashboardError) {
      console.error('Failed to update dashboard for complaint deletion:', dashboardError);
    }

    return res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete complaint' 
    });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaint,
  updateComplaintStatus,
  getAllComplaints,
  toggleComplaintLike,
  deleteComplaint
};
