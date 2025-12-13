const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf')
  .then(async () => {
    try {
      // Create a test user
      const testUser = new User({
        username: 'testlogin',
        email: 'testlogin@test.com',
        password: 'TestPassword123',
        role: 'user'
      });

      await testUser.save();
      console.log('Test user created');

      // Try to find and verify
      const found = await User.findOne({ email: 'testlogin@test.com' }).select('+password');
      console.log('Found:', found?.email);
      const isMatch = await found.matchPassword('TestPassword123');
      console.log('Password match:', isMatch);

      // Clean up
      await User.deleteOne({ email: 'testlogin@test.com' });
      console.log('Test user deleted');

    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
