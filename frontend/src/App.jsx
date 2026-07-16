import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currency, setCurrency] = useState('INR');

  // Advanced Interactive Engine States
  const [hiringMultiplier, setHiringMultiplier] = useState(100);
  const [marketingMultiplier, setMarketingMultiplier] = useState(100);
  
  // Feature 1: Dynamic Growth Efficiency Factor (SaaS Core Model)
  const [growthEfficiency, setGrowthEfficiency] = useState(15); // Each marketing unit drives growth %

  // New Milestone Form State
  const [newMilestone, setNewMilestone] = useState({ name: '', amount: '', monthIndex: 1 });

  useEffect(() => {
    fetchFinancials();
  }, []);

  useEffect(() => {
    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }
    function onReceiveBudgetUpdate(data) {
      if (data.hiringMultiplier !== undefined) setHiringMultiplier(data.hiringMultiplier);
      if (data.marketingMultiplier !== undefined) setMarketingMultiplier(data.marketingMultiplier);
      if (data.growthEfficiency !== undefined) setGrowthEfficiency(data.growthEfficiency);
    }

    if (socket.connected) setIsConnected(true);
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

  const handleHiringChange = (value) => {
    setHiringMultiplier(value);
    socket.emit('budget_update', { hiringMultiplier: value, marketingMultiplier, growthEfficiency });
  };

  const handleMarketingChange = (value) => {
    setMarketingMultiplier(value);
    socket.emit('budget_update', { hiringMultiplier, marketingMultiplier: value, growthEfficiency });
  };

  const handleEfficiencyChange = (value) => {
    setGrowthEfficiency(value);
    socket.emit('budget_update', { hiringMultiplier, marketingMultiplier, growthEfficiency: value });
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();

    const payload = {
      name: newMilestone.name.trim(),
      amount: Number(newMilestone.amount),
      monthIndex: parseInt(newMilestone.monthIndex, 10) || 1
    };

    if (!payload.name || isNaN(payload.amount) || payload.amount <= 0) {
      alert("Validation Rejected: Ensure amount is a positive number.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Database pipeline validation failed.');
        return;
      }
      
      setNewMilestone({ name: '', amount: '', monthIndex: 1 });
      fetchFinancials();
    } catch (err) {
      alert('Network transmission error: Server database connection unreachable.');
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!window.confirm("Purge milestone?")) return;
    try {
      await fetch(`http://localhost:5000/api/milestones/${id}`, { method: 'DELETE' });
      fetchFinancials();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatMoney = (value) => {
    if (currency === 'INR') return '₹' + Math.round(value).toLocaleString('en-IN');
    return '$' + Math.round(value).toLocaleString('en-US');
  };

  if (loading) return <div style={{ backgroundColor: '#070a13', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>COMPILING ADVANCED SCENARIO ENGINE...</div>;
  if (error) return <div style={{ backgroundColor: '#070a13', color: '#ef4444', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>Pipeline Connection Error: {error}</div>;

  // --- ADVANCED PROPAGATION FORECASTING MATH ---
  let dynamicCashTrack = dbData.currentCash;
  let runningBaseRevenue = dbData.monthlyRevenue;
  let finalRunwayMonthsCount = 0;
  let defaultCriticalAlertMonth = null;

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const currentMonth = i + 1;

    // Compounding Growth Model: Marketing spend yields revenue scaling base
    const marketingImpactFactor = (marketingMultiplier / 100);
    const revenueGrowthRate = (growthEfficiency / 1000) * marketingImpactFactor;
    runningBaseRevenue = runningBaseRevenue * (1 + revenueGrowthRate);

    // Dynamic Expense States
    const currentSimulatedEng = dbData.expenses.engineering * (hiringMultiplier / 100);
    const currentSimulatedMkt = dbData.expenses.marketing * marketingImpactFactor;
    const currentTotalBurn = currentSimulatedEng + currentSimulatedMkt + dbData.expenses.operations;
    
    // Net operational position
    const monthlyNetDeficit = currentTotalBurn - runningBaseRevenue;

    // Injection milestones check
    const monthlyInflow = dbData.milestones
      .filter(m => m.monthIndex === currentMonth)
      .reduce((sum, item) => sum + item.amount, 0);

    // Apply delta matrix
    dynamicCashTrack = dynamicCashTrack - monthlyNetDeficit + monthlyInflow;
    if (dynamicCashTrack < 0) dynamicCashTrack = 0;

    // Track when the system breaches safety limits (3-Month runway buffer)
    if (monthlyNetDeficit > 0) {
      const remainingRunwayAtThisPoint = dynamicCashTrack / monthlyNetDeficit;
      if (remainingRunwayAtThisPoint < 3 && !defaultCriticalAlertMonth && dynamicCashTrack > 0) {
        defaultCriticalAlertMonth = `Month ${currentMonth}`;
      }
    }

    if (dynamicCashTrack > 0) finalRunwayMonthsCount++;

    return {
      name: `Month ${currentMonth}`,
      Balance: Math.round(dynamicCashTrack),
      Revenue: Math.round(runningBaseRevenue),
      BurnRate: Math.round(currentTotalBurn)
    };
  });

  const pieData = [
    { name: 'Engineering', value: Math.round(dbData.expenses.engineering * (hiringMultiplier / 100)), color: '#38bdf8' },
    { name: 'Marketing', value: Math.round(dbData.expenses.marketing * (marketingMultiplier / 100)), color: '#f43f5e' },
    { name: 'Operations', value: Math.round(dbData.expenses.operations), color: '#eab308' }
  ];

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Month,Simulated Cash Balance,Simulated Revenue Inflow,Simulated Burn Rate\n";
    chartData.forEach(row => { csvContent += `${row.name},${row.Balance},${row.Revenue},${row.BurnRate}\n`; });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Enterprise_Runway_Intelligence_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ backgroundColor: '#070a13', color: '#f8fafc', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Dynamic System Alert Banner */}
      {defaultCriticalAlertMonth && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '12px 20px', borderRadius: '8px', marginBottom: '24px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
          <span style={{ animation: 'pulse 1.5s infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
          <strong>CRITICAL RISK DETECTED:</strong> Cash reserves projected to breach safety standard (less than 3 months buffer remaining) around <strong>{defaultCriticalAlertMonth}</strong>.
          <style>{`@keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }`}</style>
        </div>
      )}

      {/* Header Panel */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '20px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
            {dbData.companyName} <span style={{ color: '#0ea5e9', fontWeight: '400' }}>/ Advanced Runway Intelligence Matrix</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', margin: 0 }}>Mathematical Forecasting Loop & Risk Mitigation System</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
            <button onClick={() => setCurrency('INR')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', backgroundColor: currency === 'INR' ? '#0ea5e9' : 'transparent', color: currency === 'INR' ? '#0f172a' : '#94a3b8' }}>INR (₹)</button>
            <button onClick={() => setCurrency('USD')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', backgroundColor: currency === 'USD' ? '#0ea5e9' : 'transparent', color: currency === 'USD' ? '#0f172a' : '#94a3b8' }}>USD ($)</button>
          </div>
          <button onClick={handleExportCSV} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>📥 Export Institutional Ledger</button>
          <span style={{ fontSize: '11px', backgroundColor: isConnected ? '#064e3b' : '#1e293b', padding: '6px 12px', borderRadius: '20px', color: isConnected ? '#34d399' : '#94a3b8', fontWeight: '600' }}>
            {isConnected ? 'MULTIPLAYER_ACTIVE' : 'STANDALONE'}
          </span>
        </div>
      </header>

      {/* Core Telemetry Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Algorithmic Runway Duration</div>
          <div style={{ fontSize: '36px', fontWeight: '900', color: finalRunwayMonthsCount < 6 ? '#f43f5e' : '#10b981', marginTop: '8px' }}>
            {finalRunwayMonthsCount >= 12 ? '12+' : finalRunwayMonthsCount} <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '400' }}>Months</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Terminal Adjusted Burn Rate</div>
          <div style={{ fontSize: '36px', fontWeight: '900', color: '#f43f5e', marginTop: '8px' }}>{formatMoney(chartData[11].BurnRate)}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Compounded Month-12 Revenue Inflow</div>
          <div style={{ fontSize: '36px', fontWeight: '900', color: '#10b981', marginTop: '8px' }}>{formatMoney(chartData[11].Revenue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '32px' }}>
        
        {/* Left Control Columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h3 style={{ color: '#38bdf8', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>SaaS Algorithmic Growth Controls</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>Hiring Overhead Multiplier:</span>
                <span style={{ color: '#38bdf8', fontWeight: '700' }}>{hiringMultiplier}%</span>
              </div>
              <input type="range" min="50" max="250" value={hiringMultiplier} onChange={(e) => handleHiringChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#38bdf8' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>Marketing Acquisition Scale:</span>
                <span style={{ color: '#f43f5e', fontWeight: '700' }}>{marketingMultiplier}%</span>
              </div>
              <input type="range" min="50" max="250" value={marketingMultiplier} onChange={(e) => handleMarketingChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#f43f5e' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8' }}>Marketing CAC Efficiency Dynamic:</span>
                <span style={{ color: '#eab308', fontWeight: '700' }}>{(growthEfficiency / 10).toFixed(1)}% Yield Increase</span>
              </div>
              <input type="range" min="5" max="50" value={growthEfficiency} onChange={(e) => handleEfficiencyChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#eab308' }} />
            </div>
          </div>

          {/* Form */}
          <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0 0 20px 0' }}>Inject Capital Infusion Event</h3>
            <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="text" placeholder="Inflow Name (e.g. Series A)" value={newMilestone.name} onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#070a13', color: '#fff' }} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <input type="number" placeholder="Amount" value={newMilestone.amount} onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#070a13', color: '#fff' }} required />
                <input type="number" min="1" max="12" placeholder="Target Month" value={newMilestone.monthIndex} onChange={(e) => setNewMilestone({...newMilestone, monthIndex: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#070a13', color: '#fff' }} required />
              </div>
              <button type="submit" style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}>Commit Ledger Record</button>
            </form>
          </div>

          {/* RESTORED: Active Milestone Registry List Component Layout */}
          <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ borderBottom: '1px solid #1f2937', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: '700', margin: 0 }}>Active Milestone Registry</h3>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Manage live database parameters and entries</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {dbData.milestones.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#070a13', padding: '12px 16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
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
                <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '24px', backgroundColor: '#070a13', borderRadius: '8px' }}>No active milestones found in the database.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Output Dashboard Columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Forecast Graph */}
          <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '700', margin: '0 0 16px 0' }}>Algorithmic Cash Flow Optimization Runway Projections</h3>
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} tickFormatter={(val) => currency === 'INR' ? `₹${(val / 1000)}k` : `$${(val / 1000)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} formatter={(value) => [formatMoney(value), 'Cash Balance']} />
                  <Area type="monotone" dataKey="Balance" stroke="#0ea5e9" strokeWidth={3} fill="rgba(14, 165, 233, 0.1)" />
                  
                  {/* Visual Reference Line marking the strict 3-Month Buffer Red Zone */}
                  <ReferenceLine y={dbData.currentCash * 0.25} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Risk Zone Threshold', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operational Expense Breakdown */}
          <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ width: '130px', height: '130px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pieData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></span>
                  <span style={{ color: '#94a3b8' }}>{item.name}: <strong>{formatMoney(item.value)}/mo</strong></span>
                </div>
              ))}
            </div>
          </div>

        </div>
   
      </div>
    </div>
  );
}

export default App;