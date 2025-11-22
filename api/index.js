// Vercel serverless function entry point
require('dotenv').config();

let app;

try {
  // Import the Express app from backend
  app = require('../backend/server');
  console.log('✅ Backend server loaded');
} catch (error) {
  console.error('❌ Failed to load backend:', error.message);
  
  // Fallback error handler
  const express = require('express');
  app = express();
  
  app.use(express.json());
  
  app.get('/api/health', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      env: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      },
      hint: 'Backend module failed to load - check Vercel logs'
    });
  });
  
  app.all('*', (req, res) => {
    res.status(500).json({
      error: 'Server not initialized',
      message: error.message
    });
  });
}

module.exports = app;
