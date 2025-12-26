const axios = require('axios');

const quickTest = async () => {
  try {
    console.log('🚀 Quick Event System Test');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@cyberctf.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    // Test events endpoint
    try {
      const eventsResponse = await axios.get('http://localhost:5000/api/events', config);
      console.log('✅ Events endpoint working');
      console.log(`   Found ${eventsResponse.data.count} events`);
      
      if (eventsResponse.data.data && eventsResponse.data.data.length > 0) {
        console.log('   Sample event:', eventsResponse.data.data[0].name);
      }
    } catch (error) {
      console.log('❌ Events endpoint error:', error.response?.data?.message || error.message);
    }
    
    // Test notifications endpoint
    try {
      const notificationsResponse = await axios.get('http://localhost:5000/api/notifications', config);
      console.log('✅ Notifications endpoint working');
      console.log(`   Found ${notificationsResponse.data.data?.length || 0} notifications`);
    } catch (error) {
      console.log('❌ Notifications endpoint error:', error.response?.data?.message || error.message);
    }
    
    // Test event creation
    try {
      const eventData = {
        name: 'Test Event - ' + Date.now(),
        description: 'Quick test event',
        startDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        endDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        accessType: 'public',
        maxParticipants: 10,
        challenges: [],
        settings: {
          showScoreboard: true,
          allowLateJoin: true,
          showParticipantCount: true
        }
      };
      
      const createResponse = await axios.post('http://localhost:5000/api/events', eventData, config);
      console.log('✅ Event creation working');
      console.log(`   Created event: ${createResponse.data.data.name}`);
      
      // Clean up - delete the test event
      await axios.delete(`http://localhost:5000/api/events/${createResponse.data.data._id}`, config);
      console.log('✅ Event cleanup successful');
      
    } catch (error) {
      console.log('❌ Event creation error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Quick test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

quickTest();
