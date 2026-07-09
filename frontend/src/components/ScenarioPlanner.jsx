import React from 'react';
import { DollarSign, Users, Target } from 'lucide-react';

export default function ScenarioPlanner({ adjustments, onChange }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      <h3 className="text-base font-semibold text-slate-900 mb-1">Interactive Scenario Modeler</h3>
      <p className="text-xs text-slate-500 mb-6">Simulate immediate business changes to view updated cash-out projections.</p>
      
      <div className="space-y-6">
        {/* Adjusting Salaries / Hiring */}
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="flex items-center gap-2 text-slate-700"><Users className="w-4 h-4 text-slate-400" /> Headcount / Monthly Payroll Changes</span>
            <span className={`${adjustments.payroll >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {adjustments.payroll >= 0 ? `+$${adjustments.payroll.toLocaleString()}` : `-$${Math.abs(adjustments.payroll).toLocaleString()}`}
            </span>
          </div>
          <input type="range" min="-10000" max="25000" step="1000" value={adjustments.payroll} onChange={(e) => onChange('payroll', parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>

        {/* Adjusting Marketing Spend */}
        <div>
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="flex items-center gap-2 text-slate-700"><Target className="w-4 h-4 text-slate-400" /> Marketing & Growth Budgets</span>
            <span className={`${adjustments.marketing >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {adjustments.marketing >= 0 ? `+$${adjustments.marketing.toLocaleString()}` : `-$${Math.abs(adjustments.marketing).toLocaleString()}`}
            </span>
          </div>
          <input type="range" min="-5000" max="15000" step="500" value={adjustments.marketing} onChange={(e) => onChange('marketing', parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>
      </div>
    </div>
  );
}