// This script will be run on server startup to ensure admin has the correct password
const User = require('../models/User');

const ensureAdminPassword = async () => {
  try {
    // Find admin user
    let admin = await User.findOne({ email: 'admin@ctfquest.com' });
    
    if (!admin) {
      // Create admin if doesn't exist
      admin = await User.create({
        username: 'admin',
        email: 'admin@ctfquest.com',
        password: 'Ctf#Quest@Admin$123',
        role: 'admin'
      });
      console.log('Admin user created with new password');
    } else {
      // Update existing admin password
      admin.password = 'Ctf#Quest@Admin$123';
      await admin.save();
      console.log('Admin password updated to new secure password');
    }
    
    console.log('Admin credentials:');
    console.log('Email: admin@ctfquest.com');
    console.log('Password: Ctf#Quest@Admin$123');
    
  } catch (error) {
    console.error('Error ensuring admin password:', error);
  }
};

module.exports = { ensureAdminPassword };