const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cache for user data to reduce database queries
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

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
    const cacheKey = `user_${decoded.id}`;
    const cachedUser = userCache.get(cacheKey);

    let user;
    if (cachedUser && (now - cachedUser.timestamp < CACHE_TTL) && !newTokenGenerated) {
      // Use cached user data
      user = cachedUser.data;
    } else {
      // Get user from database
      user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // Remove from cache if user no longer exists
        userCache.delete(cacheKey);
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      // Cache the user data
      userCache.set(cacheKey, {
        data: user,
        timestamp: now
      });
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
