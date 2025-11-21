const path = require('path');

// Set up environment
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

let app;

try {
  // Import the Express app
  app = require('../backend/server');
  console.log('✅ Express app loaded successfully');
} catch (error) {
  console.error('❌ Error loading Express app:', error);
  
  // Fallback: Create a minimal Express app for error reporting
  const express = require('express');
  app = express();
  
  app.use(express.json());
  
  app.all('*', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      hint: 'Check Vercel function logs for details'
    });
  });
}

module.exports = app;
