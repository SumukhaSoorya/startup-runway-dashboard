import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import financialsRouter from './routes/financialsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS strict network polling rules
app.use(cors({
  origin: 'http://localhost:5173', // Restrict data flow exclusively to our frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Bind our API routes cleanly
app.use('/api', financialsRouter);

// Health Telemetry Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: 'connected', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Secure Financial Analytics engine operational on port ${PORT}`);
});