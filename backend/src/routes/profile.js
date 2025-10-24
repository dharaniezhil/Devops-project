const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  getProfileByUserId,
  updateProfile,
  getAllProfiles,
  deleteProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
  updateNotifications,
  updateTheme,
  getProfileCompletion,
  uploadMiddleware
} = require('../controllers/profileController');

const router = express.Router();

/**
 * Enhanced validation middleware for profile creation/update
 */
const validateProfile = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    }),
  
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]*$/)
    .withMessage('Please enter a valid phone number'),
  
  body('emergencyContact.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot exceed 100 characters'),
  
  body('emergencyContact.phone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]*$/)
    .withMessage('Please enter a valid emergency contact phone number'),
  
  body('emergencyContact.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship cannot exceed 50 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  
  body('location.country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters'),
  
  body('location.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location address cannot exceed 200 characters'),
  
  body('location.pincode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Pincode cannot exceed 20 characters'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Invalid gender selection'),
  
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Nationality cannot exceed 50 characters'),
  
  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Occupation cannot exceed 100 characters'),
  
  body('alternatePhone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]*$/)
    .withMessage('Please enter a valid alternate phone number'),
  
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  
  body('languages.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each language cannot exceed 50 characters'),
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('interests.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each interest cannot exceed 50 characters'),
  
  body('socialMedia.twitter')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please enter a valid Twitter URL'),
  
  body('socialMedia.linkedin')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please enter a valid LinkedIn URL'),
  
  body('socialMedia.facebook')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please enter a valid Facebook URL'),
  
  body('theme')
    .optional()
    .isIn(['Light', 'Dark', 'Green+Gray', 'Orange+Blue', 'Blue+White'])
    .withMessage('Invalid theme selection'),
  
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification setting must be boolean'),
  
  body('notifications.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification setting must be boolean'),
  
  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification setting must be boolean')
];

/**
 * Validation middleware for password change
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

/**
 * Validation middleware for theme update
 */
const validateTheme = [
  body('theme')
    .notEmpty()
    .withMessage('Theme is required')
    .isIn(['Light', 'Dark', 'Green+Gray', 'Orange+Blue', 'Blue+White'])
    .withMessage('Invalid theme selection')
];

/**
 * GET /api/profile/me
 * Get current authenticated user's profile
 */
router.get('/me', authenticateToken, getProfileByUserId);

/**
 * POST /api/profile
 * Create or update profile for authenticated user
 */
router.post('/', [
  authenticateToken,
  ...validateProfile
], updateProfile);

/**
 * PUT /api/profile
 * Create or update profile for authenticated user (alternative endpoint)
 */
router.put('/', [
  authenticateToken,
  ...validateProfile
], updateProfile);

/**
 * GET /api/profile/all
 * Get all profiles (admin functionality - optional)
 */
router.get('/all', authenticateToken, getAllProfiles);

/**
 * POST /api/profile/picture
 * Upload profile picture
 */
router.post('/picture', [
  authenticateToken,
  uploadMiddleware
], uploadProfilePicture);

/**
 * DELETE /api/profile/picture
 * Remove profile picture
 */
router.delete('/picture', authenticateToken, removeProfilePicture);

/**
 * POST /api/profile/change-password
 * Change user password
 */
router.post('/change-password', [
  authenticateToken,
  ...validatePasswordChange
], changePassword);

/**
 * POST /api/profile/notifications
 * Update notification settings
 */
router.post('/notifications', authenticateToken, updateNotifications);

/**
 * POST /api/profile/theme
 * Update theme preference
 */
router.post('/theme', [
  authenticateToken,
  ...validateTheme
], updateTheme);

/**
 * GET /api/profile/completion
 * Get profile completion status
 */
router.get('/completion', authenticateToken, getProfileCompletion);

/**
 * DELETE /api/profile
 * Delete current user's profile
 */
router.delete('/', authenticateToken, deleteProfile);

module.exports = router;
