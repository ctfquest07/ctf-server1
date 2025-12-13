const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Check if admin exists
      const admin = await User.findOne({ 
        $or: [{ email: 'admin@cyberctf.com' }, { username: 'admin' }] 
      });
      
      console.log('Admin user:', admin);
      
    } catch (error) {
      console.error('Error finding admin user:', error.message);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
