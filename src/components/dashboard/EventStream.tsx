'use client';

import { useDashboardStore, STAGES, type Transaction, type TransactionStage } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

function PipelineProgressDots({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center gap-[3px]">
      {STAGES.map((stage) => {
        const isCompleted = tx.completedStages.includes(stage);
        const isCurrent = tx.stage === stage && tx.status === 'PROCESSING';
        const isFailed = tx.failedStage === stage;

        return (
          <div
            key={stage}
            className={`
              w-[6px] h-[6px] rounded-full transition-all duration-300
              ${isFailed
                ? 'bg-rose-500'
                : isCompleted
                  ? 'bg-emerald-500'
                  : isCurrent
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-white/10'
              }
            `}
          />
        );
      })}
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function TxTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    FX_TRADE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    PAYMENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    TRANSFER: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    POSITION_UPDATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    SETTLEMENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    RECONCILIATION: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };

  const color = colors[type] || 'bg-white/5 text-white/50 border-white/10';

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${color}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  if (status === 'SUCCESS') {
    return (
      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
        Done
      </span>
    );
  }
  if (status === 'ERROR') {
    return (
      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-semibold uppercase tracking-wider">
        Failed
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
      Active
    </span>
  );
}

export function EventStream() {
  const transactions = useDashboardStore((s) => s.transactions);

  // Sort: PROCESSING first, then ERROR, then SUCCESS
  const sorted = [...transactions].sort((a, b) => {
    const order = { PROCESSING: 0, ERROR: 1, SUCCESS: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Section label */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Transaction Stream
        </span>
        <span className="text-[10px] font-mono text-white/20 tabular-nums">
          {transactions.length} records
        </span>
        <div className="flex-1 h-px bg-white/[0.04]" />
      </div>

      {/* Table header */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-white/[0.04]">
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 w-[100px]">TX ID</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 w-[100px]">Type</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 w-[80px]">Pipeline</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 w-[60px]">Status</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 ml-auto">Time</span>
      </div>

      {/* Table body */}
      <div className="max-h-[280px] overflow-y-auto dark-scrollbar">
        <AnimatePresence mode="popLayout">
          {sorted.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`
                flex items-center gap-4 px-5 py-2.5 transition-colors duration-150
                border-l-2
                ${tx.status === 'PROCESSING'
                  ? 'border-l-cyan-500/60 bg-cyan-500/[0.02]'
                  : tx.status === 'ERROR'
                    ? 'border-l-rose-500/60 bg-rose-500/[0.02]'
                    : 'border-l-transparent hover:bg-white/[0.015]'
                }
              `}
            >
              {/* TX ID */}
              <span className="text-[11px] font-mono font-medium text-white/60 w-[100px] truncate">
                {tx.id}
              </span>

              {/* Type badge */}
              <div className="w-[100px]">
                <TxTypeBadge type={tx.type} />
              </div>

              {/* Pipeline progress dots */}
              <div className="w-[80px]">
                <PipelineProgressDots tx={tx} />
              </div>

              {/* Status */}
              <div className="w-[60px]">
                <StatusBadge status={tx.status} />
              </div>

              {/* Time */}
              <span className="text-[10px] font-mono text-white/25 ml-auto tabular-nums">
                {formatTimeAgo(tx.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="px-5 py-10 text-center">
            <span className="text-[11px] text-white/20">No transactions yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
