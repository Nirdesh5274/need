# 🚀 Vercel Deployment Setup Guide

## Critical: Set Environment Variables First!

Login issues happen because environment variables are missing in Vercel. Follow these exact steps:

### Step 1: Go to Vercel Dashboard
1. Open your project in Vercel: https://vercel.com/dashboard
2. Click on your project (need)
3. Go to **Settings** tab
4. Click **Environment Variables** in the left sidebar

### Step 2: Add These 5 Variables

Copy and paste each variable exactly as shown:

#### Variable 1: MONGODB_URI
```
MONGODB_URI
```
Value:
```
mongodb+srv://NirdeshK_db_user:JShZZhVSd4o4Hebd@cluster0.f1wm6hw.mongodb.net/?appName=Cluster0
```

#### Variable 2: JWT_SECRET
```
JWT_SECRET
```
Value:
```
factory-management-super-secret-jwt-key-2024-vercel-deployment
```

#### Variable 3: ADMIN_EMAIL
```
ADMIN_EMAIL
```
Value:
```
admin@factory.com
```

#### Variable 4: ADMIN_PASSWORD_HASH
```
ADMIN_PASSWORD_HASH
```
Value:
```
$2a$10$EScRNOfKNDaRzJ7.gzGOsewsTekkpJz2i6iqRZ.9Sz4vU0l/3VYlK
```

#### Variable 5: NODE_ENV
```
NODE_ENV
```
Value:
```
production
```

### Step 3: Set Environment Scope
For each variable, select:
- ✅ Production
- ✅ Preview (optional)
- ✅ Development (optional)

### Step 4: Save and Redeploy

1. Click **Save** for each variable
2. After all 5 variables are added, go to **Deployments** tab
3. Click on the latest deployment
4. Click **⋯ (three dots)** → **Redeploy**
5. Select **Use existing Build Cache** → Click **Redeploy**

### Step 5: Test Login

1. Wait for deployment to complete (1-2 minutes)
2. Open your Vercel URL
3. Login with:
   - **Email:** `admin@factory.com`
   - **Password:** `Admin@123!Factory`

---

## ✅ Verification Checklist

- [ ] All 5 environment variables added in Vercel
- [ ] Variables applied to Production environment
- [ ] Redeployed after adding variables
- [ ] MongoDB Atlas allows connections from 0.0.0.0/0
- [ ] Tested login on Vercel URL

---

## 🔧 Troubleshooting

### Login still fails?

1. **Check Browser Console (F12):**
   - Look for 401 errors (auth issue)
   - Look for 500 errors (server issue)
   - Look for CORS errors

2. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Deployments
   - Click on your deployment
   - Click on **Functions** tab
   - Check `api/index.js` logs for errors

3. **Verify Environment Variables:**
   - Settings → Environment Variables
   - Make sure all 5 are there
   - Check for typos (especially in ADMIN_PASSWORD_HASH)

4. **Check MongoDB Connection:**
   - Login to MongoDB Atlas
   - Go to Network Access
   - Ensure 0.0.0.0/0 is in the IP whitelist

### Common Issues:

**Issue:** "Invalid credentials" error
**Solution:** 
- Verify you're using: `admin@factory.com` / `Admin@123!Factory`
- Check ADMIN_PASSWORD_HASH is set correctly in Vercel
- Redeploy after setting variables

**Issue:** "Server error" or no response
**Solution:**
- Check JWT_SECRET is set in Vercel
- Check MONGODB_URI is correct and MongoDB allows connections
- Check Vercel function logs for errors

**Issue:** CORS error in browser console
**Solution:**
- Already fixed in the latest code
- Make sure you deployed the latest commit (f9d06d5)
- Clear browser cache and try again

---

## 📞 Need Help?

If login still doesn't work after following all steps:

1. Check Vercel function logs for exact error
2. Verify all 5 environment variables are set
3. Make sure MongoDB Atlas allows connections
4. Try clearing browser cache and cookies
5. Test with incognito/private browsing mode

---

## 🎯 Quick Reference

**Login Credentials:**
- Email: `admin@factory.com`
- Password: `Admin@123!Factory`

**Required Environment Variables:**
1. MONGODB_URI
2. JWT_SECRET
3. ADMIN_EMAIL
4. ADMIN_PASSWORD_HASH
5. NODE_ENV

**Vercel Dashboard:** https://vercel.com/dashboard
**GitHub Repo:** https://github.com/Nirdesh5274/need
