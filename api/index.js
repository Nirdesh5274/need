// Vercel Serverless Function Entry Point
// This file must be kept simple and lightweight

// Load environment variables
require('dotenv').config();

// Import and export the Express app
// The backend/server.js is already configured to export the app
const app = require('../backend/server');

// Export for Vercel
module.exports = app;
