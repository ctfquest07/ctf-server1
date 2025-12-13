const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const customAdmin = {
  username: 'pwngrid-admin',
  email: 'admin@pwngrid.com',
  password: 'PwNgrid@879#',
  role: 'admin'
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ctf-platform')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Remove existing admin with this email if exists
      await User.deleteOne({ email: customAdmin.email });
      
      // Create new admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(customAdmin.password, salt);
      
      const newAdmin = new User({
        username: customAdmin.username,
        email: customAdmin.email,
        password: hashedPassword,
        role: customAdmin.role
      });
      
      await newAdmin.save();
      console.log('Custom admin user created successfully');
      console.log('Email:', customAdmin.email);
      console.log('Password:', customAdmin.password);
      
    } catch (error) {
      console.error('Error creating custom admin:', error.message);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });