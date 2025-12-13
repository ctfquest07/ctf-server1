require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createTestAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing test admin
    await User.deleteOne({ email: 'test@admin.com' });
    
    // Create simple test admin
    const admin = new User({
      username: 'testadmin',
      email: 'test@admin.com',
      password: '123456',
      role: 'admin',
      points: 0,
      isEmailVerified: true
    });

    await admin.save();
    console.log('✅ Test admin created successfully!');
    console.log('Email: test@admin.com');
    console.log('Password: 123456');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestAdmin();