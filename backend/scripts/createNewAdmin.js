const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Admin user details
const adminUser = {
  username: 'superadmin',
  email: 'superadmin@cyberctf.com',
  password: 'admin123',  // This will be hashed before saving
  role: 'admin'
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ 
        $or: [{ email: adminUser.email }, { username: adminUser.username }] 
      });
      
      if (existingAdmin) {
        console.log('This admin user already exists');
        process.exit(0);
      }
      
      // Create admin user manually without using the User.create method
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      const newAdmin = new User({
        username: adminUser.username,
        email: adminUser.email,
        password: hashedPassword,
        role: adminUser.role
      });
      
      await newAdmin.save();
      console.log('New admin user created successfully');
      console.log('Username:', adminUser.username);
      console.log('Email:', adminUser.email);
      console.log('Password:', adminUser.password, '(not hashed)');
      console.log('Role:', adminUser.role);
      
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
