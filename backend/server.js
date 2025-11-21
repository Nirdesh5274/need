const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting for all routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// CORS with flexible origin for Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  'https://need-nirdesh5274s-projects.vercel.app',
  'https://need.vercel.app',
  'https://need-three.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, serverless, etc.)
    if (!origin) return callback(null, true);
    
    // Allow any Vercel deployment URL or configured origins
    if (origin.includes('.vercel.app') || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production to avoid CORS issues
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection - Lazy connection for serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not set in environment variables');
    throw new Error('MONGODB_URI is required');
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    throw error;
  }
};

// Connect to MongoDB on startup (for local dev)
if (require.main === module) {
  connectDB().catch(err => console.error('Failed to connect to MongoDB:', err));
}

// Middleware to ensure DB connection for all API routes
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Database connection failed', 
      error: error.message,
      hint: 'Check if MONGODB_URI environment variable is set in Vercel'
    });
  }
});

// Health check (no DB required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    },
    mongodb: isConnected ? 'Connected' : 'Not connected'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/invoices', require('./routes/invoices'));

// Export for Vercel serverless
module.exports = app;

// Local server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
