# 🏭 AluTrade PRO — Aluminum Trading & Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express.js-v4-black.svg)](https://expressjs.com/)
[![Render](https://img.shields.io/badge/Deploy-Render-purple.svg)](https://render.com/)

**AluTrade PRO** is an enterprise-grade commodity trading, spot rate monitoring, and AI-powered portfolio analytics platform tailored for physical aluminum trading (ingots, primary alloys, extrusion scrap, and industrial metal lots).

---

## ✨ Key Features

- ⚡ **Real-Time Spot Rate Intelligence:** Monitor LME (London Metal Exchange) and MCX spot prices, 24h highs/lows, and price trends.
- 🤖 **Gemini AI Commodity Analyst:** Interactive AI Copilot providing custom buying/selling target entry prices, GST tax margin calculations, and strategic market forecasts.
- 📊 **Holdings & Ledger Management:** Track active aluminum inventory lots, weighted average purchase costs, unsold quantities, and real-time unrealized PnL.
- 🧮 **GST & Profit Calculator:** Built-in 18% Input Tax Credit (ITC) margin calculator tailored for industrial metal trading transactions.
- 📄 **Reports & Document Export:** Download automated PDF Invoices, Excel Ledgers, and share live WhatsApp Spot Rate Cards.
- 🗄️ **PostgreSQL DB Integration:** Robust database persistence with automatic table setup and seed data fallback.

---

## 📁 Repository Architecture

The project is cleanly decoupled into **`frontend`** and **`backend`** services:

```text
aluminiumtrade/
├── 📁 frontend/                # React + Vite Single Page Application
│   ├── 📁 src/
│   │   ├── 📁 components/      # UI Views (Dashboard, Market, AiAnalyst, Ledger, Buy/Sell)
│   │   ├── 📁 context/         # React Context State Management
│   │   └── 📁 lib/             # Export Utilities (PDF, Excel, WhatsApp)
│   ├── index.html              # Frontend Entry Point
│   ├── vite.config.ts          # Vite Configuration with API Proxy
│   └── package.json            # Frontend Dependencies & Scripts
│
├── 📁 backend/                 # Node.js + Express Backend Server
│   ├── server.ts               # Express REST API, PostgreSQL, & Gemini AI
│   └── package.json            # Backend Dependencies & Scripts
│
└── package.json                # Root Workspace Commands
```

---

## 🚀 Local Setup & Development

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **bun**

### 2. Installation
Install dependencies in both frontend and backend:

```bash
# Clone the repository
git clone https://github.com/ArhaTechnologies/aluminiumtrade.git
cd aluminiumtrade

# Install dependencies for both services
npm run install:all
```

Alternatively, install individually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Variables
Create `.env` files in both `/backend` and `/frontend` using the provided `.env.example` templates:

**Backend (`/backend/.env`):**
```env
PORT=3000
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
DATABASE_URL="postgresql://postgres:password@localhost:5432/alutrade"
```

**Frontend (`/frontend/.env`):**
```env
VITE_API_URL="http://localhost:3000"
```

### 4. Running the Development Servers

Run backend and frontend concurrently:

```bash
# Start Backend API Server (http://localhost:3000)
npm run dev:backend

# Start Frontend Dev Server (http://localhost:5173)
npm run dev:frontend
```

---

## 🌐 Deploying to Render

### Option 1: Deploy Unified Web Service (Recommended)
You can deploy the complete platform as a single **Web Service** on [Render](https://render.com):

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect repository: `ArhaTechnologies/aluminiumtrade`.
4. Configure service settings:
   - **Name:** `aluminiumtrade`
   - **Runtime:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm run install:all && npm --prefix frontend run build && npm --prefix backend run build`
   - **Start Command:** `npm --prefix backend run start`
5. Add **Environment Variables**:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = *Your Gemini API Key*
   - `DATABASE_URL` = *Your PostgreSQL Connection String (Render Postgres or Supabase)*

### Option 2: Deploy Frontend & Backend Separately
- **Backend Service:** Set **Root Directory** to `backend`, Build: `npm install && npm run build`, Start: `npm start`.
- **Frontend Static Site:** Set **Root Directory** to `frontend`, Build: `npm install && npm run build`, Publish Directory: `dist`. Set `VITE_API_URL` to your backend Render URL.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
