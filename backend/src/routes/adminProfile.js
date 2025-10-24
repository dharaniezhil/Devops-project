const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  uploadProfilePicture
} = require('../controllers/adminProfileController');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

/**
 * @route   GET /api/admin/profile
 * @desc    Get current admin's profile
 * @access  Private (Admin only)
 */
router.get('/', getAdminProfile);

/**
 * @route   PUT /api/admin/profile
 * @desc    Update current admin's profile
 * @access  Private (Admin only)
 */
router.put('/', updateAdminProfile);

/**
 * @route   POST /api/admin/profile/change-password
 * @desc    Change admin password
 * @access  Private (Admin only)
 */
router.post('/change-password', changePassword);

/**
 * @route   POST /api/admin/profile/upload-picture
 * @desc    Upload/Update admin profile picture
 * @access  Private (Admin only)
 */
router.post('/upload-picture', upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
