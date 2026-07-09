import React from 'react';

export default function MetricCard({ title, value, subtext, icon: Icon, variant = 'default' }) {
  // Determine card styling based on importance (e.g., critical red for zero cash days)
  const baseStyles = "p-6 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md";
  const variantStyles = {
    default: "border-slate-200 text-slate-900",
    critical: "border-red-200 bg-red-50/50 text-slate-900",
    success: "border-emerald-200 bg-emerald-50/50 text-slate-900"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && <Icon className={`h-5 w-5 ${variant === 'critical' ? 'text-red-600' : variant === 'success' ? 'text-emerald-600' : 'text-slate-400'}`} />}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
      </div>
      {subtext && (
        <p className={`mt-1 text-xs ${variant === 'critical' ? 'text-red-600' : variant === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}