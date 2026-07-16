import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import financialsRoutes from './routes/financialsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"]
  }
});

app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  }
}));

app.use(express.json());
app.use('/api', financialsRoutes);

// Memory ledger cache so new connection tabs sync instantly
let currentSessionState = {
  hiringMultiplier: 100,
  marketingMultiplier: 100,
  growthEfficiency: 15
};

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to sync engine: ${socket.id}`);

  // Send current state to newly opened tabs immediately
  socket.emit('receive_budget_update', currentSessionState);

  socket.on('budget_update', (data) => {
    if (data.hiringMultiplier !== undefined) currentSessionState.hiringMultiplier = data.hiringMultiplier;
    if (data.marketingMultiplier !== undefined) currentSessionState.marketingMultiplier = data.marketingMultiplier;
    if (data.growthEfficiency !== undefined) currentSessionState.growthEfficiency = data.growthEfficiency;

    socket.broadcast.emit('receive_budget_update', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Secure Financial Analytics engine operational on port ${PORT}`);
});