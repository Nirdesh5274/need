# Quick Reference Card

## 🚀 Getting Started (3 Steps)

### 1. Install Dependencies
```powershell
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure Environment
Create `backend/.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
PORT=5000
NODE_ENV=development
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the App
**Terminal 1 (Backend):**
```powershell
cd backend
npm start
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

**Open:** http://localhost:3000

---

## 📦 Project Structure

```
factory/
├── backend/          # Express API server
│   ├── models/       # Database models
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth middleware
│   └── server.js     # Entry point
├── frontend/         # React app
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page views
│       ├── context/     # Auth context
│       └── utils/       # API client
└── vercel.json       # Deployment config
```

---

## 🔑 Essential Commands

### Development
```powershell
# Backend
cd backend
npm run dev          # Start with nodemon (auto-reload)

# Frontend  
cd frontend
npm run dev          # Start dev server (http://localhost:3000)
```

### Production
```powershell
npm run build        # Build frontend for production
```

### Deployment
```powershell
vercel              # Deploy to Vercel
vercel --prod       # Deploy to production
```

---

## 🌐 API Endpoints

### Auth (Public)
- `POST /api/auth/register` - Register owner
- `POST /api/auth/login` - Login

### Products (Protected)
- `GET /api/products` - List all
- `POST /api/products` - Create
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Delete

### Sales (Protected)
- `GET /api/sales` - List all
- `POST /api/sales` - Create (auto-updates inventory)
- `DELETE /api/sales/:id` - Delete (restores inventory)

### Expenses (Protected)
- `GET /api/expenses` - List all
- `POST /api/expenses` - Create
- `PUT /api/expenses/:id` - Update
- `DELETE /api/expenses/:id` - Delete

### Reports (Protected)
- `GET /api/reports/dashboard` - Summary stats
- `GET /api/reports/profit-loss` - P&L trend
- `GET /api/reports/expenses` - By category
- `GET /api/reports/inventory` - Stock report

---

## 🔧 Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection | `mongodb+srv://...` |
| JWT_SECRET | JWT secret key | 32+ char random string |
| PORT | Server port | `5000` |
| NODE_ENV | Environment | `development` or `production` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | `http://localhost:5000/api` |

---

## 📊 App Features

### Dashboard
- Sales, expenses, profit overview
- Low stock alerts
- Date filtering

### Inventory
- Add/edit/delete products
- Track quantities
- Low stock thresholds
- Search functionality

### Sales
- Multi-product sales
- Auto inventory deduction
- Customer tracking
- Payment methods

### Expenses
- Categorized tracking
- Vendor management
- Multiple payment types
- Date filtering

### Reports
- Profit/Loss charts
- Expense breakdown (pie chart)
- Inventory valuation
- Top products (bar chart)

---

## 🚨 Common Issues & Fixes

### "Cannot connect to database"
✅ Check MongoDB URI in backend/.env
✅ Verify MongoDB is running
✅ Check network access in MongoDB Atlas

### "Token is not valid"
✅ Ensure JWT_SECRET is set
✅ Clear browser localStorage
✅ Re-login to get new token

### "API calls return 404"
✅ Ensure backend is running on port 5000
✅ Check VITE_API_URL in frontend/.env
✅ Verify no typos in API endpoints

### Build fails on Vercel
✅ Check all env vars are set in Vercel
✅ Ensure package.json files are correct
✅ Review build logs for specific errors

---

## 📱 Default Ports

- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000
- **MongoDB (local):** mongodb://localhost:27017

---

## 🔒 Security Checklist

- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Never commit .env files
- ✅ Use HTTPS in production
- ✅ Whitelist only necessary IPs in MongoDB
- ✅ Keep dependencies updated
- ✅ Use strong passwords
- ✅ Enable 2FA on Vercel and MongoDB Atlas

---

## 📚 Quick Links

- **MongoDB Atlas:** https://cloud.mongodb.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Generate JWT Secret:** 
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## 🎯 First Time Setup Flow

1. ✅ Install Node.js
2. ✅ Clone/download project
3. ✅ Create MongoDB database
4. ✅ Configure .env files
5. ✅ Install dependencies
6. ✅ Start backend server
7. ✅ Start frontend dev server
8. ✅ Register at /register
9. ✅ Start using the app!

---

## 🚀 Deploy to Vercel Flow

1. ✅ Push code to GitHub
2. ✅ Import repo in Vercel
3. ✅ Add environment variables
4. ✅ Deploy
5. ✅ Register your account
6. ✅ Done!

---

## 💾 Database Collections

- **users** - Owner accounts
- **products** - Inventory items
- **sales** - Sales transactions
- **expenses** - Expense records

---

## 🎨 Tech Stack

**Frontend:** React + Vite + Recharts  
**Backend:** Node.js + Express  
**Database:** MongoDB + Mongoose  
**Auth:** JWT + bcryptjs  
**Deployment:** Vercel

---

**Need more help?** Check GUIDE.md for complete documentation!
