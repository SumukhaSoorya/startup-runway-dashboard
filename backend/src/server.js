import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configure system environment parameters
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable cross-origin calls so our Vite frontend can safely read data
app.use(cors());
app.use(express.json());

// Health Check Telemetry Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Primary Financial Intelligence Data Pipeline
app.get('/api/financials', (req, res) => {
  res.status(200).json({
    companyName: "Acme Tech Inc.",
    currency: "USD",
    currentCash: 350000,
    monthlyRevenue: 20000,
    expenses: {
      engineering: 35000,
      marketing: 15000,
      operations: 12000
    },
    milestones: [
      { id: 1, name: 'Seed Round Funding', amount: 250000, monthIndex: 3 },
      { id: 2, name: 'Govt Tech Grant', amount: 75000, monthIndex: 6 }
    ]
  });
});

// Boot up the server engine
app.listen(PORT, () => {
  console.log(`🚀 Financial Analytics engine operational on port ${PORT}`);
});