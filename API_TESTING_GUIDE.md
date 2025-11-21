# API Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication
First, login to get a token:

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@factory.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "username": "owner",
    "email": "owner@factory.com"
  }
}
```

**Use this token in all subsequent requests:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📦 Products (Inventory) API

### 1. Create Product
```bash
POST /api/products
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Steel Rod",
  "description": "High-quality steel rod for manufacturing",
  "sku": "STL-001",
  "barcode": "1234567890123",
  "category": "Raw Materials",
  "quantity": 500,
  "price": 150,
  "costPrice": 100,
  "lowStockThreshold": 50,
  "reorderLevel": 100,
  "unit": "pcs",
  "location": {
    "aisle": "A1",
    "shelf": "S2",
    "bin": "B3"
  },
  "supplier": {
    "name": "Steel Corp",
    "contact": "1234567890"
  },
  "tags": ["steel", "manufacturing", "raw-material"]
}
```

### 2. Get All Products with Filters
```bash
GET /api/products?page=1&limit=20&search=steel&category=Raw%20Materials&stockStatus=in_stock&sortBy=name&sortOrder=asc
Authorization: Bearer YOUR_TOKEN
```

### 3. Get Product Statistics
```bash
GET /api/products/statistics
Authorization: Bearer YOUR_TOKEN
```

### 4. Adjust Stock
```bash
POST /api/products/PRODUCT_ID/adjust-stock
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "adjustment": -10,
  "type": "out",
  "reason": "Manual adjustment",
  "notes": "Damaged items removed"
}
```

### 5. Get Low Stock Alerts
```bash
GET /api/products/alerts/low-stock
Authorization: Bearer YOUR_TOKEN
```

### 6. Bulk Price Update
```bash
POST /api/products/bulk/update-prices
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "productIds": ["id1", "id2", "id3"],
  "priceChange": 10,
  "type": "increase"
}
```

---

## 💰 Sales API

### 1. Create Sale
```bash
POST /api/sales
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "products": [
    {
      "product": "PRODUCT_ID_1",
      "quantity": 2,
      "price": 150
    },
    {
      "product": "PRODUCT_ID_2",
      "quantity": 1,
      "price": 300
    }
  ],
  "customer": {
    "name": "ABC Manufacturing",
    "phone": "9876543210",
    "email": "abc@example.com",
    "address": {
      "street": "123 Industrial Area",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  },
  "discount": {
    "type": "percentage",
    "value": 10
  },
  "tax": {
    "type": "percentage",
    "value": 18,
    "name": "GST"
  },
  "shipping": {
    "cost": 100,
    "method": "Standard Delivery"
  },
  "paymentMethod": "bank_transfer",
  "notes": "Urgent delivery required"
}
```

### 2. Get All Sales with Filters
```bash
GET /api/sales?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31&paymentStatus=paid&search=INV-202412
Authorization: Bearer YOUR_TOKEN
```

### 3. Get Sales Analytics
```bash
GET /api/sales/analytics/summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer YOUR_TOKEN
```

### 4. Update Payment Status
```bash
PATCH /api/sales/SALE_ID/payment-status
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentDate": "2024-12-20",
  "paymentAmount": 600,
  "paymentNotes": "Paid via bank transfer"
}
```

### 5. Update Delivery Status
```bash
PATCH /api/sales/SALE_ID/delivery-status
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "deliveryStatus": "shipped",
  "trackingNumber": "TRK123456",
  "courierName": "DHL Express"
}
```

---

## 💸 Expenses API

### 1. Create Expense
```bash
POST /api/expenses
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Factory Electricity Bill",
  "description": "Monthly electricity bill for December 2024",
  "amount": 25000,
  "category": "Utilities",
  "subcategory": "Electricity",
  "paymentMethod": "bank_transfer",
  "paymentStatus": "paid",
  "vendor": {
    "name": "State Electricity Board",
    "contact": "1800-xxx-xxxx",
    "email": "support@electricity.gov"
  },
  "department": "Operations",
  "taxDeductible": true,
  "expenseDate": "2024-12-20",
  "notes": "Bill number: EB-2024-12-001"
}
```

### 2. Create Recurring Expense
```bash
POST /api/expenses/recurring/create
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Monthly Rent",
  "description": "Factory rent payment",
  "amount": 50000,
  "category": "Rent",
  "frequency": "monthly",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "paymentMethod": "bank_transfer",
  "vendor": {
    "name": "Property Owner Name",
    "contact": "9876543210"
  }
}
```

### 3. Get All Expenses with Filters
```bash
GET /api/expenses?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31&category=Utilities&paymentStatus=paid
Authorization: Bearer YOUR_TOKEN
```

### 4. Get Expense Analytics
```bash
GET /api/expenses/analytics/summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer YOUR_TOKEN
```

### 5. Get Recurring Expenses
```bash
GET /api/expenses/recurring/list
Authorization: Bearer YOUR_TOKEN
```

### 6. Get Pending Approvals
```bash
GET /api/expenses/approvals/pending
Authorization: Bearer YOUR_TOKEN
```

### 7. Approve/Reject Expense
```bash
PATCH /api/expenses/EXPENSE_ID/approval
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "approved",
  "comments": "Approved for payment"
}
```

---

## 📊 Reports API

### 1. Dashboard Summary
```bash
GET /api/reports/dashboard?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer YOUR_TOKEN
```

Response includes:
- Sales metrics (total, count, average, profit)
- Expense metrics (total, count, average)
- Net profit and margin
- Inventory metrics
- Payment breakdown

### 2. Sales Report
```bash
GET /api/reports/sales?startDate=2024-01-01&endDate=2024-12-31&groupBy=monthly
Authorization: Bearer YOUR_TOKEN
```

GroupBy options: `daily`, `weekly`, `monthly`, `yearly`

### 3. Expenses Report
```bash
GET /api/reports/expenses?startDate=2024-01-01&endDate=2024-12-31&groupBy=monthly
Authorization: Bearer YOUR_TOKEN
```

### 4. Profit & Loss Statement
```bash
GET /api/reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31&groupBy=monthly
Authorization: Bearer YOUR_TOKEN
```

### 5. Inventory Report
```bash
GET /api/reports/inventory?category=Raw%20Materials
Authorization: Bearer YOUR_TOKEN
```

### 6. Cash Flow Report
```bash
GET /api/reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer YOUR_TOKEN
```

### 7. Export All Data
```bash
GET /api/reports/export/all?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer YOUR_TOKEN
```

---

## 🧪 Testing with cURL

### Example: Create a Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "category": "Testing",
    "quantity": 100,
    "price": 50,
    "costPrice": 30,
    "lowStockThreshold": 10
  }'
```

### Example: Get Dashboard
```bash
curl -X GET "http://localhost:5000/api/reports/dashboard?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🧪 Testing with Postman

1. **Import Collection**: Create a new collection called "Factory Management"
2. **Set Environment Variable**:
   - Variable: `base_url`
   - Value: `http://localhost:5000/api`
   - Variable: `token`
   - Value: (will be set after login)

3. **Login Request**:
   - Save the token from response
   - Set it to environment variable `{{token}}`

4. **Use in Other Requests**:
   - URL: `{{base_url}}/products`
   - Headers: `Authorization: Bearer {{token}}`

---

## 📝 Common Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

### Date Filtering
- `startDate`: Start date (ISO format: 2024-01-01)
- `endDate`: End date (ISO format: 2024-12-31)

### Sorting
- `sortBy`: Field name to sort by
- `sortOrder`: `asc` or `desc`

### Search
- `search`: Search term (searches across multiple fields)

### Status Filters
- `paymentStatus`: pending, partial, paid, refunded
- `deliveryStatus`: pending, shipped, delivered, cancelled
- `stockStatus`: in_stock, low_stock, out_of_stock, reorder

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "message": "Insufficient stock for Product Name. Available: 5"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 404 Not Found
```json
{
  "message": "Product not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## 🔗 Quick Links

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- MongoDB: mongodb://localhost:27017/factory

---

**Happy Testing! 🚀**
