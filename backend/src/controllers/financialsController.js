import pool from '../config/db.js';

// --- 1. GET USER-ISOLATED FINANCIAL DATA ---
export const getFinancialData = async (req, res) => {
  const userId = req.user.id; // Decrypted dynamically by verifyToken middleware

  try {
    // Fetch the company financial parameters belonging strictly to this user
    const [companyRows] = await pool.query(
      'SELECT id, company_name, currency, current_cash, monthly_revenue, burn_engineering, burn_marketing, burn_operations, user_id FROM company_financials WHERE user_id = ? LIMIT 1', 
      [userId]
    );

    let financialProfile = {
      id: null,
      companyName: "RunwayPulse Enterprise",
      currency: "USD",
      currentCash: 1000000,
      monthlyRevenue: 85000,
      expenses: { engineering: 40000, marketing: 20000, operations: 15000 },
      milestones: []
    };

    if (companyRows.length > 0) {
      const row = companyRows[0];
      financialProfile = {
        id: row.id,
        companyName: row.company_name,
        currency: row.currency || 'USD',
        currentCash: Number(row.current_cash || 0),
        monthlyRevenue: Number(row.monthly_revenue || 0),
        expenses: {
          engineering: Number(row.burn_engineering || 0),
          marketing: Number(row.burn_marketing || 0),
          operations: Number(row.burn_operations || 0)
        },
        milestones: []
      };
    } else {
      // Auto-provision a starting record for this new user so the dashboard has numbers right away
      const [insertRes] = await pool.query(
        'INSERT INTO company_financials (company_name, currency, current_cash, monthly_revenue, burn_engineering, burn_marketing, burn_operations, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [financialProfile.companyName, financialProfile.currency, financialProfile.currentCash, financialProfile.monthlyRevenue, financialProfile.expenses.engineering, financialProfile.expenses.marketing, financialProfile.expenses.operations, userId]
      );
      financialProfile.id = insertRes.insertId;
    }

    // Fetch ONLY the funding milestones injected by this specific logged-in user
    const [milestoneRows] = await pool.query(
      'SELECT id, name, amount, month_index FROM funding_milestones WHERE user_id = ? ORDER BY month_index ASC, id ASC', 
      [userId]
    );

    financialProfile.milestones = milestoneRows.map(m => ({
      id: m.id,
      name: m.name,
      amount: Number(m.amount),
      monthIndex: m.month_index
    }));

    res.json(financialProfile);

  } catch (err) {
    console.error('❌ Controller Pipeline Fetch Failure:', err);
    res.status(500).json({ error: 'Internal database metric loading crash: ' + err.message });
  }
};

// --- 2. UPDATE USER FINANCIAL BASELINE (CASH, REVENUE, EXPENSES) ---
export const updateFinancialData = async (req, res) => {
  const userId = req.user.id;
  const { companyName, currency, currentCash, monthlyRevenue, expenses } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM company_financials WHERE user_id = ? LIMIT 1', [userId]);

    const cash = currentCash !== undefined ? Number(currentCash) : null;
    const rev = monthlyRevenue !== undefined ? Number(monthlyRevenue) : null;
    const eng = expenses?.engineering !== undefined ? Number(expenses.engineering) : null;
    const mkt = expenses?.marketing !== undefined ? Number(expenses.marketing) : null;
    const ops = expenses?.operations !== undefined ? Number(expenses.operations) : null;

    if (existing.length > 0) {
      await pool.query(
        `UPDATE company_financials SET 
          company_name = COALESCE(?, company_name),
          currency = COALESCE(?, currency),
          current_cash = COALESCE(?, current_cash),
          monthly_revenue = COALESCE(?, monthly_revenue),
          burn_engineering = COALESCE(?, burn_engineering),
          burn_marketing = COALESCE(?, burn_marketing),
          burn_operations = COALESCE(?, burn_operations)
         WHERE user_id = ?`,
        [companyName || null, currency || null, cash, rev, eng, mkt, ops, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO company_financials (company_name, currency, current_cash, monthly_revenue, burn_engineering, burn_marketing, burn_operations, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [companyName || 'RunwayPulse Enterprise', currency || 'USD', cash ?? 1000000, rev ?? 85000, eng ?? 40000, mkt ?? 20000, ops ?? 15000, userId]
      );
    }

    res.json({ message: 'Financial profile parameters updated successfully.' });
  } catch (err) {
    console.error('❌ Controller Pipeline Update Failure:', err);
    res.status(500).json({ error: 'Failed to update financial parameters: ' + err.message });
  }
};

// --- 3. ADD A PERSONAL RECURRING MILESTONE ---
export const addMilestone = async (req, res) => {
  const { name, amount, monthIndex } = req.body;
  const userId = req.user.id; // Secure token identity binding

  if (!name || isNaN(Number(amount)) || !monthIndex) {
    return res.status(400).json({ error: 'Missing entry data definitions matrix elements.' });
  }

  try {
    const [compRows] = await pool.query('SELECT id FROM company_financials WHERE user_id = ? LIMIT 1', [userId]);
    const companyId = compRows.length > 0 ? compRows[0].id : null;

    const [result] = await pool.query(
      'INSERT INTO funding_milestones (name, amount, month_index, user_id, company_id) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), Number(amount), parseInt(monthIndex, 10), userId, companyId]
    );

    res.status(201).json({ 
      id: result.insertId, 
      name: name.trim(), 
      amount: Number(amount), 
      monthIndex: parseInt(monthIndex, 10) 
    });
  } catch (err) {
    console.error('❌ Milestone Insertion Failure:', err);
    res.status(500).json({ error: 'Failed to record entry asset parameters to database: ' + err.message });
  }
};

// --- 4. PURGE A USER-OWNED MILESTONE ---
export const deleteMilestone = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Guard verification check: Ensure the milestone row strictly belongs to this user
    const [check] = await pool.query(
      'SELECT id FROM funding_milestones WHERE id = ? AND user_id = ?', 
      [id, userId]
    );

    if (check.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: You do not possess structural ownership of this data node.' });
    }

    await pool.query('DELETE FROM funding_milestones WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Milestone record successfully cleared from personalized log matrix.' });
  } catch (err) {
    console.error('❌ Milestone Purge Deletion Error:', err);
    res.status(500).json({ error: 'Database pipeline transaction error clearing resource: ' + err.message });
  }
};
