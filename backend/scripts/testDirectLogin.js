const mongoose = require('mongoose');
const User = require('../models/User');

const testDirectLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf');
    console.log('Connected to MongoDB');

    const email = 'admin@cyberctf.com';
    const password = 'admin123';

    console.log('Testing login process step by step...');

    // Step 1: Find user
    console.log('Step 1: Finding user...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    console.log('✅ User found:', user.username);

    // Step 2: Check if locked
    console.log('Step 2: Checking if account is locked...');
    const isLocked = user.isLocked();
    console.log('Account locked:', isLocked ? '❌ YES' : '✅ NO');

    if (isLocked) {
      console.log('Account is locked until:', user.lockUntil);
      process.exit(1);
    }

    // Step 3: Check password
    console.log('Step 3: Testing password...');
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('❌ Password does not match');
      process.exit(1);
    }

    console.log('🎉 All login checks passed! The issue might be in the API route.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testDirectLogin();
