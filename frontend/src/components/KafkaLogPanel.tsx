import { useEffect, useRef } from "react";
import type { LogEntry } from "../hooks/usePipelineStore";

function colorizeLog(msg: string): React.ReactNode {
  const timeMatch = msg.match(/^(\[\d{2}:\d{2}:\d{2}\])/);
  if (!timeMatch)
    return <span style={{ color: "rgba(255,255,255,0.4)" }}>{msg}</span>;

  const time = timeMatch[1];
  const rest = msg.slice(time.length);
  const parts = rest.split(/(GBM-\d{5}|T24\.\w+)/g);

  return (
    <span>
      <span style={{ color: "#F59E0B" }}>{time}</span>
      {parts.map((part, i) => {
        const key = `${i}-${part.slice(0, 8)}`;
        if (/^GBM-/.test(part))
          return (
            <span key={key} style={{ color: "#22C55E" }}>
              {part}
            </span>
          );
        if (/^T24\./.test(part))
          return (
            <span key={key} style={{ color: "#60A5FA" }}>
              {part}
            </span>
          );
        return (
          <span key={key} style={{ color: "rgba(255,255,255,0.5)" }}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

export function KafkaLogPanel({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const reversed = [...logs].reverse();

  return (
    <div className="w-full" style={{ background: "oklch(var(--log-bg))" }}>
      <div
        className="px-4 py-2.5 flex items-center gap-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-status-error" />
          <span className="w-3 h-3 rounded-full bg-status-amber" />
          <span className="w-3 h-3 rounded-full bg-status-success" />
        </div>
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Kafka System Trace
        </span>
        <span
          className="ml-auto text-[11px]"
          style={{
            color: "rgba(255,255,255,0.25)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {logs.length} entries
        </span>
      </div>

      <div
        ref={scrollRef}
        data-ocid="kafkalog.panel"
        className="overflow-y-auto px-4 py-2"
        style={{ maxHeight: "180px" }}
      >
        {reversed.length === 0 ? (
          <div
            data-ocid="kafkalog.empty_state"
            className="text-[12px] py-2"
            style={{
              color: "rgba(255,255,255,0.2)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            Waiting for events...
          </div>
        ) : (
          reversed.map((log, idx) => (
            <div
              key={`${log.timestamp}-${idx}`}
              className="text-[12px] leading-5 py-0.5"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {colorizeLog(log.message)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
