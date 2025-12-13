const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Challenge = require('./models/Challenge');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function debugSubmit() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf');
    console.log('Connected to MongoDB');

    // Get an admin user
    const admin = await User.findOne({ role: 'admin' });
    console.log('Admin user:', admin?._id);

    if (!admin) {
      console.log('No admin user found');
      return;
    }

    // Login as admin
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@cyberctf.com',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.token;
    console.log('Admin token obtained');

    // Create a test challenge
    const challengeRes = await axios.post(`${API_URL}/challenges`, {
      title: `Debug Challenge ${Date.now()}`,
      description: 'Debug challenge',
      category: 'misc',
      difficulty: 'Easy',
      points: 10,
      flag: 'CTF{debug_flag}',
      isVisible: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const challengeId = challengeRes.data.data._id;
    console.log('Challenge created:', challengeId);

    // Create a test user
    const testUsername = `debuguser_${Date.now()}`;
    const userRes = await axios.post(`${API_URL}/auth/register`, {
      username: testUsername,
      email: `${testUsername}@test.com`,
      password: 'test123'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const userId = userRes.data.user.id;
    console.log('User created:', userId);

    // Login as the test user
    const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: `${testUsername}@test.com`,
      password: 'test123'
    });
    const userToken = userLoginRes.data.token;
    console.log('User token obtained');

    // Now test submitting
    console.log('\nAttempting to submit flag...');
    console.log('Challenge ID:', challengeId);
    console.log('User ID:', userId);

    try {
      const submitRes = await axios.post(
        `${API_URL}/challenges/${challengeId}/submit`,
        { flag: 'CTF{debug_flag}' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      console.log('✓ Submit successful:', submitRes.data);
    } catch (submitErr) {
      console.error('✗ Submit failed:');
      console.error('Status:', submitErr.response?.status);
      console.error('Data:', submitErr.response?.data);
      console.error('Full error:', submitErr.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugSubmit();
