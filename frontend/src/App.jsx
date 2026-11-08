import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Area, 
  Line, 
  ComposedChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { io } from 'socket.io-client';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  UploadCloud, 
  Trash2, 
  Settings2, 
  CheckCircle2, 
  Zap, 
  Download, 
  RefreshCw, 
  Layers, 
  PieChart, 
  Plus, 
  FileSpreadsheet, 
  LogOut, 
  Sliders,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';
import './App.css';

// Socket singleton connecting to the backend engine
const socket = io('http://localhost:5002', {
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export default function App() {
  // =========================================================================
  // 1. STATE DEFINITIONS
  // =========================================================================
  const [token, setToken] = useState(() => localStorage.getItem('runway_token') || null);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('runway_user_email') || '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Financial Database & Network State
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [fetchError, setFetchError] = useState(null);
  const [isConnected, setIsConnected] = useState(() => socket.connected);
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'
  const [activeTab, setActiveTab] = useState('milestones'); // 'milestones' | 'expenses' | 'copilot'

  // Scenario Multipliers
  const [hiringMultiplier, setHiringMultiplier] = useState(100);
  const [marketingMultiplier, setMarketingMultiplier] = useState(100);
  const [growthEfficiency, setGrowthEfficiency] = useState(15); // 1.5%

  // Milestones & Modals
  const [newMilestone, setNewMilestone] = useState({ name: '', amount: '', monthIndex: 1 });
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '',
    currentCash: 1000000,
    monthlyRevenue: 85000,
    engineering: 40000,
    marketing: 20000,
    operations: 15000
  });

  const fileInputRef = useRef(null);

  // AI Copilot States
  const [aiInsight, setAiInsight] = useState('');
  const [aiEngine, setAiEngine] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAuditTimestamp, setLastAuditTimestamp] = useState(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // =========================================================================
  // 2. CORE AUTH & REQUEST HELPERS (DECLARED BEFORE ANY useEffect TRIGGERS)
  // =========================================================================
  const handleLogout = useCallback(() => {
    localStorage.removeItem('runway_token');
    localStorage.removeItem('runway_user_email');
    setToken(null);
    setUserEmail('');
    setDbData(null);
  }, []);

  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, [token]);

  const fetchFinancials = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('http://localhost:5002/api/financials', {
        headers: getHeaders()
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setDbData(data);
      setCurrency(data.currency || 'USD');
      setEditForm({
        companyName: data.companyName || '',
        currentCash: data.currentCash || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        engineering: data?.expenses?.engineering || 0,
        marketing: data?.expenses?.marketing || 0,
        operations: data?.expenses?.operations || 0
      });
    } catch (err) {
      setFetchError(err.message || 'Failed to retrieve company financials.');
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders, handleLogout]);

  // =========================================================================
  // 3. LIFECYCLE & WEBSOCKET SUBSCRIPTIONS
  // =========================================================================
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleServerUpdate = (payload) => {
      if (payload && payload.userId) {
        fetchFinancials();
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('financials_updated', handleServerUpdate);
    socket.on('milestone_added', handleServerUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('financials_updated', handleServerUpdate);
      socket.off('milestone_added', handleServerUpdate);
    };
  }, [fetchFinancials]);

  useEffect(() => {
    let isSubscribed = true;
    if (!token) return;

    const loadData = async () => {
      try {
        const res = await fetch('http://localhost:5002/api/financials', {
          headers: getHeaders()
        });
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (isSubscribed) {
          setDbData(data);
          setCurrency(data.currency || 'USD');
          setEditForm({
            companyName: data.companyName || '',
            currentCash: data.currentCash || 0,
            monthlyRevenue: data.monthlyRevenue || 0,
            engineering: data?.expenses?.engineering || 0,
            marketing: data?.expenses?.marketing || 0,
            operations: data?.expenses?.operations || 0
          });
          setLoading(false);
        }
      } catch (err) {
        if (isSubscribed) {
          setFetchError(err.message || 'Failed to retrieve company financials.');
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [token, getHeaders, handleLogout]);

  // =========================================================================
  // 4. ACTION HANDLERS
  // =========================================================================
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(`http://localhost:5002${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed.');

      localStorage.setItem('runway_token', data.token);
      localStorage.setItem('runway_user_email', data.user.email);
      setToken(data.token);
      setUserEmail(data.user.email);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setLoginEmail('admin@enterprise.com');
    setLoginPassword('admin123');
    setIsRegistering(false);
    setAuthError(null);
  };

  const handleUpdateFinancials = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5002/api/financials', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          companyName: editForm.companyName,
          currentCash: Number(editForm.currentCash),
          monthlyRevenue: Number(editForm.monthlyRevenue),
          currency,
          expenses: {
            engineering: Number(editForm.engineering),
            marketing: Number(editForm.marketing),
            operations: Number(editForm.operations)
          }
        })
      });
      if (!res.ok) throw new Error('Update failed');
      setShowEditModal(false);
      fetchFinancials();
    } catch {
      alert('Unable to persist financial baseline updates.');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.name || !newMilestone.amount) return;
    setIsSubmittingMilestone(true);
    try {
      const res = await fetch('http://localhost:5002/api/milestones', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newMilestone.name,
          amount: Number(newMilestone.amount),
          monthIndex: Number(newMilestone.monthIndex)
        })
      });
      if (!res.ok) throw new Error('Failed to record milestone');
      setNewMilestone({ name: '', amount: '', monthIndex: 1 });
      setShowAddModal(false);
      fetchFinancials();
    } catch {
      alert('Failed to record funding milestone.');
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (id) => {
    if (!confirm('Remove this funding milestone from trajectory model?')) return;
    try {
      const res = await fetch(`http://localhost:5002/api/milestones/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchFinancials();
    } catch {
      alert('Failed to remove milestone.');
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5002/api/milestones/upload-csv', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('CSV Upload failed');
      alert('Milestone ledger synchronized from CSV!');
      fetchFinancials();
    } catch {
      alert('CSV format error. Required columns: name, amount, month_index');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = 'name,amount,month_index\nSeries A Inflow,500000,3\nStrategic Partnership,150000,7\nR&D Tax Incentive,45000,10';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_funding_milestones.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyPreset = (h, m, g) => {
    setHiringMultiplier(h);
    setMarketingMultiplier(m);
    setGrowthEfficiency(g);
  };

  // =========================================================================
  // 5. PROJECTION ENGINE & DERIVED METRICS
  // =========================================================================
  const { chartData, runwayMonths, currentBurn, totalInflows, zeroCashMonth } = useMemo(() => {
    const engBase = Number(dbData?.expenses?.engineering || 0);
    const mktBase = Number(dbData?.expenses?.marketing || 0);
    const opsBase = Number(dbData?.expenses?.operations || 0);
    const milestones = Array.isArray(dbData?.milestones) ? dbData.milestones : [];

    const totalMilestoneSum = milestones.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const data = [];
    let rollingCash = Number(dbData?.currentCash || 0);
    let rollingRev = Number(dbData?.monthlyRevenue || 0);
    let months = 0;
    let initialBurn = 0;
    let firstZeroMonth = null;

    for (let i = 0; i < 12; i++) {
      const currentMonth = i + 1;
      const mktFactor = (marketingMultiplier || 100) / 100;
      const growthRate = ((growthEfficiency || 15) / 1000) * mktFactor;

      rollingRev = rollingRev * (1 + growthRate);

      const engExp = engBase * ((hiringMultiplier || 100) / 100);
      const mktExp = mktBase * mktFactor;
      const totalBurn = engExp + mktExp + opsBase;
      if (i === 0) initialBurn = totalBurn;

      const monthlyInflow = milestones
        .filter(m => Number(m.monthIndex || m.month_index) === currentMonth)
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      const netBurn = Math.max(0, totalBurn - rollingRev);
      rollingCash = Math.max(0, rollingCash - netBurn + monthlyInflow);

      if (rollingCash > 0) {
        months++;
      } else if (firstZeroMonth === null) {
        firstZeroMonth = currentMonth;
      }

      data.push({
        month: `M${currentMonth}`,
        fullMonth: `Month ${currentMonth}`,
        Balance: Math.round(rollingCash),
        BurnRate: Math.round(totalBurn),
        Revenue: Math.round(rollingRev),
        NetBurn: Math.round(netBurn),
        Inflow: Math.round(monthlyInflow)
      });
    }

    return { 
      chartData: data, 
      runwayMonths: months, 
      currentBurn: Math.round(initialBurn),
      totalInflows: totalMilestoneSum,
      zeroCashMonth: firstZeroMonth
    };
  }, [dbData, hiringMultiplier, marketingMultiplier, growthEfficiency]);

  // Multi-Currency Regional Formatter
  const formatMoney = useCallback((val) => {
    const num = Math.round(Number(val) || 0);
    return currency === 'INR' 
      ? `₹${num.toLocaleString('en-IN')}` 
      : `$${num.toLocaleString('en-US')}`;
  }, [currency]);

  // AI CFO Audit Dispatcher
  const requestAICFOAudit = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('http://localhost:5002/api/ai/analyze', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          currentCash: Number(dbData?.currentCash || 1000000),
          monthlyBurn: currentBurn,
          runwayMonths,
          hiringMultiplier,
          marketingMultiplier,
          growthEfficiency,
          currency
        })
      });
      const data = await res.json();
      setAiInsight(data.insight || 'Financial audit completed successfully.');
      setAiEngine(data.engine || 'gemini-2.5-flash');
      setLastAuditTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      const fallback = runwayMonths < 6
        ? `CRITICAL CAPITAL DEFICIT DIAGNOSIS:\nCurrent reserves of ${formatMoney(dbData?.currentCash)} provide only ${runwayMonths} month(s) of survival under current net burn of ${formatMoney(currentBurn)}/month.\n\nEXECUTIVE MITIGATION ACTIONS:\n1. Conserve Headcount: Restrict hiring multiplier down to 70% to immediately lower payroll run-rate.\n2. Inflow Pacing: Accelerate pipeline capital milestones and pause speculative acquisition spend.`
        : `STABLE CAPITAL POSITION:\nYou hold ${runwayMonths}+ months of operational buffer with ${formatMoney(dbData?.currentCash)} in reserves against ${formatMoney(currentBurn)} monthly burn.\n\nEXECUTIVE MITIGATION ACTIONS:\n1. Disciplined Execution: Maintain baseline hiring pacing while driving product roadmap milestones.\n2. CAC Payback Focus: Scale marketing spend strictly into channels with under 8-month payback.`;
      setAiInsight(fallback);
      setAiEngine('deterministic-cfo-engine');
      setLastAuditTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setAiLoading(false);
    }
  };

  // =========================================================================
  // 6. RENDER BRANCH: AUTHENTICATION
  // =========================================================================
  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div className="studio-card" style={{ width: '100%', maxWidth: '420px', padding: '36px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--accent-blue-subtle)',
              border: '1px solid var(--accent-blue-border)',
              marginBottom: '14px',
              color: 'var(--accent-blue)'
            }}>
              <TrendingUp style={{ width: '28px', height: '28px' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>
              RunwayPulse
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '6px' }}>
              Autonomous Capital Runway & Liquidity Intelligence
            </p>
          </div>

          {authError && (
            <div style={{
              background: 'var(--accent-rose-subtle)',
              border: '1px solid var(--accent-rose-border)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '18px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '0.04em' }}>
                CORPORATE EMAIL
              </label>
              <input
                type="email"
                placeholder="founder@enterprise.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '0.04em' }}>
                ACCESS KEY
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                justifyContent: 'center',
                fontSize: '13px',
                marginTop: '4px'
              }}
            >
              {authLoading ? 'Verifying Identity...' : (isRegistering ? 'Provision Workspace' : 'Sign In to Cockpit')}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div style={{ marginTop: '14px' }}>
            <button
              type="button"
              onClick={fillDemoAccount}
              style={{
                width: '100%',
                padding: '9px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-body)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Fill Demo Credentials (admin@enterprise.com)
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-dim)' }}>
            {isRegistering ? 'Already registered?' : 'New deployment?'}{' '}
            <button
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                cursor: 'pointer',
                fontWeight: '600',
                padding: 0
              }}
            >
              {isRegistering ? 'Sign In' : 'Create an Account'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // 7. RENDER BRANCH: LOADING STATE
  // =========================================================================
  if (loading && !dbData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <RefreshCw className="animate-spin" style={{ width: '28px', height: '28px', color: 'var(--accent-blue)' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 500 }}>
          Synchronizing Ledger Telemetry...
        </span>
      </div>
    );
  }

  // Calculate Scenario Deltas for Sensitivity Box
  const baselineNetBurn = Math.max(0, 
    ((Number(dbData?.expenses?.engineering || 0)) + 
     (Number(dbData?.expenses?.marketing || 0)) + 
     (Number(dbData?.expenses?.operations || 0))) - 
    (Number(dbData?.monthlyRevenue || 0))
  );
  const burnDelta = currentBurn - baselineNetBurn;

  // =========================================================================
  // 8. RENDER BRANCH: MAIN ENTERPRISE DASHBOARD
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', paddingBottom: '60px' }}>
      
      {/* 8.1 TOP NAVIGATION HEADER */}
      <header style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Brand & Connection Telemetry */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}>
              <TrendingUp style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  RunwayPulse
                </span>
                <span className="status-pill emerald">
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                    display: 'inline-block'
                  }} className={isConnected ? "live-indicator" : ""} />
                  {isConnected ? 'Live Engine' : 'Reconnecting...'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0, fontWeight: 500 }}>
                {dbData?.companyName || 'Institutional Workspace'} • Financial Cockpit
              </p>
            </div>
          </div>

          {/* Strategic Preset Controller & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Scenario Presets */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-card-subtle)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => applyPreset(70, 70, 10)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: (hiringMultiplier === 70 && marketingMultiplier === 70) ? 'var(--bg-card)' : 'transparent',
                  color: (hiringMultiplier === 70 && marketingMultiplier === 70) ? 'var(--accent-blue)' : 'var(--text-dim)',
                  boxShadow: (hiringMultiplier === 70 && marketingMultiplier === 70) ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Austerity
              </button>
              <button
                onClick={() => applyPreset(100, 100, 15)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: (hiringMultiplier === 100 && marketingMultiplier === 100) ? 'var(--bg-card)' : 'transparent',
                  color: (hiringMultiplier === 100 && marketingMultiplier === 100) ? 'var(--accent-blue)' : 'var(--text-dim)',
                  boxShadow: (hiringMultiplier === 100 && marketingMultiplier === 100) ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Baseline
              </button>
              <button
                onClick={() => applyPreset(150, 140, 25)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: (hiringMultiplier === 150 && marketingMultiplier === 140) ? 'var(--bg-card)' : 'transparent',
                  color: (hiringMultiplier === 150 && marketingMultiplier === 140) ? 'var(--accent-blue)' : 'var(--text-dim)',
                  boxShadow: (hiringMultiplier === 150 && marketingMultiplier === 140) ? 'var(--shadow-sm)' : 'none'
                }}
              >
                Hypergrowth
              </button>
            </div>

            {/* Currency Selector */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-card-subtle)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setCurrency('USD')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: currency === 'USD' ? 'var(--bg-card)' : 'transparent',
                  color: currency === 'USD' ? 'var(--accent-blue)' : 'var(--text-dim)',
                  boxShadow: currency === 'USD' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                $ USD
              </button>
              <button
                onClick={() => setCurrency('INR')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: currency === 'INR' ? 'var(--bg-card)' : 'transparent',
                  color: currency === 'INR' ? 'var(--accent-blue)' : 'var(--text-dim)',
                  boxShadow: currency === 'INR' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                ₹ INR
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              className="btn-secondary"
              title="Toggle Theme"
              style={{ padding: '6px 10px' }}
            >
              {theme === 'light' ? <Moon style={{ width: '15px', height: '15px' }} /> : <Sun style={{ width: '15px', height: '15px' }} />}
            </button>

            {/* Edit Baseline Parameters Modal Trigger */}
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary"
            >
              <Settings2 style={{ width: '14px', height: '14px' }} />
              <span>Edit Baseline</span>
            </button>

            {/* User Profile & Sign Out */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '6px 8px', color: 'var(--accent-rose)' }}
                title="Sign Out"
              >
                <LogOut style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 8.2 MAIN CONTENT CONTAINER */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>

        {fetchError && (
          <div style={{
            background: 'var(--accent-rose-subtle)',
            border: '1px solid var(--accent-rose-border)',
            color: 'var(--accent-rose)',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle style={{ width: '18px', height: '18px' }} />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={fetchFinancials}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 8.3 TOP KPI SUMMARY STRIP (4 METRIC CARDS) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          
          {/* KPI 1: CASH RESERVES */}
          <div className="studio-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                  Cash On Hand (Reserves)
                </span>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                  {formatMoney(dbData?.currentCash)}
                </div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-blue-subtle)',
                border: '1px solid var(--accent-blue-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)'
              }}>
                <DollarSign style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span className="status-pill emerald">
                +{formatMoney(totalInflows)} Milestones
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                across {dbData?.milestones?.length || 0} scheduled tranches
              </span>
            </div>
          </div>

          {/* KPI 2: NET MONTHLY BURN */}
          <div className="studio-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                  Net Monthly Burn
                </span>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                  {formatMoney(currentBurn)}<span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-dim)' }}>/mo</span>
                </div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--accent-amber-subtle)',
                border: '1px solid var(--accent-amber-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)'
              }}>
                <TrendingDown style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-body)', fontWeight: 600 }}>
                Revenue: {formatMoney(dbData?.monthlyRevenue)}/mo
              </span>
              <span style={{ color: 'var(--text-faint)' }}>•</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                Eng: {formatMoney((dbData?.expenses?.engineering || 0) * (hiringMultiplier / 100))}
              </span>
            </div>
          </div>

          {/* KPI 3: RUNWAY RUN-RATE */}
          <div className="studio-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                  Runway Horizon
                </span>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: '800', color: runwayMonths >= 12 ? 'var(--accent-emerald)' : (runwayMonths >= 6 ? 'var(--accent-amber)' : 'var(--accent-rose)'), marginTop: '4px' }}>
                  {runwayMonths >= 12 ? '12+ Months' : `${runwayMonths} Months`}
                </div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: runwayMonths >= 12 ? 'var(--accent-emerald-subtle)' : (runwayMonths >= 6 ? 'var(--accent-amber-subtle)' : 'var(--accent-rose-subtle)'),
                border: `1px solid ${runwayMonths >= 12 ? 'var(--accent-emerald-border)' : (runwayMonths >= 6 ? 'var(--accent-amber-border)' : 'var(--accent-rose-border)')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: runwayMonths >= 12 ? 'var(--accent-emerald)' : (runwayMonths >= 6 ? 'var(--accent-amber)' : 'var(--accent-rose)')
              }}>
                <Calendar style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
            <div>
              <span className={`status-pill ${runwayMonths >= 12 ? 'emerald' : (runwayMonths >= 6 ? 'amber' : 'rose')}`}>
                {runwayMonths >= 12 ? 'Healthy Trajectory (>12 mo)' : (runwayMonths >= 6 ? 'Cautionary Runway (6-12 mo)' : 'Critical Deficit (<6 mo)')}
              </span>
            </div>
          </div>

          {/* KPI 4: ZERO CASH HORIZON */}
          <div className="studio-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                  Zero-Cash Threshold
                </span>
                <div className="font-mono" style={{ fontSize: '24px', fontWeight: '800', color: zeroCashMonth ? 'var(--accent-rose)' : 'var(--accent-blue)', marginTop: '4px' }}>
                  {zeroCashMonth ? `Month ${zeroCashMonth}` : 'Extended >12M'}
                </div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: zeroCashMonth ? 'var(--accent-rose-subtle)' : 'var(--accent-blue-subtle)',
                border: `1px solid ${zeroCashMonth ? 'var(--accent-rose-border)' : 'var(--accent-blue-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: zeroCashMonth ? 'var(--accent-rose)' : 'var(--accent-blue)'
              }}>
                <ShieldAlert style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              {zeroCashMonth ? 'Deficit occurs unless funding is injected' : 'Positive cash buffer maintained across projection'}
            </div>
          </div>

        </div>

        {/* 8.4 MAIN VISUAL WORKSPACE: CHART (65%) + SCENARIO MODELER (35%) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
          gap: '20px',
          marginBottom: '24px'
        }}>
          
          {/* 8.4.1 HIGH RESOLUTION RECHARTS PROJECTION CANVAS */}
          <div className="studio-card" style={{ padding: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  12-Month Projected Liquidity Trajectory
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                  Real-time cash balance, burn rate, and capital milestone integration
                </p>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-blue)' }} />
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Reserves</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-amber)' }} />
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Burn</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-emerald)' }} />
                  <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>Revenue</span>
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div style={{ width: '100%', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => {
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                      if (v >= 1000) return `${Math.round(v / 1000)}k`;
                      return v;
                    }}
                  />

                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                            {item.fullMonth}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', color: '#2563eb', fontWeight: 600, marginBottom: '4px' }}>
                            <span>Cash Balance:</span>
                            <span className="font-mono">{formatMoney(item.Balance)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', color: '#d97706', marginBottom: '4px' }}>
                            <span>Total Burn:</span>
                            <span className="font-mono">{formatMoney(item.BurnRate)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', color: '#059669', marginBottom: '4px' }}>
                            <span>Revenue:</span>
                            <span className="font-mono">{formatMoney(item.Revenue)}</span>
                          </div>
                          {item.Inflow > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', color: '#4f46e5', fontWeight: 600, paddingTop: '4px', borderTop: '1px dashed #e2e8f0', marginTop: '4px' }}>
                              <span>Milestone Inflow:</span>
                              <span className="font-mono">+{formatMoney(item.Inflow)}</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />

                  <Area 
                    type="monotone" 
                    dataKey="Balance" 
                    stroke="#2563eb" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#balanceGradient)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="BurnRate" 
                    stroke="#f97316" 
                    strokeWidth={1.8} 
                    strokeDasharray="4 4" 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="#10b981" 
                    strokeWidth={1.8} 
                    dot={false} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* 8.4.2 SCENARIO & SENSITIVITY STRESS TESTER */}
          <div className="studio-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders style={{ width: '18px', height: '18px', color: 'var(--accent-blue)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Sensitivity Modeler
                </h3>
              </div>
              <button
                onClick={() => applyPreset(100, 100, 15)}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                Reset
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '20px' }}>
              Simulate dynamic hiring pacing, acquisition spend, and revenue expansion rates.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              {/* SLIDER 1: ENGINEERING / HEADCOUNT */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-body)' }}>
                    Engineering & Headcount
                  </span>
                  <span className="font-mono status-pill blue">
                    {hiringMultiplier}% ({formatMoney((dbData?.expenses?.engineering || 0) * (hiringMultiplier / 100))})
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={hiringMultiplier}
                  onChange={(e) => setHiringMultiplier(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* SLIDER 2: MARKETING & ACQUISITION */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-body)' }}>
                    Marketing & Acquisition
                  </span>
                  <span className="font-mono status-pill amber">
                    {marketingMultiplier}% ({formatMoney((dbData?.expenses?.marketing || 0) * (marketingMultiplier / 100))})
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={marketingMultiplier}
                  onChange={(e) => setMarketingMultiplier(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* SLIDER 3: MOM REVENUE EXPANSION */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-body)' }}>
                    MoM Growth Efficiency
                  </span>
                  <span className="font-mono status-pill emerald">
                    {(growthEfficiency / 10).toFixed(1)}% / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={growthEfficiency}
                  onChange={(e) => setGrowthEfficiency(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* REAL-TIME IMPACT SUMMARY BOX */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px',
                marginTop: 'auto'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '8px' }}>
                  Simulated Scenario Variance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Net Burn Impact:</span>
                    <span className="font-mono" style={{ fontSize: '13px', fontWeight: '700', color: burnDelta > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {burnDelta > 0 ? `+${formatMoney(burnDelta)}` : formatMoney(burnDelta)}/mo
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Runway Trajectory:</span>
                    <span className="font-mono" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {runwayMonths >= 12 ? '12+ Months' : `${runwayMonths} Months`}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 8.5 INTERACTIVE TABBED WORKSPACE: MILESTONES / EXPENSES / AI COPILOT */}
        <div className="studio-card" style={{ padding: '24px' }}>
          
          {/* TAB HEADERS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setActiveTab('milestones')}
                className={`tab-pill ${activeTab === 'milestones' ? 'active' : ''}`}
              >
                <Layers style={{ width: '15px', height: '15px' }} />
                <span>Capital Milestones ({dbData?.milestones?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`tab-pill ${activeTab === 'expenses' ? 'active' : ''}`}
              >
                <PieChart style={{ width: '15px', height: '15px' }} />
                <span>Departmental Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('copilot')}
                className={`tab-pill ${activeTab === 'copilot' ? 'active' : ''}`}
              >
                <Sparkles style={{ width: '15px', height: '15px', color: 'var(--accent-blue)' }} />
                <span>Autonomous AI CFO Memo</span>
              </button>
            </div>

            {activeTab === 'milestones' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  <span>Add Inflow Milestone</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <UploadCloud style={{ width: '14px', height: '14px' }} />
                  <span>Bulk CSV</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCsvUpload}
                  accept=".csv"
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* TAB 1: CAPITAL MILESTONES & CSV INGESTION */}
          {activeTab === 'milestones' && (
            <div>
              {(!dbData?.milestones || dbData.milestones.length === 0) ? (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-medium)'
                }}>
                  <Layers style={{ width: '32px', height: '32px', color: 'var(--text-dim)', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    No Scheduled Capital Inflows
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px' }}>
                    Inject expected funding rounds, grants, or venture debt to evaluate cash runway extensions.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                  >
                    <Plus style={{ width: '14px', height: '14px' }} />
                    <span>Schedule First Milestone</span>
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="studio-table">
                    <thead>
                      <tr>
                        <th>Funding Descriptor</th>
                        <th>Scheduled Month</th>
                        <th>Capital Amount</th>
                        <th>Model Impact</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbData.milestones.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {m.name}
                          </td>
                          <td>
                            <span className="status-pill blue">
                              Month {m.monthIndex || m.month_index}
                            </span>
                          </td>
                          <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            +{formatMoney(m.amount)}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                            Injected into Month {m.monthIndex || m.month_index} reserves
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteMilestone(m.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--accent-rose)',
                                cursor: 'pointer',
                                padding: '4px 6px',
                                borderRadius: '4px'
                              }}
                              title="Delete Milestone"
                            >
                              <Trash2 style={{ width: '15px', height: '15px' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CSV Upload Assistant Helper */}
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                  <FileSpreadsheet style={{ width: '16px', height: '16px', color: 'var(--accent-blue)' }} />
                  <span>Bulk ingestion requires columns: <code className="font-mono" style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px' }}>name, amount, month_index</code></span>
                </div>
                <button
                  onClick={downloadSampleCsv}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-blue)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    padding: 0
                  }}
                >
                  <Download style={{ width: '13px', height: '13px' }} />
                  <span>Download Sample Template</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: DEPARTMENTAL EXPENSES BREAKDOWN */}
          {activeTab === 'expenses' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                
                {/* Engineering Card */}
                <div style={{ padding: '18px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-body)' }}>Engineering & Product</span>
                    <span className="status-pill blue">{hiringMultiplier}%</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {formatMoney((dbData?.expenses?.engineering || 0) * (hiringMultiplier / 100))}/mo
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '52%', height: '100%', background: 'var(--accent-blue)' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
                    Baseline: {formatMoney(dbData?.expenses?.engineering)}/mo (Core R&D & Payroll)
                  </span>
                </div>

                {/* Marketing Card */}
                <div style={{ padding: '18px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-body)' }}>Sales & Marketing (CAC)</span>
                    <span className="status-pill amber">{marketingMultiplier}%</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {formatMoney((dbData?.expenses?.marketing || 0) * (marketingMultiplier / 100))}/mo
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '28%', height: '100%', background: 'var(--accent-amber)' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
                    Baseline: {formatMoney(dbData?.expenses?.marketing)}/mo (Acquisition & Campaigns)
                  </span>
                </div>

                {/* Operations Card */}
                <div style={{ padding: '18px', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-body)' }}>General Operations</span>
                    <span className="status-pill emerald">Fixed</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {formatMoney(dbData?.expenses?.operations)}/mo
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '20%', height: '100%', background: 'var(--accent-emerald)' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', display: 'block' }}>
                    Fixed baseline: Cloud hosting, legal, and tooling
                  </span>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn-secondary"
                >
                  <Settings2 style={{ width: '14px', height: '14px' }} />
                  <span>Update Baseline Expense Values</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUTONOMOUS AI CFO COPILOT */}
          {activeTab === 'copilot' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles style={{ width: '18px', height: '18px', color: 'var(--accent-blue)' }} />
                    Executive Liquidity & Runway Advisory Memo
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {lastAuditTimestamp ? `Last audited at ${lastAuditTimestamp} via ${aiEngine}` : 'Autonomous audit of cash reserves, burn telemetry, and runway runway longevity'}
                  </p>
                </div>

                <button
                  onClick={requestAICFOAudit}
                  disabled={aiLoading}
                  className="btn-primary"
                  style={{ padding: '8px 16px' }}
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="animate-spin" style={{ width: '14px', height: '14px' }} />
                      <span>Synthesizing Audit...</span>
                    </>
                  ) : (
                    <>
                      <Zap style={{ width: '14px', height: '14px' }} />
                      <span>Execute Financial Audit</span>
                    </>
                  )}
                </button>
              </div>

              {aiInsight ? (
                <div style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '14px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <span className="status-pill blue">
                      <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                      Engine: {aiEngine || 'gemini-2.5-flash'}
                    </span>
                    <span className="status-pill emerald">
                      Runway: {runwayMonths} Mo
                    </span>
                  </div>

                  <div style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '13px',
                    color: 'var(--text-body)'
                  }}>
                    {aiInsight}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-medium)'
                }}>
                  <Sparkles style={{ width: '32px', height: '32px', color: 'var(--accent-blue)', margin: '0 auto 10px' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    AI Liquidity Audit Ready
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '14px' }}>
                    Click &quot;Execute Financial Audit&quot; to synthesize an institutional diagnosis and capital allocation action plan.
                  </p>
                  <button
                    onClick={requestAICFOAudit}
                    className="btn-primary"
                    style={{ padding: '8px 16px' }}
                  >
                    <Zap style={{ width: '14px', height: '14px' }} />
                    <span>Run Full Audit</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* MODAL: ADD FUNDING MILESTONE */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="studio-card" style={{ width: '100%', maxWidth: '440px', padding: '24px', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                Add Capital Milestone
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                  INFLOW DESCRIPTOR
                </label>
                <input
                  type="text"
                  placeholder="e.g. Series Pre-A Investment Tranche"
                  value={newMilestone.name}
                  onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                    AMOUNT ({currency === 'INR' ? '₹' : '$'})
                  </label>
                  <input
                    type="number"
                    placeholder="250000"
                    value={newMilestone.amount}
                    onChange={e => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                    MONTH
                  </label>
                  <select
                    value={newMilestone.monthIndex}
                    onChange={e => setNewMilestone({ ...newMilestone, monthIndex: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Month {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingMilestone}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isSubmittingMilestone ? 'Recording...' : 'Commit Milestone'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BASELINE PARAMETERS */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="studio-card" style={{ width: '100%', maxWidth: '480px', padding: '24px', boxShadow: 'var(--shadow-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                Edit Financial Baseline Parameters
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateFinancials} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                  COMPANY NAME
                </label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                    CURRENT CASH ({currency === 'INR' ? '₹' : '$'})
                  </label>
                  <input
                    type="number"
                    value={editForm.currentCash}
                    onChange={e => setEditForm({ ...editForm, currentCash: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                    MONTHLY REVENUE ({currency === 'INR' ? '₹' : '$'})
                  </label>
                  <input
                    type="number"
                    value={editForm.monthlyRevenue}
                    onChange={e => setEditForm({ ...editForm, monthlyRevenue: e.target.value })}
                    required
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                    ENG BURN
                  </label>
                  <input
                    type="number"
                    value={editForm.engineering}
                    onChange={e => setEditForm({ ...editForm, engineering: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                    MKT BURN
                  </label>
                  <input
                    type="number"
                    value={editForm.marketing}
                    onChange={e => setEditForm({ ...editForm, marketing: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '5px' }}>
                    OPS BURN
                  </label>
                  <input
                    type="number"
                    value={editForm.operations}
                    onChange={e => setEditForm({ ...editForm, operations: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Baseline Parameters
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
