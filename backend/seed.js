import pool from './src/config/db.js';

async function seedDatabase() {
  console.log('🔄 Initializing clean financial data seed routine...');
  
  try {
    // 1. Clear out historic test records safely
    await pool.query('DELETE FROM funding_milestones');
    console.log('🧹 Historic milestones records purged safely.');

    // 2. Inject clear, institutional baseline demo milestones
    const defaultMilestones = [
      ['Angel Investment Round', 2500000, 3],
      ['Government Tech Grant Inflow', 500000, 6],
      ['Series Pre-A Capital Injection', 5000000, 9]
    ];

    for (const milestone of defaultMilestones) {
      await pool.query(
        'INSERT INTO funding_milestones (name, amount, month_index) VALUES (?, ?, ?)',
        milestone
      );
    }
    
    console.log(`✅ Successfully seeded ${defaultMilestones.length} professional baseline records.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database seed critical failure:', err.message);
    process.exit(1);
  }
}

seedDatabase();