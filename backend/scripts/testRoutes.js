const axios = require('axios');

const testRoutes = async () => {
  try {
    // Get a token first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@cyberctf.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    // Test different routes
    const routes = [
      '/api/health',
      '/api/auth/me',
      '/api/challenges',
      '/api/events',
      '/api/notifications'
    ];

    for (const route of routes) {
      try {
        const response = await axios.get(`http://localhost:5000${route}`, config);
        console.log(`✅ ${route}: ${response.status} - ${response.data.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.log(`❌ ${route}: ${error.response?.status || 'No response'} - ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
};

testRoutes();
