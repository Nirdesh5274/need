// Vercel Serverless Function Entry Point
// Vercel automatically injects environment variables, no need for dotenv in production

// Import the Express app
const app = require('./server');

// Export the Express app as the default handler for Vercel serverless functions
module.exports = app;
