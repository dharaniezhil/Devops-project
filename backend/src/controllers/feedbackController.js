const { validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const CommunityFeed = require('../models/CommunityFeed');

// POST /api/feedback - Create new feedback
const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { complaintId, feedback } = req.body;

    // Check if complaint exists and belongs to user or is accessible
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // For now, allow feedback only on user's own complaints
    // You can modify this to allow community feedback if needed
    if (complaint.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback on your own complaints'
      });
    }

    // Check if complaint is resolved (optional - you may want to allow feedback on any status)
    if (complaint.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be provided on resolved complaints'
      });
    }

    // Check if user already provided feedback for this complaint
    const existingFeedback = await Feedback.findOne({
      user: userId,
      complaint: complaintId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already provided feedback for this complaint'
      });
    }

    // Create new feedback
    const newFeedback = new Feedback({
      user: userId,
      complaint: complaintId,
      feedback: {
        satisfaction: feedback.satisfaction,
        resolutionMet: feedback.resolutionMet,
        timeliness: feedback.timeliness,
        communication: feedback.communication,
        updates: feedback.updates || 'Sometimes', // Default if not provided
        easeOfUse: feedback.easeOfUse,
        recommendation: feedback.recommendation,
        likedMost: feedback.likedMost || '',
        improvement: feedback.improvement || '',
        suggestion: feedback.suggestion || ''
      }
    });

    await newFeedback.save();

    // Mirror to community-feed collection (lightweight entry)
    try {
      const satisfactionMap = {
        'Very satisfied': 5,
        'Satisfied': 4,
        'Neutral': 3,
        'Unsatisfied': 2,
        'Very unsatisfied': 1
      };
      const rating = satisfactionMap[feedback.satisfaction] || null;
      const feedbackText = [feedback.likedMost, feedback.improvement, feedback.suggestion]
        .filter(Boolean)
        .join(' \n ');
      await CommunityFeed.create({
        complaintId,
        userId,
        feedbackText,
        rating,
        feedback: {
          serviceSatisfaction: feedback.satisfaction,
          resolutionExpectations: feedback.resolutionMet,
          timeliness: feedback.timeliness,
          communicationClarity: feedback.communication,
          statusUpdates: feedback.updates,
          systemEaseOfUse: feedback.easeOfUse,
          recommendSystem: feedback.recommendation
        },
        additionalFeedback: {
          likedMost: feedback.likedMost || '',
          improvements: feedback.improvement || '',
          otherComments: feedback.suggestion || ''
        },
        submittedAt: new Date()
      });
    } catch (mirrorErr) {
      console.error('community-feed mirror failed:', mirrorErr.message);
      // do not block user on mirror failure
    }

    // Update complaint's feedback count
    try {
      await Complaint.findByIdAndUpdate(
        complaintId,
        { $inc: { feedbackCount: 1 } }
      );
    } catch (updateError) {
      console.error('Failed to update complaint feedback count:', updateError);
      // Don't fail the feedback creation if count update fails
    }

    // Populate user and complaint info for response
    await newFeedback.populate('user', 'name email');
    await newFeedback.populate('complaint', 'title status');

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    
    // Handle duplicate key error (shouldn't happen due to pre-check, but just in case)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already provided feedback for this complaint'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

// GET /api/feedback/complaint/:id - Get all feedback for a specific complaint
const getComplaintFeedback = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // For regular users, only show their own complaint's feedback
    // Admins can see all complaint feedback
    let accessQuery = { complaint: complaintId, isVisible: true };
    if (req.user.role !== 'admin') {
      // Only show user's own complaint feedback
      if (complaint.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const feedbacks = await Feedback.find(accessQuery)
      .populate('user', 'name email')
      .populate('complaint', 'title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(accessQuery);

    // Get feedback statistics
    const stats = await Feedback.getComplaintStats(complaintId);

    return res.json({
      success: true,
      feedbacks,
      stats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: feedbacks.length,
        totalFeedbacks: total
      }
    });

  } catch (error) {
    console.error('Error fetching complaint feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
};

// GET /api/feedback/my - Get user's own feedback submissions
const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find({ user: userId })
      .populate('user', 'name email')
      .populate('complaint', 'title status category location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments({ user: userId });

    return res.json({
      success: true,
      feedbacks,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: feedbacks.length,
        totalFeedbacks: total
      }
    });

  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your feedback'
    });
  }
};

// GET /api/feedback/admin/all - Get all feedback (Admin only)
const getAllFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { visible, satisfaction } = req.query;

    let filter = {};
    if (visible !== undefined) {
      filter.isVisible = visible === 'true';
    }
    if (satisfaction) {
      filter['feedback.satisfaction'] = satisfaction;
    }

    const feedbacks = await Feedback.find(filter)
      .populate('user', 'name email')
      .populate('complaint', 'title status category location')
      .populate('moderatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(filter);

    // Get overall statistics
    const overallStats = await Feedback.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          avgSatisfaction: { $avg: '$satisfactionScore' },
          satisfactionDistribution: {
            $push: '$feedback.satisfaction'
          }
        }
      }
    ]);

    return res.json({
      success: true,
      feedbacks,
      overallStats: overallStats[0] || {
        totalFeedbacks: 0,
        avgSatisfaction: 0,
        satisfactionDistribution: []
      },
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: feedbacks.length,
        totalFeedbacks: total
      }
    });

  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
};

// PUT /api/feedback/:id/moderate - Moderate feedback (Admin only)
const moderateFeedback = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const feedbackId = req.params.id;
    const { isVisible, moderationNote } = req.body;
    const adminId = req.user.id;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.isVisible = isVisible !== undefined ? isVisible : feedback.isVisible;
    feedback.isModerated = true;
    feedback.moderatedBy = adminId;
    feedback.moderationNote = moderationNote || feedback.moderationNote;

    await feedback.save();

    await feedback.populate('user', 'name email');
    await feedback.populate('complaint', 'title status');
    await feedback.populate('moderatedBy', 'name email');

    return res.json({
      success: true,
      message: 'Feedback moderated successfully',
      feedback
    });

  } catch (error) {
    console.error('Error moderating feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to moderate feedback'
    });
  }
};

// DELETE /api/feedback/:id - Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    let feedback;
    if (userRole === 'admin') {
      feedback = await Feedback.findById(feedbackId);
    } else {
      feedback = await Feedback.findOne({ _id: feedbackId, user: userId });
    }

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or access denied'
      });
    }

    const complaintId = feedback.complaint;
    await Feedback.findByIdAndDelete(feedbackId);

    // Update complaint's feedback count
    try {
      await Complaint.findByIdAndUpdate(
        complaintId,
        { $inc: { feedbackCount: -1 } }
      );
    } catch (updateError) {
      console.error('Failed to update complaint feedback count:', updateError);
    }

    return res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete feedback'
    });
  }
};

module.exports = {
  createFeedback,
  getComplaintFeedback,
  getUserFeedback,
  getAllFeedback,
  moderateFeedback,
  deleteFeedback
};