const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function createUser() {
  try {
    // Delete existing user
    await User.deleteMany({ email: 'owner@factory.com' });
    console.log('Cleared existing users');

    // Create new user
    const user = new User({
      username: 'Factory Owner',
      email: 'owner@factory.com',
      password: 'password123', // Will be hashed automatically by the model
      role: 'owner'
    });

    await user.save();
    console.log('✅ User created successfully!');
    console.log('Email: owner@factory.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

createUser();
