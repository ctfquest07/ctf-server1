const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

async function debugLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ctf-platform');
    console.log('Connected to MongoDB');

    // Check admin user
    const admin = await User.findOne({ email: 'admin@cyberctf.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('- ID:', admin._id);
    console.log('- Username:', admin.username);
    console.log('- Email:', admin.email);
    console.log('- Role:', admin.role);
    console.log('- Password hash:', admin.password);
    console.log('- Is blocked:', admin.isBlocked);
    console.log('- Login attempts:', admin.loginAttempts);

    // Test password matching
    const testPassword = 'admin123';
    console.log('\n🔍 Testing password:', testPassword);
    
    const isMatch = await admin.matchPassword(testPassword);
    console.log('Password match result:', isMatch);

    // Test bcrypt directly
    const directMatch = await bcrypt.compare(testPassword, admin.password);
    console.log('Direct bcrypt compare:', directMatch);

    // Check if account is locked
    console.log('Is account locked:', admin.isLocked ? admin.isLocked() : 'No isLocked method');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugLogin();