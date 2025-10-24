const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  // Google OAuth Integration
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Only required if not a Google user
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Exclude password by default
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  nationality: {
    type: String,
    default: '',
    trim: true
  },
  occupation: {
    type: String,
    default: '',
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  alternatePhone: {
    type: String,
    default: '',
    trim: true
  },
  languages: {
    type: [String],
    default: []
  },
  interests: {
    type: [String],
    default: []
  },
  emergencyContact: {
    name: {
      type: String,
      default: '',
      trim: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    relationship: {
      type: String,
      default: '',
      trim: true
    }
  },
  socialMedia: {
    twitter: {
      type: String,
      default: '',
      trim: true
    },
    linkedin: {
      type: String,
      default: '',
      trim: true
    },
    facebook: {
      type: String,
      default: '',
      trim: true
    }
  },
  // Location fields (required for complaint routing)
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{6}$/.test(v);
      },
      message: 'Pincode must be exactly 6 digits'
    }
  },
  // Extended location details (optional)
  location: {
    country: {
      type: String,
      default: '',
      trim: true
    },
    state: {
      type: String,
      default: '',
      trim: true
    },
    address: {
      type: String,
      default: '',
      trim: true
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  // Secret key required for admin login (not for superadmin)
  adminSecretKey: {
    type: String,
    default: null,
    select: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  complaintCount: {
    type: Number,
    default: 0
  },
  // Recently viewed complaints (last 5)
  recentlyAccessed: [
    {
      complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
      accessedAt: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Ensure password is hashed on update
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() || {};
  const newPassword = update.password || (update.$set && update.$set.password);
  if (!newPassword) return next();

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    if (update.$set && update.$set.password) {
      update.$set.password = hashedPassword;
    } else {
      update.password = hashedPassword;
    }
    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
