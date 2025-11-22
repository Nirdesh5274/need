// Vercel Serverless Function Entry Point
require('dotenv').config();

// Import the Express app from same folder (moved from backend/)
const app = require('./server');

// Export for Vercel
module.exports = app;
