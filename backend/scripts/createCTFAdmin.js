const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ctf-platform';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully to:', MONGODB_URI);
    
    try {
      // Create admin user directly in the database
      const db = mongoose.connection;
      const usersCollection = db.collection('users');
      
      // Check if admin already exists
      const existingAdmin = await usersCollection.findOne({ 
        $or: [
          { email: 'admin@ctf.com' },
          { role: 'admin' }
        ]
      });
      
      if (existingAdmin) {
        console.log('Admin user already exists:', {
          username: existingAdmin.username,
          email: existingAdmin.email,
          role: existingAdmin.role
        });
        process.exit(0);
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Insert admin user
      const result = await usersCollection.insertOne({
        username: 'admin',
        email: 'admin@ctf.com',
        password: hashedPassword,
        role: 'admin',
        points: 0,
        solvedChallenges: [],
        createdAt: new Date(),
        lastActivity: new Date()
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@ctf.com');
      console.log('👤 Username: admin');
      console.log('🔑 Password: admin123');
      console.log('🛡️  Role: admin');
      console.log('🆔 ID:', result.insertedId);
      
      // Also create a test user
      const testUserPassword = await bcrypt.hash('password123', salt);
      const testUserResult = await usersCollection.insertOne({
        username: 'testuser',
        email: 'user@test.com',
        password: testUserPassword,
        role: 'user',
        points: 0,
        solvedChallenges: [],
        createdAt: new Date(),
        lastActivity: new Date()
      });
      
      console.log('\n✅ Test user created successfully!');
      console.log('📧 Email: user@test.com');
      console.log('👤 Username: testuser');
      console.log('🔑 Password: password123');
      console.log('🛡️  Role: user');
      console.log('🆔 ID:', testUserResult.insertedId);
      
    } catch (error) {
      console.error('❌ Error creating users:', error.message);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
