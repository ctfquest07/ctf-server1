require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@ctfquest.com';
    const password = 'admin123';

    // Simulate login process
    console.log('Testing login for:', email);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found');
    console.log('User details:');
    console.log('- ID:', user._id);
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Is Blocked:', user.isBlocked);
    console.log('- Is Locked:', user.isLocked());
    console.log('- Login Attempts:', user.loginAttempts);
    console.log('- Email Verified:', user.isEmailVerified);

    // Test password
    const isMatch = await user.matchPassword(password);
    console.log('- Password Match:', isMatch);

    if (isMatch) {
      console.log('✅ Login should succeed');
    } else {
      console.log('❌ Login should fail - password mismatch');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLogin();