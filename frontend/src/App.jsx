import React, { useState, useMemo } from 'react';
import { DollarSign, Flame, Calendar, ShieldAlert, Plus, Trash2, Milestone } from 'lucide-react';
import RunwayChart from './components/RunwayChart';

export default function App() {
  // 1. Industry Baseline Financials
  const [cashBalance, setCashBalance] = useState(350000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(20000);
  
  // Categorized Burn Rates
  const [expenses, setExpenses] = useState({
    engineering: 35000,
    marketing: 15000,
    operations: 12000
  });

  // 2. Future Funding / Cash Inflow Milestones (Crucial for real startups)
  const [milestones, setMilestones] = useState([
    { id: 1, name: 'Seed Round Funding', amount: 250000, monthIndex: 3 },
    { id: 2, name: 'Govt Tech Grant', amount: 75000, monthIndex: 6 }
  ]);

  const [newMilestone, setNewMilestone] = useState({ name: '', amount: '', monthIndex: 1 });

  // 3. Handlers for Milestones
  const addMilestone = () => {
    if (!newMilestone.name || !newMilestone.amount) return;
    setMilestones([...milestones, {
      id: Date.now(),
      name: newMilestone.name,
      amount: parseFloat(newMilestone.amount),
      monthIndex: parseInt(newMilestone.monthIndex)
    }]);
    setNewMilestone({ name: '', amount: '', monthIndex: 1 });
  };

  const removeMilestone = (id) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // 4. Advanced Matrix Calculations Engine
  const metrics = useMemo(() => {
    const totalGrossBurn = expenses.engineering + expenses.marketing + expenses.operations;
    const netBurn = Math.max(0, totalGrossBurn - monthlyRevenue);
    
    // Calculate 12-Month Rolling Horizon accounting for episodic funding tranches
    const chartData = [];
    let rollingCash = cashBalance;
    let deathMonth = null;
    const monthsArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      // Check if any funding milestone lands in this specific month
      const milestoneHits = milestones.filter(m => m.monthIndex === i);
      const injectedCash = milestoneHits.reduce((sum, m) => sum + m.amount, 0);
      
      rollingCash += injectedCash;
      rollingCash -= netBurn;
      
      if (rollingCash <= 0 && deathMonth === null) {
        deathMonth = i;
      }

      chartData.push({
        month: monthsArray[i],
        balance: Math.max(0, Math.round(rollingCash)),
        inflow: injectedCash
      });
    }

    const totalRunwayMonths = netBurn > 0 ? (cashBalance / netBurn).toFixed(1) : '∞';
    const isDefaultAlive = monthlyRevenue > totalGrossBurn || totalRunwayMonths > 18;

    return {
      totalGrossBurn,
      netBurn,
      totalRunwayMonths,
      isDefaultAlive,
      chartData,
      deathMonth: deathMonth !== null ? monthsArray[deathMonth] : 'Clear Sky (12mo+)'
    };
  }, [cashBalance, monthlyRevenue, expenses, milestones]);

  return (
    <div className="obsidian-layout">
      {/* Top Telemetry Banner */}
      <header className="obsidian-header">
        <div className="branding">
          <div className="logo-cube"></div>
          <div>
            <h1>RUNWAYPULSE <span className="version-tag">v2.0 PRO</span></h1>
            <p className="subtitle">Enterprise Financial Runway Simulation Matrix</p>
          </div>
        </div>
        <div className={`status-badge ${metrics.isDefaultAlive ? 'alive' : 'dead'}`}>
          {metrics.isDefaultAlive ? 'DEFAULT ALIVE' : 'DEFAULT DEAD (ACTION REQUIRED)'}
        </div>
      </header>

      {/* Analytics Command Dashboard */}
      <div className="obsidian-grid">
        
        {/* Left Column: Direct Variables & Dynamic Controls */}
        <div className="panel-column">
          <div className="obsidian-panel">
            <h3>1. Core Capital Variables</h3>
            
            <div className="input-block">
              <label>Starting Bank Cash Reserves ($)</label>
              <input type="number" value={cashBalance} onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)} />
            </div>

            <div className="input-block">
              <label>Monthly Inflow / MRR ($)</label>
              <input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="obsidian-panel">
            <h3>2. Granular Monthly OpEx (Burn)</h3>
            
            <div className="slider-item">
              <div className="slider-label"><span>Engineering & Product Payroll</span><span>${expenses.engineering.toLocaleString()}</span></div>
              <input type="range" min="5000" max="100000" step="2500" value={expenses.engineering} onChange={(e) => setExpenses({...expenses, engineering: parseInt(e.target.value)})} />
            </div>

            <div className="slider-item">
              <div className="slider-label"><span>Growth & Performance Marketing</span><span>${expenses.marketing.toLocaleString()}</span></div>
              <input type="range" min="0" max="50000" step="1000" value={expenses.marketing} onChange={(e) => setExpenses({...expenses, marketing: parseInt(e.target.value)})} />
            </div>

            <div className="slider-item">
              <div className="slider-label"><span>Operations, Legal & Overhead</span><span>${expenses.operations.toLocaleString()}</span></div>
              <input type="range" min="2000" max="30000" step="500" value={expenses.operations} onChange={(e) => setExpenses({...expenses, operations: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="obsidian-panel">
            <h3>3. Capital Inflow Milestones (Tranches)</h3>
            <div className="milestone-form">
              <input type="text" placeholder="e.g. Grant / Round" value={newMilestone.name} onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})} />
              <input type="number" placeholder="Amount ($)" value={newMilestone.amount} onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})} />
              <select value={newMilestone.monthIndex} onChange={(e) => setNewMilestone({...newMilestone, monthIndex: e.target.value})}>
                <option value={2}>Month 3 (Mar)</option>
                <option value={5}>Month 6 (Jun)</option>
                <option value={8}>Month 9 (Sep)</option>
              </select>
              <button onClick={addMilestone} className="add-btn"><Plus size={16} /></button>
            </div>

            <div className="milestone-list">
              {milestones.map(m => (
                <div key={m.id} className="milestone-row">
                  <span>{m.name} (+${m.amount.toLocaleString()})</span>
                  <button onClick={() => removeMilestone(m.id)} className="delete-btn"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: High-Value Intelligence Output Panels */}
        <div className="panel-column">
          <div className="metrics-summary-row">
            <div className="summary-card">
              <span className="card-lbl">Gross Burn</span>
              <span className="card-val text-orange">${metrics.totalGrossBurn.toLocaleString()}</span>
            </div>
            <div className="summary-card">
              <span className="card-lbl">Net Monthly Loss</span>
              <span className="card-val text-red">${metrics.netBurn.toLocaleString()}</span>
            </div>
            <div className="summary-card highlighted">
              <span className="card-lbl">Months of Runway</span>
              <span className="card-val text-cyan">{metrics.totalRunwayMonths} Mo</span>
            </div>
          </div>

          <div className="obsidian-panel chart-wrapper">
            <RunwayChart data={metrics.chartData} />
          </div>

          <div className="obsidian-panel critical-notice-box">
            <div className="notice-icon"><Flame size={24} /></div>
            <div>
              <h4>Zero-Cash Drop Dead Deadline Month</h4>
              <p className="deadline-date">{metrics.deathMonth}</p>
              <p className="desc text-secondary">This maps out exactly when your cash reserves break floor parity under your customized budget parameters.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}