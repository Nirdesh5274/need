# Factory Management System 🏭

A modern, secure factory management system built with MERN stack. Clean, simple, and production-ready!

## ✨ Features

- 🔐 **Secure Authentication** - Single admin login with bcrypt & JWT
- 📦 **Inventory Management** - Simple product tracking with low-stock alerts
- 💰 **Sales Tracking** - Record sales with auto-invoice generation
- 💳 **Expense Management** - Track expenses with auto-numbering
- 📊 **Dashboard** - Real-time stats with beautiful glassmorphic design
- 📱 **Responsive** - Works perfectly on all devices

## 🚀 Quick Deploy to Vercel

### One-Click Deploy (Recommended)

1. **Fork this repository**
2. **Go to [Vercel](https://vercel.com)** and import your fork
3. **Deploy Backend:**
   - Root Directory: `backend`
   - Add Environment Variables:
     ```
     MONGODB_URI=your_mongodb_atlas_connection_string
     JWT_SECRET=your_random_secret_key_minimum_32_characters
     ADMIN_PASSWORD_HASH=your_bcrypt_hashed_password
     PORT=5000
     ```
   - Click Deploy

4. **Deploy Frontend:**
   - Root Directory: `frontend`
   - Add Environment Variables:
     ```
     VITE_API_URL=https://your-backend-url.vercel.app/api
     ```
   - Click Deploy

5. **Done!** 🎉

### Login Credentials
- Email: `admin@factory.com`
- Password: `Admin@123!Factory` 

## Tech Stack

**Frontend:**
- React 18
- React Router v6
- Recharts (for data visualization)
- Axios
- Vite

**Backend:**
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd factory
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the backend directory:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=production
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

   Create a `.env` file in the frontend directory:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Running Locally

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on http://localhost:5000

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on http://localhost:3000

3. **Register an Account**
   - Navigate to http://localhost:3000/register
   - Create your owner account
   - Login and start managing your factory!

## Deployment on Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas account (for cloud database)

### Steps

1. **Prepare MongoDB Atlas**
   - Create a free cluster on MongoDB Atlas
   - Get your connection string
   - Whitelist Vercel's IP addresses (0.0.0.0/0 for all IPs)

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings on Vercel
   - Add environment variables:
     - `MONGODB_URI` - Your MongoDB Atlas connection string
     - `JWT_SECRET` - A secure random string
     - `NODE_ENV` - production
     - `VITE_API_URL` - Your Vercel API URL (e.g., https://your-app.vercel.app/api)

5. **Redeploy**
   ```bash
   vercel --prod
   ```

### Alternative: Deploy via GitHub

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

## Project Structure

```
factory/
├── backend/
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Page components
│   │   ├── utils/       # Utilities (API client)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── vercel.json          # Vercel configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new owner
- `POST /api/auth/login` - Login

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `DELETE /api/sales/:id` - Delete sale

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Reports
- `GET /api/reports/dashboard` - Dashboard summary
- `GET /api/reports/profit-loss` - Profit/loss report
- `GET /api/reports/expenses` - Expenses by category
- `GET /api/reports/inventory` - Inventory report

## Features Overview

### Dashboard
- Real-time statistics for sales, expenses, profit, and inventory
- Low stock alerts
- Date range filtering

### Inventory Management
- Add, edit, and delete products
- Track stock quantities
- Set low-stock thresholds
- Search and filter products

### Sales Management
- Create sales with multiple products
- Automatic inventory deduction
- Customer information tracking
- Multiple payment methods

### Expense Management
- Track expenses by category
- Vendor management
- Multiple payment methods
- Detailed expense records

### Reports & Analytics
- Profit/Loss trends over time
- Expenses breakdown by category
- Inventory valuation
- Top products by value
- Visual charts and graphs

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Owner-only access control

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.
