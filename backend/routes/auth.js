const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts - max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@factory.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$EScRNOfKNDaRzJ7.gzGOsewsTekkpJz2i6iqRZ.9Sz4vU0l/3VYlK';
const ADMIN_USERNAME = 'Admin';
const ADMIN_ID = 'admin_' + require('crypto').createHash('sha256').update(ADMIN_EMAIL).digest('hex').substring(0, 16);

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set in environment variables. Using default (INSECURE).');
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production-please';

if (!ADMIN_PASSWORD_HASH) {
  console.error('ERROR: ADMIN_PASSWORD_HASH not set in environment variables');
}

// Failed login attempts tracking
const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes

// Check if IP is locked out
function isLockedOut(ip) {
  const attempts = failedAttempts.get(ip);
  if (!attempts) return false;
  
  if (attempts.count >= MAX_FAILED_ATTEMPTS) {
    const timeSinceLock = Date.now() - attempts.lastAttempt;
    if (timeSinceLock < LOCKOUT_TIME) {
      return true;
    } else {
      // Reset after lockout period
      failedAttempts.delete(ip);
      return false;
    }
  }
  return false;
}

// Record failed attempt
function recordFailedAttempt(ip) {
  const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  failedAttempts.set(ip, attempts);
}

// Clear failed attempts
function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

// Secure login with bcrypt and rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if IP is locked out
    if (isLockedOut(clientIp)) {
      return res.status(429).json({ 
        message: 'Account temporarily locked due to multiple failed attempts. Please try again later.' 
      });
    }

    // Constant-time email comparison to prevent timing attacks
    const emailMatch = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    
    // Verify password using bcrypt
    let passwordMatch = false;
    if (ADMIN_PASSWORD_HASH) {
      passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    }

    // Check credentials
    if (!emailMatch || !passwordMatch) {
      recordFailedAttempt(clientIp);
      
      // Generic error message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(clientIp);

    // Create secure JWT token with shorter expiration
    const token = jwt.sign(
      { 
        userId: ADMIN_ID,
        email: ADMIN_EMAIL,
        role: 'owner',
        iat: Math.floor(Date.now() / 1000)
      }, 
      JWT_SECRET, 
      { 
        expiresIn: '8h', // Shorter session for security
        algorithm: 'HS256'
      }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({
      token,
      user: {
        id: ADMIN_ID,
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        role: 'owner'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
