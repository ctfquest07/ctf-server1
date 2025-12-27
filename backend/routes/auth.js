const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const { protect, authorize } = require('../middleware/auth');
const { enhancedValidation } = require('../middleware/advancedSecurity');
const { loginLimiter, generalLimiter, sanitizeInput, validateInput, securityHeaders } = require('../middleware/security');
const { sendOTPEmail } = require('../utils/email');
const requestIp = require('request-ip');
const UAParser = require('ua-parser-js');
const moment = require('moment-timezone');

// Real-time logging function
const logActivity = (action, details = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] AUTH: ${action}`, details);
};
const crypto = require('crypto');
const { getRedisClient } = require('../utils/redis');
// Use centralized Redis client for scoreboard caching
const redisClient = getRedisClient();

// Helper function to get real IP address using request-ip
const getRealIP = (req) => {
  const clientIp = requestIp.getClientIp(req);
  // Clean up IPv6 mapped IPv4 addresses
  if (clientIp && clientIp.startsWith('::ffff:')) {
    return clientIp.substring(7);
  }
  return clientIp || 'Unknown';
};

// Helper function to parse user agent
const parseUserAgent = (userAgentString) => {
  if (!userAgentString) return 'Unknown';

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const browser = result.browser.name ? `${result.browser.name} ${result.browser.version}` : 'Unknown Browser';
  const os = result.os.name ? `${result.os.name} ${result.os.version}` : 'Unknown OS';
  const device = result.device.type ? result.device.type : 'desktop';

  return `${browser} on ${os} (${device})`;
};

// Helper function to create login log
const createLoginLog = async (user, req, status, failureReason = null) => {
  try {
    // Only create log if user exists (has valid _id)
    if (user && user._id) {
      // Get real IP address using request-ip library
      const realIP = getRealIP(req);

      // Parse user agent for better readability
      const rawUserAgent = req.get('User-Agent') || 'Unknown';
      const parsedUserAgent = parseUserAgent(rawUserAgent);

      // Create timestamp in Indian Standard Time (IST)
      const istTime = moment().tz('Asia/Kolkata').toDate();

      const loginLog = await LoginLog.create({
        user: user._id,
        email: user.email,
        username: user.username,
        ipAddress: realIP,
        userAgent: parsedUserAgent,
        loginTime: istTime,
        status,
        failureReason
      });

      console.log(`Login log created: ${user.username} - ${status} - IP: ${realIP} - Agent: ${parsedUserAgent}`);
      return loginLog;
    }
  } catch (error) {
    console.error('Error creating login log:', error);
  }
};

// Generate JWT Token (fully env-driven)
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// @route   POST /api/auth/register
// @desc    Public registration disabled - Admin only
// @access  Public
router.post('/register', async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Public registration is currently disabled. Please contact the administrator for account creation.',
    adminContact: 'ctfquest@gmail.com',
    registrationDisabled: true
  });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate user account
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.clearOTP();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error verifying OTP: ${error.message}` :
        'Error verifying OTP. Please try again later.'
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to email
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error resending OTP: ${error.message}` :
        'Error resending OTP. Please try again later.'
    });
  }
});

// @route   POST /api/auth/register-admin
// @desc    Register a user (Admin only)
// @access  Private/Admin
router.post('/register-admin', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { username, email, password, teamId } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.email === email ?
          'Email already registered' :
          'Username already taken'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      team: teamId || undefined
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        team: user.team
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error creating user: ${error.message}` :
        'Error creating user. Please try again later.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', sanitizeInput, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Enhanced input validation
    let validatedEmail;
    try {
      validatedEmail = enhancedValidation.email(email);
      logActivity('LOGIN_ATTEMPT', { email: validatedEmail, ip: req.ip, userAgent: req.get('User-Agent') });
    } catch (validationError) {
      logActivity('LOGIN_VALIDATION_FAILED', { email, error: validationError.message, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Check for user
    const user = await User.findOne({ email: validatedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check for account locking (Relaxed: 20 attempts, 5 min lock)
    if (user.isLocked()) {
      await createLoginLog(user, req, 'failed', 'Account locked');

      return res.status(429).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.',
        retryAfter: Math.ceil((user.lockUntil - Date.now()) / 1000)
      });
    }

    // Check if user is blocked by admin
    if (user.isBlocked) {
      await createLoginLog(user, req, 'failed', 'Account blocked by admin');

      return res.status(403).json({
        success: false,
        message: 'You are blocked. Suspicious activity detected. Contact Admin for further information.',
        isBlocked: true,
        blockedReason: user.blockedReason
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Log failed login attempt and increment counter
      await user.incrementLoginAttempts();
      await createLoginLog(user, req, 'failed', 'Invalid password');

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    // Log successful login and reset attempts
    await user.resetLoginAttempts();
    await createLoginLog(user, req, 'success');

    // Populate team info
    await user.populate('team');

    // Generate token with shorter expiry for security
    const token = generateToken(user._id);
    logActivity('LOGIN_SUCCESS', { userId: user._id, username: user.username, ip: req.ip, userAgent: req.get('User-Agent') });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        team: user.team
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error logging in'
    });
  }
});

// @route   POST /api/auth/forgotpassword
// @desc    Forgot password
// @access  Public
router.post('/forgotpassword', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email'
      });
    }

    // Get reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // TODO: Send email with reset token
    // For now, just return the token in development
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        resetToken
      });
    }

    res.json({
      success: true,
      message: 'Email sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error processing request'
    });
  }
});

// @route   POST /api/auth/resetpassword/:resettoken
// @desc    Reset password
// @access  Public
router.post('/resetpassword/:resettoken', async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error resetting password'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  // Prevent HTTP caching to avoid 304 responses
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    // Use req.user._id directly (now always a string from middleware)
    const user = await User.findById(req.user._id).populate('team');

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        isBlocked: true,
        message: 'Your account has been blocked. Contact Admin for further information.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isBlocked: user.isBlocked,
          blockedReason: user.blockedReason,
          blockedAt: user.blockedAt
        }
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        team: user.team,
        solvedChallenges: user.solvedChallenges,
        createdAt: user.createdAt,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error fetching user data'
    });
  }
});

// @route   GET /api/auth/scoreboard
// @desc    Get scoreboard by teams or users
// @access  Private
router.get('/scoreboard', protect, async (req, res) => {
  try {
    // Check if scoreboard is enabled
    if (process.env.SCOREBOARD_ENABLED === 'false') {
      return res.status(403).json({
        success: false,
        message: 'This is currently disabled by Admin',
        scoreboardDisabled: true
      });
    }

    const { type = 'teams' } = req.query;
    console.log('Fetching scoreboard data...', { type });

    // Check Redis Cache
    const cacheKey = `scoreboard:${type}`;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json({
          success: true,
          type: type,
          data: JSON.parse(cachedData),
          cached: true
        });
      }
    } catch (e) {
      console.warn('Redis cache error:', e);
    }

    if (type === 'teams') {
      const Team = require('../models/Team');
      
      // Use MongoDB aggregation pipeline for performance (critical for 500+ users)
      const pipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'members',
            foreignField: '_id',
            as: 'memberDetails'
          }
        },
        {
          $addFields: {
            totalPoints: { $sum: '$memberDetails.points' },
            lastSolveTime: { $max: '$memberDetails.lastSolveTime' },
            visibleMembers: {
              $filter: {
                input: '$memberDetails',
                as: 'member',
                cond: { $ne: ['$$member.showInScoreboard', false] }
              }
            }
          }
        }
      ];

      // Filter by role - only show teams with visible members for non-admins
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        pipeline.push({
          $match: {
            $expr: { $gt: [{ $size: '$visibleMembers' }, 0] }
          }
        });
      }

      // Sort and limit
      pipeline.push(
        { $sort: { totalPoints: -1, lastSolveTime: 1, name: 1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            points: '$totalPoints',
            lastSolveTime: 1,
            members: '$memberDetails',
            solvedChallenges: 1,
            createdAt: 1,
            createdBy: 1
          }
        }
      );

      const teamsWithPoints = await Team.aggregate(pipeline);

      // Cache for 30 seconds
      await redisClient.setex(cacheKey, 30, JSON.stringify(teamsWithPoints));

      res.json({
        success: true,
        type: 'teams',
        data: teamsWithPoints
      });
    } else {
      // Build query based on user role
      let userQuery = { role: 'user' };

      // If not admin, only show users with showInScoreboard: true (default) or explicitly true
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        userQuery.showInScoreboard = { $ne: false }; // Show users where showInScoreboard is not false
      }

      const users = await User.find(userQuery)
        .select('username points solvedChallenges role team showInScoreboard lastSolveTime')
        .populate('team', 'name')
        .sort({ points: -1, lastSolveTime: 1, username: 1 })
        .limit(100); // Limit to top 100 for performance

      // Cache for 30 seconds
      await redisClient.setex(cacheKey, 30, JSON.stringify(users));

      res.json({
        success: true,
        type: 'users',
        data: users
      });
    }
    // redis.disconnect(); // Don't disconnect if reusing, but here we created a new instance which is inefficient.
    // Ideally use shared instance. For now, let GC handle or rely on ioredis management.
    // Better: use shared client from earlier refactor if globally available, but this file doesn't have it.
    // Creating one per request is bad practice.
    // FIX: Import the redis client properly or reuse connection. 
    // Since I can't easily change the whole file structure to export client right now without restart, 
    // I will use a local require inside the route but logic suggests it should be top level.
    // However, I will stick to this for "Stability over perfection" and minimal diff.
    // Actually, creating new connection per request IS a stability risk.
    // I will fix this by creating a singleton helper or assuming global context?
    // Let's just create it at top of file in next step if needed. 
    // For this specific 'replace', I will just instantiate it once outside the if/else if possible... 
    // Wait, I can't modify top of file easily with this chunk.
    // I will use existing `redisClient` if I added it? No I didn't add it to auth.js yet.
    // I added it to middleware/auth.js
    // I should add `const Redis = require('ioredis'); const redis = new Redis(...)` to top of auth.js first?
    // Or just do it here efficiently.
    // Actually, I'll use the one I added in `middleware/auth.js`? No that's not exported.
    // I will instantiate it here but inside the route is risky.
    // BETTER PLAN: Update top of file to import Redis, then update this chunk.
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error fetching scoreboard'
    });
  }
});

// @route   GET /api/auth/scoreboard/progression
// @desc    Get score progression over time for top teams/users
// @access  Private
router.get('/scoreboard/progression', protect, async (req, res) => {
  try {
    const { type = 'teams', limit = 10 } = req.query;
    const Submission = require('../models/Submission');
    const Team = require('../models/Team');

    // Check cache first
    const cacheKey = `scoreboard:progression:${type}:${limit}`;
    const CACHE_TTL = 60; // 60 seconds cache

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        });
      }
    } catch (cacheErr) {
      console.warn('Redis cache read error:', cacheErr);
    }

    if (type === 'teams') {
      // Get all correct submissions sorted by time
      const submissions = await Submission.find({ isCorrect: true })
        .populate('user', 'team username')
        .populate('challenge', 'points')
        .sort({ submittedAt: 1 })
        .lean();

      // Build score progression for each team
      const teamScores = {};
      const teamNames = {};
      const timePoints = new Set();

      for (const sub of submissions) {
        if (!sub.user?.team) continue;

        const teamId = sub.user.team.toString();
        const timestamp = new Date(sub.submittedAt).getTime();
        
        timePoints.add(timestamp);

        if (!teamScores[teamId]) {
          teamScores[teamId] = [];
        }

        const currentScore = teamScores[teamId].length > 0 
          ? teamScores[teamId][teamScores[teamId].length - 1].score 
          : 0;

        teamScores[teamId].push({
          time: timestamp,
          score: currentScore + (sub.points || 0)
        });

        // Cache team name
        if (!teamNames[teamId]) {
          const team = await Team.findById(teamId).select('name').lean();
          teamNames[teamId] = team?.name || 'Unknown Team';
        }
      }

      // Get top N teams by final score
      const teamFinalScores = Object.entries(teamScores).map(([teamId, scores]) => ({
        teamId,
        finalScore: scores[scores.length - 1]?.score || 0,
        name: teamNames[teamId]
      })).sort((a, b) => b.finalScore - a.finalScore).slice(0, parseInt(limit));

      // Format data for frontend
      const progressionData = teamFinalScores.map(team => ({
        id: team.teamId,
        name: team.name,
        data: teamScores[team.teamId] || []
      }));

      const result = {
        type: 'teams',
        teams: progressionData,
        startTime: Math.min(...timePoints),
        endTime: Math.max(...timePoints)
      };

      // Cache result
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      } catch (cacheErr) {
        console.warn('Redis cache write error:', cacheErr);
      }

      res.json({
        success: true,
        data: result
      });

    } else {
      // Users progression
      const submissions = await Submission.find({ isCorrect: true })
        .populate('user', 'username role showInScoreboard')
        .populate('challenge', 'points')
        .sort({ submittedAt: 1 })
        .lean();

      const userScores = {};
      const timePoints = new Set();

      for (const sub of submissions) {
        if (!sub.user || sub.user.role === 'admin' || sub.user.showInScoreboard === false) continue;

        const userId = sub.user._id.toString();
        const timestamp = new Date(sub.submittedAt).getTime();
        
        timePoints.add(timestamp);

        if (!userScores[userId]) {
          userScores[userId] = {
            username: sub.user.username,
            scores: []
          };
        }

        const currentScore = userScores[userId].scores.length > 0 
          ? userScores[userId].scores[userScores[userId].scores.length - 1].score 
          : 0;

        userScores[userId].scores.push({
          time: timestamp,
          score: currentScore + (sub.points || 0)
        });
      }

      // Get top N users by final score
      const userFinalScores = Object.entries(userScores).map(([userId, data]) => ({
        userId,
        username: data.username,
        finalScore: data.scores[data.scores.length - 1]?.score || 0,
        scores: data.scores
      })).sort((a, b) => b.finalScore - a.finalScore).slice(0, parseInt(limit));

      const progressionData = userFinalScores.map(user => ({
        id: user.userId,
        name: user.username,
        data: user.scores
      }));

      const result = {
        type: 'users',
        users: progressionData,
        startTime: timePoints.size > 0 ? Math.min(...timePoints) : Date.now(),
        endTime: timePoints.size > 0 ? Math.max(...timePoints) : Date.now()
      };

      // Cache result
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      } catch (cacheErr) {
        console.warn('Redis cache write error:', cacheErr);
      }

      res.json({
        success: true,
        data: result
      });
    }

  } catch (error) {
    console.error('Error fetching score progression:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching score progression',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users with pagination (admin only)
// @access  Private/Admin
router.get('/users', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { all, search } = req.query;

    // Build search query
    let query = {};
    if (search) {
      // Sanitize regex input to prevent ReDoS attacks
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 50);
      query.$or = [
        { username: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } }
      ];
    }

    if (all === 'true') {
      // Return all users without pagination for team creation
      const users = await User.find(query)
        .select('-password')
        .populate('team', 'name')
        .sort({ username: 1 });

      return res.json({
        success: true,
        count: users.length,
        total: users.length,
        users
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .populate('team', 'name')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      total: totalUsers,
      page,
      pages: Math.ceil(totalUsers / limit),
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error fetching users'
    });
  }
});

// @route   GET /api/auth/users/:id
// @desc    Get single user by ID (admin only or own profile)
// @access  Private/Admin
router.get('/users/:id', protect, async (req, res) => {
  try {
    // Allow users to view their own profile or admins to view any profile
    const isOwnProfile = req.user._id.toString() === req.params.id; // Fixed: added .toString()
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @route   GET /api/auth/user/:id
// @desc    Get public user profile by ID
// @access  Private
router.get('/user/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username points solvedChallenges team createdAt')
      .populate('team', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error fetching user'
    });
  }
});

// @route   POST /api/auth/reset-platform
// @desc    Reset all user points, solved challenges, and challenge solves (admin only)
// @access  Private/Admin
router.post('/reset-platform', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    console.log('Resetting platform data...');

    // Import Challenge model
    const Challenge = require('../models/Challenge');

    // Reset all users' points and solved challenges
    const userUpdateResult = await User.updateMany(
      {}, // Match all users
      {
        $set: {
          points: 0,
          solvedChallenges: []
        }
      }
    );

    // Reset all challenges' solvedBy arrays
    const challengeUpdateResult = await Challenge.updateMany(
      {}, // Match all challenges
      { $set: { solvedBy: [] } }
    );

    console.log('Reset complete. Users updated:', userUpdateResult.modifiedCount);
    console.log('Reset complete. Challenges updated:', challengeUpdateResult.modifiedCount);

    res.json({
      success: true,
      message: 'Platform reset successful',
      stats: {
        usersReset: userUpdateResult.modifiedCount,
        challengesReset: challengeUpdateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error resetting platform:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error resetting platform: ${error.message}` :
        'Error resetting platform. Please try again.'
    });
  }
});

// @route   PUT /api/auth/users/:id/role
// @desc    Change user role (Admin/Superadmin)
// @access  Private/Admin
router.put('/users/:id/role', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change user roles'
      });
    }

    const { newRole } = req.body;

    if (!newRole || !['admin', 'user'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "admin" or "user"'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change superadmin role'
      });
    }

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    res.json({
      success: true,
      message: `User role changed from ${oldRole} to ${newRole}`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error changing role: ${error.message}` :
        'Error changing user role. Please try again.'
    });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete a user (Admin only)
// @access  Private/Admin
router.delete('/users/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete superadmin user'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error deleting user: ${error.message}` :
        'Error deleting user. Please try again.'
    });
  }
});

// @route   PUT /api/auth/users/:id/block
// @desc    Block or unblock a user (Admin only)
// @access  Private/Admin
router.put('/users/:id/block', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { isBlocked, reason } = req.body;

    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isBlocked must be a boolean'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block superadmin user'
      });
    }

    user.isBlocked = isBlocked;
    user.blockedReason = isBlocked ? reason || 'No reason provided' : null;
    user.blockedAt = isBlocked ? new Date() : null;
    await user.save();

    res.json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason
      }
    });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error updating user block status: ${error.message}` :
        'Error updating user block status. Please try again.'
    });
  }
});

// @route   PUT /api/auth/users/:id/submission-permission
// @desc    Update user submission permission (Admin only)
// @access  Private/Admin
router.put('/users/:id/submission-permission', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { canSubmitFlags } = req.body;

    if (typeof canSubmitFlags !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'canSubmitFlags must be a boolean'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.canSubmitFlags = canSubmitFlags;
    await user.save();

    res.json({
      success: true,
      message: `User submission permission ${canSubmitFlags ? 'allowed' : 'blocked'}`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        canSubmitFlags: user.canSubmitFlags
      }
    });
  } catch (error) {
    console.error('Error updating submission permission:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error updating submission permission: ${error.message}` :
        'Error updating submission permission. Please try again.'
    });
  }
});

// @route   PUT /api/auth/users/:id/scoreboard-visibility
// @desc    Update user scoreboard visibility (Admin only)
// @access  Private/Admin
router.put('/users/:id/scoreboard-visibility', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { showInScoreboard } = req.body;

    if (typeof showInScoreboard !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'showInScoreboard must be a boolean'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.showInScoreboard = showInScoreboard;
    await user.save();

    res.json({
      success: true,
      message: `User ${showInScoreboard ? 'shown on' : 'hidden from'} scoreboard`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        showInScoreboard: user.showInScoreboard
      }
    });
  } catch (error) {
    console.error('Error updating scoreboard visibility:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error updating scoreboard visibility: ${error.message}` :
        'Error updating scoreboard visibility. Please try again.'
    });
  }
});

// @route   PUT /api/platform-control/block-submissions
// @desc    Block or allow all submissions globally (Admin only)
// @access  Private/Admin
router.put('/platform-control/block-submissions', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { submissionsAllowed } = req.body;

    if (typeof submissionsAllowed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'submissionsAllowed must be a boolean'
      });
    }

    const Challenge = require('../models/Challenge');

    await Challenge.updateMany(
      {},
      { submissionsAllowed }
    );

    res.json({
      success: true,
      message: `All submissions ${submissionsAllowed ? 'allowed' : 'blocked'}`,
      data: {
        submissionsAllowed
      }
    });
  } catch (error) {
    console.error('Error updating global submission status:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error updating submission status: ${error.message}` :
        'Error updating submission status. Please try again.'
    });
  }
});

// @route   PUT /api/platform-control/scoreboard-toggle
// @desc    Enable or disable scoreboard globally (Admin only)
// @access  Private/Admin
router.put('/platform-control/scoreboard-toggle', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { scoreboardEnabled } = req.body;

    if (typeof scoreboardEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'scoreboardEnabled must be a boolean'
      });
    }

    // Store in environment or database - for now using a simple approach
    process.env.SCOREBOARD_ENABLED = scoreboardEnabled.toString();

    res.json({
      success: true,
      message: `Scoreboard ${scoreboardEnabled ? 'enabled' : 'disabled'}`,
      data: {
        scoreboardEnabled
      }
    });
  } catch (error) {
    console.error('Error updating scoreboard status:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error updating scoreboard status: ${error.message}` :
        'Error updating scoreboard status. Please try again.'
    });
  }
});

// @route   PUT /api/platform-control/connection-limit
// @desc    Set maximum concurrent connections (Admin only)
// @access  Private/Admin
router.put('/platform-control/connection-limit', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { maxConnections } = req.body;

    if (typeof maxConnections !== 'number' || maxConnections < 1) {
      return res.status(400).json({
        success: false,
        message: 'maxConnections must be a positive number'
      });
    }

    // Store in environment variable for simplicity
    process.env.MAX_CONNECTIONS = maxConnections.toString();

    res.json({
      success: true,
      message: `Connection limit set to ${maxConnections}`,
      data: {
        maxConnections
      }
    });
  } catch (error) {
    console.error('Error updating connection limit:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error updating connection limit: ${error.message}` :
        'Error updating connection limit. Please try again.'
    });
  }
});

// @route   PUT /api/platform-control/unblock-all-users
// @desc    Unblock all blocked users (Admin only)
// @access  Private/Admin
router.put('/platform-control/unblock-all-users', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const result = await User.updateMany(
      { isBlocked: true },
      {
        $set: {
          isBlocked: false,
          blockedReason: null,
          blockedAt: null
        }
      }
    );

    res.json({
      success: true,
      message: 'All users unblocked successfully',
      data: {
        unblockedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error unblocking all users:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error unblocking users: ${error.message}` :
        'Error unblocking users. Please try again.'
    });
  }
});

// @route   PUT /api/platform-control/unblock-by-email/:email
// @desc    Unblock a user by email (Admin only)
// @access  Private/Admin
router.put('/platform-control/unblock-by-email/:email', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBlocked = false;
    user.blockedReason = null;
    user.blockedAt = null;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.username} unblocked successfully`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Error unblocking user by email:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error unblocking user: ${error.message}` :
        'Error unblocking user. Please try again.'
    });
  }
});

// @route   GET /api/auth/admin/login-logs
// @desc    Get login logs (Admin only)
// @access  Private/Admin
router.get('/admin/login-logs', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { userId, status, search } = req.query;

    // Build query
    let query = {};
    if (userId) query.user = userId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const totalLogs = await LoginLog.countDocuments(query);
    const logs = await LoginLog.find(query)
      .populate('user', 'username email role')
      .sort({ loginTime: -1, createdAt: -1, _id: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      count: logs.length,
      total: totalLogs,
      page,
      pages: Math.ceil(totalLogs / limit),
      logs
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error fetching login logs'
    });
  }
});

// @route   GET /api/auth/admin/login-logs/:userId
// @desc    Get login logs for specific user (Admin only)
// @access  Private/Admin
router.get('/admin/login-logs/:userId', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalLogs = await LoginLog.countDocuments({ user: userId });
    const logs = await LoginLog.find({ user: userId })
      .populate('user', 'username email role')
      .sort({ loginTime: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      count: logs.length,
      total: totalLogs,
      page,
      pages: Math.ceil(totalLogs / limit),
      logs
    });
  } catch (error) {
    console.error('Error fetching user login logs:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error fetching user login logs'
    });
  }
});

// @route   DELETE /api/auth/admin/login-logs
// @desc    Clear all login logs (Admin only)
// @access  Private/Admin
router.delete('/admin/login-logs', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    // Delete all login logs
    const result = await LoginLog.deleteMany({});

    res.json({
      success: true,
      message: `Deleted all ${result.deletedCount} login logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing login logs:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error clearing login logs'
    });
  }
});

// @route   PUT /api/auth/admin/change-password
// @desc    Change admin password (Admin only - can only change own password)
// @access  Private/Admin
router.put('/admin/change-password', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logActivity('ADMIN_PASSWORD_CHANGED', { userId: user._id, username: user.username });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ?
        `Error changing password: ${error.message}` :
        'Error changing password. Please try again.'
    });
  }
});

module.exports = router;
