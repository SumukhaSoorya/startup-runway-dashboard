export default function MetricCard({ title, value, subtext, icon: Icon, variant = 'default' }) {
  const baseStyles = "p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300";
  const variantStyles = {
    default: "bg-slate-900/60 border-white/10 text-white shadow-lg hover:border-white/20",
    critical: "bg-rose-950/40 border-rose-500/30 text-white shadow-rose-950/50 hover:border-rose-500/50",
    success: "bg-emerald-950/40 border-emerald-500/30 text-white shadow-emerald-950/50 hover:border-emerald-500/50",
    warning: "bg-amber-950/40 border-amber-500/30 text-white shadow-amber-950/50 hover:border-amber-500/50"
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant] || variantStyles.default}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <Icon className={`h-4 w-4 ${variant === 'critical' ? 'text-rose-400' : variant === 'success' ? 'text-emerald-400' : variant === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
      </div>
      {subtext && (
        <p className={`mt-2 text-xs font-medium ${variant === 'critical' ? 'text-rose-300' : variant === 'success' ? 'text-emerald-300' : variant === 'warning' ? 'text-amber-300' : 'text-slate-400'}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}
