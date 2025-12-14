const crypto = require('crypto');

// Security configuration constants
const SECURITY_CONFIG = {
  // Password policy
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    BCRYPT_ROUNDS: 12,
    HISTORY_COUNT: 5 // Remember last 5 passwords
  },

  // Session security
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict',
    NAME: 'ctfquest.sid'
  },

  // JWT configuration
  JWT: {
    ACCESS_TOKEN_EXPIRE: '15m',
    REFRESH_TOKEN_EXPIRE: '7d',
    ALGORITHM: 'HS256',
    ISSUER: 'ctfquest',
    AUDIENCE: 'ctfquest-users'
  },

  // Rate limiting
  RATE_LIMIT: {
    LOGIN: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_ATTEMPTS: 3,
      BLOCK_DURATION: 30 * 60 * 1000 // 30 minutes
    },
    API: {
      WINDOW_MS: 15 * 60 * 1000,
      MAX_REQUESTS: 100
    },
    CHALLENGE_SUBMIT: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_ATTEMPTS: 5
    }
  },

  // File upload security
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    SCAN_FOR_MALWARE: true,
    QUARANTINE_SUSPICIOUS: true
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'"],
    IMG_SRC: ["'self'", "data:", "https:"],
    FONT_SRC: ["'self'"],
    CONNECT_SRC: ["'self'"],
    FRAME_ANCESTORS: ["'none'"],
    OBJECT_SRC: ["'none'"],
    UPGRADE_INSECURE_REQUESTS: true
  },

  // Security headers
  HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1 year
    HSTS_INCLUDE_SUBDOMAINS: true,
    HSTS_PRELOAD: true,
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin'
  },

  // Input validation patterns
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME_REGEX: /^[a-zA-Z0-9_-]+$/,
    OBJECTID_REGEX: /^[0-9a-fA-F]{24}$/,
    
    // Dangerous patterns to block
    SQL_INJECTION_PATTERNS: [
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
      /((\%27)|(\'))union/gi,
      /exec(\s|\+)+(s|x)p\w+/gi,
      /UNION(?:\s+ALL)?\s+SELECT/gi,
      /(DROP|CREATE|ALTER|TRUNCATE|INSERT|DELETE)\s+(TABLE|DATABASE|INDEX)/gi
    ],
    
    XSS_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /vbscript:/gi,
      /data:text\/html/gi
    ],
    
    NOSQL_INJECTION_PATTERNS: [
      /\$where/gi,
      /\$ne/gi,
      /\$gt/gi,
      /\$lt/gi,
      /\$regex/gi,
      /\$or/gi,
      /\$and/gi
    ]
  },

  // Logging configuration
  LOGGING: {
    SECURITY_EVENTS: true,
    FAILED_LOGINS: true,
    SUSPICIOUS_ACTIVITY: true,
    ADMIN_ACTIONS: true,
    FILE_UPLOADS: true,
    LOG_RETENTION_DAYS: 90
  },

  // Two-Factor Authentication
  TWO_FACTOR: {
    ENABLED: false, // Can be enabled later
    ISSUER: 'CTFQuest',
    WINDOW: 2, // Allow 2 time steps
    STEP: 30 // 30 seconds
  }
};

// Generate secure random strings
const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const config = SECURITY_CONFIG.PASSWORD;
  const errors = [];

  if (password.length < config.MIN_LENGTH) {
    errors.push(`Password must be at least ${config.MIN_LENGTH} characters long`);
  }

  if (password.length > config.MAX_LENGTH) {
    errors.push(`Password must not exceed ${config.MAX_LENGTH} characters`);
  }

  if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.REQUIRE_SPECIAL_CHARS && !/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', '1234567890', 'password123'
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and weak');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Check for suspicious patterns in input
const detectSuspiciousInput = (input) => {
  if (typeof input !== 'string') return false;

  const patterns = [
    ...SECURITY_CONFIG.VALIDATION.SQL_INJECTION_PATTERNS,
    ...SECURITY_CONFIG.VALIDATION.XSS_PATTERNS,
    ...SECURITY_CONFIG.VALIDATION.NOSQL_INJECTION_PATTERNS
  ];

  return patterns.some(pattern => pattern.test(input));
};

// Security event logger
const logSecurityEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    severity: details.severity || 'medium'
  };

  console.log(`[SECURITY_EVENT] ${JSON.stringify(logEntry)}`);
  
  // In production, you might want to send this to a security monitoring service
  // or store in a dedicated security log database
};

module.exports = {
  SECURITY_CONFIG,
  generateSecureRandom,
  generateCSRFToken,
  validatePasswordStrength,
  detectSuspiciousInput,
  logSecurityEvent
};