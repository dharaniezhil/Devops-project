// backend/src/controllers/contactController.js
const Contact = require('../models/contact'); // Use lowercase 'contact' to match your existing file
const { sendContactNotification } = require('../config/email'); // Import email functionality

// @desc    Send contact message
// @route   POST /api/contact
// @access  Public
const sendMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message'
            });
        }

        // Additional validation for minimum lengths
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        if (message.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Message must be at least 10 characters long'
            });
        }

        // Email validation
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Check for recent submissions from same email (optional rate limiting)
        const recentSubmission = await Contact.findOne({
            email: email.toLowerCase(),
            createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes
        });

        if (recentSubmission) {
            return res.status(429).json({
                success: false,
                message: 'Please wait before submitting another message. You can submit one message every 5 minutes.'
            });
        }

        // Create new contact entry
        const contact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim()
        });

        // Save to MongoDB
        await contact.save();

        console.log('✅ New contact message saved:', {
            id: contact._id,
            name: contact.name,
            email: contact.email,
            createdAt: contact.createdAt
        });

        // Send email notification (don't let email failure prevent successful contact submission)
        try {
            console.log('📧 Sending email notification...');
            const emailResult = await sendContactNotification(contact);
            if (emailResult.success) {
                console.log('✅ Email notification sent successfully');
            } else {
                console.error('⚠️  Email notification failed, but contact was saved:', emailResult.error);
            }
        } catch (emailError) {
            console.error('⚠️  Email notification error (contact still saved):', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Your query has been submitted successfully! We will get back to you within 24 hours.',
            data: {
                id: contact._id,
                name: contact.name,
                email: contact.email,
                status: contact.status,
                createdAt: contact.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Contact form submission error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact
// @access  Private (Admin)
const getMessages = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;
        
        const filter = {};
        if (status && status !== 'all') filter.status = status;
        
        // Add search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const contacts = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('respondedBy', 'name email')
            .select('-__v');

        const total = await Contact.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: contacts.length,
            total,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            data: contacts
        });

    } catch (error) {
        console.error('❌ Get contact messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Update contact message status
// @route   PUT /api/contact/:id/status
// @access  Private (Admin)
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;

        if (!['new', 'in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be new, in-progress, or resolved'
            });
        }

        const updateData = { status };
        if (adminResponse) {
            updateData.adminResponse = adminResponse;
            updateData.respondedAt = new Date();
            // If you have user authentication, add: updateData.respondedBy = req.user.id;
        }

        const contact = await Contact.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contact status updated successfully',
            data: contact
        });

    } catch (error) {
        console.error('❌ Update contact status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// @desc    Get contact statistics
// @route   GET /api/contact/stats
// @access  Private (Admin)
const getStats = async (req, res) => {
    try {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Contact.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await Contact.countDocuments({ createdAt: { $gte: today } });

        const formattedStats = {
            total,
            today: todayCount,
            byStatus: stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, { new: 0, 'in-progress': 0, resolved: 0 })
        };

        res.status(200).json({
            success: true,
            data: formattedStats
        });

    } catch (error) {
        console.error('❌ Get contact stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    updateStatus,
    getStats
};