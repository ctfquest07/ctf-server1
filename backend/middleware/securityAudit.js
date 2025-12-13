const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

class SecurityAudit {
  static log(action, details, severity = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      severity,
      action,
      details
    };
    console.log(`[${timestamp}] [${severity}] SECURITY: ${action}`, details);
  }

  static getEnhancedSecurityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      frameguard: {
        action: 'deny'
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },
      permittedCrossDomainPolicies: false,
      hidePoweredBy: true
    });
  }

  static getInputSanitizers() {
    return [
      mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
          SecurityAudit.log('SANITIZATION', { 
            key, 
            path: req.path,
            ip: req.ip 
          }, 'WARN');
        }
      }),
      xss(),
      hpp({
        whitelist: ['page', 'limit', 'sort', 'search', 'category', 'difficulty']
      })
    ];
  }

  static validateRequest(req, res, next) {
    const suspiciousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT)\b)/i,
      /(<script|javascript:|onerror|onload)/i,
      /(\/\.\.|\.\.\/)/
    ];

    const checkValue = (value) => {
      if (typeof value !== 'string') return false;
      return suspiciousPatterns.some(pattern => pattern.test(value));
    };

    for (const key in req.body) {
      if (checkValue(req.body[key])) {
        SecurityAudit.log('SUSPICIOUS_INPUT_DETECTED', {
          key,
          path: req.path,
          ip: req.ip,
          method: req.method
        }, 'CRITICAL');
        
        return res.status(400).json({
          success: false,
          message: 'Invalid input detected'
        });
      }
    }

    next();
  }

  static verifyIDOR(userId, resourceOwnerId, req, res, next) {
    if (userId !== resourceOwnerId && req.user?.role !== 'admin') {
      SecurityAudit.log('IDOR_ATTEMPT', {
        userId,
        resourceOwnerId,
        path: req.path,
        ip: req.ip
      }, 'CRITICAL');

      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  }

  static auditLog(action, userId, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      userId,
      details
    };
    SecurityAudit.log('AUDIT', logEntry, 'INFO');
  }
}

const secureHeaders = SecurityAudit.getEnhancedSecurityHeaders();
const sanitizers = SecurityAudit.getInputSanitizers();

module.exports = {
  SecurityAudit,
  secureHeaders,
  sanitizers,
  validateRequest: SecurityAudit.validateRequest.bind(SecurityAudit),
  verifyIDOR: SecurityAudit.verifyIDOR.bind(SecurityAudit),
  auditLog: SecurityAudit.auditLog.bind(SecurityAudit)
};
