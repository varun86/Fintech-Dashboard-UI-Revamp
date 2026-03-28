'use client';

import { Activity, Zap, AlertTriangle, Layers } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useDashboardStore } from '@/lib/store';
import { startSimulation, stopSimulation, resetSimulation } from '@/lib/simulation';

export function TopBar() {
  const metrics = useDashboardStore((s) => s.metrics);
  const isRunning = useDashboardStore((s) => s.isRunning);
  const transactions = useDashboardStore((s) => s.transactions);

  const totalVolume = metrics.totalVolume;
  const healthPercent = metrics.healthPercent;
  const activeIssues = metrics.activeIssues;
  const processingCount = metrics.processingCount;

  const handleToggle = () => {
    if (isRunning) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  const handleReset = () => {
    resetSimulation();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/[0.06]">
      {/* Subtle bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-5 py-3">
        <div className="flex items-center gap-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white text-[11px] font-black tracking-tight">GBM</span>
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-white tracking-tight">
                Pipeline Monitor
              </h1>
              <p className="text-[10px] text-white/30 font-medium">
                Real-time event processing
              </p>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            <MetricCard
              label="Total Volume"
              value={totalVolume}
              icon={Layers}
              accent="cyan"
            />
            <MetricCard
              label="Health"
              value={`${healthPercent}%`}
              icon={Activity}
              accent="emerald"
              trend={healthPercent >= 90 ? 'up' : healthPercent >= 70 ? 'neutral' : 'down'}
            />
            <MetricCard
              label="Active Issues"
              value={activeIssues}
              icon={AlertTriangle}
              accent={activeIssues > 3 ? 'rose' : activeIssues > 0 ? 'amber' : 'emerald'}
            />
            <MetricCard
              label="Processing"
              value={processingCount}
              icon={Zap}
              accent="cyan"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Start/Pause Button */}
            <button
              onClick={handleToggle}
              className={`
                relative px-5 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider
                transition-all duration-300 cursor-pointer
                ${isRunning
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 glow-emerald hover:bg-emerald-500/25'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
                }
              `}
            >
              {isRunning && (
                <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
              )}
              <span className="relative flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-white/30'}`} />
                {isRunning ? 'Running' : 'Start'}
              </span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-full text-[11px] font-medium text-white/30 
                         border border-white/[0.06] bg-white/[0.02] 
                         hover:bg-white/[0.06] hover:text-white/50 
                         transition-all duration-200 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
