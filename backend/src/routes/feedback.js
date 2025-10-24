const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  createFeedback,
  getComplaintFeedback,
  getUserFeedback,
  getAllFeedback,
  moderateFeedback,
  deleteFeedback
} = require('../controllers/feedbackController');

const router = express.Router();

// Rate limiting for feedback creation
const feedbackCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 feedback submissions per windowMs
  message: {
    success: false,
    message: 'Too many feedback submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for feedback reading
const feedbackReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation for feedback creation
const createFeedbackValidation = [
  body('complaintId')
    .notEmpty()
    .withMessage('Complaint ID is required')
    .isMongoId()
    .withMessage('Invalid complaint ID format'),
  
  body('feedback.satisfaction')
    .notEmpty()
    .withMessage('Satisfaction rating is required')
    .isIn(['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied', 'Very unsatisfied'])
    .withMessage('Invalid satisfaction rating'),
  
  body('feedback.resolutionMet')
    .notEmpty()
    .withMessage('Resolution met response is required')
    .isIn(['Yes, completely', 'Partially', 'Not at all'])
    .withMessage('Invalid resolution met response'),
  
  body('feedback.timeliness')
    .notEmpty()
    .withMessage('Timeliness rating is required')
    .isIn(['Excellent', 'Good', 'Average', 'Poor'])
    .withMessage('Invalid timeliness rating'),
  
  body('feedback.communication')
    .notEmpty()
    .withMessage('Communication rating is required')
    .isIn(['Yes', 'Somewhat', 'No'])
    .withMessage('Invalid communication rating'),
  
  body('feedback.updates')
    .optional()
    .isIn(['Always', 'Sometimes', 'Rarely', 'Never'])
    .withMessage('Invalid updates rating'),
  
  body('feedback.easeOfUse')
    .notEmpty()
    .withMessage('Ease of use rating is required')
    .isIn(['Very easy', 'Easy', 'Average', 'Difficult', 'Very difficult'])
    .withMessage('Invalid ease of use rating'),
  
  body('feedback.recommendation')
    .notEmpty()
    .withMessage('Recommendation is required')
    .isIn(['Yes', 'Maybe', 'No'])
    .withMessage('Invalid recommendation response'),
  
  body('feedback.likedMost')
    .optional()
    .isString()
    .withMessage('Liked most must be a string')
    .isLength({ max: 500 })
    .withMessage('Liked most feedback cannot exceed 500 characters'),
  
  body('feedback.improvement')
    .optional()
    .isString()
    .withMessage('Improvement must be a string')
    .isLength({ max: 500 })
    .withMessage('Improvement feedback cannot exceed 500 characters'),
  
  body('feedback.suggestion')
    .optional()
    .isString()
    .withMessage('Suggestion must be a string')
    .isLength({ max: 500 })
    .withMessage('Additional suggestions cannot exceed 500 characters')
];

// Validation for MongoDB ObjectId parameters
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Validation for pagination queries
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// Validation for moderation
const moderationValidation = [
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean'),
  
  body('moderationNote')
    .optional()
    .isString()
    .withMessage('Moderation note must be a string')
    .isLength({ max: 200 })
    .withMessage('Moderation note cannot exceed 200 characters')
];

// Routes

// POST /api/feedback - Create new feedback
router.post(
  '/',
  feedbackCreateLimiter,
  authenticateToken,
  createFeedbackValidation,
  createFeedback
);

// GET /api/feedback/complaint/:id - Get feedback for specific complaint
router.get(
  '/complaint/:id',
  feedbackReadLimiter,
  authenticateToken,
  mongoIdValidation,
  paginationValidation,
  getComplaintFeedback
);

// GET /api/feedback/my - Get user's own feedback
router.get(
  '/my',
  feedbackReadLimiter,
  authenticateToken,
  paginationValidation,
  getUserFeedback
);

// GET /api/feedback/admin/all - Get all feedback (Admin only)
router.get(
  '/admin/all',
  feedbackReadLimiter,
  authenticateToken,
  paginationValidation,
  [
    query('visible')
      .optional()
      .isBoolean()
      .withMessage('Visible filter must be a boolean'),
    
    query('satisfaction')
      .optional()
      .isIn(['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied', 'Very unsatisfied'])
      .withMessage('Invalid satisfaction filter')
  ],
  getAllFeedback
);

// PUT /api/feedback/:id/moderate - Moderate feedback (Admin only)
router.put(
  '/:id/moderate',
  authenticateToken,
  mongoIdValidation,
  moderationValidation,
  moderateFeedback
);

// DELETE /api/feedback/:id - Delete feedback
router.delete(
  '/:id',
  authenticateToken,
  mongoIdValidation,
  deleteFeedback
);

module.exports = router;