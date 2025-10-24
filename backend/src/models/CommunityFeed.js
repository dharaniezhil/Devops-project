const mongoose = require('mongoose');

const CommunityFeedSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedbackText: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, default: null },
  feedback: { type: Object, default: {} },
  additionalFeedback: { type: Object, default: {} },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'community-feed' });

module.exports = mongoose.model('CommunityFeed', CommunityFeedSchema);
