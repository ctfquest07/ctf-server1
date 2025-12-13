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
      const existingUser = await User.findOne({ 
        $or: [{ email: superadminUser.email }, { username: superadminUser.username }] 
      });
      
      if (existingUser) {
        console.log('User already exists. Updating to superadmin...');
        existingUser.role = 'superadmin';
        existingUser.password = superadminUser.password;
        await existingUser.save();
        console.log('Superadmin updated successfully');
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(superadminUser.password, salt);
        
        const newSuperadmin = new User({
          username: superadminUser.username,
          email: superadminUser.email,
          password: hashedPassword,
          role: superadminUser.role
        });
        
        await newSuperadmin.save();
        console.log('Superadmin created successfully');
      }
      
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
