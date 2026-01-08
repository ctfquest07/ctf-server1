const EventState = require('../models/EventState');
const { getRedisClient } = require('../utils/redis');

const redisClient = getRedisClient();
const CACHE_KEY = 'ctf:event:state';
const CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Get event state from cache or MongoDB
 * @returns {Promise<Object>} Event state object
 */
async function getEventState() {
  try {
    // Try Redis cache first
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[EventState] Redis cache miss or error:', err.message);
  }

  // Fallback to MongoDB
  try {
    const eventState = await EventState.getEventState();
    const stateObj = {
      status: eventState.status,
      startedAt: eventState.startedAt,
      endedAt: eventState.endedAt,
      startedBy: eventState.startedBy,
      endedBy: eventState.endedBy
    };

    // Cache in Redis for future requests
    try {
      await redisClient.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stateObj));
    } catch (err) {
      console.warn('[EventState] Failed to cache state in Redis:', err.message);
    }

    return stateObj;
  } catch (err) {
    console.error('[EventState] Error fetching event state from MongoDB:', err);
    // Default to 'not_started' if database error
    return { status: 'not_started' };
  }
}

/**
 * Refresh event state cache in Redis
 * @param {Object} stateObj - Event state object to cache
 */
async function refreshEventStateCache(stateObj) {
  try {
    await redisClient.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(stateObj));
  } catch (err) {
    console.warn('[EventState] Failed to refresh cache:', err.message);
  }
}

/**
 * Middleware to check if event is started (allows submissions)
 * Returns 403 if event is not started or ended
 */
exports.checkEventStarted = async (req, res, next) => {
  try {
    const eventState = await getEventState();
    
    if (eventState.status !== 'started') {
      return res.status(403).json({
        success: false,
        message: eventState.status === 'ended' 
          ? 'CTF event has ended. Submissions are no longer accepted.'
          : 'CTF event has not started yet.',
        eventStatus: eventState.status
      });
    }

    // Attach event state to request for use in route handlers
    req.eventState = eventState;
    next();
  } catch (error) {
    console.error('[EventState] Error in checkEventStarted:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking event state'
    });
  }
};

/**
 * Middleware to check if event is NOT ended (blocks if ended)
 * Allows submissions when started or not_started
 */
exports.checkEventNotEnded = async (req, res, next) => {
  try {
    const eventState = await getEventState();
    
    if (eventState.status === 'ended') {
      return res.status(403).json({
        success: false,
        message: 'CTF event has ended. Submissions are no longer accepted.',
        eventStatus: 'ended',
        endedAt: eventState.endedAt
      });
    }

    // Attach event state to request
    req.eventState = eventState;
    next();
  } catch (error) {
    console.error('[EventState] Error in checkEventNotEnded:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking event state'
    });
  }
};

/**
 * Helper function to check event state (for use in route handlers)
 * @returns {Promise<Object>} Event state object
 */
exports.getEventState = getEventState;

/**
 * Helper function to refresh cache
 * @param {Object} stateObj - Event state object
 */
exports.refreshEventStateCache = refreshEventStateCache;

/**
 * Check if event is ended (synchronous check for use in business logic)
 * @returns {Promise<boolean>} True if event is ended
 */
exports.isEventEnded = async () => {
  try {
    const eventState = await getEventState();
    return eventState.status === 'ended';
  } catch (error) {
    console.error('[EventState] Error checking if event ended:', error);
    // Default to false (allow operations) if check fails
    return false;
  }
};
