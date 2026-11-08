import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { exec } from 'child_process';
import cron from 'node-cron';
import financialsRoutes from './routes/financialsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { verifyToken } from './middleware/authMiddleware.js';
import pool from './config/db.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

const httpServer = createServer(app);

// Allowed browser origins for local development and testing
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:5174", 
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5002"
];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow dev origins gracefully
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Configure CORS
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Body parsing MUST be mounted before API routes
app.use(express.json());

// Public Endpoint
app.use('/api/auth', authRoutes);

// Protected Endpoint Structure (Guarded with verifyToken)
app.use('/api/ai', verifyToken, aiRoutes);
app.use('/api', verifyToken, financialsRoutes);

// --- FEATURE: BULK CSV DATA SPREADSHEET INGESTION ENDPOINT (USER LINKED) ---
app.post('/api/milestones/bulk', verifyToken, async (req, res) => {
  const { milestones } = req.body;
  const userId = req.user.id; // Extract decrypted user id from JWT payload
  
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return res.status(400).json({ error: "Batch transmission rejected: Ledger array is empty or malformed." });
  }

  try {
    for (const item of milestones) {
      if (!item.name || isNaN(Number(item.amount)) || !item.monthIndex) {
        return res.status(400).json({ error: `Validation failure inside item: ${JSON.stringify(item)}` });
      }
    }

    // Retrieve the user's company id if existing
    const [compRows] = await pool.query('SELECT id FROM company_financials WHERE user_id = ? LIMIT 1', [userId]);
    const companyId = compRows.length > 0 ? compRows[0].id : null;

    // Insert records tied uniquely to the logged-in user
    for (const item of milestones) {
      await pool.query(
        'INSERT INTO funding_milestones (name, amount, month_index, user_id, company_id) VALUES (?, ?, ?, ?, ?)',
        [item.name.trim().substring(0, 100), Number(item.amount), parseInt(item.monthIndex, 10), userId, companyId]
      );
    }

    res.status(201).json({ message: `Successfully integrated ${milestones.length} personal spreadsheet records.` });
  } catch (err) {
    console.error("❌ Bulk upload database failure detail:", err);
    res.status(500).json({ error: `Database Ingestion Core Rejection: ${err.message}` });
  }
});

let currentSessionState = {
  hiringMultiplier: 100,
  marketingMultiplier: 100,
  growthEfficiency: 15
};

io.on('connection', (socket) => {
  socket.emit('receive_budget_update', currentSessionState);

  socket.on('budget_update', (data) => {
    if (data.hiringMultiplier !== undefined) currentSessionState.hiringMultiplier = data.hiringMultiplier;
    if (data.marketingMultiplier !== undefined) currentSessionState.marketingMultiplier = data.marketingMultiplier;
    if (data.growthEfficiency !== undefined) currentSessionState.growthEfficiency = data.growthEfficiency;
    socket.broadcast.emit('receive_budget_update', data);
  });

  socket.on('disconnect', () => {
    // Client disconnect handled cleanly
  });
});

cron.schedule('0 0 * * *', () => {
  console.log('⏰ Midnight reached. Running automatic database backup...');
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'runway_pulse_db';
  const command = `mysqldump -u ${dbUser} -p${dbPassword} ${dbName} > backup.sql`;
  
  exec(command, (error) => {
    if (error) {
       console.error(`❌ Automatic Backup Failed: ${error.message}`);
       return;
    }
    console.log('💾 System state successfully backed up to backup.sql');
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 RunwayPulse Enterprise Financial Analytics engine operational on port ${PORT}`);
});
