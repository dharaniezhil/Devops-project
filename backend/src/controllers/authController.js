const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Dashboard = require('../models/Dashboard');

// Helper: sign JWT
const signToken = (id, role = 'user', actorType = 'user') => {
  return jwt.sign(
    { id, role, actorType },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, phone, location, city, district, pincode } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    console.log('Registration attempt:', { name, email: normalizedEmail, city, district, pincode });

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      console.log('Email already exists:', normalizedEmail);
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Validate required location fields
    if (!city || !district || !pincode) {
      console.error('Missing required fields:', { city: !!city, district: !!district, pincode: !!pincode });
      return res.status(400).json({ 
        success: false, 
        message: 'City, district, and pincode are required' 
      });
    }

    const user = new User({
      name: (name || '').trim(),
      email: normalizedEmail,
      password,
      phone: phone ? String(phone).trim() : '',
      city: city.trim(),
      district: district.trim(),
      pincode: pincode.trim(),
      location: {
        address: (location || '').trim()
      }
    });
    
    console.log('Attempting to save user:', user.email);
    await user.save();
    console.log('User saved successfully:', user._id);

    // Create dashboard entry for new user
    try {
      await Dashboard.create({
        user: user._id,
        totalComplaints: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0
      });
      console.log('Dashboard created for user:', user._id);
    } catch (dashboardError) {
      console.error('Failed to create dashboard for user:', user._id, dashboardError);
      // Continue with registration even if dashboard creation fails
    }

    const token = signToken(user._id, 'user', 'user');
    console.log('Registration successful for:', user.email);
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        district: user.district,
        pincode: user.pincode,
        location: user.location,
        phone: user.phone
      },
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: err.message || 'Registration failed' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id, user.role || 'user', 'user');
    const { password: _pw, ...safe } = user.toObject();

    return res.json({
      message: 'Login successful',
      user: {
        id: safe._id,
        name: safe.name,
        email: safe.email,
        role: safe.role,
        city: safe.city,
        district: safe.district,
        pincode: safe.pincode,
        location: safe.location,
        phone: safe.phone,
        lastLogin: user.lastLogin
      },
      token
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        district: user.district,
        pincode: user.pincode,
        location: user.location,
        phone: user.phone,
        status: user.status,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load user' });
  }
};

// Optional: POST /api/auth/logout (client removes token)
const logout = async (req, res) => {
  return res.json({ message: 'Logout successful' });
};

// Export with both naming styles for safety
module.exports = {
  register,
  login,
  getMe,
  logout,
  registerUser: register,
  loginUser: login
};
