require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin if exists
    await User.deleteMany({ $or: [{ email: 'admin@ctfquest.com' }, { username: 'admin' }] });
    console.log('Deleted existing admin (if any)');

    // Create new admin
    const admin = new User({
      username: 'admin',
      email: 'admin@ctfquest.com',
      password: 'admin123',
      role: 'admin',
      points: 0,
      isEmailVerified: true
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('Email: admin@ctfquest.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();