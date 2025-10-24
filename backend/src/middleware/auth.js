// src/middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * authenticateToken
 * - Expects Authorization: Bearer <token>
 * - Verifies JWT and attaches req.user = { id, role, actorType }
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      actorType: decoded.actorType, // 'user', 'admin', or 'labour'
      requirePasswordChange: decoded.requirePasswordChange || false
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireUserActor = (req, res, next) => {
  if (!req.user || req.user.actorType !== 'user') {
    return res.status(403).json({ message: 'Users only' });
  }
  next();
};

const requireAdminActor = (req, res, next) => {
  if (!req.user || req.user.actorType !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.actorType !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  if (req.user.role === 'admin' || req.user.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.actorType !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  if (req.user.role === 'superadmin') return next();
  return res.status(403).json({ message: 'Super Admin access required' });
};

// Generic role checker (accepts array of roles). Superadmin passes for admin.
const checkRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const role = (req.user.role || '').toLowerCase();
  const allowed = roles.map(r => String(r).toLowerCase());
  if (allowed.includes(role)) return next();
  // Allow superadmin when admin is requested
  if (allowed.includes('admin') && role === 'superadmin') return next();
  return res.status(403).json({ message: 'Access denied' });
};

const requireLabour = (req, res, next) => {
  if (!req.user || req.user.actorType !== 'labour' || req.user.role !== 'labour') {
    return res.status(403).json({ message: 'Labours only' });
  }
  next();
};

const requireLabourActor = (req, res, next) => {
  if (!req.user || req.user.actorType !== 'labour') {
    return res.status(403).json({ message: 'Labours only' });
  }
  next();
};

// Middleware to check if password change is required
const checkPasswordChangeRequired = (req, res, next) => {
  // Allow password change endpoint itself
  if (req.path === '/change-password' && req.method === 'POST') {
    return next();
  }

  // Check if user needs to change password
  if (req.user && req.user.requirePasswordChange) {
    return res.status(403).json({
      success: false,
      requirePasswordChange: true,
      message: 'Password change required before accessing other features',
      redirect: '/admin/change-password'
    });
  }

  next();
};

module.exports = { 
  authenticateToken, 
  requireUserActor, 
  requireAdminActor, 
  requireAdmin, 
  requireSuperAdmin, 
  requireLabour, 
  requireLabourActor, 
  checkRole,
  checkPasswordChangeRequired
};
