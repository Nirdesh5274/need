# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account with a cluster created
3. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Prepare MongoDB Atlas

1. Login to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project or use existing one
3. Create a cluster (Free M0 tier is sufficient for testing)
4. Create a database user:
   - Go to Database Access
   - Add New Database User
   - Choose password authentication
   - Set username and strong password
   - Grant "Read and write to any database" privilege
5. Whitelist Vercel IPs:
   - Go to Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: For production, restrict this after deployment
6. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Step 2: Push Code to GitHub

```bash
cd c:\Users\HP\Desktop\factory
git init
git add .
git commit -m "Initial commit - Factory Management System"
git branch -M main
git remote add origin https://github.com/yourusername/factory-management.git
git push -u origin main
```

### Step 3: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** frontend/dist
   - **Install Command:** `npm run install-all`

### Step 4: Configure Environment Variables

In the Vercel project settings, add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/factory?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_string_minimum_32_characters
NODE_ENV=production
PORT=5000
```

For frontend (also add these):
```
VITE_API_URL=/api
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Visit your deployed site at the provided URL

### Step 6: Update Frontend API URL

After first deployment, update the `VITE_API_URL` in Vercel:

1. Go to Project Settings → Environment Variables
2. Update `VITE_API_URL` to: `https://your-app-name.vercel.app/api`
3. Redeploy the project

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

### Step 3: Deploy

```powershell
cd c:\Users\HP\Desktop\factory
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **factory-management**
- In which directory is your code located? **.**

### Step 4: Set Environment Variables

```powershell
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NODE_ENV
vercel env add VITE_API_URL
```

### Step 5: Deploy to Production

```powershell
vercel --prod
```

## Post-Deployment Steps

### 1. Create Your Owner Account

1. Visit `https://your-app.vercel.app/register`
2. Create your owner account with:
   - Username
   - Email
   - Password (minimum 6 characters)
3. You'll be automatically logged in

### 2. Test the Application

- Add some products in the Inventory section
- Create a test sale
- Record an expense
- View reports

### 3. Security Recommendations

1. **Restrict MongoDB Access:**
   - In MongoDB Atlas Network Access
   - Remove 0.0.0.0/0
   - Add only Vercel's IP ranges

2. **Enable 2FA on Vercel:**
   - Go to Account Settings
   - Enable Two-Factor Authentication

3. **Monitor Usage:**
   - Check Vercel Analytics
   - Monitor MongoDB Atlas metrics

## Troubleshooting

### Build Fails

**Issue:** Build fails with module not found
**Solution:** Ensure all dependencies are in package.json files

**Issue:** Environment variables not working
**Solution:** Redeploy after adding environment variables

### API Not Working

**Issue:** 404 on API calls
**Solution:** Check vercel.json routing configuration

**Issue:** CORS errors
**Solution:** Ensure backend accepts requests from your domain

### Database Connection Issues

**Issue:** "MongoNetworkError" or connection timeout
**Solution:** 
- Verify MongoDB connection string is correct
- Check if IP whitelist includes 0.0.0.0/0
- Ensure database user has correct permissions

### Authentication Issues

**Issue:** "Token is not valid" errors
**Solution:**
- Ensure JWT_SECRET is set in Vercel environment variables
- Clear browser cookies and try again

## Updating Your Deployment

### Via Git Push (If connected to GitHub)

```bash
git add .
git commit -m "Your update message"
git push
```

Vercel will automatically deploy the changes.

### Via CLI

```powershell
vercel --prod
```

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for DNS propagation

## Monitoring and Logs

- **View Logs:** Vercel Dashboard → Your Project → Deployments → View Function Logs
- **Analytics:** Vercel Dashboard → Your Project → Analytics
- **Performance:** Check Vercel Speed Insights

## Cost Considerations

- **Vercel Free Tier:**
  - 100GB bandwidth
  - Unlimited requests
  - Serverless function execution time limits

- **MongoDB Atlas Free Tier (M0):**
  - 512MB storage
  - Shared RAM
  - Suitable for small-scale applications

For production apps with higher traffic, consider upgrading to paid tiers.

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check MongoDB Atlas logs
3. Review browser console for frontend errors
4. Check Network tab in browser DevTools for API calls

## Next Steps

- Set up monitoring and alerting
- Configure backup strategies for your database
- Implement rate limiting for API endpoints
- Add more features as needed
- Set up staging environment for testing
