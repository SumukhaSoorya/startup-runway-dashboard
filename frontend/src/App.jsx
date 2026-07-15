import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

// Establish a single persistent connection to our backend
const socket = io('http://localhost:5000');

function App() {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic Socket Connection State
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Currency State (USD or INR)
  const [currency, setCurrency] = useState('INR'); // Defaulted to Indian Rupees (₹)!

  // Simulation Sliders States
  const [hiringMultiplier, setHiringMultiplier] = useState(100);
  const [marketingMultiplier, setMarketingMultiplier] = useState(100);

  // New Milestone Form State
  const [newMilestone, setNewMilestone] = useState({ name: '', amount: '', monthIndex: 1 });

  // 1. Fetch initial baseline financials from MySQL
  useEffect(() => {
    fetchFinancials();
  }, []);

  // 2. Setup Socket event listeners & Connection state monitoring
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onReceiveBudgetUpdate(data) {
      if (data.hiringMultiplier !== undefined) {
        setHiringMultiplier(data.hiringMultiplier);
      }
      if (data.marketingMultiplier !== undefined) {
        setMarketingMultiplier(data.marketingMultiplier);
      }
    }

    // Set initial connection status
    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_budget_update', onReceiveBudgetUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_budget_update', onReceiveBudgetUpdate);
    };
  }, []);

  const fetchFinancials = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/financials');
      if (!response.ok) throw new Error('Failed to load secure pipeline data.');
      const data = await response.json();
      setDbData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Broadcast slider adjustments to all other users instantly
  const handleHiringChange = (value) => {
    setHiringMultiplier(value);
    socket.emit('budget_update', { hiringMultiplier: value });
  };

  const handleMarketingChange = (value) => {
    setMarketingMultiplier(value);
    socket.emit('budget_update', { marketingMultiplier: value });
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone)
      });
      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Validation failed');
        return;
      }
      setNewMilestone({ name: '', amount: '', monthIndex: 1 });
      fetchFinancials();
    } catch (err) {
      alert('Network transmission error.');
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm("Are you sure you want to permanently purge this milestone?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/milestones/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Deletion failed.');
      fetchFinancials();
    } catch (err) {
      alert(err.message);
    }
  };

  // Export the current simulated runway projection to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Simulated Balance (INR/USD)\n";

    chartData.forEach(row => {
      csvContent += `${row.name},${row.Balance}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${dbData.companyName}_runway_projection.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to format money cleanly based on country system
  const formatMoney = (value) => {
    if (currency === 'INR') {
      return '₹' + Math.round(value).toLocaleString('en-IN');
    }
    return '$' + Math.round(value).toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ border: '4px solid #1e293b', borderTop: '4px solid #38bdf8', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
        <p style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '0.05em' }}>CONNECTING TO DATA PIPELINE...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', padding: '24px', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '12px', border: '1px solid #ef4444', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>Network Connection Error</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchFinancials} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  // --- RUNWAY SIMULATION CALCULATIONS ---
  const simulatedEngineering = dbData.expenses.engineering * (hiringMultiplier / 100);
  const simulatedMarketing = dbData.expenses.marketing * (marketingMultiplier / 100);
  const totalSimulatedBurn = simulatedEngineering + simulatedMarketing + dbData.expenses.operations;
  const netMonthlyBurn = totalSimulatedBurn - dbData.monthlyRevenue;

  let currentCashRunway = dbData.currentCash;
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const currentMonth = i + 1;
    const monthlyInflow = dbData.milestones
      .filter(m => m.monthIndex === currentMonth)
      .reduce((sum, m) => sum + m.amount, 0);

    currentCashRunway = currentCashRunway - netMonthlyBurn + monthlyInflow;
    if (currentCashRunway < 0) currentCashRunway = 0;

    return {
      name: `Month ${currentMonth}`,
      Balance: Math.round(currentCashRunway)
    };
  });

  const calculatedRunwayMonths = netMonthlyBurn > 0 ? (dbData.currentCash / netMonthlyBurn).toFixed(1) : '∞';

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f8fafc', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header Panel */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '20px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#0ea5e9', width: '10px', height: '10px', borderRadius: '50%' }}></span>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>{dbData.companyName} <span style={{ color: '#38bdf8', fontWeight: '300' }}>/ Runway Pulse</span></h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', margin: 0 }}>Enterprise Scenario Planning Simulation Matrix Engine</p>
        </div>

        {/* Currency Switcher & Dynamic Multiplayer Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Currency Switch Selection Block */}
          <div style={{ backgroundColor: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setCurrency('INR')}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', backgroundColor: currency === 'INR' ? '#38bdf8' : 'transparent', color: currency === 'INR' ? '#0f172a' : '#94a3b8', transition: 'all 0.2s' }}
            >
              INR (₹)
            </button>
            <button 
              onClick={() => setCurrency('USD')}
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', backgroundColor: currency === 'USD' ? '#38bdf8' : 'transparent', color: currency === 'USD' ? '#0f172a' : '#94a3b8', transition: 'all 0.2s' }}
            >
              USD ($)
            </button>
          </div>

          {/* PLACED SCENARIO EXPORT UTILITY BUTTON */}
          <button 
            onClick={handleExportCSV}
            style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0284c7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0ea5e9'}
          >
            📤 Export Scenario
          </button>
          
          {isConnected ? (
            <span style={{ fontSize: '11px', backgroundColor: '#064e3b', padding: '6px 12px', borderRadius: '20px', color: '#34d399', border: '1px solid #047857', fontWeight: '600' }}>MULTIPLAYER_ACTIVE</span>
          ) : (
            <span style={{ fontSize: '11px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '20px', color: '#94a3b8', border: '1px solid #1f2937', fontWeight: '600' }}>LIVE_CONNECTED</span>
          )}
        </div>
      </header>

      {/* Primary Telemetry Readouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', borderLeft: '4px solid #22c55e' }}>
          <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Starting Cash Balance</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>{formatMoney(dbData.currentCash)}</div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Static database reserve baseline</div>
        </div>
        
        <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Simulated Monthly Burn Rate</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#f43f5e', marginTop: '8px' }}>{formatMoney(totalSimulatedBurn)}</div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Adjusts based on sliders</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', borderLeft: '4px solid #eab308' }}>
          <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>Simulated Survival Runway</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#f59e0b', marginTop: '8px' }}>{calculatedRunwayMonths} <span style={{ fontSize: '18px', fontWeight: '400', color: '#94a3b8' }}>Months</span></div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>Time until reserve is empty</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Sliders (Using Broadcasters) */}
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ borderBottom: '1px solid #1f2937', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ color: '#38bdf8', fontSize: '16px', fontWeight: '700', margin: 0 }}>Capital Simulation Sliders</h3>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Stress-test operational budgets and overhead metrics</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', fontWeight: '500' }}>Hiring & Engineering Capacity:</span>
                <span style={{ color: '#38bdf8', fontWeight: '700' }}>{hiringMultiplier}% ({formatMoney(simulatedEngineering)}/mo)</span>
              </div>
              <input 
                type="range" min="50" max="250" value={hiringMultiplier} 
                onChange={(e) => handleHiringChange(Number(e.target.value))}
                style={{ width: '100%', height: '6px', borderRadius: '3px', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', fontWeight: '500' }}>Growth & Marketing Strategy:</span>
                <span style={{ color: '#f43f5e', fontWeight: '700' }}>{marketingMultiplier}% ({formatMoney(simulatedMarketing)}/mo)</span>
              </div>
              <input 
                type="range" min="50" max="250" value={marketingMultiplier} 
                onChange={(e) => handleMarketingChange(Number(e.target.value))}
                style={{ width: '100%', height: '6px', borderRadius: '3px', accentColor: '#f43f5e', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Form */}
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <div style={{ borderBottom: '1px solid #1f2937', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '700', margin: 0 }}>Inject Capital Infusion Event</h3>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Log new grant values or funding rounds directly to MySQL</p>
            </div>
            
            <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Inflow Name</label>
                <input 
                  type="text" placeholder="e.g. Govt Grant / Series Seed" value={newMilestone.name}
                  onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #1f2937', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Amount ({currency === 'INR' ? '₹' : '$'})</label>
                  <input 
                    type="number" placeholder="e.g. 500000" value={newMilestone.amount}
                    onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #1f2937', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px', outline: 'none' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Target Month (1-12)</label>
                  <input 
                    type="number" min="1" max="12" placeholder="Month Index" value={newMilestone.monthIndex}
                    onChange={(e) => setNewMilestone({...newMilestone, monthIndex: parseInt(e.target.value) || 1})}
                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #1f2937', backgroundColor: '#0b0f19', color: '#fff', fontSize: '13px', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', marginTop: '8px' }}>
                Commit Secure Record
              </button>
            </form>
          </div>

          {/* Registry List */}
          <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <div style={{ borderBottom: '1px solid #1f2937', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '700', margin: 0 }}>Active Milestone Registry</h3>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Manage live database parameters and entries</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {dbData.milestones.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0b0f19', padding: '12px 16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '13px' }}>{m.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Month {m.monthIndex} • <span style={{ color: '#10b981', fontWeight: '600' }}>{formatMoney(m.amount)}</span></div>
                  </div>
                  <button 
                    onClick={() => handleDeleteMilestone(m.id)}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' }}
                  >
                    Purge
                  </button>
                </div>
              ))}
              {dbData.milestones.length === 0 && (
                <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '24px', backgroundColor: '#0b0f19', borderRadius: '8px' }}>No active milestones found in the database.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Chart */}
        <div style={{ backgroundColor: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column' }}>
          <div style={{ borderBottom: '1px solid #1f2937', paddingBottom: '12px', marginBottom: '24px' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '700', margin: 0 }}>12-Month Simulated Runway Delta</h3>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Real-time projection of cash over 12 months</p>
          </div>
          
          <div style={{ width: '100%', height: '360px', flexGrow: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => currency === 'INR' ? `₹${(val / 1000)}k` : `$${(val / 1000)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#fff', fontSize: '13px' }} formatter={(value) => [formatMoney(value), 'Simulated Cash']} />
                <Area type="monotone" dataKey="Balance" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;