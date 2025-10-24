const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, default: '', validate: { validator: function(v) { return !v || /^[+]?[1-9]?[0-9]{7,15}$/.test(v); }, message: 'Invalid phone number format' } },
  profilePicture: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'superadmin'], required: true, default: 'admin' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  lastLogin: { type: Date, default: null },
  emailVerified: { type: Boolean, default: false },
  permissions: { type: [String], default: [] },
  adminSecretKey: { type: String, default: null, select: false },
  // New fields for password management
  isFirstLogin: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: true },
  passwordChangedAt: { type: Date, default: null },
  temporaryPassword: { type: Boolean, default: true },
  // Location fields (required for complaint routing)
  city: { type: String, required: [true, 'City is required'], trim: true },
  district: { type: String, required: [true, 'District is required'], trim: true },
  pincode: { 
    type: String, 
    required: [true, 'Pincode is required'], 
    trim: true,
    validate: {
      validator: function(v) { return /^[0-9]{6}$/.test(v); },
      message: 'Pincode must be exactly 6 digits'
    }
  }
}, { timestamps: true });

adminSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (e) { next(e); }
});

adminSchema.pre('findOneAndUpdate', async function(next){
  const update = this.getUpdate() || {};
  const newPw = update.password || (update.$set && update.$set.password);
  if (!newPw) return next();
  try {
    const hashed = await bcrypt.hash(newPw, 12);
    if (update.$set && update.$set.password) update.$set.password = hashed; else update.password = hashed;
    this.setUpdate(update);
    next();
  } catch (e) { next(e); }
});

adminSchema.methods.comparePassword = async function(candidate){
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);