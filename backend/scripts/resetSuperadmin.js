const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const superadminUser = {
  username: 'superadmin',
  email: 'superadmin@pwngrid.com',
  password: 'SuperAdmin',
  role: 'superadmin'
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      await User.deleteMany({ role: 'superadmin' });
      console.log('Deleted existing superadmins');
      
      const newSuperadmin = new User({
        username: superadminUser.username,
        email: superadminUser.email,
        password: superadminUser.password,
        role: superadminUser.role
      });
      
      await newSuperadmin.save();
      console.log('Superadmin created successfully');
      console.log('Email:', superadminUser.email);
      console.log('Password:', superadminUser.password);
      console.log('Role:', superadminUser.role);
      
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
