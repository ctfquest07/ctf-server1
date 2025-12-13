const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function fixAdminLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ctf-platform');
    console.log('Connected to MongoDB');

    // Delete existing admin user
    await User.deleteOne({ email: 'admin@cyberctf.com' });
    console.log('Deleted existing admin user');

    // Create fresh admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@cyberctf.com',
      password: 'admin123',
      role: 'admin',
      isEmailVerified: true,
      isBlocked: false,
      loginAttempts: 0
    });

    await adminUser.save();
    console.log('✅ New admin user created successfully');
    console.log('Email: admin@cyberctf.com');
    console.log('Password: admin123');

    // Test the password
    const testUser = await User.findOne({ email: 'admin@cyberctf.com' }).select('+password');
    const isMatch = await testUser.matchPassword('admin123');
    console.log('Password test result:', isMatch ? '✅ PASS' : '❌ FAIL');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixAdminLogin();