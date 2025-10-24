const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  complaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: [true, 'Complaint is required']
  },
  feedback: {
    satisfaction: {
      type: String,
      enum: {
        values: ['Very satisfied', 'Satisfied', 'Neutral', 'Unsatisfied', 'Very unsatisfied'],
        message: '{VALUE} is not a valid satisfaction level'
      },
      required: [true, 'Satisfaction is required']
    },
    resolutionMet: {
      type: String,
      enum: {
        values: ['Yes, completely', 'Partially', 'Not at all'],
        message: '{VALUE} is not a valid resolution met response'
      },
      required: [true, 'Resolution met is required']
    },
    timeliness: {
      type: String,
      enum: {
        values: ['Excellent', 'Good', 'Average', 'Poor'],
        message: '{VALUE} is not a valid timeliness rating'
      },
      required: [true, 'Timeliness is required']
    },
    communication: {
      type: String,
      enum: {
        values: ['Yes', 'Somewhat', 'No'],
        message: '{VALUE} is not a valid communication response'
      },
      required: [true, 'Communication is required']
    },
    updates: {
      type: String,
      enum: {
        values: ['Always', 'Sometimes', 'Rarely', 'Never'],
        message: '{VALUE} is not a valid updates response'
      },
      required: [true, 'Updates is required']
    },
    easeOfUse: {
      type: String,
      enum: {
        values: ['Very easy', 'Easy', 'Average', 'Difficult', 'Very difficult'],
        message: '{VALUE} is not a valid ease of use rating'
      },
      required: [true, 'Ease of use is required']
    },
    recommendation: {
      type: String,
      enum: {
        values: ['Yes', 'Maybe', 'No'],
        message: '{VALUE} is not a valid recommendation response'
      },
      required: [true, 'Recommendation is required']
    },
    // Open-ended feedback
    likedMost: {
      type: String,
      trim: true,
      maxlength: [500, 'Liked most feedback cannot exceed 500 characters'],
      default: ''
    },
    improvement: {
      type: String,
      trim: true,
      maxlength: [500, 'Improvement feedback cannot exceed 500 characters'],
      default: ''
    },
    suggestion: {
      type: String,
      trim: true,
      maxlength: [500, 'Additional suggestions cannot exceed 500 characters'],
      default: ''
    }
  },
  // Admin visibility and moderation
  isVisible: {
    type: Boolean,
    default: true
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderationNote: {
    type: String,
    trim: true,
    maxlength: [200, 'Moderation note cannot exceed 200 characters'],
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure one feedback per user per complaint
feedbackSchema.index({ user: 1, complaint: 1 }, { unique: true });

// Index for better performance
feedbackSchema.index({ complaint: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ isVisible: 1, createdAt: -1 });

// Virtual for overall satisfaction score (for analytics)
feedbackSchema.virtual('satisfactionScore').get(function() {
  const satisfactionMap = {
    'Very satisfied': 5,
    'Satisfied': 4,
    'Neutral': 3,
    'Unsatisfied': 2,
    'Very unsatisfied': 1
  };
  return satisfactionMap[this.feedback.satisfaction] || 0;
});

// Static method to get feedback statistics for a complaint
feedbackSchema.statics.getComplaintStats = async function(complaintId) {
  const stats = await this.aggregate([
    { $match: { complaint: new mongoose.Types.ObjectId(complaintId), isVisible: true } },
    {
      $group: {
        _id: null,
        totalFeedbacks: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfactionScore' },
        satisfactionBreakdown: {
          $push: '$feedback.satisfaction'
        },
        recommendationBreakdown: {
          $push: '$feedback.recommendation'
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalFeedbacks: 0,
    avgSatisfaction: 0,
    satisfactionBreakdown: [],
    recommendationBreakdown: []
  };
};

// Pre-save middleware to handle moderation
feedbackSchema.pre('save', function(next) {
  // Auto-hide feedback with potentially inappropriate content
  const textFields = [
    this.feedback.likedMost,
    this.feedback.improvement, 
    this.feedback.suggestion
  ];
  
  const hasInappropriateContent = textFields.some(field => {
    if (!field) return false;
    // Simple check - in production, use more sophisticated content filtering
    const inappropriateWords = ['spam', 'inappropriate', 'offensive'];
    return inappropriateWords.some(word => 
      field.toLowerCase().includes(word.toLowerCase())
    );
  });
  
  if (hasInappropriateContent && this.isNew) {
    this.isVisible = false;
  }
  
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);