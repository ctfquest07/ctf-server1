const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf');
    console.log('Connected to MongoDB');

    // Delete existing admin
    await User.deleteOne({ email: 'admin@cyberctf.com' });
    console.log('Deleted existing admin');

    // Create new admin - let the pre-save hook handle password hashing
    const admin = new User({
      username: 'admin',
      email: 'admin@cyberctf.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      role: 'admin',
      points: 0,
      solvedChallenges: [],
      loginAttempts: 0
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('Email: admin@cyberctf.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
