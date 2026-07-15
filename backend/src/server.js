import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import financialsRoutes from './routes/financialsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server to share with Socket.io
const httpServer = createServer(app);

// 1. Array of allowed local origins
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];

// 2. Configure Socket.io CORS for both ports
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE"]
  }
});

// 3. Configure Express CORS for both ports
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

// Main API Routes
app.use('/api', financialsRoutes);

// Socket.io Real-Time Orchestration
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Listen for live budget updates from a user
  socket.on('budget_update', (data) => {
    // Broadcast the updated slider multipliers to everyone else
    socket.broadcast.emit('receive_budget_update', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start our wrapped HTTP server instead of app.listen
httpServer.listen(PORT, () => {
  console.log(`🚀 Secure Financial Analytics engine operational on port ${PORT}`);
});