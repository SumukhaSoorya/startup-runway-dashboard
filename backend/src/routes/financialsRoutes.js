import express from 'express';
import { getFinancialData, updateFinancialData, addMilestone, deleteMilestone } from '../controllers/financialsController.js';

const router = express.Router();

// Handlers are securely behind the verifyToken middleware attached in server.js
router.get('/financials', getFinancialData);
router.put('/financials', updateFinancialData);
router.post('/milestones', addMilestone);
router.delete('/milestones/:id', deleteMilestone);

export default router;
