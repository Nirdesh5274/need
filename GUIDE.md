# Factory Management System - Complete Guide

## 🎉 Your MERN Application is Ready!

This is a full-stack web application built with MongoDB, Express.js, React, and Node.js for managing factory operations.

## 📋 What's Included

### ✅ Complete Backend API
- **Authentication System** - Secure JWT-based login for owner
- **Product Management** - Full CRUD operations for inventory
- **Sales Management** - Track all sales transactions
- **Expense Management** - Record and categorize expenses
- **Reports API** - Generate various business reports

### ✅ Modern React Frontend
- **Dashboard** - Overview of sales, expenses, profit, and inventory
- **Inventory Page** - Manage products with stock tracking
- **Sales Page** - Create multi-product sales transactions
- **Expenses Page** - Record business expenses by category
- **Reports Page** - Visual charts and analytics

### ✅ Key Features
- 🔐 Secure owner-only authentication
- 📦 Inventory management with low-stock alerts
- 💰 Sales tracking with automatic inventory deduction
- 💳 Expense categorization and tracking
- 📊 Visual reports with charts (profit/loss, expenses breakdown)
- 📱 Responsive design for all devices
- ⚡ Real-time updates

### ✅ Deployment Ready
- Configured for Vercel deployment
- Production-ready with environment variables
- Detailed deployment documentation

## 🚀 Quick Start

### Option 1: Run the Setup Script (Easiest)

```powershell
cd c:\Users\HP\Desktop\factory
.\setup.ps1
```

This will automatically:
- Check Node.js installation
- Install all dependencies
- Create environment files
- Show next steps

### Option 2: Manual Setup

1. **Install Backend Dependencies**
   ```powershell
   cd backend
   npm install
   ```

2. **Configure Backend Environment**
   - Copy `backend/.env.example` to `backend/.env`
   - Add your MongoDB URI and JWT secret (see SETUP.md)

3. **Install Frontend Dependencies**
   ```powershell
   cd frontend
   npm install
   ```

4. **Configure Frontend Environment**
   - Copy `frontend/.env.example` to `frontend/.env`
   - Default settings work for local development

5. **Start Backend Server**
   ```powershell
   cd backend
   npm start
   ```
   Server runs on http://localhost:5000

6. **Start Frontend (in new terminal)**
   ```powershell
   cd frontend
   npm run dev
   ```
   App opens at http://localhost:3000

## 📁 Project Structure

```
factory/
├── backend/                      # Node.js/Express backend
│   ├── models/                   # MongoDB models
│   │   ├── User.js              # User authentication model
│   │   ├── Product.js           # Inventory product model
│   │   ├── Sale.js              # Sales transaction model
│   │   └── Expense.js           # Expense record model
│   ├── routes/                   # API route handlers
│   │   ├── auth.js              # Authentication routes
│   │   ├── products.js          # Product CRUD routes
│   │   ├── sales.js             # Sales management routes
│   │   ├── expenses.js          # Expense management routes
│   │   └── reports.js           # Reports and analytics routes
│   ├── middleware/               # Custom middleware
│   │   └── auth.js              # JWT authentication middleware
│   ├── server.js                # Express app setup
│   ├── package.json             # Backend dependencies
│   └── .env.example             # Environment variables template
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── Layout.jsx       # Main layout with sidebar
│   │   │   ├── Layout.css
│   │   │   └── PrivateRoute.jsx # Protected route wrapper
│   │   ├── context/             # React Context API
│   │   │   └── AuthContext.jsx  # Authentication state management
│   │   ├── pages/               # Page components
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   ├── Dashboard.jsx    # Dashboard with statistics
│   │   │   ├── Inventory.jsx    # Inventory management
│   │   │   ├── Sales.jsx        # Sales management
│   │   │   ├── Expenses.jsx     # Expense management
│   │   │   ├── Reports.jsx      # Reports and charts
│   │   │   └── Auth.css         # Shared auth styles
│   │   ├── utils/               # Utility functions
│   │   │   └── api.js           # Axios API client
│   │   ├── App.jsx              # Main app component with routing
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── index.html               # HTML template
│   ├── vite.config.js           # Vite configuration
│   ├── package.json             # Frontend dependencies
│   └── .env.example             # Frontend env template
│
├── vercel.json                   # Vercel deployment config
├── package.json                  # Root package.json for scripts
├── .gitignore                    # Git ignore rules
├── README.md                     # Project overview
├── SETUP.md                      # Environment setup guide
├── DEPLOYMENT.md                 # Vercel deployment guide
└── setup.ps1                     # Windows setup script
```

## 🔑 First Time Setup

### 1. Get MongoDB Connection String

**Option A: MongoDB Atlas (Recommended for deployment)**
1. Sign up at https://cloud.mongodb.com
2. Create a free cluster
3. Create database user
4. Whitelist IP addresses
5. Get connection string
6. Add to `backend/.env`

**Option B: Local MongoDB**
```
MONGODB_URI=mongodb://localhost:27017/factory
```

### 2. Generate JWT Secret

Run in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated string to `backend/.env`:
```
JWT_SECRET=your_generated_secret_here
```

### 3. Start Using the App

1. Go to http://localhost:3000/register
2. Create your owner account:
   - Username: yourname
   - Email: your@email.com
   - Password: (min 6 characters)
3. Login and start managing!

## 📊 Using the Application

### Dashboard
- View sales, expenses, profit statistics
- See low-stock alerts
- Filter by date range (week/month/year)

### Inventory Management
1. Click "Add Product"
2. Fill in product details:
   - Name, category, description
   - Quantity, cost price, selling price
   - SKU (optional), low stock threshold
3. Products appear in the table
4. Edit or delete as needed

### Creating a Sale
1. Click "New Sale"
2. Add customer info (optional)
3. Select payment method
4. Add products:
   - Choose product from dropdown
   - Enter quantity
   - Price auto-fills (editable)
5. Review total
6. Click "Create Sale"
7. Inventory automatically updates

### Recording Expenses
1. Click "Add Expense"
2. Enter details:
   - Title and description
   - Amount
   - Category (rent, utilities, salaries, etc.)
   - Vendor (optional)
   - Payment method
3. Save expense

### Viewing Reports
- **Profit/Loss Trend**: Line chart showing sales, expenses, profit over time
- **Expenses by Category**: Pie chart breakdown
- **Inventory Summary**: Total value, low stock items
- **Top Products**: Bar chart of highest value inventory

## 🌐 Deploying to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)
- MongoDB Atlas account (free)

### Quick Deploy Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/factory.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Add environment variables:
     - MONGODB_URI
     - JWT_SECRET
     - NODE_ENV=production
     - VITE_API_URL=/api
   - Click Deploy

3. **Access Your App**
   - Visit your Vercel URL
   - Register your account
   - Start using!

📖 **See DEPLOYMENT.md for detailed instructions**

## 🔧 Available Scripts

### Root Directory
```powershell
npm run install-all      # Install all dependencies
npm run build           # Build frontend for production
```

### Backend Directory
```powershell
npm start              # Start production server
npm run dev            # Start development server with nodemon
```

### Frontend Directory
```powershell
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
- **Vite** - Build tool
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **React Icons** - Icon library
- **date-fns** - Date utilities

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Protected API routes
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variables for secrets
- ✅ Owner-only access control

## 📝 API Documentation

### Authentication Endpoints

**POST /api/auth/register**
- Register new owner account
- Body: `{ username, email, password }`

**POST /api/auth/login**
- Login to account
- Body: `{ email, password }`
- Returns: `{ token, user }`

### Product Endpoints (Protected)

**GET /api/products**
- Get all products

**POST /api/products**
- Create new product
- Body: Product details

**PUT /api/products/:id**
- Update product

**DELETE /api/products/:id**
- Delete product

### Sales Endpoints (Protected)

**GET /api/sales**
- Get all sales
- Query params: startDate, endDate

**POST /api/sales**
- Create new sale
- Automatically updates inventory

**DELETE /api/sales/:id**
- Delete sale (restores inventory)

### Expense Endpoints (Protected)

**GET /api/expenses**
- Get all expenses
- Query params: startDate, endDate, category

**POST /api/expenses**
- Create expense

**PUT /api/expenses/:id**
- Update expense

**DELETE /api/expenses/:id**
- Delete expense

### Report Endpoints (Protected)

**GET /api/reports/dashboard**
- Dashboard summary statistics

**GET /api/reports/profit-loss**
- Profit/loss over time

**GET /api/reports/expenses**
- Expenses by category

**GET /api/reports/inventory**
- Inventory report with valuation

## ❓ Troubleshooting

### Backend won't start
- Check MongoDB connection string in .env
- Ensure MongoDB is running (if local)
- Verify all dependencies are installed

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check VITE_API_URL in frontend/.env
- Look for CORS errors in browser console

### Authentication not working
- Verify JWT_SECRET is set in backend/.env
- Clear browser cookies and localStorage
- Check token in localStorage (DevTools → Application)

### Deployment issues
- Verify all environment variables in Vercel
- Check build logs for errors
- Ensure MongoDB Atlas allows Vercel IPs

## 📚 Additional Resources

- **MongoDB Documentation**: https://docs.mongodb.com/
- **Express.js Guide**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **Vercel Docs**: https://vercel.com/docs
- **Vite Guide**: https://vitejs.dev/guide/

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Run the application locally
3. ✅ Register your owner account
4. ✅ Add some test data
5. ✅ Explore all features
6. ✅ Deploy to Vercel
7. 🚀 Start managing your factory!

## 💡 Tips

- **Backup**: Regularly backup your MongoDB database
- **Security**: Use strong passwords and keep JWT secret secure
- **Monitoring**: Check Vercel analytics and MongoDB metrics
- **Updates**: Keep dependencies updated for security patches
- **Testing**: Test thoroughly before production use

## 🤝 Support

Need help? Check these resources:
1. Read README.md, SETUP.md, and DEPLOYMENT.md
2. Review the troubleshooting section above
3. Check browser console for errors
4. Review Vercel deployment logs
5. Verify MongoDB Atlas connection

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Factory Managing! 🏭✨**

Built with ❤️ using the MERN stack
