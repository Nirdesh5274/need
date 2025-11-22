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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, serverless functions, etc.)
    if (!origin) return callback(null, true);
    
    // In production, allow all Vercel deployment URLs
    if (origin.includes('.vercel.app') || 
        origin.includes('localhost') || 
        (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL))) {
      callback(null, true);
    } else {
      // Allow all origins in production to prevent CORS issues
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// Connect to MongoDB on startup (for local dev only)
if (require.main === module) {
  connectDB().catch(err => console.error('Failed to connect to MongoDB:', err));
}

// Health check endpoint (no DB required)
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

// DB connection middleware for other routes
const dbMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('DB connection error:', error);
    res.status(500).json({ 
      message: 'Database connection failed', 
      error: error.message,
      hint: 'Check if MONGODB_URI environment variable is set in Vercel'
    });
  }
};

// Routes with DB middleware
app.use('/api/auth', dbMiddleware, require('./routes/auth'));
app.use('/api/products', dbMiddleware, require('./routes/products'));
app.use('/api/sales', dbMiddleware, require('./routes/sales'));
app.use('/api/expenses', dbMiddleware, require('./routes/expenses'));
app.use('/api/reports', dbMiddleware, require('./routes/reports'));
app.use('/api/invoices', dbMiddleware, require('./routes/invoices'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Export app for serverless
module.exports = app;

// Local development server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      });
    })
    .catch(err => {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    });
}
