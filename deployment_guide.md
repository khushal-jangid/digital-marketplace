# Full-Stack Deployment Guide

This guide details the step-by-step process for deploying the **Digital Project Marketplace** frontend to **Vercel** and the backend API to **Render**.

---

## Step 1: Push your Code to GitHub

Before deploying, push your full-stack folder to a private or public GitHub repository.

Run these commands in your project root terminal (`C:\Users\choya\digital-marketplace`):

```bash
# Initialize git repository
git init

# Create a .gitignore in the root (if not already present)
echo "node_modules/\n.env\ndist/\npackage-lock.json" > .gitignore

# Stage all files
git add .

# Commit changes
git commit -m "feat: complete fullstack codebase with responsive layouts and mock database"

# Create a new repository on GitHub.com and link it
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## Step 2: Deploy the Backend to Render

[Render](https://render.com) is a great free hosting platform for Node.js Express servers.

1. Go to the [Render Dashboard](https://dashboard.render.com/) and sign in.
2. Click **New** (top right) -> **Web Service**.
3. Connect your GitHub account and select your repository.
4. Configure the Web Service settings:
   * **Name**: `apex-marketplace-backend`
   * **Root Directory**: `backend` (⚠️ *Very Important*)
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
   * **Instance Type**: `Free`
5. Click **Advanced** to add **Environment Variables**:
   * `PORT`: `5000`
   * `JWT_SECRET`: `your_random_secret_string`
   * `MONGO_URI`: *(Optional)* Leave blank to run the server in **Mock/Sandbox Mode** automatically. If you want a real persistent DB, paste a MongoDB Atlas connection string.
   * `RAZORPAY_KEY_ID`: *(Optional)* Leave blank to run in mock sandbox payment mode.
   * `RAZORPAY_KEY_SECRET`: *(Optional)*
   * `EMAIL_USER`: *(Optional)* Your Gmail/SMTP email.
   * `EMAIL_PASS`: *(Optional)* Your Gmail App Password.
6. Click **Create Web Service**. 
7. Once deployed, Render will provide a public URL (e.g., `https://apex-marketplace-backend.onrender.com`). **Copy this URL**.

---

## Step 3: Deploy the Frontend to Vercel

[Vercel](https://vercel.com) is the optimal platform for React + Vite Single Page Applications (SPAs).

1. Go to the [Vercel Dashboard](https://vercel.com/) and sign in.
2. Click **Add New** -> **Project**.
3. Select your GitHub repository.
4. Configure the project settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click **Edit** and select `frontend` (⚠️ *Very Important*)
   * **Build & Development Settings**: Keep defaults (Vercel automatically detects `npm run build` and `dist` output).
5. Add **Environment Variables**:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://YOUR-RENDER-BACKEND-URL.onrender.com/api` (The Render URL copied from Step 2 with `/api` appended at the end).
6. Click **Deploy**.
7. Vercel will build and host the app in under 1 minute, providing a custom production URL!

---

## Step 4: Add CORS Origin (Optional but Recommended)

To ensure secure requests between Vercel and Render:
1. Open [backend/server.js](file:///C:/Users/choya/digital-marketplace/backend/server.js).
2. Ensure Vercel's production URL is added to the CORS configuration to prevent browser blockages.
