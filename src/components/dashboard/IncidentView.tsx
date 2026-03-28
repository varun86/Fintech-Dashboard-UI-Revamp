'use client';

import { useDashboardStore, type TransactionStage } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function FailedStageBadge({ stage }: { stage: TransactionStage }) {
  const colors: Record<TransactionStage, string> = {
    DISPATCHER: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    SCENARIO: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    PAYLOAD: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    CONNECT: 'bg-red-500/15 text-red-400 border-red-500/20',
    EVENT_STORE: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colors[stage]}`}>
      {stage}
    </span>
  );
}

function IncidentCard({ incident }: { incident: ReturnType<typeof useDashboardStore.getState>['incidents'][0] }) {
  const typeColors: Record<string, string> = {
    FX_TRADE: 'text-cyan-400',
    PAYMENT: 'text-emerald-400',
    TRANSFER: 'text-violet-400',
    POSITION_UPDATE: 'text-amber-400',
    SETTLEMENT: 'text-blue-400',
    RECONCILIATION: 'text-pink-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white/[0.02] border border-rose-500/[0.12] rounded-xl p-4 
                 border-l-2 border-l-rose-500/50 glow-rose
                 hover:bg-white/[0.04] transition-colors duration-200"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-mono font-bold text-white/70">
          {incident.txId}
        </span>
        <span className={`text-[10px] font-medium ${typeColors[incident.txType] || 'text-white/40'}`}>
          {incident.txType.replace('_', ' ')}
        </span>
        <span className="text-[10px] text-white/20 ml-auto font-mono tabular-nums">
          {formatTimeAgo(incident.timestamp)}
        </span>
      </div>

      {/* Failed stage badge */}
      <div className="mb-2">
        <FailedStageBadge stage={incident.failedStage} />
      </div>

      {/* Error message */}
      <p className="text-[11px] text-white/30 leading-relaxed">
        {incident.errorMessage}
      </p>
    </motion.div>
  );
}

export function IncidentView() {
  const incidents = useDashboardStore((s) => s.incidents);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Section label */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Incidents
        </span>
        {incidents.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-semibold tabular-nums">
            {incidents.length}
          </span>
        )}
        <div className="flex-1 h-px bg-white/[0.04]" />
      </div>

      {/* Incident cards grid */}
      <div className="max-h-[300px] overflow-y-auto dark-scrollbar px-5 pb-4">
        <AnimatePresence mode="popLayout">
          {incidents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <ShieldAlert className="w-8 h-8 text-white/10 mb-3" />
              <span className="text-[12px] text-white/20 font-medium">No incidents</span>
              <span className="text-[10px] text-white/10 mt-1">All transactions processing normally</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
