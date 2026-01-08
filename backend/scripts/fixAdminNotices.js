require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const User = require('../models/User');

async function fixAdminNotices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    console.log(`Found ${admins.length} admin users`);

    // For each admin, mark their created notices as read by them
    for (const admin of admins) {
      const result = await Notice.updateMany(
        { 
          createdBy: admin._id,
          readBy: { $ne: admin._id }
        },
        { 
          $addToSet: { readBy: admin._id }
        }
      );
      console.log(`Updated ${result.modifiedCount} notices for admin: ${admin.username}`);
    }

    console.log('✓ All admin notices have been marked as read by their creators');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminNotices();
