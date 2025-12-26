/**
 * Centralized Configuration Module
 * All runtime behavior is driven by .env variables
 * NO HARDCODED VALUES - everything configurable
 */

// Helper to parse duration strings (e.g., "24h", "30m", "5s") to milliseconds
const parseDuration = (value, defaultMs) => {
  if (!value) return defaultMs;
  if (typeof value === 'number') return value;
  
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return defaultMs;
  
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(num) * (multipliers[unit] || 1000);
};

// Helper to parse boolean strings
const parseBoolean = (value, defaultValue) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
};

// Helper to parse integer
const parseInt = (value, defaultValue) => {
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

module.exports = {
  // Server Configuration
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10000),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ctfquest',
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 500),
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 50)
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: {
      userCache: parseDuration(process.env.REDIS_USER_CACHE_TTL || '5m', 300000), // 5 minutes
      challengeCache: parseDuration(process.env.REDIS_CHALLENGE_CACHE_TTL || '5m', 300000),
      scoreboardCache: parseDuration(process.env.REDIS_SCOREBOARD_CACHE_TTL || '30s', 30000)
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '24h',
    // Refresh token when this % of lifetime remains (default 10%)
    refreshThresholdPercent: parseInt(process.env.JWT_REFRESH_THRESHOLD_PERCENT, 10)
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseDuration(process.env.SESSION_MAX_AGE || '24h', 86400000) // 24 hours
  },

  // Security Configuration
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 100),
    loginTimeoutMinutes: parseInt(process.env.LOGIN_TIMEOUT, 1),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 12),
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE_SECONDS, 31536000) // 1 year
  },

  // Rate Limiting Configuration
  rateLimit: {
    login: {
      windowMs: parseDuration(process.env.LOGIN_RATE_WINDOW || '15m', 900000), // 15 minutes
      max: parseInt(process.env.LOGIN_RATE_MAX, 5) // 5 attempts per window
    },
    flagSubmit: {
      maxAttempts: parseInt(process.env.FLAG_SUBMIT_MAX_ATTEMPTS, 100),
      windowSeconds: parseInt(process.env.FLAG_SUBMIT_WINDOW, 30),
      cooldownSeconds: parseInt(process.env.FLAG_SUBMIT_COOLDOWN, 2),
      windowMs: parseDuration(process.env.FLAG_SUBMIT_RATE_WINDOW || '1m', 60000), // 1 minute
      max: parseInt(process.env.FLAG_SUBMIT_RATE_MAX, 10) // 10 submissions per minute
    },
    general: {
      windowMs: parseDuration(process.env.GENERAL_RATE_WINDOW || '15m', 900000), // 15 minutes
      max: parseInt(process.env.GENERAL_RATE_MAX, 100) // 100 requests per window
    },
    securityAudit: {
      windowMs: parseDuration(process.env.SECURITY_AUDIT_WINDOW || '15m', 900000) // 15 minutes
    }
  },

  // Real-time / SSE Configuration
  realtime: {
    heartbeatIntervalMs: parseDuration(process.env.SSE_HEARTBEAT_INTERVAL || '30s', 30000)
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, true)
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 587),
      secure: parseBoolean(process.env.SMTP_SECURE, true),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.FROM_EMAIL || process.env.SMTP_USER
  },

  // Analytics Timeframes (configurable)
  analytics: {
    activeUserDays: parseInt(process.env.ANALYTICS_ACTIVE_USER_DAYS, 30),
    recentActivityDays: parseInt(process.env.ANALYTICS_RECENT_ACTIVITY_DAYS, 7)
  }
};
