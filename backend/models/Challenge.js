const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['web', 'crypto', 'forensics', 'reverse', 'osint', 'misc']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['Easy', 'Medium', 'Hard', 'Expert']
  },
  points: {
    type: Number,
    required: [true, 'Points are required']
  },
  // CTFd-style dynamic scoring
  dynamicScoring: {
    enabled: {
      type: Boolean,
      default: false
    },
    initial: {
      type: Number, // Initial/maximum points
      default: function() { return this.points; }
    },
    minimum: {
      type: Number, // Minimum points (floor)
      default: function() { return Math.floor(this.points * 0.25); } // 25% of initial
    },
    decay: {
      type: Number, // Number of solves to reach minimum
      default: 50 // After 50 solves, reaches minimum value
    }
  },
  flag: {
    type: String,
    required: [true, 'Flag is required'],
    select: false // Hide flag in query results by default
  },
  hints: [{
    content: String,
    cost: Number
  }],
  solvedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVisible: {
    type: Boolean,
    default: true
  },
  submissionsAllowed: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for number of solves
ChallengeSchema.virtual('solveCount').get(function() {
  return this.solvedBy ? this.solvedBy.length : 0;
});

// Method to calculate current dynamic value based on solves
ChallengeSchema.methods.getCurrentValue = function() {
  // If dynamic scoring is not enabled, return static points
  if (!this.dynamicScoring?.enabled) {
    return this.points;
  }

  const solveCount = this.solvedBy?.length || 0;
  const initial = this.dynamicScoring.initial || this.points;
  const minimum = this.dynamicScoring.minimum || Math.floor(this.points * 0.25);
  const decay = this.dynamicScoring.decay || 50;

  // CTFd-style logarithmic decay formula
  // value = ((minimum - initial) / (decay ** 2)) * (solves ** 2) + initial
  if (solveCount === 0) {
    return initial;
  }

  if (solveCount >= decay) {
    return minimum;
  }

  // Calculate the decay curve
  const value = Math.floor(
    ((minimum - initial) / Math.pow(decay, 2)) * Math.pow(solveCount, 2) + initial
  );

  // Ensure value is between minimum and initial
  return Math.max(minimum, Math.min(initial, value));
};

// Set toJSON option to include virtuals
ChallengeSchema.set('toJSON', { virtuals: true });
ChallengeSchema.set('toObject', { virtuals: true });

// Create indexes for better performance with multiple users
ChallengeSchema.index({ title: 1 }, { unique: true });
ChallengeSchema.index({ category: 1 }); // For filtering by category
ChallengeSchema.index({ difficulty: 1 }); // For filtering by difficulty
ChallengeSchema.index({ points: 1 }); // For sorting by points
ChallengeSchema.index({ isVisible: 1 }); // For filtering visible challenges
ChallengeSchema.index({ createdAt: 1 }); // For sorting by creation date
ChallengeSchema.index({ solvedBy: 1 }); // For user-specific queries

// Compound indexes for complex queries
ChallengeSchema.index({ category: 1, difficulty: 1 }); // For category + difficulty filtering
ChallengeSchema.index({ isVisible: 1, category: 1 }); // For visible challenges by category
ChallengeSchema.index({ isVisible: 1, points: 1 }); // For visible challenges sorted by points
ChallengeSchema.index({ category: 1, points: 1 }); // For category challenges sorted by points

module.exports = mongoose.model('Challenge', ChallengeSchema);
