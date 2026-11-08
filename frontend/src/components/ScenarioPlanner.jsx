import { Users, Target } from 'lucide-react';

export default function ScenarioPlanner({ adjustments, onChange, currency = 'USD' }) {
  const sym = currency === 'INR' ? '₹' : '$';

  return (
    <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
      <h3 className="text-base font-semibold text-white mb-1">Interactive Scenario Modeler</h3>
      <p className="text-xs text-slate-400 mb-6">Simulate immediate business changes to view updated cash-out projections.</p>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-cyan-400" /> Headcount / Monthly Payroll Changes
            </span>
            <span className={`${adjustments.payroll >= 0 ? 'text-rose-400' : 'text-emerald-400'} font-semibold`}>
              {adjustments.payroll >= 0 ? `+${sym}${adjustments.payroll.toLocaleString()}` : `-${sym}${Math.abs(adjustments.payroll).toLocaleString()}`}
            </span>
          </div>
          <input 
            type="range" 
            min="-10000" 
            max="25000" 
            step="1000" 
            value={adjustments.payroll} 
            onChange={(e) => onChange('payroll', parseInt(e.target.value))} 
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
          />
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="flex items-center gap-2 text-slate-300">
              <Target className="w-4 h-4 text-violet-400" /> Marketing & Growth Budgets
            </span>
            <span className={`${adjustments.marketing >= 0 ? 'text-rose-400' : 'text-emerald-400'} font-semibold`}>
              {adjustments.marketing >= 0 ? `+${sym}${adjustments.marketing.toLocaleString()}` : `-${sym}${Math.abs(adjustments.marketing).toLocaleString()}`}
            </span>
          </div>
          <input 
            type="range" 
            min="-5000" 
            max="15000" 
            step="500" 
            value={adjustments.marketing} 
            onChange={(e) => onChange('marketing', parseInt(e.target.value))} 
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400" 
          />
        </div>
      </div>
    </div>
  );
}
