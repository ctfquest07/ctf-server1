const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { getRedisClient } = require('../utils/redis');
const redisClient = getRedisClient();
const CACHE_TTL = 300; // 5 minutes in seconds

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is about to expire (within 5 minutes)
    const tokenExp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    let newTokenGenerated = false;
    if (tokenExp - now < fiveMinutes) {
      // Generate new token
      const newToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1h' }
      );

      // Set new token in response header
      res.setHeader('X-New-Token', newToken);
      newTokenGenerated = true;
    }

    // Check cache first to reduce database load
    const cacheKey = `user:${decoded.id}`;

    let user;
    if (!newTokenGenerated) {
      try {
        const cachedStr = await redisClient.get(cacheKey);
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          // Restore Date objects for password check
          if (cachedData.passwordChangedAt) {
            cachedData.passwordChangedAt = new Date(cachedData.passwordChangedAt);
          }
          // Ensure _id is always a string for consistency
          if (cachedData._id && typeof cachedData._id === 'object') {
            cachedData._id = cachedData._id.toString();
          }
          user = cachedData;
        }
      } catch (e) {
        console.warn('Redis cache error:', e);
      }
    }

    if (!user) {
      // Get user from database
      const dbUser = await User.findById(decoded.id).select('-password');

      if (!dbUser) {
        // Remove from cache if user no longer exists
        await redisClient.del(cacheKey);
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      // Convert to plain object with _id as string for consistency
      const userObj = dbUser.toObject();
      userObj._id = userObj._id.toString();
      user = userObj;

      // Cache the user data
      await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(userObj));
    }

    // Check if user's password was changed after the token was issued
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please login again'
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Authorize superadmin only
exports.authorizeSuperadmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Only superadmin can access this route'
    });
  }
  next();
};
