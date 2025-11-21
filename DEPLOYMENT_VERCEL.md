# Vercel Deployment Guide - Factory Management System

## Prerequisites
1. Vercel account (https://vercel.com)
2. GitHub account
3. MongoDB Atlas database (already configured)

## Step 1: Prepare Backend for Vercel

Backend is already configured with:
- `backend/vercel.json` - Vercel configuration
- Environment variables in `.env`
- Security features (helmet, rate limiting, CORS)

## Step 2: Prepare Frontend for Vercel

Frontend needs to be configured to use production API URL.

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy Backend:
```bash
cd backend
vercel --prod
```

3. During deployment, add these environment variables:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
- `ADMIN_EMAIL`: Your admin email
- `ADMIN_PASSWORD_HASH`: Generate using bcrypt (see backend/.env.example)
- `PORT`: 5000
- `NODE_ENV`: production

4. Note the backend URL (e.g., https://factory-backend-xxx.vercel.app)

5. Update frontend environment variable:
```bash
cd ../frontend
# Update .env with: VITE_API_URL=https://your-backend-url.vercel.app/api
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository or upload folder

4. **For Backend:**
   - Root Directory: `backend`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Environment Variables: Add all from `.env`

5. **For Frontend:**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: `VITE_API_URL` = your backend URL

## Step 4: Environment Variables on Vercel

Go to Project Settings → Environment Variables and add:

**Backend:**
```
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_generated_jwt_secret_here
ADMIN_EMAIL=admin@factory.com
ADMIN_PASSWORD_HASH=your_bcrypt_password_hash_here
NODE_ENV=production
PORT=5000
```

**Frontend:**
```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

## Step 5: Update CORS Settings

After getting frontend URL, update backend `server.js`:
```javascript
const corsOptions = {
  origin: ['https://your-frontend-url.vercel.app', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## Step 6: Test Deployment

1. Visit your frontend URL
2. Login with: `admin@factory.com` / `Admin@123!Factory`
3. Test all features

## Troubleshooting

### Backend not connecting to MongoDB:
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- Verify connection string in environment variables

### Frontend can't reach backend:
- Check CORS settings in backend
- Verify VITE_API_URL in frontend environment variables
- Check Network tab in browser DevTools

### Login issues:
- Verify ADMIN_PASSWORD_HASH is set correctly
- Check backend logs in Vercel dashboard

## Quick Deploy Commands

```bash
# Deploy backend
cd backend
vercel --prod

# Deploy frontend (after updating VITE_API_URL)
cd ../frontend
vercel --prod
```

## Login Credentials
- Email: `admin@factory.com`
- Password: `Admin@123!Factory`

## Security Notes
- All passwords are bcrypt hashed
- Rate limiting enabled (5 login attempts per 15 min)
- JWT tokens expire in 8 hours
- HTTPS enforced in production
- MongoDB injection protection enabled
