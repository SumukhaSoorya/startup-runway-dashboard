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
// POST: Securely validate and insert a new financial milestone row
export const addMilestone = async (req, res) => {
  const { name, amount, monthIndex } = req.body;

  // 1. Strict Request Validation (Fail early, fail loudly)
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Validation Failure: A valid milestone name is required.' });
  }
  
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Validation Failure: Amount must be a positive numeric value.' });
  }

  const parsedMonth = parseInt(monthIndex, 10);
  if (isNaN(parsedMonth) || parsedMonth < 0 || parsedMonth > 12) {
    return res.status(400).json({ error: 'Validation Failure: Month Index must be a valid runway timeline interval (0-12).' });
  }

  try {
    // 2. Parameterized SQL Mutation to prevent SQL Injections
    const queryStr = 'INSERT INTO funding_milestones (company_id, name, amount, month_index) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(queryStr, [1, name.trim(), parsedAmount, parsedMonth]);

    // 3. Return the newly created resource parameter
    res.status(201).json({
      message: 'Milestone recorded securely.',
      milestone: {
        id: result.insertId,
        name: name.trim(),
        amount: parsedAmount,
        monthIndex: parsedMonth
      }
    });
  } catch (error) {
    console.error('Secure Write Operation Failure:', error);
    res.status(500).json({ error: 'Database pipeline rewrite failure.' });
  }
};
// DELETE: Securely remove a milestone parameter by its database ID
export const deleteMilestone = async (req, res) => {
  const { id } = req.params;

  try {
    // Run a parameterized SQL statement to safely delete the target milestone
    const [result] = await pool.query('DELETE FROM funding_milestones WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Milestone target not found in registry.' });
    }

    res.status(200).json({ message: 'Milestone successfully purged from database.' });
  } catch (error) {
    console.error('Purge Operation Failure:', error);
    res.status(500).json({ error: 'Database pipeline deletion failure.' });
  }
};