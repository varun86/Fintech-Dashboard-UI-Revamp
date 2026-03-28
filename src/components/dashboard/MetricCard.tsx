'use client';

import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function MetricCard({ label, value, icon: Icon, accent, trend, trendValue }: MetricCardProps) {
  const accentClasses: Record<string, { iconBg: string; iconText: string; valueText: string; trendUp: string; trendDown: string }> = {
    emerald: {
      iconBg: 'bg-emerald-500/10',
      iconText: 'text-emerald-400',
      valueText: 'text-emerald-400',
      trendUp: 'text-emerald-400',
      trendDown: 'text-rose-400',
    },
    rose: {
      iconBg: 'bg-rose-500/10',
      iconText: 'text-rose-400',
      valueText: 'text-rose-400',
      trendUp: 'text-emerald-400',
      trendDown: 'text-rose-400',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10',
      iconText: 'text-cyan-400',
      valueText: 'text-cyan-400',
      trendUp: 'text-emerald-400',
      trendDown: 'text-rose-400',
    },
    amber: {
      iconBg: 'bg-amber-500/10',
      iconText: 'text-amber-400',
      valueText: 'text-amber-400',
      trendUp: 'text-emerald-400',
      trendDown: 'text-rose-400',
    },
    white: {
      iconBg: 'bg-white/5',
      iconText: 'text-white/70',
      valueText: 'text-white',
      trendUp: 'text-emerald-400',
      trendDown: 'text-rose-400',
    },
  };

  const styles = accentClasses[accent] || accentClasses.white;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 min-w-[160px] transition-colors hover:bg-white/[0.05]">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${styles.iconText}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-white/40 mb-0.5">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold tabular-nums ${styles.valueText}`}>
              {value}
            </span>
            {trend && trendValue && (
              <span className={`text-[10px] font-medium tabular-nums ${trend === 'up' ? styles.trendUp : trend === 'down' ? styles.trendDown : 'text-white/30'}`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
