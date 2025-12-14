const { SECURITY_CONFIG, logSecurityEvent, detectSuspiciousInput } = require('../config/security');

// Enhanced security audit middleware
const securityAuditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Log all requests to sensitive endpoints
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/admin/',
    '/api/challenges/submit',
    '/upload'
  ];
  
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isSensitive) {
    logSecurityEvent('SENSITIVE_ENDPOINT_ACCESS', {
      method: req.method,
      path: req.path,
      ip: clientIP,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for suspicious input patterns
  const checkInput = (obj, path = '') => {
    if (typeof obj === 'string') {
      if (detectSuspiciousInput(obj)) {
        logSecurityEvent('SUSPICIOUS_INPUT_DETECTED', {
          path: req.path,
          field: path,
          value: obj.substring(0, 100), // Log first 100 chars only
          ip: clientIP,
          userAgent,
          severity: 'high'
        });
        
        throw new Error('Suspicious input detected');
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        checkInput(value, path ? `${path}.${key}` : key);
      }
    }
  };
  
  try {
    // Check request body, query, and params for suspicious content
    if (req.body) checkInput(req.body, 'body');
    if (req.query) checkInput(req.query, 'query');
    if (req.params) checkInput(req.params, 'params');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Request blocked due to security policy',
      blocked: true
    });
  }
  
  // Monitor response time for potential DoS attacks
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (duration > 5000) { // Requests taking more than 5 seconds
      logSecurityEvent('SLOW_REQUEST_DETECTED', {
        method: req.method,
        path: req.path,
        duration,
        ip: clientIP,
        userAgent,
        severity: 'medium'
      });
    }
  });
  
  next();
};

// Brute force protection
const bruteForceProtection = () => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = `${req.ip}_${req.path}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    const record = attempts.get(key);
    
    // Reset if window has passed
    if (now - record.firstAttempt > windowMs) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    record.count++;
    
    // Block if too many attempts
    if (record.count > 10) {
      logSecurityEvent('BRUTE_FORCE_DETECTED', {
        ip: req.ip,
        path: req.path,
        attempts: record.count,
        severity: 'high'
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        blocked: true
      });
    }
    
    next();
  };
};

// SQL injection detection
const sqlInjectionDetection = (req, res, next) => {
  const sqlPatterns = SECURITY_CONFIG.VALIDATION.SQL_INJECTION_PATTERNS;
  
  const checkForSQLi = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(obj)) {
          logSecurityEvent('SQL_INJECTION_ATTEMPT', {
            path: req.path,
            field: path,
            pattern: pattern.source,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'critical'
          });
          
          throw new Error('SQL injection attempt detected');
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        checkForSQLi(value, path ? `${path}.${key}` : key);
      }
    }
  };
  
  try {
    if (req.body) checkForSQLi(req.body, 'body');
    if (req.query) checkForSQLi(req.query, 'query');
    if (req.params) checkForSQLi(req.params, 'params');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Request blocked by security filter',
      blocked: true
    });
  }
  
  next();
};

// XSS protection
const xssProtection = (req, res, next) => {
  const xssPatterns = SECURITY_CONFIG.VALIDATION.XSS_PATTERNS;
  
  const checkForXSS = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of xssPatterns) {
        if (pattern.test(obj)) {
          logSecurityEvent('XSS_ATTEMPT', {
            path: req.path,
            field: path,
            pattern: pattern.source,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'high'
          });
          
          throw new Error('XSS attempt detected');
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        checkForXSS(value, path ? `${path}.${key}` : key);
      }
    }
  };
  
  try {
    if (req.body) checkForXSS(req.body, 'body');
    if (req.query) checkForXSS(req.query, 'query');
    if (req.params) checkForXSS(req.params, 'params');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Request blocked by XSS filter',
      blocked: true
    });
  }
  
  next();
};

// NoSQL injection protection
const noSQLInjectionProtection = (req, res, next) => {
  const checkForNoSQLi = (obj, path = '') => {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        // Check for MongoDB operators
        if (key.startsWith('$') || key.includes('.')) {
          logSecurityEvent('NOSQL_INJECTION_ATTEMPT', {
            path: req.path,
            field: path ? `${path}.${key}` : key,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'high'
          });
          
          throw new Error('NoSQL injection attempt detected');
        }
        
        checkForNoSQLi(value, path ? `${path}.${key}` : key);
      }
    }
  };
  
  try {
    if (req.body) checkForNoSQLi(req.body, 'body');
    if (req.query) checkForNoSQLi(req.query, 'query');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Request blocked by NoSQL injection filter',
      blocked: true
    });
  }
  
  next();
};

// File upload security scanner
const fileUploadSecurity = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }
  
  const files = req.files || [req.file];
  
  for (const file of files) {
    if (!file) continue;
    
    // Check file size
    if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE) {
      logSecurityEvent('FILE_SIZE_VIOLATION', {
        filename: file.originalname,
        size: file.size,
        maxSize: SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE,
        ip: req.ip,
        severity: 'medium'
      });
      
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed size',
        blocked: true
      });
    }
    
    // Check file type
    if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      logSecurityEvent('FILE_TYPE_VIOLATION', {
        filename: file.originalname,
        mimetype: file.mimetype,
        ip: req.ip,
        severity: 'medium'
      });
      
      return res.status(400).json({
        success: false,
        message: 'File type not allowed',
        blocked: true
      });
    }
    
    // Check for malicious file names
    if (/[<>:"/\\|?*\x00-\x1f]/.test(file.originalname)) {
      logSecurityEvent('MALICIOUS_FILENAME', {
        filename: file.originalname,
        ip: req.ip,
        severity: 'high'
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid filename detected',
        blocked: true
      });
    }
  }
  
  next();
};

module.exports = {
  securityAuditMiddleware,
  bruteForceProtection,
  sqlInjectionDetection,
  xssProtection,
  noSQLInjectionProtection,
  fileUploadSecurity
};