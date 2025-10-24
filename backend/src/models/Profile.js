const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  // Reference to User model (ObjectId reference)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true // One profile per user
  },
  
  // Personal Information Section
  name: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120']
  },
  role: {
    type: String,
    enum: ['User'],
    default: 'User'
  },
  status: {
    type: String,
    enum: ['Active', 'Pending Verification', 'Inactive'],
    default: 'Active'
  },

  // Contact Information Section
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' }
  },
  address: {
    type: String,
    default: '',
    maxlength: [500, 'Address cannot exceed 500 characters']
  },

  // Legacy location structure (keeping for backward compatibility)
  location: {
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' }
  },

  // Profile Picture
  profilePicture: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }, // For Cloudinary integration
    base64: { type: String, default: '' }, // Alternative base64 storage
    uploadedAt: { type: Date, default: null }
  },

  // Account Settings
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    complaints: { type: Boolean, default: true },
    updates: { type: Boolean, default: true }
  },
  theme: {
    type: String,
    enum: ['Light', 'Dark', 'Green+Gray', 'Orange+Blue', 'Blue+White'],
    default: 'Light'
  },

  // Additional Profile Fields
  bio: { 
    type: String, 
    default: '',
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate age from date of birth
profileSchema.virtual('calculatedAge').get(function() {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return this.age || null;
});

// Virtual field for formatted address
profileSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address) parts.push(this.address);
  if (this.location?.city) parts.push(this.location.city);
  if (this.location?.state) parts.push(this.location.state);
  if (this.location?.country) parts.push(this.location.country);
  return parts.join(', ') || 'No address provided';
});

// Pre-save middleware to calculate completion percentage
profileSchema.pre('save', function(next) {
  const requiredFields = [
    this.name,
    this.email,
    this.phone
  ];
  
  const optionalFields = [
    this.dateOfBirth,
    this.address,
    this.bio,
    this.emergencyContact?.name,
    this.emergencyContact?.phone,
    this.profilePicture?.url || this.profilePicture?.base64
  ];
  
  const completedRequired = requiredFields.filter(field => field && field.toString().trim()).length;
  const completedOptional = optionalFields.filter(field => field && field.toString().trim()).length;
  
  const totalRequired = requiredFields.length;
  const totalOptional = optionalFields.length;
  
  // Calculate percentage (required fields are weighted more heavily)
  const requiredPercentage = (completedRequired / totalRequired) * 70; // 70% weight
  const optionalPercentage = (completedOptional / totalOptional) * 30; // 30% weight
  
  this.completionPercentage = Math.round(requiredPercentage + optionalPercentage);
  this.isCompleted = this.completionPercentage >= 80;
  this.lastUpdated = new Date();
  
  // Auto-calculate age if date of birth is provided
  if (this.dateOfBirth && !this.age) {
    this.age = this.calculatedAge;
  }
  
  next();
});

// Pre-update middleware
profileSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set) {
    update.$set.lastUpdated = new Date();
  } else {
    update.lastUpdated = new Date();
  }
  next();
});

// Method to update profile picture
profileSchema.methods.updateProfilePicture = function(pictureData) {
  this.profilePicture = {
    ...this.profilePicture,
    ...pictureData,
    uploadedAt: new Date()
  };
  return this.save();
};

// Method to toggle notification settings
profileSchema.methods.updateNotifications = function(notificationSettings) {
  this.notifications = {
    ...this.notifications,
    ...notificationSettings
  };
  return this.save();
};

// Method to change theme
profileSchema.methods.changeTheme = function(newTheme) {
  const validThemes = ['Light', 'Dark', 'Green+Gray', 'Orange+Blue', 'Blue+White'];
  if (validThemes.includes(newTheme)) {
    this.theme = newTheme;
    return this.save();
  }
  throw new Error('Invalid theme selection');
};

// Indexes for better query performance
profileSchema.index({ user: 1 }, { unique: true });
profileSchema.index({ email: 1 });
profileSchema.index({ phone: 1 });
profileSchema.index({ status: 1 });
profileSchema.index({ isCompleted: 1 });
profileSchema.index({ 'location.country': 1 });
profileSchema.index({ 'location.state': 1 });
profileSchema.index({ 'location.city': 1 });
profileSchema.index({ theme: 1 });
profileSchema.index({ lastUpdated: -1 });

// Export the model
module.exports = mongoose.model('Profile', profileSchema);
