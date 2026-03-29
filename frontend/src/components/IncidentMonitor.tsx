import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Transaction } from "../hooks/usePipelineStore";

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export function IncidentMonitor({ incidents }: { incidents: Transaction[] }) {
  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden"
      style={{ background: "oklch(var(--incident))" }}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <AlertCircle size={14} className="text-status-error" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
          Incident Monitor
        </span>
        {incidents.length > 0 && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-status-error text-white">
            {incidents.length}
          </span>
        )}
      </div>

      <div
        className="overflow-y-auto p-3 flex flex-col gap-2"
        style={{ maxHeight: "520px" }}
      >
        {incidents.length === 0 ? (
          <div
            data-ocid="incidents.empty_state"
            className="flex flex-col items-center justify-center py-14 gap-3"
          >
            <CheckCircle2 size={32} className="text-status-success" />
            <span className="text-sm font-medium text-white/70">
              All systems operational
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {incidents.map((inc, idx) => (
              <motion.div
                key={inc.id + inc.timestamp}
                data-ocid={`incidents.item.${idx + 1}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg p-3 border border-white/10"
                style={{ background: "oklch(0.18 0.04 253)" }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-status-error/20 border border-status-error/50 flex items-center justify-center shrink-0">
                    <AlertCircle size={12} className="text-status-error" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[13px] font-semibold text-status-amber">
                        {inc.id}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-error/20 text-status-error border border-status-error/30">
                        {inc.stage}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">
                      {relativeTime(inc.timestamp)}
                    </div>
                    {inc.error && (
                      <div className="mt-1.5 text-[11px] text-white/60 leading-snug">
                        {inc.error}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
