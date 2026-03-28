'use client';

import { useDashboardStore, STAGES, KAFKA_TOPICS, type TransactionStage } from '@/lib/store';
import { motion } from 'framer-motion';

const STAGE_LABELS: Record<TransactionStage, string> = {
  DISPATCHER: 'Dispatcher',
  SCENARIO: 'Scenario Engine',
  PAYLOAD: 'Payload Builder',
  CONNECT: 'Connector',
  EVENT_STORE: 'Event Store',
};

const STAGE_ICONS: Record<TransactionStage, string> = {
  DISPATCHER: '⇢',
  SCENARIO: '◈',
  PAYLOAD: '⚙',
  CONNECT: '⚡',
  EVENT_STORE: '▣',
};

function StageNode({ stage }: { stage: TransactionStage }) {
  const nodeMetrics = useDashboardStore((s) => s.metrics.nodes[stage]);
  const { success, error, processing } = nodeMetrics;

  const hasActivity = processing > 0;
  const total = success + error + processing;

  return (
    <div className="relative group">
      {/* Pulse ring when processing */}
      {hasActivity && (
        <div className="absolute -inset-1 rounded-2xl border border-cyan-500/30 animate-pulse-ring" />
      )}

      <div
        className={`
          relative bg-white/[0.03] border rounded-2xl p-4 min-w-[150px] transition-all duration-300
          ${hasActivity
            ? 'border-cyan-500/30 glow-cyan'
            : 'border-white/[0.06] hover:border-white/[0.12]'
          }
        `}
      >
        {/* Stage name header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">{STAGE_ICONS[stage]}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">
            {STAGE_LABELS[stage]}
          </span>
        </div>

        {/* Metric count badges */}
        <div className="flex items-center gap-1.5">
          {success > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tabular-nums">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {success}
            </span>
          )}
          {error > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-medium tabular-nums">
              <span className="w-1 h-1 rounded-full bg-rose-400" />
              {error}
            </span>
          )}
          {processing > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-medium tabular-nums">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              {processing}
            </span>
          )}
          {total === 0 && (
            <span className="text-[10px] text-white/20 font-medium">Idle</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center w-10 shrink-0">
      <div className="relative flex items-center justify-center w-10 h-[2px]">
        {/* Animated dashed line */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line
            x1="0" y1="1" x2="40" y2="1"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="animate-flow-dash"
          />
        </svg>
        {/* Flowing dot */}
        <motion.div
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/80"
          animate={{ x: [0, 30] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

export function PipelineView() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Pipeline Architecture
        </span>
        <div className="flex-1 h-px bg-white/[0.04]" />
      </div>

      {/* Pipeline stages row */}
      <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <StageNode stage={stage} />
            </motion.div>
            {i < STAGES.length - 1 && <Connector />}
          </div>
        ))}
      </div>

      {/* Vertical connector to Kafka topics */}
      <div className="flex justify-center py-3">
        <div className="relative flex flex-col items-center">
          {/* Vertical line */}
          <svg width="2" height="32" className="overflow-visible">
            <line
              x1="1" y1="0" x2="1" y2="32"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="animate-flow-dash"
            />
          </svg>
          {/* Flowing dot down */}
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/60"
            animate={{ y: [0, 28] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Kafka Topics row */}
      <motion.div
        className="flex items-center justify-center gap-2 flex-wrap mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {KAFKA_TOPICS.map((topic) => (
          <span
            key={topic}
            className="px-3 py-1 rounded-lg bg-purple-500/[0.07] border border-purple-500/10 
                       text-[10px] font-mono font-medium text-purple-300/70 tracking-wide
                       hover:bg-purple-500/[0.12] transition-colors duration-200"
          >
            {topic}
          </span>
        ))}
      </motion.div>

      {/* Vertical connector to Event Store */}
      <div className="flex justify-center py-2">
        <div className="relative flex flex-col items-center">
          <svg width="2" height="20" className="overflow-visible">
            <line
              x1="1" y1="0" x2="1" y2="20"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              strokeDasharray="3 3"
              className="animate-flow-dash"
            />
          </svg>
        </div>
      </div>

      {/* Event Store Capsule */}
      <motion.div
        className="flex justify-center"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-full px-6 py-2.5 glow-emerald">
          <div className="absolute inset-0 rounded-full border border-emerald-500/10 animate-pulse" />
          <div className="flex items-center gap-3">
            <span className="text-emerald-400/60 text-sm">▣</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
              Event Store
            </span>
            <span className="text-[10px] text-emerald-400/50 font-mono">Append-only</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
