const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cyberctf')
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    try {
      // Create admin user directly in the database
      const db = mongoose.connection;
      const usersCollection = db.collection('users');
      
      // Check if admin already exists
      const existingAdmin = await usersCollection.findOne({ 
        email: 'admin2@cyberctf.com'
      });
      
      if (existingAdmin) {
        console.log('Admin user already exists');
        process.exit(0);
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Insert admin user
      const result = await usersCollection.insertOne({
        username: 'admin2',
        email: 'admin2@cyberctf.com',
        password: hashedPassword,
        role: 'admin',
        points: 0,
        solvedChallenges: [],
        createdAt: new Date()
      });
      
      console.log('Admin user created successfully:', result.insertedId);
      console.log('Username: admin2');
      console.log('Email: admin2@cyberctf.com');
      console.log('Password: admin123 (not hashed)');
      console.log('Role: admin');
      
    } catch (error) {
      console.error('Error creating admin user:', error.message);
    } finally {
      mongoose.disconnect();
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
