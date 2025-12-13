const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/analytics/overview
// @desc    Get platform overview metrics
// @access  Private/Admin
router.get('/overview', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalChallenges = await Challenge.countDocuments();
    const visibleChallenges = await Challenge.countDocuments({ isVisible: true });

    const allUsers = await User.find().select('solvedChallenges points createdAt');
    const totalSubmissions = allUsers.reduce((sum, user) => sum + (user.solvedChallenges?.length || 0), 0);
    const totalPoints = allUsers.reduce((sum, user) => sum + (user.points || 0), 0);
    const avgPointsPerUser = totalUsers > 0 ? (totalPoints / totalUsers).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          blocked: blockedUsers
        },
        challenges: {
          total: totalChallenges,
          visible: visibleChallenges,
          hidden: totalChallenges - visibleChallenges
        },
        submissions: {
          total: totalSubmissions,
          avgPerUser: avgPointsPerUser,
          totalPoints: totalPoints
        }
      }
    });
  } catch (err) {
    console.error('Error fetching analytics overview:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/analytics/user-engagement
// @desc    Get user engagement metrics
// @access  Private/Admin
router.get('/user-engagement', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('username createdAt solvedChallenges points isBlocked')
      .sort({ createdAt: -1 });

    const engagementData = users.map(user => ({
      username: user.username,
      joinedDate: user.createdAt,
      challengesSolved: user.solvedChallenges?.length || 0,
      points: user.points || 0,
      isActive: !user.isBlocked,
      daysActive: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    const engagement = {
      highEngagement: engagementData.filter(u => u.challengesSolved >= 5 && u.isActive).length,
      mediumEngagement: engagementData.filter(u => u.challengesSolved >= 2 && u.challengesSolved < 5 && u.isActive).length,
      lowEngagement: engagementData.filter(u => u.challengesSolved < 2 && u.isActive).length,
      inactive: engagementData.filter(u => !u.isActive).length
    };

    res.json({
      success: true,
      data: {
        summary: engagement,
        users: engagementData
      }
    });
  } catch (err) {
    console.error('Error fetching user engagement:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/analytics/challenge-stats
// @desc    Get challenge statistics
// @access  Private/Admin
router.get('/challenge-stats', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .select('title category difficulty points solvedBy isVisible')
      .lean();

    const stats = {
      byCategory: {},
      byDifficulty: {},
      topChallenges: [],
      leastSolved: []
    };

    challenges.forEach(challenge => {
      if (!stats.byCategory[challenge.category]) {
        stats.byCategory[challenge.category] = { count: 0, solved: 0 };
      }
      stats.byCategory[challenge.category].count++;
      stats.byCategory[challenge.category].solved += challenge.solvedBy?.length || 0;

      if (!stats.byDifficulty[challenge.difficulty]) {
        stats.byDifficulty[challenge.difficulty] = { count: 0, avgPoints: 0 };
      }
      stats.byDifficulty[challenge.difficulty].count++;
      stats.byDifficulty[challenge.difficulty].avgPoints += challenge.points;
    });

    stats.topChallenges = challenges
      .sort((a, b) => (b.solvedBy?.length || 0) - (a.solvedBy?.length || 0))
      .slice(0, 5)
      .map(c => ({
        title: c.title,
        solves: c.solvedBy?.length || 0,
        points: c.points
      }));

    stats.leastSolved = challenges
      .sort((a, b) => (a.solvedBy?.length || 0) - (b.solvedBy?.length || 0))
      .slice(0, 5)
      .map(c => ({
        title: c.title,
        solves: c.solvedBy?.length || 0,
        points: c.points
      }));

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error fetching challenge stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/analytics/traffic
// @desc    Get traffic statistics
// @access  Private/Admin
router.get('/traffic', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsersLast30 = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const totalUsersLast7 = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const totalUsersToday = await User.countDocuments({ createdAt: { $gte: today } });

    const usersPerDay = {};
    const users = await User.find({ createdAt: { $gte: thirtyDaysAgo } }).select('createdAt').lean();
    
    users.forEach(user => {
      const day = new Date(user.createdAt).toISOString().split('T')[0];
      usersPerDay[day] = (usersPerDay[day] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        last30Days: totalUsersLast30,
        last7Days: totalUsersLast7,
        today: totalUsersToday,
        dailyBreakdown: usersPerDay
      }
    });
  } catch (err) {
    console.error('Error fetching traffic stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/analytics/leaderboard-stats
// @desc    Get leaderboard statistics
// @access  Private/Admin
router.get('/leaderboard-stats', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const topUsers = await User.find()
      .select('username points solvedChallenges')
      .sort({ points: -1 })
      .limit(10)
      .lean();

    const topUsersData = topUsers.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      points: user.points,
      challengesSolved: user.solvedChallenges?.length || 0
    }));

    res.json({
      success: true,
      data: topUsersData
    });
  } catch (err) {
    console.error('Error fetching leaderboard stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

module.exports = router;
