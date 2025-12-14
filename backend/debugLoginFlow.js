require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);

    const email = 'admin@ctfquest.com';
    const password = 'admin123';

    console.log('\n=== DEBUG LOGIN FLOW ===');
    console.log('Email:', email);
    console.log('Password:', password);

    // Step 1: Find user
    console.log('\n1. Finding user...');
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password
    });

    // Step 2: Check if locked
    console.log('\n2. Checking if account is locked...');
    const isLocked = user.isLocked();
    console.log('Is locked:', isLocked);

    // Step 3: Check if blocked
    console.log('\n3. Checking if account is blocked...');
    console.log('Is blocked:', user.isBlocked);

    // Step 4: Test password
    console.log('\n4. Testing password...');
    const isMatch = await user.matchPassword(password);
    console.log('Password matches:', isMatch);

    if (isMatch) {
      console.log('\n✅ LOGIN SHOULD SUCCEED');
    } else {
      console.log('\n❌ LOGIN SHOULD FAIL - Password mismatch');
      
      // Let's test with different passwords
      console.log('\n--- Testing different passwords ---');
      const testPasswords = ['admin123', 'Admin123', 'ADMIN123', '123456'];
      
      for (const testPass of testPasswords) {
        const testMatch = await user.matchPassword(testPass);
        console.log(`Password "${testPass}":`, testMatch);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugLogin();