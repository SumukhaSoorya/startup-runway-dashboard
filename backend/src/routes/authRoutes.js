import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_runway_vector_key';

// --- ROUTE 1: USER REGISTRATION ---
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required fields.' });
  }

  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Capture the auto-generated insertId
    const [result] = await pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
    const newUserId = result.insertId;

    // Provisions a baseline company_financials row for the new user
    await pool.query(
      `INSERT INTO company_financials (company_name, currency, current_cash, monthly_revenue, burn_engineering, burn_marketing, burn_operations, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['RunwayPulse Enterprise', 'USD', 1000000.00, 85000.00, 40000.00, 20000.00, 15000.00, newUserId]
    );

    // Sign the token WITH the id and email
    const token = jwt.sign(
      { id: newUserId, email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'Account created successfully!',
      token, 
      user: { id: newUserId, email } 
    });

  } catch (err) {
    console.error('❌ Registration Engine Failure:', err);
    res.status(500).json({ error: 'Database error creating your user profile vector: ' + err.message });
  }
});

// --- ROUTE 2: USER LOGIN ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required fields.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or operational authorization key.' });
    }

    const user = rows[0];
    
    // Verify credential alignment matching
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid password credential structure.' });
    }

    // Sign a secure JWT cryptographic identity token valid for 24 hours
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { id: user.id, email: user.email } 
    });

  } catch (err) {
    console.error('❌ Auth Engine Failure:', err);
    res.status(500).json({ error: 'Internal secure authentication crash: ' + err.message });
  }
});

export default router;
