import { AnimatePresence, motion } from "motion/react";
import type { Stage, Transaction } from "../hooks/usePipelineStore";

const STAGES: Stage[] = ["DISPATCHER", "SCENARIO", "PAYLOAD", "CONNECT"];

const TYPE_COLORS: Record<string, string> = {
  FX_TRADE: "bg-blue-100 text-blue-700",
  WIRE_TRANSFER: "bg-purple-100 text-purple-700",
  SWAP: "bg-amber-100 text-amber-700",
  ACH_PAYMENT: "bg-emerald-100 text-emerald-700",
};

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

function StagePills({ tx }: { tx: Transaction }) {
  const currentIdx = STAGES.indexOf(tx.stage);
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        let cls = "";
        let pulse = false;
        if (tx.status === "ERROR" && i === currentIdx) {
          cls = "bg-status-error text-white";
        } else if (tx.status === "SUCCESS" || i < currentIdx) {
          cls = "bg-status-success text-white";
        } else if (i === currentIdx && tx.status === "PROCESSING") {
          cls = "bg-status-blue text-white";
          pulse = true;
        } else {
          cls = "bg-gray-100 text-gray-400";
        }
        return (
          <span
            key={stage}
            className={`relative text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}
          >
            {pulse && (
              <span className="absolute inset-0 rounded-full bg-status-blue animate-ping opacity-40" />
            )}
            {stage.slice(0, 4)}
          </span>
        );
      })}
    </div>
  );
}

export function EventStream({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-white rounded-xl shadow-card flex flex-col">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live Event Stream
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-status-blue">
          <span className="w-1.5 h-1.5 rounded-full bg-status-blue animate-pulse" />
          {transactions.filter((t) => t.status === "PROCESSING").length} active
        </span>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "460px" }}>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-border">
              {["Transaction ID", "Type", "Time", "Pipeline Stage"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-ocid="eventstream.table">
            <AnimatePresence initial={false}>
              {transactions.map((tx, idx) => (
                <motion.tr
                  key={tx.id}
                  data-ocid={`eventstream.item.${idx + 1}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[13px] font-medium text-foreground">
                      {tx.id}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        TYPE_COLORS[tx.type] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                    {relativeTime(tx.timestamp)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StagePills tx={tx} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div
            data-ocid="eventstream.empty_state"
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          >
            <span className="text-sm">Waiting for transactions…</span>
          </div>
        )}
      </div>
    </div>
  );
}
