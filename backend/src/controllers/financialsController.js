import pool from '../config/db.js';

// GET: Securely retrieve company financial parameters and relational tranches
export const getFinancialData = async (req, res) => {
  try {
    // Parameterized lookup for company ID 1
    const [companyRows] = await pool.query('SELECT * FROM company_financials WHERE id = ?', [1]);
    
    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'Enterprise registry parameter target not found.' });
    }

    const [milestoneRows] = await pool.query('SELECT * FROM funding_milestones WHERE company_id = ?', [1]);
    
    const company = companyRows[0];
    
    // Structure cleanly for the frontend consumption state
    res.status(200).json({
      companyName: company.company_name,
      currency: company.currency,
      currentCash: parseFloat(company.current_cash),
      monthlyRevenue: parseFloat(company.monthly_revenue),
      expenses: {
        engineering: parseFloat(company.burn_engineering),
        marketing: parseFloat(company.burn_marketing),
        operations: parseFloat(company.burn_operations)
      },
      milestones: milestoneRows.map(m => ({
        id: m.id,
        name: m.name,
        amount: parseFloat(m.amount),
        monthIndex: m.month_index
      }))
    });
  } catch (error) {
    console.error('Secure Data Pipeline Error:', error);
    res.status(500).json({ error: 'Internal system secure retrieval breakdown.' });
  }
};