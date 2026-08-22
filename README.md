# ApexMarket - Full-Stack Digital Project Marketplace

ApexMarket is a production-ready, full-stack digital marketplace where users can browse, purchase, and download premium developer files (source code, templates, PDFs, ZIP archives).

## 🚀 Key Features

*   **Secure Auth**: Sign up, Login, and Edit Profiles using JWT (JSON Web Tokens) with passwords hashed by `bcrypt`.
*   **Wishlist & Cart**: Interactive wishlist additions, persistable carts, and dynamic pricing calculations.
*   **Secure Downloads**: Implements signed URL structures. Upon paid verification, the server generates a 15-minute JWT-signed token. File streams are processed server-side (Express) with download attempt logs, capping access at 5 downloads per transaction to prevent URL leaks and sharing.
*   **Mock & Sandbox Mode**: Out-of-the-box local testing capabilities. If Razorpay keys and SMTP credentials are left blank in `.env`, the system automatically runs a sandbox checkout flow (instantly verifying payments) and prints purchase confirmation emails to the server console log.
*   **Referral System**: Generates unique referral codes for users. Signups with code credit **INR 100** instantly to the referrer.
*   **Admin Dashboard**:
    *   *Analytics panel*: Visual interactive custom SVG trend graphs charting sales revenue over time.
    *   *Inventory controller*: Create new catalog projects (with in-memory buffer file uploads), update descriptions, and delete products.
    *   *Coupon configurations*: Configures percentage/fixed promo codes with min-order checks and validity checks.
*   **Support Chat**: Integrated help tickets thread with simulated live support agent answers.
*   **Responsive PWA UI**: Dark-first glassmorphism styling, clean slide-in transitions, and service workers caching core layout pages for offline installs.

---

## 📂 Project Directory Structure

```text
digital-marketplace/
├── backend/
│   ├── config/
│   │   ├── db.js             # Mongoose MongoDB connection
│   │   ├── mail.js           # Nodemailer config (SMTP or console logger)
│   │   ├── razorpay.js       # Razorpay client & signature checks
│   │   └── storage.js        # Local secure upload directories & JWT signed urls
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── couponController.js
│   │   ├── orderController.js
│   │   ├── projectController.js
│   │   ├── reviewController.js
│   │   └── supportController.js
│   ├── middleware/
│   │   └── auth.js           # Route guards (protect / admin roles)
│   ├── models/
│   │   ├── Coupon.js
│   │   ├── DownloadLog.js
│   │   ├── Order.js
│   │   ├── Project.js
│   │   ├── Review.js
│   │   ├── SupportMessage.js
│   │   └── User.js
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── couponRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── supportRoutes.js
│   ├── uploads/
│   │   └── secure/           # Server directory for physical file uploads
│   ├── .env                  # Backend environment settings
│   ├── package.json
│   └── server.js             # Express startup with automatic DB seeders
├── frontend/
│   ├── public/
│   │   ├── manifest.json     # PWA configurations
│   │   └── sw.js             # Offline service worker cache
│   ├── src/
│   │   ├── components/       # Shared headers, loaders, cards, and guards
│   │   ├── context/          # State managers (Auth, Cart, Themes)
│   │   ├── pages/            # Viewports (Landing, Details, Cart, Dashboards)
│   │   ├── utils/
│   │   │   └── api.js        # HTTP Fetch requests with header token injectors
│   │   ├── App.jsx
│   │   ├── index.css         # Global variables design styles
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js        # Development server routing proxies
└── README.md
```

---

## 🛠️ Step-by-Step Setup Guide

### Prerequisites
*   Node.js (v18+)
*   MongoDB running locally (`mongodb://localhost:27017`) OR a remote MongoDB Atlas connection string.

### 1. Set Up Backend Env
Create a file named `.env` in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/project_marketplace
JWT_SECRET=super_secret_jwt_token_key_for_digital_marketplace_web_app_2026
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Razorpay (Optional - Leave blank to run sandbox sandbox mode automatically)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Mail Setup (Optional - Leave blank to print emails to server terminal logs)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Digital Marketplace" <noreply@digitalmarketplace.com>
```

### 2. Run the Servers

To start the backend server:
```bash
cd backend
npm run dev
```

To start the frontend application:
```bash
cd frontend
npm run dev
```

The frontend will run at `http://localhost:5173`. Vite is configured with a development proxy redirecting `/api` traffic directly to `http://localhost:5000/api`.

---

## 🔒 Security Architectures

1.  **Signed Downloads URLs**:
    When a purchase verification matches a paid transaction, the server signs a JWT containing the `fileKey`, `userId`, `projectId`, and `orderId`. This URL token is only valid for **15 minutes**.
2.  **Download Throttling**:
    The Express download route checks the `DownloadLog` collection. Every download registers the request timestamp and client IP address. If the counter meets the limit of **5 attempts**, further downloads are denied.
3.  **Path Traversal Prevention**:
    Project files are stored outside of the standard public directories under `backend/uploads/secure/`. They cannot be accessed via direct URL paths. The file stream is piped directly through Node's `res.download(filePath, originalName)` block after JWT decryption matches active purchase criteria.

---

## 🚀 Deployment Instructions

### Docker Setup
To containerize this stack, add a `Dockerfile` in both directory roots and use `docker-compose.yml`:
```yaml
version: '3.8'
services:
  database:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://database:27017/project_marketplace
      - JWT_SECRET=prod_secret
    depends_on:
      - database

  web:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api
```

### CI/CD Deployment pipeline
We can set up a GitHub Action pipeline (`.github/workflows/deploy.yml`) to run tests and push builds automatically to host platforms (e.g. Render, AWS Elastic Beanstalk):
```yaml
name: Deploy Pipeline
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Test
        run: |
          cd backend && npm install && npm test
          cd ../frontend && npm install && npm run build
```
