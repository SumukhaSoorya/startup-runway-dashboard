import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RunwayChart({ data }) {
  const formatCurrency = (value) => `$${(value / 1000).toFixed(0)}k`;

  return (
    <div style={{ width: '100%', height: 320 }}>
      <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Rolling Cash Exhaustion Curve (12-Month Run)
      </h4>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cashGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" vertical={false} />
          <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
          <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={formatCurrency} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#11131c', borderColor: '#272d40', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
            formatter={(value) => [`$${value.toLocaleString()}`, "Reserves"]}
          />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="balance" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cashGlow)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}