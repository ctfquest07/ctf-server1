const mongoose = require('mongoose');
const User = require('../models/User');

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf');
    console.log('Connected to MongoDB');

    // Find the admin user with password field
    const user = await User.findOne({ email: 'admin@cyberctf.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('User found:', {
      username: user.username,
      email: user.email,
      role: user.role,
      loginAttempts: user.loginAttempts,
      lockUntil: user.lockUntil,
      isLocked: user.isLocked(),
      hasPassword: !!user.password
    });

    // Reset login attempts and unlock account
    await user.resetLoginAttempts();
    console.log('✅ Login attempts reset and account unlocked');

    // Test password matching
    if (user.password) {
      const isMatch = await user.matchPassword('admin123');
      console.log('Password test result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');
    } else {
      console.log('❌ No password set for user');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugLogin();
