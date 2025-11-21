# Environment Setup Guide

## Backend Environment Variables (.env)

Create a file `backend/.env` with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/factory?retryWrites=true&w=majority

# JWT Secret (Generate a secure random string)
JWT_SECRET=your_super_secure_random_string_here_min_32_chars

# Server Port
PORT=5000

# Node Environment
NODE_ENV=production
```

### How to Get MongoDB URI:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or login
3. Create a new cluster (free tier available)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database user password
8. Replace `<dbname>` with `factory` or your preferred database name

### How to Generate JWT Secret:

**Option 1 - Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2 - Using PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Option 3 - Online Generator:**
Visit: https://randomkeygen.com/ and use a "Fort Knox Password"

## Frontend Environment Variables (.env)

Create a file `frontend/.env` with:

```env
# API URL
# For local development
VITE_API_URL=http://localhost:5000/api

# For production (after deployment)
# VITE_API_URL=https://your-vercel-app.vercel.app/api
```

## Vercel Environment Variables

When deploying to Vercel, add these environment variables in the Vercel Dashboard:

### Project Settings > Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | Your MongoDB Atlas connection string | Production, Preview, Development |
| `JWT_SECRET` | Your secure random string | Production, Preview, Development |
| `NODE_ENV` | production | Production |
| `VITE_API_URL` | https://your-app.vercel.app/api | Production, Preview, Development |

**Important:** After adding environment variables in Vercel, you need to redeploy your application for the changes to take effect.

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to git
- Keep your JWT_SECRET secure and random
- Use different JWT secrets for development and production
- Whitelist only necessary IP addresses in MongoDB Atlas (use 0.0.0.0/0 for Vercel)
- Change default passwords immediately
- Use strong passwords for MongoDB users

## Troubleshooting

### MongoDB Connection Issues:
- Ensure your IP is whitelisted in MongoDB Atlas
- Check if your connection string is correct
- Verify database user has read/write permissions

### JWT Issues:
- Ensure JWT_SECRET is set and is a string
- Check if the secret is at least 32 characters long

### API Connection Issues:
- Verify VITE_API_URL is correctly set
- Check if backend server is running
- Ensure no CORS issues (backend should allow your frontend origin)
