const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Attempting login...');
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin2@cyberctf.com',
      password: 'admin123'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error Details:');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
    console.error('Message:', err.message);
    console.error('Full error:', err);
  }
};

testLogin();
