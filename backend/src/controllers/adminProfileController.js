const AdminProfile = require('../models/AdminProfile');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * Get admin profile
 * GET /api/admin/profile
 */
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    let profile = await AdminProfile.findOne({ adminId });
    
    // If profile doesn't exist, create one from Admin data
    if (!profile) {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      profile = await AdminProfile.create({
        adminId: admin._id,
        fullName: admin.name,
        email: admin.email,
        role: admin.role,
        contactNumber: admin.phone || ''
      });
    }
    
    res.json({
      success: true,
      data: profile.getSanitizedProfile()
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update admin profile
 * PUT /api/admin/profile
 */
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { fullName, contactNumber, department, bio, location } = req.body;
    
    // Validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required and must be at least 2 characters long'
      });
    }
    
    if (contactNumber && !/^[+]?[1-9]?[0-9]{7,15}$/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please enter a valid phone number (7-15 digits)'
      });
    }
    
    // Validate location fields if provided
    if (location) {
      if (location.pincode && !/^[0-9]{4,10}$/.test(location.pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Pincode must be 4-10 digits'
        });
      }
      if (location.zipcode && !/^[A-Za-z0-9\s\-]{3,10}$/.test(location.zipcode)) {
        return res.status(400).json({
          success: false,
          message: 'Zipcode must be 3-10 alphanumeric characters'
        });
      }
    }
    
    let profile = await AdminProfile.findOne({ adminId });
    
    if (!profile) {
      // Create profile if it doesn't exist
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      profile = new AdminProfile({
        adminId: admin._id,
        fullName: fullName.trim(),
        email: admin.email,
        role: admin.role,
        contactNumber: contactNumber || '',
        department: department || '',
        bio: bio || '',
        location: location || {
          address: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          zipcode: ''
        }
      });
    } else {
      // Update existing profile
      profile.fullName = fullName.trim();
      profile.contactNumber = contactNumber || '';
      profile.department = department || '';
      profile.bio = bio || '';
      
      if (location) {
        profile.location = {
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          country: location.country || '',
          pincode: location.pincode || '',
          zipcode: location.zipcode || ''
        };
      }
    }
    
    await profile.save();
    
    // Also update the Admin model for consistency
    await Admin.findByIdAndUpdate(adminId, {
      name: fullName.trim(),
      phone: contactNumber || ''
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile.getSanitizedProfile()
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update admin profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * Change admin password
 * POST /api/admin/profile/change-password
 */
const changePassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get admin with password field
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (the pre-save hook will hash it)
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Upload/Update admin profile picture
 * POST /api/admin/profile/upload-picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing:', {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET
      });
      return res.status(500).json({
        success: false,
        message: 'Image upload service is not configured. Please contact administrator.',
        error: 'CLOUDINARY_NOT_CONFIGURED'
      });
    }
    
    // Find or create admin profile
    let profile = await AdminProfile.findOne({ adminId });
    
    if (!profile) {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }
      
      profile = new AdminProfile({
        adminId: admin._id,
        fullName: admin.name,
        email: admin.email,
        role: admin.role,
        contactNumber: admin.phone || ''
      });
    }
    
    try {
      // If there's an existing profile picture, delete it from Cloudinary
      if (profile.profilePicture && profile.profilePicture.publicId) {
        try {
          await deleteFromCloudinary(profile.profilePicture.publicId);
        } catch (deleteError) {
          console.warn('Failed to delete old profile picture:', deleteError);
          // Continue with upload even if deletion fails
        }
      }
      
      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'admin-profiles');
      
      // Update profile with new image data
      profile.profilePicture = {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        originalName: req.file.originalname
      };
      
      await profile.save();
      
      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePicture: profile.profilePicture
        }
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      
      // Check for specific Cloudinary errors
      if (cloudinaryError.message && cloudinaryError.message.includes('Invalid API key')) {
        return res.status(500).json({
          success: false,
          message: 'Image upload service configuration error. Please check your Cloudinary API credentials.',
          error: 'INVALID_CLOUDINARY_CREDENTIALS'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage',
        error: process.env.NODE_ENV === 'development' ? cloudinaryError.message : 'UPLOAD_FAILED'
      });
    }
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  uploadProfilePicture
};
