# Vercel Deployment Guide

## 🚀 Deploy Factory Management System to Vercel

### Prerequisites
- Vercel account (free tier works)
- MongoDB Atlas account (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Prepare MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Setup Database Access**
   - Go to "Database Access"
   - Add New Database User
   - Username: `factoryuser`
   - Password: Generate secure password
   - Database User Privileges: Read and write to any database

4. **Setup Network Access**
   - Go to "Network Access"
   - Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://factoryuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/factory?retryWrites=true&w=majority`

---

## Step 2: Prepare Your Code

### Update Backend Configuration

1. **Create Production Config** (`backend/config/production.js`):
```javascript
module.exports = {
  mongoURI: process.env.MONGODB_URI || 'your-mongodb-atlas-uri',
  jwtSecret: process.env.JWT_SECRET || 'your-very-secure-jwt-secret-key-change-this',
  port: process.env.PORT || 5000
};
```

2. **Update server.js** to use environment variables:
```javascript
const mongoose = require('mongoose');

// Use environment variable for MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factory';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));
```

3. **Update Frontend API URL** (`frontend/src/api/axios.js`):
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
```

---

## Step 3: Push to Git Repository

1. **Initialize Git** (if not already done):
```bash
git init
git add .
git commit -m "Factory management system ready for deployment"
```

2. **Create GitHub Repository**:
   - Go to GitHub
   - Create new repository: `factory-management`
   - Don't initialize with README

3. **Push Code**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/factory-management.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy Backend to Vercel

1. **Login to Vercel**:
   - Go to https://vercel.com
   - Sign up or login with GitHub

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Backend**:
   - Framework Preset: Other
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`

4. **Set Environment Variables**:
   Click "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Your secure JWT secret (generate random string) |
   | `NODE_ENV` | `production` |

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy the backend URL (e.g., `https://factory-backend-xxx.vercel.app`)

---

## Step 5: Deploy Frontend to Vercel

1. **Import Same Repository Again**:
   - Click "Add New..." → "Project"
   - Import your repository again

2. **Configure Frontend**:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**:
   
   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | Your backend URL + /api (e.g., `https://factory-backend-xxx.vercel.app/api`) |

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app is now live!

---

## Step 6: Create Vercel Configuration Files

### Backend - `backend/vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Frontend - `frontend/vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Step 7: Update Frontend Environment

Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-url.vercel.app/api
```

---

## Step 8: Test Deployment

1. **Open Frontend URL**
2. **Test Login**:
   - Email: `owner@factory.com`
   - Password: `password123`
3. **Test Each Module**:
   - Dashboard
   - Inventory
   - Sales
   - Expenses
   - Reports

---

## Common Issues & Solutions

### Issue 1: CORS Errors

**Solution**: Update `backend/server.js`:
```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.vercel.app'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

### Issue 2: MongoDB Connection Timeout

**Solution**: 
- Check MongoDB Atlas Network Access
- Ensure 0.0.0.0/0 is whitelisted
- Verify connection string format

### Issue 3: Environment Variables Not Working

**Solution**:
- Redeploy after adding environment variables
- Check variable names are exact (case-sensitive)
- For frontend, variables must start with `VITE_`

### Issue 4: 404 on Frontend Routes

**Solution**: 
- Ensure `vercel.json` in frontend has rewrite rules
- SPA routing needs to redirect all routes to index.html

### Issue 5: API Not Found (404)

**Solution**:
- Check backend routes in `vercel.json`
- Verify API_URL in frontend includes `/api`
- Check backend logs in Vercel dashboard

---

## Monitoring & Maintenance

### View Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click "Functions" → "Logs"
4. View real-time logs

### Update Deployment
```bash
git add .
git commit -m "Update message"
git push
```
Vercel auto-deploys on push!

### Rollback Deployment
1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Find previous working deployment
5. Click "..." → "Promote to Production"

---

## Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with strong password
- [ ] Network access configured
- [ ] Backend environment variables set
- [ ] Frontend environment variables set
- [ ] CORS configured correctly
- [ ] Both deployments successful
- [ ] Login works
- [ ] All CRUD operations work
- [ ] Reports load correctly
- [ ] Change default admin password

---

## Custom Domain (Optional)

1. **Buy Domain**: From Namecheap, GoDaddy, etc.
2. **In Vercel**:
   - Go to project settings
   - Click "Domains"
   - Add your domain
3. **Update DNS**:
   - Add CNAME record pointing to Vercel
   - Wait for propagation (can take 24-48 hours)

---

## Security Best Practices

1. **Change Default Credentials**:
   ```javascript
   // After first login, change the password immediately
   ```

2. **Use Strong JWT Secret**:
   ```bash
   # Generate random string
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Regular Backups**:
   - Use MongoDB Atlas automated backups
   - Export data regularly using export endpoints

4. **Monitor Access**:
   - Check Vercel analytics
   - Monitor MongoDB Atlas metrics

---

## Cost Estimates

### Free Tier Limits:
- **Vercel**: 
  - 100GB bandwidth/month
  - 100 deployments/day
  - Unlimited projects
  
- **MongoDB Atlas**:
  - 512 MB storage
  - Shared RAM
  - Good for 10K+ products

### When to Upgrade:
- More than 100GB traffic/month
- Need dedicated database
- Require team collaboration

---

## Support & Resources

- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- GitHub Issues: (Your repository issues page)

---

## Alternative Deployment Options

### Backend Alternatives:
1. **Render.com** (Free tier available)
2. **Railway.app** (Free trial)
3. **Heroku** (Paid only)
4. **DigitalOcean App Platform**

### Frontend Alternatives:
1. **Netlify** (Similar to Vercel)
2. **GitHub Pages** (Free for static sites)
3. **Cloudflare Pages**

---

**Deployment Complete! 🎉**

Your factory management system is now live and accessible worldwide!
