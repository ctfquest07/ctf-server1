const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const crypto = require('crypto');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');

// Enhanced rate limiting with IP tracking
const createAdvancedRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message, blocked: true },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use IP + User-Agent for better tracking
      return `${req.ip}_${crypto.createHash('md5').update(req.get('User-Agent') || '').digest('hex')}`;
    },
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
      res.status(429).json({
        success: false,
        message,
        blocked: true,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Strict rate limiters
const strictLoginLimiter = createAdvancedRateLimit(
  15 * 60 * 1000, // 15 minutes
  3, // 3 attempts only
  'Too many login attempts. Account temporarily locked.',
  true
);

const apiLimiter = createAdvancedRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'API rate limit exceeded. Please slow down.'
);

const challengeSubmitLimiter = createAdvancedRateLimit(
  60 * 1000, // 1 minute
  5, // 5 submissions per minute
  'Too many flag submissions. Please wait before trying again.'
);

// Enhanced helmet configuration
const advancedHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Advanced input sanitization
const advancedSanitization = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // XSS protection
      value = xss(value, {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
      });
      
      // Additional XSS patterns
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /vbscript:/gi,
        /data:text\/html/gi
      ];
      
      xssPatterns.forEach(pattern => {
        value = value.replace(pattern, '');
      });
      
      // SQL injection protection - comprehensive patterns
      const sqlPatterns = [
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
        /((\%27)|(\'))union/gi,
        /exec(\s|\+)+(s|x)p\w+/gi,
        /UNION(?:\s+ALL)?\s+SELECT/gi,
        /(DROP|CREATE|ALTER|TRUNCATE|INSERT|DELETE)\s+(TABLE|DATABASE|INDEX)/gi,
        /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bEXEC\b|\bUNION\b)/gi
      ];
      
      sqlPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          throw new Error('Potential SQL injection detected');
        }
      });
      
      // NoSQL injection protection
      if (typeof value === 'object' && value !== null) {
        const keys = Object.keys(value);
        if (keys.some(key => key.startsWith('$') || key.includes('.'))) {
          throw new Error('Potential NoSQL injection detected');
        }
      }
      
      return value.trim();
    }
    return value;
  };

  try {
    // Sanitize all input recursively
    const sanitizeObject = (obj) => {
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
          return obj.map(item => sanitizeObject(item));
        } else {
          const sanitized = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              sanitized[key] = sanitizeObject(obj[key]);
            }
          }
          return sanitized;
        }
      }
      return sanitizeValue(obj);
    };

    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
  } catch (error) {
    console.warn(`Security violation detected from IP: ${req.ip}, Error: ${error.message}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      blocked: true
    });
  }
};

// Enhanced input validation
const enhancedValidation = {
  email: (email) => {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }
    if (email.length > 254) {
      throw new Error('Email too long');
    }
    return validator.normalizeEmail(email, { 
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false
    });
  },
  
  username: (username) => {
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, hyphens, and underscores');
    }
    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be between 3 and 20 characters');
    }
    // Check for reserved usernames
    const reserved = ['admin', 'root', 'administrator', 'system', 'api', 'www', 'mail', 'ftp'];
    if (reserved.includes(username.toLowerCase())) {
      throw new Error('Username is reserved');
    }
    return username;
  },
  
  password: (password) => {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required');
    }
    if (password.length < 8 || password.length > 128) {
      throw new Error('Password must be between 8 and 128 characters');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
    // Check for common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
    if (weakPasswords.includes(password.toLowerCase())) {
      throw new Error('Password is too weak');
    }
    return password;
  },
  
  objectId: (id) => {
    if (!id || typeof id !== 'string') {
      throw new Error('ID is required');
    }
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new Error('Invalid ID format');
    }
    return id;
  }
};

// CSRF protection with token validation
const csrfProtection = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip if API key authentication is used
  if (req.headers['x-api-key']) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    console.warn(`CSRF attack detected from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed',
      blocked: true
    });
  }
  
  next();
};

// File upload security with advanced validation
const secureFileUpload = {
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ],
  
  maxFileSize: 5 * 1024 * 1024, // 5MB
  
  validateFile: (file) => {
    if (!file) return true;
    
    // Check file size
    if (file.size > secureFileUpload.maxFileSize) {
      throw new Error('File size exceeds limit');
    }
    
    // Check MIME type
    if (!secureFileUpload.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('File extension not allowed');
    }
    
    // Check for malicious file names
    if (/[<>:"/\\|?*\x00-\x1f]/.test(file.originalname)) {
      throw new Error('Invalid characters in filename');
    }
    
    // Check for double extensions
    if ((file.originalname.match(/\./g) || []).length > 1) {
      throw new Error('Multiple file extensions not allowed');
    }
    
    return true;
  }
};

// Security logging middleware
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log security-relevant requests
  const securityPaths = ['/api/auth/', '/api/admin/', '/upload'];
  const isSecurityPath = securityPaths.some(path => req.path.startsWith(path));
  
  if (isSecurityPath) {
    console.log(`[SECURITY] ${req.method} ${req.path} from ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  }
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    if (isSecurityPath && (!data.success || data.blocked)) {
      console.warn(`[SECURITY_ALERT] ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${req.ip}`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  strictLoginLimiter,
  apiLimiter,
  challengeSubmitLimiter,
  advancedHelmet,
  advancedSanitization,
  enhancedValidation,
  csrfProtection,
  secureFileUpload,
  securityLogger,
  mongoSanitize: mongoSanitize()
};