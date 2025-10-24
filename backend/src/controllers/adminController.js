// backend/src/controllers/adminController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Labour = require('../models/Labour');

const Admin = require('../models/Admin');
const sanitize = (u) => ({ 
  id: u._id, 
  name: u.name, 
  email: u.email, 
  role: u.role,
  city: u.city || '',
  district: u.district || '',
  pincode: u.pincode || ''
});
const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

async function adminLogin(req, res) {
  try {
    const { email, password, secretKey } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    
    const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() })
      .select('+password +adminSecretKey +isFirstLogin +mustChangePassword +temporaryPassword');
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    if (!(admin.role === 'admin' || admin.role === 'superadmin')) return res.status(403).json({ message: 'Not an admin account' });

    // Check for temporary password (SuperAdmin@123)
    let passwordValid = false;
    
    // If admin tries to use temporary password but has already changed it, block it
    if (password === 'SuperAdmin@123' && !admin.temporaryPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Temporary password is no longer valid. Please use your current password.' 
      });
    }
    
    if (admin.temporaryPassword && password === 'SuperAdmin@123') {
      passwordValid = true;
    } else {
      passwordValid = await bcrypt.compare(password, admin.password);
    }

    if (!passwordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Secret key requirement logic:
    // - Skip for temporary password login
    // - Skip if admin has changed password (adminSecretKey is null after first password change)
    // - Only required for admins who still have a secret key set
    if (!admin.temporaryPassword && admin.adminSecretKey) {
      // Secret key enforcement for admins (not required for superadmin or admins who changed password)
      if (admin.role === 'admin') {
        if (!secretKey) {
          return res.status(400).json({ 
            success: false,
            message: 'Secret key is required for admin login' 
          });
        }
        const keyOk = await bcrypt.compare(String(secretKey), admin.adminSecretKey);
        if (!keyOk) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid secret key' 
          });
        }
      }
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // Check if password change is required
    if (admin.mustChangePassword || admin.isFirstLogin || admin.temporaryPassword) {
      const tempToken = sign({ 
        ...sanitize(admin), 
        actorType: 'admin', 
        requirePasswordChange: true 
      });
      return res.json({ 
        success: true,
        requirePasswordChange: true,
        message: 'Password change required on first login',
        tempToken,
        user: sanitize(admin)
        // Let frontend handle navigation
      });
    }

    const token = sign({ ...sanitize(admin), actorType: 'admin' });
    return res.json({ 
      success: true,
      token, 
      user: sanitize(admin)
      // Let frontend handle navigation based on user role
    });
  } catch (e) {
    console.error('Admin login error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function adminRegisterWithSecret(req, res) {
  try {
    const { name, email, password, secretKey } = req.body;
    if (!name || !email || !password || !secretKey) return res.status(400).json({ message: 'Name, email, password, and secretKey are required' });
    const expected = process.env.ADMIN_SECRET_KEY;
    if (!expected || secretKey !== expected) return res.status(403).json({ message: 'Invalid secret key' });
    const existing = await Admin.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const admin = await Admin.create({ name: name.trim(), email: String(email).trim().toLowerCase(), password, role: 'admin' });
    const token = sign({ ...sanitize(admin), actorType: 'admin' });
    return res.status(201).json({ token, user: sanitize(admin), redirect: '/admin/dashboard' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createAdminBySuper(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
    const existing = await Admin.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    // Generate secret key (plaintext once) and store hashed
    const secretPlain = crypto.randomBytes(16).toString('hex');
    const secretHash = await bcrypt.hash(secretPlain, 12);

    // Save admin with raw password (model pre-save will hash it) and hashed secret key
    const admin = await Admin.create({
      name: name.trim(),
      email: String(email).trim().toLowerCase(),
      password: password, // pre-save hook hashes this
      role: 'admin',
      adminSecretKey: secretHash
    });

    return res.status(201).json({ user: sanitize(admin), secretKey: secretPlain });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function promoteToAdmin(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = 'admin';
    await user.save();
    return res.json({ user: sanitize(user) });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function listAdmins(req, res) {
  try {
    const admins = await Admin.find({}, 'name email role status createdAt lastLogin').sort({ createdAt: -1 }).limit(500);
    return res.json({ admins });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.find({}, 'name email role createdAt updatedAt').sort({ createdAt: -1 }).limit(500);
    return res.json({ users });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getAdminMe(req, res) {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id).select('name email role city district pincode');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    return res.json({ 
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        city: admin.city || '',
        district: admin.district || '',
        pincode: admin.pincode || ''
      }
    });
  } catch (e) {
    console.error('Get admin me error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

function adminDashboard(req, res) {
  return res.json({ section: 'Admin Dashboard', features: ['User Management', 'Complaint Management', 'Feedback Review', 'Reports'] });
}

function superDashboard(req, res) {
  return res.json({ section: 'Super Admin Dashboard', features: ['All Admin Privileges', 'Promote Users to Admin', 'System Settings'] });
}

// SuperAdmin-only: update admin
async function updateAdminBySuper(req, res) {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      // Prevent accidental self-downgrade/update of critical fields, but allow name/phone/email updates if needed
      // For safety, block role/status change on self via this endpoint
      const { role, status, ...rest } = req.body || {};
      const updated = await Admin.findByIdAndUpdate(id, { $set: rest }, { new: true, runValidators: true });
      return res.json({ admin: sanitize(updated) });
    }
    const updated = await Admin.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Admin not found' });
    return res.json({ admin: sanitize(updated) });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin-only: delete admin
async function deleteAdminBySuper(req, res) {
  try {
    const { id } = req.params;
    if (req.user.id === id) return res.status(400).json({ message: 'Cannot delete your own superadmin account' });
    const deleted = await Admin.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Admin not found' });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin-only: create user
async function createUserBySuper(req, res) {
  try {
    const { name, email, password, phone = '', location = '' } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });
    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name: name.trim(), email: String(email).trim().toLowerCase(), password, phone, location, role: 'user' });
    return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin-only: update user
async function updateUserBySuper(req, res) {
  try {
    const { id } = req.params;
    const updated = await User.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: { id: updated._id, name: updated.name, email: updated.email, role: updated.role, status: updated.status } });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin-only: delete user
async function deleteUserBySuper(req, res) {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true });
  } catch (e) {
  return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin-only: create labour
async function createLabourBySuper(req, res) {
  try {
    const { name, email, phone, password, skills = [], city } = req.body || {};
    if (!name || !email || !phone || !password || !city) {
      return res.status(400).json({ message: 'Name, email, phone, password, and city are required' });
    }
    const existing = await Labour.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });
    const labour = await Labour.create({ 
      name: name.trim(), 
      email: String(email).trim().toLowerCase(), 
      phone: String(phone).trim(),
      password, 
      role: 'labour',
      skills: Array.isArray(skills) ? skills : [],
      status: 'active',
      city: city.trim()
    });
    return res.status(201).json({ 
      message: 'Labour account created successfully',
      labour: { 
        id: labour._id, 
        name: labour.name, 
        email: labour.email, 
        phone: labour.phone, 
        role: labour.role, 
        status: labour.status,
        city: labour.city
      } 
    });
  } catch (e) {
    console.error('Create labour error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin/Admin: list labours
async function listLabours(req, res) {
  try {
    let query = {};
    
    // If user is admin (not superadmin), filter by their city
    if (req.user.role === 'admin') {
      const admin = await Admin.findById(req.user.id).select('city');
      if (admin && admin.city) {
        query.city = admin.city;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Admin has no city assigned' 
        });
      }
    }
    // SuperAdmin can see all labours (no city filter)
    
    const labours = await Labour.find(query, 'name email skills status city createdAt')
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json({ success: true, labours });
  } catch (e) {
    console.error('List labours error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin-only: update labour
async function updateLabourBySuper(req, res) {
  try {
    const { id } = req.params;
    const updated = await Labour.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Labour not found' });
    return res.json({ 
      success: true, 
      labour: { id: updated._id, name: updated.name, email: updated.email, skills: updated.skills, status: updated.status } 
    });
  } catch (e) {
    console.error('Update labour error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// SuperAdmin-only: delete labour
async function deleteLabourBySuper(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Labour.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Labour not found' });
    return res.json({ success: true, message: 'Labour deleted successfully' });
  } catch (e) {
    console.error('Delete labour error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// New function: Change password on first login
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
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

    // Prevent using the temporary password as new password
    if (newPassword === 'SuperAdmin@123') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot use the temporary password as your new password' 
      });
    }

    const admin = await Admin.findById(req.user.id)
      .select('+password +temporaryPassword +isFirstLogin +mustChangePassword');
    
    if (!admin) {
      console.error('Admin not found for ID:', req.user.id);
      return res.status(404).json({ 
        success: false,
        message: 'Admin not found' 
      });
    }
    
    console.log('Admin found:', {
      id: admin._id,
      email: admin.email,
      temporaryPassword: admin.temporaryPassword,
      isFirstLogin: admin.isFirstLogin,
      hasAssignedCity: !!admin.assignedCity
    });

    // Verify current password
    let currentPasswordValid = false;
    if (admin.temporaryPassword && currentPassword === 'SuperAdmin@123') {
      currentPasswordValid = true;
    } else {
      currentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    }

    if (!currentPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Update password and flags
    admin.password = newPassword; // Will be hashed by pre-save hook
    admin.temporaryPassword = false;
    admin.isFirstLogin = false;
    admin.mustChangePassword = false;
    admin.passwordChangedAt = new Date();
    
    // Remove secret key requirement after first password change
    admin.adminSecretKey = null;
    
    // Ensure assignedCity is set for old admins
    if (!admin.assignedCity) {
      admin.assignedCity = 'DefaultCity';
      console.log('Setting default city for admin:', admin.email);
    }
    
    console.log('Saving admin with updated password...');
    await admin.save();
    console.log('Admin password updated successfully');

    // Generate new token without password change requirement
    const token = sign({ ...sanitize(admin), actorType: 'admin' });

    return res.json({ 
      success: true,
      message: 'Password changed successfully. You can now access the admin panel.',
      token,
      user: sanitize(admin)
      // Let frontend handle navigation based on user role
    });
  } catch (e) {
    console.error('Password change error:', e);
    console.error('Error stack:', e.stack);
    
    // Provide more detailed error message
    let errorMessage = 'Server error while changing password';
    if (e.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(e.errors).map(err => err.message).join(', ');
    } else if (e.message) {
      errorMessage = e.message;
    }
    
    return res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
}

// Admin: create labour with auto-filled location from admin's city
async function createLabour(req, res) {
  try {
    const { name, email, phone, identityKey, password } = req.body || {};
    const adminId = req.user.id;

    // Validate required fields
    if (!name || !email || !phone || !identityKey || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required: name, email, phone, identityKey, and password' 
      });
    }

    // Validate identityKey format (6 alphanumeric characters)
    if (!/^[A-Z0-9]{6}$/i.test(identityKey)) {
      return res.status(400).json({ 
        success: false,
        message: 'Identity Key must be exactly 6 alphanumeric characters' 
      });
    }

    // Validate phone format (10 digits)
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number must be exactly 10 digits' 
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Get admin's location details
    const admin = await Admin.findById(adminId).select('city district pincode name');
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: 'Admin not found' 
      });
    }

    if (!admin.city || !admin.district || !admin.pincode) {
      return res.status(400).json({ 
        success: false,
        message: 'Admin must have location details (city, district, pincode) to create labour accounts' 
      });
    }

    // Check for existing email
    const existingEmail = await Labour.findOne({ 
      email: String(email).trim().toLowerCase() 
    });
    if (existingEmail) {
      return res.status(409).json({ 
        success: false,
        message: 'Email address is already registered' 
      });
    }

    // Check for existing phone
    const existingPhone = await Labour.findOne({ 
      phone: String(phone).trim() 
    });
    if (existingPhone) {
      return res.status(409).json({ 
        success: false,
        message: 'Phone number is already registered' 
      });
    }

    // Check for existing identityKey
    const existingKey = await Labour.findOne({ 
      identityKey: String(identityKey).trim().toUpperCase() 
    });
    if (existingKey) {
      return res.status(409).json({ 
        success: false,
        message: 'Identity Key is already in use. Please generate a different one.' 
      });
    }

    // Create labour with admin's location auto-filled
    const labour = await Labour.create({ 
      name: name.trim(), 
      email: String(email).trim().toLowerCase(), 
      phone: String(phone).trim(),
      identityKey: String(identityKey).trim().toUpperCase(),
      password, // Will be hashed by pre-save hook
      role: 'labour',
      status: 'active',
      city: admin.city,
      district: admin.district,
      pincode: admin.pincode,
      createdBy: adminId
    });

    console.log(`Labour created: ${labour.email} (${labour.identityKey}) by admin ${admin.name}`);

    return res.status(201).json({ 
      success: true,
      message: 'Labour account created successfully. Login credentials are ready.',
      labour: { 
        id: labour._id, 
        name: labour.name, 
        email: labour.email, 
        phone: labour.phone,
        identityKey: labour.identityKey,
        role: labour.role, 
        status: labour.status,
        city: labour.city,
        district: labour.district,
        pincode: labour.pincode,
        createdAt: labour.createdAt
      } 
    });
  } catch (e) {
    console.error('Create labour error:', e);
    
    // Handle validation errors
    if (e.name === 'ValidationError') {
      const errors = Object.values(e.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error: ' + errors.join(', ') 
      });
    }

    // Handle duplicate key errors
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern)[0];
      const fieldName = field === 'identityKey' ? 'Identity Key' : field.charAt(0).toUpperCase() + field.slice(1);
      return res.status(409).json({ 
        success: false,
        message: `${fieldName} is already in use` 
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'Server error while creating labour account' 
    });
  }
}

module.exports = {
  adminLogin,
  changePassword,
  adminRegisterWithSecret,
  createAdminBySuper,
  listAdmins,
  listUsers,
  getAdminMe,
  updateAdminBySuper,
  deleteAdminBySuper,
  createUserBySuper,
  updateUserBySuper,
  deleteUserBySuper,
  createLabourBySuper,
  createLabour,
  listLabours,
  updateLabourBySuper,
  deleteLabourBySuper,
  adminDashboard,
  superDashboard
};
