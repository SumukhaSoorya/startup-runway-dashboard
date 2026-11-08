import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RunwayChart({ data, currency = 'USD' }) {
  const formatCurrency = (value) => {
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${Math.round(value / 1000)}k`;
  };

  return (
    <div style={{ width: '100%', height: 320 }}>
      <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Rolling Cash Exhaustion Trajectory (12-Month Horizon)
      </h4>
      <ResponsiveContainer width="100%" height="88%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cyberNeonGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
          <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={formatCurrency} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', borderRadius: '10px', fontSize: '12px', backdropFilter: 'blur(12px)' }}
            formatter={(value) => [`${currency === 'INR' ? '₹' : '$'}${Math.round(value).toLocaleString()}`, "Reserves"]}
          />
          <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="Balance" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#cyberNeonGlow)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
