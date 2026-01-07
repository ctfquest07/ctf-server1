const rateLimit = require('express-rate-limit');
const config = require('../config');
const validator = require('validator');

// Rate limiting configurations - Very generous for CTF UX
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: 100, // Very high limit - users won't hit this during normal CTF
  message: { success: false, message: 'Too many login attempts, please wait a moment' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

const challengeSubmitLimiter = rateLimit({
  windowMs: config.rateLimit.flagSubmit.windowMs,
  max: 50, // Allow rapid flag attempts - this is CTF!
  message: { success: false, message: 'Please wait a moment before trying again' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts to prevent brute force
});

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.general.windowMs,
  max: 500, // Very high - users refreshing scoreboard frequently
  message: { success: false, message: 'Please wait a moment' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization middleware - MINIMAL for CTF UX
// CTF flags often contain special characters, so we keep sanitization minimal
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Only protect against the most critical attacks
      // Don't escape HTML entities - CTF flags might contain them!
      
      // Only block extremely dangerous SQL patterns
      const sqlPatterns = [
        /(\bDROP\s+(TABLE|DATABASE)\b)/gi,
        /(\bTRUNCATE\s+TABLE\b)/gi,
      ];
      
      sqlPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          throw new Error('Invalid input detected');
        }
      });
      
      return value.trim();
    }
    return value;
  };

  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        req.body[key] = sanitizeValue(req.body[key]);
      }
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      for (const key in req.params) {
        req.params[key] = sanitizeValue(req.params[key]);
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      blocked: true
    });
  }
};

// Input validation middleware
const validateInput = {
  email: (email) => {
    if (!email || !validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }
    return validator.normalizeEmail(email);
  },
  
  username: (username) => {
    if (!username || !validator.isAlphanumeric(username, 'en-US', { ignore: '_-' })) {
      throw new Error('Username can only contain letters, numbers, hyphens, and underscores');
    }
    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be between 3 and 20 characters');
    }
    return username;
  },
  
  password: (password) => {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
    return password;
  },
  
  flag: (flag) => {
    if (!flag || typeof flag !== 'string') {
      throw new Error('Flag must be a string');
    }
    if (!/^SECE\{[A-Za-z0-9_\-\+\*\/\=\!\@\#\$\%\^\&\(\)\[\]\{\}\:\;\,\.\?\s]+\}$/.test(flag)) {
      throw new Error('Invalid flag format. Flag must be in SECE{...} format');
    }
    return flag.trim();
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS for HTTPS
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and API endpoints with proper auth
  if (req.method === 'GET' || req.headers.authorization) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      blocked: true
    });
  }
  
  next();
};

// File upload security
const fileUploadSecurity = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: 5 * 1024 * 1024, // 5MB
  
  validateFile: (file) => {
    if (!file) return true;
    
    if (!fileUploadSecurity.allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type');
    }
    
    if (file.size > fileUploadSecurity.maxSize) {
      throw new Error('File too large');
    }
    
    // Check for malicious file names
    if (/[<>:"/\\|?*]/.test(file.originalname)) {
      throw new Error('Invalid file name');
    }
    
    return true;
  }
};

module.exports = {
  loginLimiter,
  challengeSubmitLimiter,
  generalLimiter,
  sanitizeInput,
  validateInput,
  securityHeaders,
  csrfProtection,
  fileUploadSecurity
};