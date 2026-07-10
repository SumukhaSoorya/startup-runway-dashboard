import express from 'express';
import { getFinancialData } from '../controllers/financialsController.js';

const router = express.Router();

// Route all incoming data queries through our secure controller engine
router.get('/financials', getFinancialData);

export default router;