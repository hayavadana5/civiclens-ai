# CivicLens AI — Production Deployment Guide

This guide covers deploying **CivicLens AI** to production.

---

## 1. Architecture Overview

- **Frontend**: Vite + React 18 + TailwindCSS + Leaflet + Recharts (Deploy on **Vercel**, **Netlify**, or **Cloudflare Pages**).
- **Backend**: Node.js + Express + TypeScript + Mongoose (Deploy on **Render**, **Railway**, or **AWS/DigitalOcean**).
- **Database**: **MongoDB Atlas** (Free M0 cluster).

---

## 2. Pre-Deployment Checklist

- [x] **Backend TypeScript build**: Compiles cleanly with zero errors (`tsc -p tsconfig.json` -> `dist/`).
- [x] **Frontend production build**: Bundles cleanly (`npm run build` -> `dist/`).
- [x] **CORS setup**: Pre-configured to support local ports and deployed domains (`*.vercel.app`, `*.onrender.com`, or custom domain).
- [x] **Environment variables**: Separated into client (`VITE_*`) and server (`MONGODB_URI`, `PORT`, `CORS_ORIGIN`).

---

## 3. Step-by-Step Deployment (Recommended: Vercel + Render + MongoDB Atlas)

### Step A: Set up Free MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a free shared cluster (**M0 Sandbox**).
3. Under **Database Access**, create a database user (e.g. `civiclens_admin` + password).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Drivers** -> Copy connection URI:
   ```
   mongodb+srv://civiclens_admin:<password>@cluster0.xxxxx.mongodb.net/civiclens?retryWrites=true&w=majority
   ```

---

### Step B: Deploy Backend (Render / Railway)

#### Deploying on Render (Free Web Service):
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `backend/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   | Variable | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` (or leave default) | Render sets port automatically |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `CORS_ORIGIN` | `*` (or your Vercel URL) | Allows frontend calls |
   | `GEMINI_API_KEY` | *(Optional)* | For Gemini AI triage (fallback runs if empty) |
6. Click **Create Web Service**. Once deployed, copy the Render service URL (e.g. `https://civiclens-api.onrender.com`).

#### Seed Initial Production Data (Optional):
In Render Shell or locally pointing at Atlas:
```bash
MONGODB_URI="mongodb+srv://..." npm run seed
```

---

### Step C: Deploy Frontend (Vercel / Netlify)

#### Deploying on Vercel:
1. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Root Directory**: Select `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://civiclens-api.onrender.com/api` (Your backend URL + `/api`) |
5. Click **Deploy**. Your app will be live at `https://civiclens-ai.vercel.app`!

---

## 4. Single-Server / VPS Deployment (Docker / PM2)

If you are deploying to a single Ubuntu/Debian server (AWS EC2, DigitalOcean Droplet, Linode):

1. **Install Node.js 18+ and MongoDB / Docker**:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm mongodb
   ```
2. **Clone and Build**:
   ```bash
   git clone <repo_url>
   cd civiclensai
   npm run build
   ```
3. **Run Backend with PM2**:
   ```bash
   npm install -g pm2
   cd backend/backend
   pm2 start dist/server.js --name civiclens-api
   ```
4. **Serve Frontend via Nginx**:
   Point Nginx root to `/path/to/civiclensai/frontend/dist` and proxy `/api/` requests to `http://localhost:5000/api/`.

---

## 5. Verification After Deployment

1. **Health Check**: Visit `https://your-api.onrender.com/api/health` -> should return `{"success": true, "status": "ok"}`.
2. **Dashboard**: Open your frontend domain -> should load citywide statistics and Bangalore zones.
3. **Auth Check**: Create a test citizen account with OTP verification and verify database persistence.
