const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const debugUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf');
    console.log('Connected to MongoDB');

    // Find the admin user
    const user = await User.findOne({ email: 'admin@cyberctf.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('- ID:', user._id);
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Login Attempts:', user.loginAttempts || 0);
    console.log('- Lock Until:', user.lockUntil || 'Not locked');
    console.log('- Is Locked:', user.isLocked());
    console.log('- Password Hash:', user.password);

    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('- Password Test (admin123):', isMatch ? '✅ MATCH' : '❌ NO MATCH');

    // Test with the matchPassword method
    const isMatchMethod = await user.matchPassword(testPassword);
    console.log('- Password Method Test:', isMatchMethod ? '✅ MATCH' : '❌ NO MATCH');

    // Reset login attempts if locked
    if (user.isLocked()) {
      console.log('🔓 Resetting login attempts...');
      await user.resetLoginAttempts();
      console.log('✅ Login attempts reset');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugUser();
