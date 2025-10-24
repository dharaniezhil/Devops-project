
const Profile = require('../models/Profile');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Get profile by user ID (logged-in user)
 * GET /api/profile/me
 */
const getProfileByUserId = async (req, res) => {
  try {
    const userId = req.user.id; // From authenticateToken middleware
    console.log('🔍 getProfileByUserId called for userId:', userId);
    
    const user = await User.findById(userId).select('-password -adminSecretKey');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

/**
 * Update or create profile - BULLETPROOF approach using User model directly
 * POST /api/profile
 */
const updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id; // From authenticateToken middleware
    const { 
      name, 
      email, 
      dateOfBirth, 
      gender,
      nationality,
      occupation,
      phone, 
      alternatePhone,
      languages,
      interests,
      emergencyContact, 
      socialMedia,
      bio, 
      location
    } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare user data with enhanced fields
    const userData = {
      name: name || user.name,
      email: email || user.email,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      nationality: nationality || '',
      occupation: occupation || '',
      phone: phone || '',
      alternatePhone: alternatePhone || '',
      languages: Array.isArray(languages) ? languages : [],
      interests: Array.isArray(interests) ? interests : [],
      emergencyContact: {
        name: emergencyContact?.name || '',
        phone: emergencyContact?.phone || '',
        relationship: emergencyContact?.relationship || ''
      },
      socialMedia: {
        twitter: socialMedia?.twitter || '',
        linkedin: socialMedia?.linkedin || '',
        facebook: socialMedia?.facebook || ''
      },
      bio: bio || '',
      location: {
        country: location?.country || '',
        state: location?.state || '',
        city: location?.city || '',
        address: location?.address || '',
        pincode: location?.pincode || '',
        latitude: location?.latitude || null,
        longitude: location?.longitude || null
      }
    };

    console.log('🔄 Updating user profile directly...');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      userData,
      { 
        new: true,
        runValidators: true
      }
    ).select('-password -adminSecretKey'); // Exclude sensitive fields

    res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);

    // Handle duplicate key error (should not happen with upsert, but just in case)
    if (error.code === 11000 && error.keyPattern?.user) {
      return res.status(400).json({
        success: false, 
        message: 'A profile for this user already exists',
        error: 'Duplicate profile entry'
      });
    }

    // Handle validation error with detailed messages
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.error('❌ Validation errors:', validationErrors);
      
      const errorMessage = validationErrors.length === 1 
        ? validationErrors[0].message
        : `Multiple validation errors: ${validationErrors.map(e => e.message).join(', ')}`;
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        errors: validationErrors,
        details: 'Please check your input and try again'
      });
    }

    // Handle cast errors (type conversion issues)
    if (error.name === 'CastError') {
      console.error('❌ Cast error:', error);
      return res.status(400).json({
        success: false,
        message: `Invalid data type for field '${error.path}'. Expected ${error.kind}, received ${typeof error.value}`,
        error: 'Data type mismatch',
        field: error.path,
        details: 'Please check your input format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * Get all profiles (admin functionality - optional)
 * GET /api/profile/all
 */
const getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate('user', 'email username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Profiles retrieved successfully',
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profiles',
      error: error.message
    });
  }
};

/**
 * Upload profile picture
 * POST /api/profile/picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Find or create profile
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      // Create basic profile if it doesn't exist
      const user = await User.findById(userId);
      profile = new Profile({
        user: userId,
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      });
    }

    // Convert file buffer to base64 for storage
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    // Update profile picture
    await profile.updateProfilePicture({
      base64: dataUri,
      url: '', // Can be updated later if using cloud storage
      publicId: '' // For Cloudinary integration if needed
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: profile.profilePicture
      }
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
};

/**
 * Remove profile picture
 * DELETE /api/profile/picture
 */
const removeProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Reset profile picture
    await profile.updateProfilePicture({
      url: '',
      base64: '',
      publicId: '',
      uploadedAt: null
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing profile picture',
      error: error.message
    });
  }
};

/**
 * Change password
 * POST /api/profile/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

/**
 * Update notification settings
 * POST /api/profile/notifications
 */
const updateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationSettings = req.body;

    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    await profile.updateNotifications(notificationSettings);

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        notifications: profile.notifications
      }
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings',
      error: error.message
    });
  }
};

/**
 * Update theme
 * POST /api/profile/theme
 */
const updateTheme = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

    if (!theme) {
      return res.status(400).json({
        success: false,
        message: 'Theme is required'
      });
    }

    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    await profile.changeTheme(theme);

    res.status(200).json({
      success: true,
      message: 'Theme updated successfully',
      data: {
        theme: profile.theme
      }
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    if (error.message === 'Invalid theme selection') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating theme',
      error: error.message
    });
  }
};

/**
 * Get profile completion status
 * GET /api/profile/completion
 */
const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          completionPercentage: 0,
          isCompleted: false,
          missingFields: ['name', 'email', 'phone']
        }
      });
    }

    const missingFields = [];
    if (!profile.name) missingFields.push('name');
    if (!profile.email) missingFields.push('email');
    if (!profile.phone) missingFields.push('phone');
    if (!profile.dateOfBirth) missingFields.push('dateOfBirth');
    if (!profile.address) missingFields.push('address');
    if (!profile.bio) missingFields.push('bio');
    if (!profile.emergencyContact?.name) missingFields.push('emergencyContact');
    if (!profile.profilePicture?.url && !profile.profilePicture?.base64) missingFields.push('profilePicture');

    res.status(200).json({
      success: true,
      data: {
        completionPercentage: profile.completionPercentage,
        isCompleted: profile.isCompleted,
        missingFields
      }
    });
  } catch (error) {
    console.error('Error getting profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting profile completion status',
      error: error.message
    });
  }
};

/**
 * Delete profile (optional)
 * DELETE /api/profile
 */
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await Profile.findOneAndDelete({ user: userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile',
      error: error.message
    });
  }
};

// Export multer upload middleware
const uploadMiddleware = upload.single('profilePicture');

module.exports = {
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
};
