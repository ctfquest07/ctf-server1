const mongoose = require('mongoose');

const EventStateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['not_started', 'started', 'ended'],
    default: 'not_started',
    required: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  endedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one EventState document exists
// Use a fixed _id to guarantee singleton pattern
EventStateSchema.statics.getEventState = async function() {
  const FIXED_ID = '000000000000000000000001'; // Fixed ObjectId for singleton
  let eventState = await this.findById(FIXED_ID);
  
  if (!eventState) {
    // Create default event state if it doesn't exist
    eventState = await this.create({
      _id: FIXED_ID,
      status: 'not_started'
    });
  }
  
  return eventState;
};

EventStateSchema.statics.updateEventState = async function(status, userId) {
  const FIXED_ID = '000000000000000000000001';
  const updateData = {
    status,
    updatedAt: new Date()
  };

  if (status === 'started') {
    updateData.startedAt = new Date();
    updateData.startedBy = userId;
  } else if (status === 'ended') {
    updateData.endedAt = new Date();
    updateData.endedBy = userId;
  }

  return await this.findByIdAndUpdate(
    FIXED_ID,
    updateData,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

// Index for fast lookups
EventStateSchema.index({ status: 1 });

module.exports = mongoose.model('EventState', EventStateSchema);
