import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, Flame, Calendar, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import RunwayChart from './components/RunwayChart';

export default function App() {
  // Core application states loaded dynamically via API
  const [cashBalance, setCashBalance] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [expenses, setExpenses] = useState({ engineering: 0, marketing: 0, operations: 0 });
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New milestone form tracking state
  const [newMilestone, setNewMilestone] = useState({ name: '', amount: '', monthIndex: 1 });

  // 1. Fetch data from our Node.js Backend API Engine on Mount
  useEffect(() => {
    fetch('http://localhost:5000/api/financials')
      .then(res => res.json())
      .then(data => {
        setCashBalance(data.currentCash);
        setMonthlyRevenue(data.monthlyRevenue);
        setExpenses(data.expenses);
        setMilestones(data.milestones);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Pipeline breakdown connecting to data server:", err);
        setIsLoading(false);
      });
  }, []);

  // Handlers for managing dynamic cash tranches locally
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

  // 2. Advanced Mathematical Matrix Calculations
  const metrics = useMemo(() => {
    const totalGrossBurn = expenses.engineering + expenses.marketing + expenses.operations;
    const netBurn = Math.max(0, totalGrossBurn - monthlyRevenue);
    
    const chartData = [];
    let rollingCash = cashBalance;
    let deathMonth = null;
    const monthsArray = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#090a0f', color: '#06b6d4', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
        ESTABLISHING DATA CONNECTIONS...
      </div>
    );
  }

  return (
    <div className="obsidian-layout">
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

      <div className="obsidian-grid">
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
              <input type="text" placeholder="Funding Name" value={newMilestone.name} onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})} />
              <input type="number" placeholder="Amount ($)" value={newMilestone.amount} onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})} />
              <select value={newMilestone.monthIndex} onChange={(e) => setNewMilestone({...newMilestone, monthIndex: parseInt(e.target.value)})}>
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