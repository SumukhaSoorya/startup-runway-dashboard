import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulation Sliders States (Percentage modifiers: 100% = No Change)
  const [hiringMultiplier, setHiringMultiplier] = useState(100);
  const [marketingMultiplier, setMarketingMultiplier] = useState(100);

  // New Milestone Form State
  const [newMilestone, setNewMilestone] = useState({ name: '', amount: '', monthIndex: 1 });

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/financials');
      if (!response.ok) throw new Error('Failed to load secure pipeline data.');
      const data = await response.ok ? await response.json() : null;
      setDbData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      fetchFinancials(); // Refresh data layout securely from MySQL
    } catch (err) {
      alert('Network transmission error.');
    }
  };

  if (loading) return <div style={{color: '#fff', padding: '20px'}}>Loading secure financial arrays...</div>;
  if (error) return <div style={{color: '#ef4444', padding: '20px'}}>Network Link Fault: {error}</div>;

  // --- RUNWAY SIMULATION CALCULATIONS ---
  const simulatedEngineering = dbData.expenses.engineering * (hiringMultiplier / 100);
  const simulatedMarketing = dbData.expenses.marketing * (marketingMultiplier / 100);
  const totalSimulatedBurn = simulatedEngineering + simulatedMarketing + dbData.expenses.operations;
  const netMonthlyBurn = totalSimulatedBurn - dbData.monthlyRevenue;

  // Generate dynamic 12-month timeline array based on live slider values
  let currentCashRunway = dbData.currentCash;
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const currentMonth = i + 1;
    
    // Inject dynamic milestone cash inflows securely if they match the simulated month
    const monthlyInflow = dbData.milestones
      .filter(m => m.monthIndex === currentMonth)
      .reduce((sum, m) => sum + m.amount, 0);

    currentCashRunway = currentCashRunway - netMonthlyBurn + monthlyInflow;
    if (currentCashRunway < 0) currentCashRunway = 0; // Floor cash drop calculations at zero

    return {
      name: `Month ${currentMonth}`,
      Balance: Math.round(currentCashRunway)
    };
  });

  const calculatedRunwayMonths = netMonthlyBurn > 0 ? (dbData.currentCash / netMonthlyBurn).toFixed(1) : '∞';

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Header Panel */}
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#38bdf8' }}>{dbData.companyName} // Runway Pulse</h1>
        <p style={{ color: '#94a3b8' }}>Enterprise Scenario Planning Simulation Matrix Engine</p>
      </header>

      {/* Primary Telemetry Readouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>Starting Cash Balance</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>${dbData.currentCash.toLocaleString()}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>Simulated Monthly Burn Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>${Math.round(totalSimulatedBurn).toLocaleString()}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>Simulated Safe Runway Runway</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eab308' }}>{calculatedRunwayMonths} Months</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* Left Hand: Controller & Input Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Interactive Simulation Sliders Block */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #0284c7' }}>
            <h3 style={{ color: '#38bdf8', marginBottom: '16px', fontWeight: 'bold' }}>Live Capital Simulation Sliders</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span>Hiring & Engineering Capacity:</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{hiringMultiplier}% (${Math.round(simulatedEngineering).toLocaleString()}/mo)</span>
              </label>
              <input 
                type="range" min="50" max="250" value={hiringMultiplier} 
                onChange={(e) => setHiringMultiplier(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                <span>Growth & Marketing Budget Strategy:</span>
                <span style={{ color: '#f43f5e', fontWeight: 'bold' }}>{marketingMultiplier}% (${Math.round(simulatedMarketing).toLocaleString()}/mo)</span>
              </label>
              <input 
                type="range" min="50" max="250" value={marketingMultiplier} 
                onChange={(e) => setMarketingMultiplier(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f43f5e' }}
              />
            </div>
          </div>

          {/* Secure Inflow Writer Form */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ marginBottom: '16px', fontWeight: 'bold' }}>Inject Capital Infusion Event</h3>
            <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="text" placeholder="Inflow Name (e.g. Series A)" value={newMilestone.name}
                onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                required
              />
              <input 
                type="number" placeholder="Inflow Amount ($)" value={newMilestone.amount}
                onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                required
              />
              <input 
                type="number" min="1" max="12" placeholder="Target Month Index (1-12)" value={newMilestone.monthIndex}
                onChange={(e) => setNewMilestone({...newMilestone, monthIndex: parseInt(e.target.value) || 1})}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                required
              />
              <button type="submit" style={{ padding: '10px', borderRadius: '4px', backgroundColor: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Commit Secure Record
              </button>
            </form>
          </div>
        </div>

        {/* Right Hand: Interactive Simulation Graph Rendering */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 'bold' }}>12-Month Simulated Runway Delta</h3>
          <div style={{ width: '100%', height: '300px', flexGrow: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Area type="monotone" dataKey="Balance" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;