import express from 'express';
import { getFinancialData, addMilestone, deleteMilestone } from '../controllers/financialsController.js';

const router = express.Router();

router.get('/financials', getFinancialData);
router.post('/milestones', addMilestone);

// Dynamic route targeting a specific ID parameter
router.delete('/milestones/:id', deleteMilestone);

export default router;