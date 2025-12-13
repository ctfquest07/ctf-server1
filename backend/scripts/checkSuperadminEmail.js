const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf')
  .then(async () => {
    const users = await User.find({ role: 'superadmin' }).select('email');
    console.log('Superadmin users:');
    users.forEach(u => console.log(' Email:', u.email, '| Length:', u.email.length));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
