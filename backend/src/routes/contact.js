// backend/src/routes/contact.js (lowercase filename)
const express = require('express');
const router = express.Router();
const { 
    sendMessage, 
    getMessages, 
    updateStatus, 
    getStats 
} = require('../controllers/contactController'); // Make sure this matches your controller filename

// Note: Add auth middleware here if you have it for protected routes
// const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/contact
// @desc    Send contact message
// @access  Public
router.post('/', sendMessage);

// @route   GET /api/contact
// @desc    Get all contact messages (for admin)
// @access  Private (Admin only - add auth middleware when available)
router.get('/', getMessages);

// @route   GET /api/contact/stats
// @desc    Get contact statistics
// @access  Private (Admin only - add auth middleware when available)
router.get('/stats', getStats);

// @route   PUT /api/contact/:id/status
// @desc    Update contact message status
// @access  Private (Admin only - add auth middleware when available)
router.put('/:id/status', updateStatus);

// When you have auth middleware, you can protect routes like this:
// router.get('/', protect, authorize('admin'), getMessages);
// router.get('/stats', protect, authorize('admin'), getStats);
// router.put('/:id/status', protect, authorize('admin'), updateStatus);

module.exports = router;