const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testChallengeFlow() {
  try {
    console.log('\n=== CTF Challenge Testing ===\n');

    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@cyberctf.com',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.token;
    console.log('✓ Admin logged in successfully');
    console.log(`  Token: ${adminToken.substring(0, 20)}...`);

    // Step 2: Create a new visible challenge
    console.log('\nStep 2: Creating a new visible test challenge...');
    const challengeRes = await axios.post(`${API_URL}/challenges`, {
      title: `Test Challenge ${Date.now()}`,
      description: 'This is a test challenge to verify non-admin access',
      category: 'misc',
      difficulty: 'Easy',
      points: 50,
      flag: 'CTF{test_flag_123}',
      hints: [
        { content: 'This is a hint', cost: 0 }
      ],
      isVisible: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const challengeId = challengeRes.data.data._id;
    console.log('✓ Challenge created successfully');
    console.log(`  Challenge ID: ${challengeId}`);
    console.log(`  Title: ${challengeRes.data.data.title}`);
    console.log(`  isVisible: ${challengeRes.data.data.isVisible}`);

    // Step 3: Create a non-admin user (using admin credentials)
    console.log('\nStep 3: Creating a non-admin test user (via admin)...');
    const testUsername = `testuser_${Date.now()}`;
    const userRes = await axios.post(`${API_URL}/auth/register`, {
      username: testUsername,
      email: `${testUsername}@test.com`,
      password: 'testpass123'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ Non-admin user created successfully');
    console.log(`  Username: ${testUsername}`);
    console.log(`  Email: ${userRes.data.user.email}`);
    console.log(`  Role: ${userRes.data.user.role}`);

    // Step 4: Login as non-admin user
    console.log('\nStep 4: Logging in as non-admin user...');
    const userLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: `${testUsername}@test.com`,
      password: 'testpass123'
    });
    const userToken = userLoginRes.data.token;
    console.log('✓ Non-admin user logged in successfully');
    console.log(`  Token: ${userToken.substring(0, 20)}...`);

    // Step 5: Test non-admin user accessing challenges
    console.log('\nStep 5: Non-admin user accessing challenges...');
    const userChallengesRes = await axios.get(`${API_URL}/challenges`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✓ Non-admin user can access challenges');
    console.log(`  Total challenges visible: ${userChallengesRes.data.count}`);
    const userSeesChallenge = userChallengesRes.data.data.some(c => c._id === challengeId);
    console.log(`  Can see the test challenge: ${userSeesChallenge ? '✓ YES' : '✗ NO'}`);

    if (!userSeesChallenge) {
      console.log('✗ ERROR: Non-admin user cannot see the test challenge!');
      return false;
    }

    // Step 6: Submit flag for the challenge
    console.log('\nStep 6: Non-admin user submitting flag...');
    try {
      const submitRes = await axios.post(`${API_URL}/challenges/${challengeId}/submit`, {
        flag: 'CTF{test_flag_123}'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✓ Flag submitted successfully');
      console.log(`  Message: ${submitRes.data.message}`);
      console.log(`  Points awarded: ${submitRes.data.points}`);
    } catch (submitErr) {
      console.error('✗ Flag submission error details:');
      console.error('  Status:', submitErr.response?.status);
      console.error('  Message:', submitErr.response?.data?.message);
      console.error('  Data:', JSON.stringify(submitErr.response?.data, null, 2));
      throw submitErr;
    }

    // Step 7: Verify user solved the challenge
    console.log('\nStep 7: Verifying challenge was marked as solved...');
    const userProfileRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const userSolvedChallenges = userProfileRes.data.user.solvedChallenges || [];
    const solved = userSolvedChallenges.includes(challengeId);
    console.log(`✓ Challenge marked as solved: ${solved ? '✓ YES' : '✗ NO'}`);
    console.log(`  User total points: ${userProfileRes.data.user.points}`);

    // Step 8: Try submitting the same flag again (should fail)
    console.log('\nStep 8: Attempting to submit same flag again (should fail)...');
    try {
      await axios.post(`${API_URL}/challenges/${challengeId}/submit`, {
        flag: 'CTF{test_flag_123}'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✗ ERROR: Should not allow re-submission');
    } catch (err) {
      console.log('✓ Correctly rejected re-submission');
      console.log(`  Error: ${err.response.data.message}`);
    }

    console.log('\n=== All Tests Passed! ===\n');
    return true;

  } catch (error) {
    console.error('\n✗ Test failed with error:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${error.response.data.message || error.message}`);
    } else {
      console.error(`  ${error.message}`);
    }
    return false;
  }
}

testChallengeFlow();
