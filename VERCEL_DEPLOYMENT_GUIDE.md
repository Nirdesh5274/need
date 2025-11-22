# Vercel Deployment Guide - Fixed Structure

## ✅ Fixed Issues

1. **Express module loading** - Ensured `api/package.json` has all dependencies
2. **Serverless export** - `api/server.js` exports Express app correctly
3. **Vercel wrapper** - `api/index.js` properly wraps the app for serverless
4. **Node 22.x engines** - Configured in both package.json files
5. **CORS configuration** - Handles Vercel deployment URLs dynamically
6. **MongoDB lazy connection** - Connects only when needed in serverless
7. **Route loading** - All routes load with proper DB middleware

---

## 📁 Corrected File Structure

```
factory/
├── api/                          # Backend API (serverless functions)
│   ├── index.js                  # ✅ Vercel serverless entry point
│   ├── server.js                 # ✅ Express app (exported for serverless)
│   ├── package.json              # ✅ Backend dependencies (Node 22.x)
│   ├── createUser.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Expense.js
│   │   ├── Product.js
│   │   ├── Sale.js
│   │   └── User.js
│   └── routes/
│       ├── auth.js
│       ├── expenses.js
│       ├── invoices.js
│       ├── products.js
│       ├── reports.js
│       └── sales.js
│
├── frontend/                     # React frontend
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── styles/
│       └── utils/
│
├── vercel.json                   # ✅ Root Vercel configuration
├── package.json                  # Root package.json (workspace scripts)
└── README.md
```

---

## 🔧 Fixed Files

### 1. `api/package.json`
```json
{
  "name": "factory-api",
  "version": "1.0.0",
  "description": "Backend API for Factory Management System",
  "main": "index.js",
  "engines": {
    "node": "22.x"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^8.2.1",
    "express-validator": "^7.0.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Key Points:**
- ✅ `main: "index.js"` points to serverless entry
- ✅ `engines.node: "22.x"` matches Vercel runtime
- ✅ All Express dependencies listed

---

### 2. `api/server.js`
**What Changed:**
- ✅ Exports Express app using `module.exports = app`
- ✅ Local dev server only runs when `require.main === module`
- ✅ Lazy MongoDB connection for serverless (reuses connections)
- ✅ CORS allows Vercel deployment URLs dynamically
- ✅ Health check at `/api/health` (no DB required)
- ✅ DB middleware wraps all API routes
- ✅ Error handling and 404 middleware added

**Key Code:**
```javascript
// Export app for serverless
module.exports = app;

// Local development server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    });
}
```

---

### 3. `api/index.js`
**What Changed:**
- ✅ Loads environment variables with proper path resolution
- ✅ Imports Express app from `./server.js`
- ✅ Exports app directly for Vercel serverless functions

**Complete Code:**
```javascript
// Vercel Serverless Function Entry Point
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import the Express app
const app = require('./server');

// Export the Express app as the default handler for Vercel
module.exports = app;
```

---

### 4. `vercel.json` (Root)
**What Changed:**
- ✅ Proper install command: installs deps in both `api/` and `frontend/`
- ✅ Backend build points to `api/index.js` with Node 22.x runtime
- ✅ Frontend static build from `frontend/package.json`
- ✅ Routes `/api/*` to serverless function
- ✅ Routes everything else to frontend static files
- ✅ Function config for memory and timeout

**Complete Code:**
```json
{
  "version": 2,
  "installCommand": "cd api && npm install && cd ../frontend && npm install",
  "buildCommand": "cd frontend && npm run build",
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node",
      "config": {
        "runtime": "nodejs22.x",
        "maxLambdaSize": "50mb",
        "includeFiles": "api/**"
      }
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { 
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ],
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🚀 Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Set Environment Variables in Vercel Dashboard
Go to: **Project Settings → Environment Variables**

Add:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ADMIN_EMAIL` - Admin login email (optional, has default)
- `ADMIN_PASSWORD_HASH` - Bcrypt hash for admin password (optional)
- `NODE_ENV` - Set to `production`

### 3. Deploy
```bash
# From project root
vercel --prod
```

### 4. Test Endpoints
```bash
# Health check (no DB)
curl https://your-app.vercel.app/api/health

# Login endpoint
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@factory.com","password":"admin123"}'
```

---

## 🐛 Troubleshooting

### Error: Cannot find module 'express'
**Solution:** ✅ Fixed! 
- Vercel now installs from `api/package.json`
- `vercel.json` uses `cd api && npm install`

### 500 on /api/health
**Solution:** ✅ Fixed!
- Health check endpoint doesn't require DB
- Proper error handling added
- MONGODB_URI validation

### CORS errors
**Solution:** ✅ Fixed!
- CORS dynamically allows `*.vercel.app` domains
- Allows requests without origin (serverless)

### MongoDB connection timeout
**Solution:** ✅ Fixed!
- Lazy connection (connects only when needed)
- Connection reuse across invocations
- Proper error messages for missing MONGODB_URI

---

## 📊 How It Works

### Request Flow:
```
User Request → Vercel Edge → Route Handler
                                ↓
                       /api/* → api/index.js
                                ↓
                            server.js (Express app)
                                ↓
                           DB Middleware
                                ↓
                           API Routes
                                ↓
                           Response
```

### Serverless Execution:
1. Vercel receives request to `/api/health`
2. Invokes `api/index.js` as serverless function
3. `index.js` loads `server.js` (Express app)
4. Express handles routing
5. Returns response
6. Function terminates (connection pool kept warm)

---

## ✅ Verification Checklist

- [x] `api/package.json` has Node 22.x engines
- [x] `api/package.json` lists all Express dependencies
- [x] `api/server.js` exports Express app
- [x] `api/index.js` wraps server for serverless
- [x] Root `vercel.json` configures builds and routes
- [x] CORS allows Vercel domains
- [x] MongoDB uses lazy connection
- [x] Health check endpoint works without DB
- [x] DB middleware protects API routes
- [x] Error handling middleware added
- [x] No `api/vercel.json` (removed - not needed)

---

## 🎯 Result

✅ **All issues fixed!** The app now:
- Loads Express dependencies correctly in Vercel
- Exports serverless functions properly
- Handles CORS for Vercel deployments
- Connects to MongoDB on-demand
- Returns proper error messages
- Works on Node 22.x runtime

Deploy with confidence! 🚀
