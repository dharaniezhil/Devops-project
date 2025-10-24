const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const router = express.Router();

// GET /api/user/recently-accessed
// Returns last 5 recently viewed complaints for the logged-in user
router.get('/recently-accessed', authenticateToken, async (req, res) => {
  try {
    if (req.user.actorType !== 'user') {
      return res.status(403).json({ success: false, message: 'Users only' });
    }

    const user = await User.findById(req.user.id)
      .select('recentlyAccessed')
      .populate({
        path: 'recentlyAccessed.complaint',
        select: 'title status shortDescription description',
      });

    const items = (user?.recentlyAccessed || [])
      .slice(0, 5)
      .map((entry) => ({
        complaintId: entry.complaint?._id || entry.complaint,
        title: entry.complaint?.title || entry.complaint?.shortDescription || '',
        shortDescription: entry.complaint?.shortDescription || '',
        status: entry.complaint?.status || 'Pending',
        accessedAt: entry.accessedAt,
      }));

    return res.json({ success: true, items });
  } catch (err) {
    console.error('Fetch recently accessed error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch recently accessed complaints' });
  }
});

module.exports = router;
