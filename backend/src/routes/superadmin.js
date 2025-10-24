const express = require('express');
const { authenticateToken, requireSuperAdmin, checkRole } = require('../middleware/auth');
const { createLabourBySuper, listLabours } = require('../controllers/adminController');

const router = express.Router();

// POST /api/superadmin/labours/create - SuperAdmin only
router.post('/labours/create', authenticateToken, requireSuperAdmin, createLabourBySuper);

// GET /api/superadmin/labours - Admin or SuperAdmin
router.get('/labours', authenticateToken, checkRole(['admin','superadmin']), listLabours);

module.exports = router;