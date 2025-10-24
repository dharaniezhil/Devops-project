const mongoose = require('mongoose');

const adminProfileSchema = new mongoose.Schema({
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true, 
    unique: true 
  },
  fullName: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  role: { 
    type: String, 
    enum: ['admin', 'superadmin'], 
    required: true, 
    default: 'admin' 
  },
  contactNumber: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^[+]?[1-9]?[0-9]{7,15}$/.test(v);
      },
      message: 'Invalid phone number format. Please enter a valid phone number (7-15 digits)'
    }
  },
  // Additional profile fields
  department: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: [500, 'Bio cannot exceed 500 characters'] },
  // Location information
  location: {
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      default: '',
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      default: '',
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    country: {
      type: String,
      default: '',
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters']
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[0-9]{4,10}$/.test(v);
        },
        message: 'Pincode must be 4-10 digits'
      }
    },
    zipcode: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[A-Za-z0-9\s\-]{3,10}$/.test(v);
        },
        message: 'Zipcode must be 3-10 alphanumeric characters'
      }
    }
  },
  profilePicture: {
    publicId: { type: String, default: '' },
    url: { type: String, default: '' },
    originalName: { type: String, default: '' }
  },
  lastProfileUpdate: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  collection: 'admin-profiles' // Explicitly set collection name
});

// Index for faster queries
adminProfileSchema.index({ adminId: 1 });
adminProfileSchema.index({ email: 1 });

// Pre-save middleware to update lastProfileUpdate
adminProfileSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastProfileUpdate = new Date();
  }
  next();
});

// Method to get sanitized profile data
adminProfileSchema.methods.getSanitizedProfile = function() {
  return {
    id: this._id,
    adminId: this.adminId,
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    contactNumber: this.contactNumber,
    department: this.department,
    bio: this.bio,
    location: this.location || {
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      zipcode: ''
    },
    profilePicture: this.profilePicture,
    lastProfileUpdate: this.lastProfileUpdate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('AdminProfile', adminProfileSchema);