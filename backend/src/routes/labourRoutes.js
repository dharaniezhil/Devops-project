const express = require('express');
const bcrypt = require('bcryptjs');
const Labour = require('../models/Labour');
const { authenticateToken, requireSuperAdmin, checkRole } = require('../middleware/auth');

const router = express.Router();

// Helper to sanitize labour document for response
const sanitizeLabour = (l) => ({
  id: l._id,
  name: l.name,
  email: l.email,
  phone: l.phone,
  role: l.role || 'labour',
  status: l.status || 'active',
  createdAt: l.createdAt
});

// POST /api/superadmin/labours/create
// Create a new labour (SuperAdmin only)
router.post('/create', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone, and password are required' });
    }

    const existing = await Labour.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Create labour (password hashing handled by pre-save hook in model)
    const labour = await Labour.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      password: String(password),
      role: 'labour',
      status: 'active'
    });

    return res.status(201).json({
      message: 'Labour account created successfully',
      labour: sanitizeLabour(labour)
    });
  } catch (err) {
    console.error('Create labour (superadmin) error:', err);
    return res.status(500).json({ message: 'Failed to create labour' });
  }
});

// GET /api/superadmin/labours
// List all labours (Admin or SuperAdmin)
router.get('/', authenticateToken, checkRole(['admin','superadmin']), async (req, res) => {
  try {
    const labours = await Labour.find({}, 'name email phone role status createdAt').sort({ createdAt: -1 });
    return res.json({ labours });
  } catch (err) {
    console.error('List labours (superadmin) error:', err);
    return res.status(500).json({ message: 'Failed to fetch labours' });
  }
});

module.exports = router;