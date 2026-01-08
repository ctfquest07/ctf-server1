const mongoose = require('mongoose');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
require('dotenv').config();

const fixUnlockedHints = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get all users with unlocked hints
    const users = await User.find({ 
      unlockedHints: { $exists: true, $ne: [] } 
    });

    console.log(`Found ${users.length} users with unlocked hints`);

    for (const user of users) {
      let updated = false;
      
      for (let i = 0; i < user.unlockedHints.length; i++) {
        const hint = user.unlockedHints[i];
        
        // If challengeTitle is missing or is "Unknown Challenge"
        if (!hint.challengeTitle || hint.challengeTitle === 'Unknown Challenge') {
          try {
            const challenge = await Challenge.findById(hint.challengeId);
            if (challenge) {
              user.unlockedHints[i].challengeTitle = challenge.title;
              updated = true;
              console.log(`  ✓ Updated hint for ${user.username}: ${challenge.title}`);
            } else {
              console.log(`  ⚠ Challenge not found for hint in ${user.username}: ${hint.challengeId}`);
            }
          } catch (err) {
            console.error(`  ✗ Error processing hint for ${user.username}:`, err.message);
          }
        }
      }
      
      if (updated) {
        await user.save();
        console.log(`✓ Saved updated hints for ${user.username}`);
      }
    }

    console.log('\n✓ Finished fixing unlocked hints');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
};

fixUnlockedHints();
