const mongoose = require('mongoose');

const CompetitionTimerSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  durationMinutes: {
    type: Number,
    default: 120 // 2 hours default
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one timer document exists
CompetitionTimerSchema.index({ _id: 1 }, { unique: true });

module.exports = mongoose.model('CompetitionTimer', CompetitionTimerSchema);
