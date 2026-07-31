import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { GoogleGenAI, Type } from '@google/genai';

const { Pool, Client } = pkg;

const currentFilename = typeof __filename !== 'undefined' ? __filename : '';
const currentDirname = typeof __dirname !== 'undefined' ? __dirname : (currentFilename ? path.dirname(currentFilename) : process.cwd());

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Backend Health & API Status Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'AluTrade PRO Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      aiChat: '/api/ai/chat (POST)',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Lazy-initialized PostgreSQL Connection Pool
let pgPool: InstanceType<typeof Pool> | null = null;

// Global Server In-Memory Store (Synchronized across all devices if PostgreSQL is offline)
const inMemoryUsers: any[] = [];
const inMemoryPurchases: any[] = [];
const inMemorySales: any[] = [];

function getPgPool() {
  if (!pgPool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5433/aluminum_trading';
    pgPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

// Ensure Database exists on PostgreSQL server
async function ensureDatabaseExists() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5433/aluminum_trading';
  try {
    const parsed = new URL(dbUrl);
    const dbName = parsed.pathname.substring(1) || 'aluminum_trading';
    
    // Connect to postgres default DB to check/create target DB
    parsed.pathname = '/postgres';
    const rootClient = new Client({ connectionString: parsed.toString() });
    await rootClient.connect();
    
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`[PostgreSQL Setup] Database "${dbName}" not found. Creating database...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[PostgreSQL Setup] Database "${dbName}" created successfully!`);
    }
    await rootClient.end();
  } catch (err: any) {
    console.log(`[PostgreSQL Setup] DB check info: ${err.message}`);
  }
}

// Check database connection & initialize tables + demo seed data
async function initPostgresDb() {
  await ensureDatabaseExists();
  const pool = getPgPool();
  if (!pool) return { ok: false, error: 'DATABASE_URL environment variable is not set.' };

  try {
    const client = await pool.connect();
    try {
      // Create tables for AluTrade platform
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          full_name VARCHAR(100) NOT NULL,
          dob VARCHAR(20),
          email VARCHAR(100),
          phone VARCHAR(50),
          kyc_id VARCHAR(50),
          wallet_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
          pin VARCHAR(10) DEFAULT '1234',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS purchases (
          purchase_id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) REFERENCES users(id),
          user_name VARCHAR(100),
          purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          quantity_kg NUMERIC(15, 2) NOT NULL,
          price_per_kg NUMERIC(15, 2) NOT NULL,
          subtotal NUMERIC(15, 2) NOT NULL,
          tax_amount NUMERIC(15, 2) NOT NULL,
          platform_fee NUMERIC(15, 2) NOT NULL,
          total_amount NUMERIC(15, 2) NOT NULL,
          unsold_quantity_kg NUMERIC(15, 2) NOT NULL,
          status VARCHAR(20) DEFAULT 'COMPLETED',
          note TEXT
        );

        CREATE TABLE IF NOT EXISTS sales (
          sell_id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) REFERENCES users(id),
          user_name VARCHAR(100),
          purchase_id VARCHAR(50),
          sell_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          quantity_kg NUMERIC(15, 2) NOT NULL,
          original_buy_price_per_kg NUMERIC(15, 2) NOT NULL,
          sell_price_per_kg NUMERIC(15, 2) NOT NULL,
          total_buy_amount NUMERIC(15, 2) NOT NULL,
          total_sell_amount NUMERIC(15, 2) NOT NULL,
          realized_pnl NUMERIC(15, 2) NOT NULL,
          pnl_percentage NUMERIC(8, 2) NOT NULL,
          note TEXT
        );
      `);

      return { ok: true, message: 'PostgreSQL database tables successfully verified/created.' };
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.log(`[PostgreSQL Status] Host connection info: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// API Routes

// GET DB Status
app.get('/api/db/status', async (req, res) => {
  const pool = getPgPool();
  if (!pool) {
    return res.json({
      connected: false,
      message: 'DATABASE_URL is not configured in environment variables.',
      provider: 'PostgreSQL',
    });
  }
  try {
    const client = await pool.connect();
    client.release();
    return res.json({
      connected: true,
      message: 'Connected to PostgreSQL database (aluminum_trading).',
      provider: 'PostgreSQL',
    });
  } catch (err: any) {
    return res.json({
      connected: false,
      message: `Failed to connect to PostgreSQL: ${err.message}`,
      provider: 'PostgreSQL',
    });
  }
});

// POST Init Schema
app.post('/api/db/init', async (req, res) => {
  const result = await initPostgresDb();
  if (result.ok) {
    return res.json({ success: true, message: result.message });
  } else {
    return res.status(500).json({ success: false, error: result.error });
  }
});

// GET Users (PostgreSQL or In-Memory fallback)
app.get('/api/users', async (req, res) => {
  const pool = getPgPool();
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
      if (result.rows && result.rows.length > 0) {
        const mapped = result.rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          dob: row.dob,
          email: row.email,
          phone: row.phone,
          kycId: row.kyc_id,
          walletBalance: parseFloat(row.wallet_balance),
          pin: row.pin,
          createdAt: row.created_at,
        }));
        return res.json(mapped);
      }
    } catch (err) {
      console.log('[Users Route] PostgreSQL query fallback to memory store');
    }
  }
  return res.json(inMemoryUsers);
});

// POST User (Create / Update)
app.post('/api/users', async (req, res) => {
  const pool = getPgPool();
  const { id, fullName, dob, email, phone, kycId, walletBalance, pin } = req.body;

  // Update in memory store
  const existingIdx = inMemoryUsers.findIndex((u) => u.id === id);
  const userObj = {
    id: id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName,
    dob: dob || '',
    email: email || '',
    phone: phone || '',
    kycId: kycId || '',
    walletBalance: parseFloat(walletBalance || 100000),
    pin: pin || '1234',
    createdAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    inMemoryUsers[existingIdx] = { ...inMemoryUsers[existingIdx], ...userObj };
  } else {
    inMemoryUsers.push(userObj);
  }

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO users (id, full_name, dob, email, phone, kyc_id, wallet_balance, pin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           dob = EXCLUDED.dob,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           kyc_id = EXCLUDED.kyc_id,
           wallet_balance = EXCLUDED.wallet_balance,
           pin = EXCLUDED.pin`,
        [userObj.id, userObj.fullName, userObj.dob, userObj.email, userObj.phone, userObj.kycId, userObj.walletBalance, userObj.pin]
      );
    } catch (err) {
      console.log('[Post User] DB update fallback to memory');
    }
  }
  return res.json({ success: true, user: userObj });
});

// DELETE User
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const idx = inMemoryUsers.findIndex((u) => u.id === id);
  if (idx >= 0) {
    inMemoryUsers.splice(idx, 1);
  }
  for (let i = inMemoryPurchases.length - 1; i >= 0; i--) {
    if (inMemoryPurchases[i].userId === id) inMemoryPurchases.splice(i, 1);
  }
  for (let i = inMemorySales.length - 1; i >= 0; i--) {
    if (inMemorySales[i].userId === id) inMemorySales.splice(i, 1);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM sales WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM purchases WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    } catch (err) {
      console.log('[Delete User] DB fallback to memory');
    }
  }
  return res.json({ success: true, message: `User ${id} deleted successfully` });
});

// POST Auth Signup
app.post('/api/auth/signup', async (req, res) => {
  const { fullName, dob, email, phone, kycId, walletBalance, pin } = req.body;
  const id = `USR-${Math.floor(1000 + Math.random() * 9000)}`;

  // Check duplicate in memory
  const dup = inMemoryUsers.find((u) => u.email === email || u.phone === phone);
  if (dup) {
    return res.status(400).json({ error: 'User with this email or phone number already exists.' });
  }

  const newUser = {
    id,
    fullName,
    dob: dob || '',
    email: email || '',
    phone: phone || '',
    kycId: kycId || '',
    walletBalance: parseFloat(walletBalance || 100000),
    pin: pin || '1234',
    createdAt: new Date().toISOString(),
  };

  inMemoryUsers.push(newUser);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO users (id, full_name, dob, email, phone, kyc_id, wallet_balance, pin)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, fullName, dob || '', email || '', phone || '', kycId || '', newUser.walletBalance, newUser.pin]
      );
    } catch (err) {
      console.log('[Auth Signup] DB insert fallback to memory');
    }
  }

  return res.json({ success: true, user: newUser });
});

// POST Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { identifier, pin } = req.body;
  const memUser = inMemoryUsers.find(
    (u) => (u.email === identifier || u.phone === identifier || u.id === identifier) && u.pin === pin
  );
  if (memUser) {
    return res.json({ success: true, user: memUser });
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE (email = $1 OR phone = $1 OR id = $1) AND pin = $2',
        [identifier, pin]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const user = {
          id: row.id,
          fullName: row.full_name,
          dob: row.dob,
          email: row.email,
          phone: row.phone,
          kycId: row.kyc_id,
          walletBalance: parseFloat(row.wallet_balance),
          pin: row.pin,
          createdAt: row.created_at,
        };
        return res.json({ success: true, user });
      }
    } catch (err) {
      console.log('[Auth Login] DB query fallback to memory');
    }
  }

  return res.status(401).json({ error: 'Invalid Email/Phone/ID or Security PIN.' });
});

// GET Purchases (PostgreSQL or In-Memory fallback)
app.get('/api/purchases', async (req, res) => {
  const pool = getPgPool();
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM purchases ORDER BY purchase_date DESC');
      if (result.rows) {
        const mapped = result.rows.map((row) => ({
          purchaseId: row.purchase_id,
          userId: row.user_id,
          userName: row.user_name,
          purchaseDate: row.purchase_date,
          quantityKg: parseFloat(row.quantity_kg),
          pricePerKg: parseFloat(row.price_per_kg),
          subtotal: parseFloat(row.subtotal),
          taxAmount: parseFloat(row.tax_amount),
          platformFee: parseFloat(row.platform_fee),
          totalAmount: parseFloat(row.total_amount),
          unsoldQuantityKg: parseFloat(row.unsold_quantity_kg),
          status: row.status,
          note: row.note,
        }));
        return res.json(mapped);
      }
    } catch (err) {
      console.log('[Purchases Route] DB query fallback to memory store');
    }
  }
  return res.json(inMemoryPurchases);
});

// POST Purchase (Create / Update Buy Order)
app.post('/api/purchases', async (req, res) => {
  const purchase = req.body;
  const existingIdx = inMemoryPurchases.findIndex((p) => p.purchaseId === purchase.purchaseId);
  if (existingIdx >= 0) {
    inMemoryPurchases[existingIdx] = { ...inMemoryPurchases[existingIdx], ...purchase };
  } else {
    inMemoryPurchases.unshift(purchase);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const {
        purchaseId,
        userId,
        userName,
        purchaseDate,
        quantityKg,
        pricePerKg,
        subtotal,
        taxAmount,
        platformFee,
        totalAmount,
        unsoldQuantityKg,
        status,
        note,
      } = purchase;

      await pool.query(
        `INSERT INTO purchases (purchase_id, user_id, user_name, purchase_date, quantity_kg, price_per_kg, subtotal, tax_amount, platform_fee, total_amount, unsold_quantity_kg, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (purchase_id) DO UPDATE SET
           unsold_quantity_kg = EXCLUDED.unsold_quantity_kg,
           status = EXCLUDED.status`,
        [
          purchaseId,
          userId,
          userName,
          purchaseDate || new Date().toISOString(),
          quantityKg,
          pricePerKg,
          subtotal,
          taxAmount,
          platformFee,
          totalAmount,
          unsoldQuantityKg,
          status || 'COMPLETED',
          note || '',
        ]
      );
    } catch (err) {
      console.log('[Post Purchase] DB update fallback to memory store');
    }
  }
  return res.json({ success: true });
});

// GET Sales (PostgreSQL or In-Memory fallback)
app.get('/api/sales', async (req, res) => {
  const pool = getPgPool();
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM sales ORDER BY sell_date DESC');
      if (result.rows) {
        const mapped = result.rows.map((row) => ({
          sellId: row.sell_id,
          userId: row.user_id,
          userName: row.user_name,
          purchaseId: row.purchase_id,
          sellDate: row.sell_date,
          quantityKg: parseFloat(row.quantity_kg),
          originalBuyPricePerKg: parseFloat(row.original_buy_price_per_kg),
          sellPricePerKg: parseFloat(row.sell_price_per_kg),
          totalBuyAmount: parseFloat(row.total_buy_amount),
          totalSellAmount: parseFloat(row.total_sell_amount),
          realizedPnL: parseFloat(row.realized_pnl),
          pnlPercentage: parseFloat(row.pnl_percentage),
          note: row.note,
        }));
        return res.json(mapped);
      }
    } catch (err) {
      console.log('[Sales Route] DB query fallback to memory store');
    }
  }
  return res.json(inMemorySales);
});

// POST Sale (Create Sell Order)
app.post('/api/sales', async (req, res) => {
  const sale = req.body;
  const existingIdx = inMemorySales.findIndex((s) => s.sellId === sale.sellId);
  if (existingIdx >= 0) {
    inMemorySales[existingIdx] = { ...inMemorySales[existingIdx], ...sale };
  } else {
    inMemorySales.unshift(sale);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const {
        sellId,
        userId,
        userName,
        purchaseId,
        sellDate,
        quantityKg,
        originalBuyPricePerKg,
        sellPricePerKg,
        totalBuyAmount,
        totalSellAmount,
        realizedPnL,
        pnlPercentage,
        note,
      } = sale;

      await pool.query(
        `INSERT INTO sales (sell_id, user_id, user_name, purchase_id, sell_date, quantity_kg, original_buy_price_per_kg, sell_price_per_kg, total_buy_amount, total_sell_amount, realized_pnl, pnl_percentage, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (sell_id) DO NOTHING`,
        [
          sellId,
          userId,
          userName,
          purchaseId,
          sellDate || new Date().toISOString(),
          quantityKg,
          originalBuyPricePerKg,
          sellPricePerKg,
          totalBuyAmount,
          totalSellAmount,
          realizedPnL,
          pnlPercentage,
          note || '',
        ]
      );
    } catch (err) {
      console.log('[Post Sale] DB update fallback to memory store');
    }
  }
  return res.json({ success: true });
});

// Gemini AI Helper
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// AI Market Analysis Endpoint with Smart Commodity Engine Fallback
app.post('/api/ai/analyze-market', async (req, res) => {
  try {
    const { spotPrice, change24h, totalInventoryKg, totalHoldingsValue, recentTrades } = req.body;
    const currentSpot = spotPrice || 600;
    const isBullish = (change24h || 0) >= 0;
    const buyTarget = Math.round(currentSpot * 0.965 * 100) / 100;
    const sellTarget = Math.round(currentSpot * 1.045 * 100) / 100;

    const fallbackAnalysis = {
      marketSentiment: isBullish ? 'BULLISH' : 'NEUTRAL',
      riskRating: (totalInventoryKg || 0) > 300 ? 'MODERATE' : 'LOW',
      buyTargetPrice: buyTarget,
      sellTargetPrice: sellTarget,
      summary: `Aluminum physical spot rate is trading around ₹${currentSpot}/kg with a 24h trend of ${change24h || 0}%. Supply dynamics remain steady across domestic smelters against rising extrusion manufacturing orders.`,
      recommendations: [
        `Accumulate primary ingots on technical dips near ₹${buyTarget}/kg to maximize 18% GST input credit efficiency.`,
        `Book profits on short-term holdings at target price ₹${sellTarget}/kg during intraday MCX price rallies.`,
        `Hedge physical stock against LME inventory fluctuations to protect profit margins.`
      ],
      keyFactors: [
        'LME & MCX Commodity Spot Price Momentum',
        'Regional Aluminum Extrusion Plant Order Intake',
        'Automotive & Transmission Line Ingot Demand'
      ]
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ success: true, analysis: fallbackAnalysis });
    }

    const prompt = `Analyze current aluminum market conditions and trader inventory:
- Current Spot Price: ₹${currentSpot}/kg
- 24h Price Change: ${change24h || 0}%
- Total Stock In Inventory: ${totalInventoryKg || 0} Kg
- Total Inventory Market Value: ₹${totalHoldingsValue || 0}
- Recent Trades Count: ${recentTrades ? recentTrades.length : 0}

Provide a structured market intelligence report as valid JSON with these exact fields:
1. "marketSentiment": "BULLISH" | "BEARISH" | "NEUTRAL"
2. "riskRating": "LOW" | "MODERATE" | "HIGH"
3. "buyTargetPrice": recommended purchase entry rate in INR/kg
4. "sellTargetPrice": recommended sell target rate in INR/kg
5. "summary": 2-sentence summary of aluminum supply/demand dynamics
6. "recommendations": array of 3 concise actionable advice strings for metal traders
7. "keyFactors": array of 3 key drivers (e.g. LME stocks, MCX trends, scrap spread)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketSentiment: { type: Type.STRING },
            riskRating: { type: Type.STRING },
            buyTargetPrice: { type: Type.NUMBER },
            sellTargetPrice: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    const text = response.text || '{}';
    const jsonResult = JSON.parse(text);
    return res.json({ success: true, analysis: jsonResult });
  } catch (err: any) {
    console.error('AI Market Analysis Fallback triggered:', err.message);
    const currentSpot = req.body.spotPrice || 600;
    return res.json({
      success: true,
      analysis: {
        marketSentiment: 'BULLISH',
        riskRating: 'LOW',
        buyTargetPrice: Math.round(currentSpot * 0.965 * 100) / 100,
        sellTargetPrice: Math.round(currentSpot * 1.045 * 100) / 100,
        summary: `Aluminum physical spot rate is trading around ₹${currentSpot}/kg. Commodity supply dynamics remain steady across domestic smelters against rising industrial extrusion demand.`,
        recommendations: [
          `Accumulate primary ingots on technical dips to maximize 18% GST input credit efficiency.`,
          `Book profits on short-term holdings during intraday price rallies.`,
          `Hedge physical stock against LME inventory fluctuations to protect profit margins.`
        ],
        keyFactors: [
          'LME & MCX Commodity Spot Price Momentum',
          'Regional Aluminum Extrusion Plant Order Intake',
          'Automotive & Transmission Line Ingot Demand'
        ]
      }
    });
  }
});

// AI Trade Copilot Chat Endpoint with Smart Response Fallback
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const spot = context?.spotPrice || 600;
    const inv = context?.userInventory || 0;
    const bal = context?.userBalance || 0;

    let fallbackReply = `💡 **AluTrade Copilot Market Analysis:**\n\n- **Current Spot Rate:** ₹**${spot}**/kg\n- **Your Stock Inventory:** **${inv}** Kg\n- **Available Wallet Balance:** ₹**${bal.toLocaleString('en-IN')}**\n\nFor bulk trades exceeding **1,000 Kg**, ensure you maintain a **18% GST tax margin buffer**. Current technical buy entry target is ₹**${Math.round(spot * 0.965)}**/kg and sell target is ₹**${Math.round(spot * 1.045)}**/kg.`;

    if (message.toLowerCase().includes('buy') || message.toLowerCase().includes('5000') || message.toLowerCase().includes('5,000')) {
      fallbackReply = `🎯 **Bulk Buying Recommendation (5,000 Kg Aluminum Ingot):**\n\n- **Estimated Subtotal:** ₹**${(5000 * spot).toLocaleString('en-IN')}** (at ₹${spot}/kg)\n- **18% GST Credit:** ₹**${(5000 * spot * 0.18).toLocaleString('en-IN')}**\n- **Total Investment Required:** ₹**${(5000 * spot * 1.185).toLocaleString('en-IN')}**\n\n✅ **Strategy:** Current market dynamics are **BULLISH**. Splitting your 5,000 Kg order into **2 tranches** (2,500 Kg at spot ₹${spot}/kg and 2,500 Kg on dip near ₹${Math.round(spot * 0.97)}/kg) is recommended for optimal cost averaging.`;
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ success: true, reply: fallbackReply });
    }

    const chatPrompt = `User Query: "${message}"

Current Platform Context:
- Aluminum Live Spot Rate: ₹${spot}/kg
- Selected Trader Balance: ₹${bal}
- Trader Stock Inventory: ${inv} Kg
- Active Holding Lots: ${context?.holdingsCount || 0} lots

Answer the user's trading question concisely in clear, professional English (or Hinglish if asked in Hindi). Use bold numbers, bullet points, and specific commodity trading calculations where helpful.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: chatPrompt,
      config: {
        systemInstruction:
          'You are AluTrade Copilot, an elite AI Commodity Analyst for physical Aluminum trading (ingots, scrap, primary alloys). You help traders analyze profit margins, 18% GST implications, entry/exit pricing, and market risks. Respond directly with clean markdown formatting.',
      },
    });

    return res.json({ success: true, reply: response.text });
  } catch (err: any) {
    console.error('AI Chat Fallback triggered:', err.message);
    const spot = req.body.context?.spotPrice || 600;
    return res.json({
      success: true,
      reply: `🎯 **AluTrade Commodity Guidance:**\n\n- Current Spot Price: ₹**${spot}**/kg\n- Recommended Entry Level: ₹**${Math.round(spot * 0.97)}**/kg\n- Target Exit Level: ₹**${Math.round(spot * 1.045)}**/kg\n\nEnsure 18% GST invoice generation on all industrial shipments to claim full input tax credit.`
    });
  }
});

// Server Startup Integration
async function startServer() {
  const fs = await import('fs');
  const rootFrontendDist = path.join(process.cwd(), 'frontend', 'dist');
  const parentFrontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');
  const distPath = fs.existsSync(rootFrontendDist)
    ? rootFrontendDist
    : (fs.existsSync(parentFrontendDist) ? parentFrontendDist : rootFrontendDist);

  console.log(`[Static Server] Serving frontend files from: ${distPath}`);

  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next();
    });
  });

  // Auto-initialize DB tables on startup if pool is available
  initPostgresDb().then((res) => {
    if (res.ok) {
      console.log('✅ PostgreSQL connected, schema verified, and data ready.');
    } else {
      console.log('ℹ️ PostgreSQL auto-init info:', res.error);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AluTrade Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
