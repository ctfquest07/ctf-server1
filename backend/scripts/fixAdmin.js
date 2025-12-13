const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf');
    console.log('Connected to MongoDB');

    // Delete existing admin
    await User.deleteOne({ email: 'admin@cyberctf.com' });
    console.log('Deleted existing admin');

    // Hash password properly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    console.log('Password hashed successfully');

    // Create new admin with proper password
    const admin = new User({
      username: 'admin',
      email: 'admin@cyberctf.com',
      password: hashedPassword,
      role: 'admin',
      points: 0,
      challengesSolved: [],
      rank: 1
    });

    await admin.save();
    console.log('✅ Admin created successfully!');

    // Test the password
    const testUser = await User.findOne({ email: 'admin@cyberctf.com' });
    const isMatch = await bcrypt.compare('admin123', testUser.password);
    console.log('Password verification test:', isMatch ? '✅ PASS' : '❌ FAIL');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixAdmin();
