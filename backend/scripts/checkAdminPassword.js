const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Admin credentials to check
const adminCredentials = {
  email: 'admin@cyberctf.com',
  password: 'admin123'
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Find admin user with password
      const admin = await User.findOne({ email: adminCredentials.email }).select('+password');
      
      if (!admin) {
        console.log('Admin user not found');
        return;
      }
      
      // Check password
      const isMatch = await bcrypt.compare(adminCredentials.password, admin.password);
      
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        // Update password if it doesn't match
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminCredentials.password, salt);
        
        admin.password = hashedPassword;
        await admin.save();
        
        console.log('Admin password updated successfully');
      }
      
    } catch (error) {
      console.error('Error checking admin password:', error.message);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
