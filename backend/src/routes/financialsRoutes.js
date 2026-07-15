import express from 'express';
import { getFinancialData, addMilestone } from '../controllers/financialsController.js';

const router = express.Router();

// Fetch corporate parameters
router.get('/financials', getFinancialData);

// Securely append corporate milestones
router.post('/milestones', addMilestone);

export default router;