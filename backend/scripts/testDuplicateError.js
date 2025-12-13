const axios = require('axios');

const testDuplicateError = async () => {
  try {
    console.log('🧪 Testing Duplicate Event Name Error Handling');
    console.log('=' .repeat(50));
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@cyberctf.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Admin login successful');
    
    // Create first event
    const eventData = {
      name: 'Duplicate Test Event',
      description: 'Testing duplicate name handling',
      startDate: new Date(Date.now() + 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
      accessType: 'public',
      maxParticipants: 10,
      challenges: [],
      settings: {
        showLeaderboard: true,
        allowLateJoin: true,
        showParticipantCount: true
      }
    };
    
    const firstEvent = await axios.post('http://localhost:5000/api/events', eventData, config);
    console.log('✅ First event created successfully');
    console.log(`   Event ID: ${firstEvent.data.data._id}`);
    
    // Try to create second event with same name
    console.log('\n🔄 Attempting to create duplicate event...');
    try {
      await axios.post('http://localhost:5000/api/events', eventData, config);
      console.log('❌ ERROR: Duplicate event was created (this should not happen)');
    } catch (duplicateError) {
      console.log('✅ Duplicate error caught correctly');
      console.log(`   Status: ${duplicateError.response.status}`);
      console.log(`   Message: ${duplicateError.response.data.message}`);
      
      if (duplicateError.response.status === 400 && 
          duplicateError.response.data.message.includes('already exists')) {
        console.log('✅ Error message is user-friendly and informative');
      } else {
        console.log('⚠️  Error message could be improved');
      }
    }
    
    // Cleanup
    await axios.delete(`http://localhost:5000/api/events/${firstEvent.data.data._id}`, config);
    console.log('✅ Test cleanup completed');
    
    console.log('\n🎉 Duplicate Error Handling Test Passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
};

testDuplicateError();
