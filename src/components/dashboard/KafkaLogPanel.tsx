'use client';

import { useEffect, useRef } from 'react';
import { useDashboardStore } from '@/lib/store';

function getLogColor(message: string): string {
  if (message.includes('ERROR') || message.includes('error')) return 'text-red-400';
  if (message.includes('KAFKA')) return 'text-purple-400';
  if (message.includes('INGEST')) return 'text-emerald-400';
  if (message.includes('DISPATCHER')) return 'text-cyan-400';
  if (message.includes('SCENARIO')) return 'text-sky-400';
  if (message.includes('PAYLOAD')) return 'text-amber-400';
  if (message.includes('CONNECT')) return 'text-violet-400';
  if (message.includes('EVENT_STORE')) return 'text-teal-400';
  if (message.includes('WARN')) return 'text-yellow-400';
  return 'text-white/40';
}

function getPrefixColor(message: string): string {
  const prefix = message.split(' >> ')[0]?.trim() || '';
  if (prefix === 'ERROR') return 'text-red-400';
  if (prefix === 'WARN') return 'text-yellow-400';
  if (prefix === 'KAFKA') return 'text-purple-400';
  if (prefix === 'INGEST') return 'text-emerald-400';
  if (prefix === 'DISPATCHER') return 'text-cyan-400';
  if (prefix === 'SCENARIO') return 'text-sky-400';
  if (prefix === 'PAYLOAD') return 'text-amber-400';
  if (prefix === 'CONNECT') return 'text-violet-400';
  if (prefix === 'EVENT_STORE') return 'text-teal-400';
  return 'text-white/30';
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function LogLine({ message, timestamp }: { message: string; timestamp: number }) {
  const parts = message.split(' >> ');
  const prefix = parts[0]?.trim() || '';
  const rest = parts.length > 1 ? parts.slice(1).join(' >> ') : message;

  return (
    <div className="flex gap-2 leading-5 text-[11px] font-mono">
      <span className="text-white/15 shrink-0 tabular-nums">{formatTimestamp(timestamp)}</span>
      <span className={`shrink-0 font-semibold w-[80px] ${getPrefixColor(message)}`}>{prefix}</span>
      <span className="text-white/35 break-all">{rest}</span>
    </div>
  );
}

export function KafkaLogPanel() {
  const logs = useDashboardStore((s) => s.logs);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRunning = useDashboardStore((s) => s.isRunning);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#060A13] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
        {/* Fake terminal dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
        </div>

        {/* Terminal prompt */}
        <span className="text-[10px] font-mono text-white/20">
          $ gbm-pipeline —logs --follow
        </span>

        {/* LIVE indicator */}
        <div className="flex items-center gap-1.5 ml-auto">
          {isRunning && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-400/60">
                Live
              </span>
            </>
          )}
          {!isRunning && (
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/15">
              Paused
            </span>
          )}
        </div>

        {/* Log count */}
        <span className="text-[10px] font-mono text-white/10 tabular-nums">
          {logs.length}
        </span>
      </div>

      {/* Log content */}
      <div
        ref={scrollRef}
        className="max-h-[200px] overflow-y-auto terminal-scrollbar px-5 py-2"
      >
        {logs.map((log) => (
          <LogLine key={log.id} message={log.message} timestamp={log.timestamp} />
        ))}

        {logs.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-emerald-400/40 text-[11px] font-mono">▸</span>
            <span className="w-[6px] h-[14px] bg-emerald-400/50 animate-blink" />
          </div>
        )}

        {logs.length === 0 && (
          <div className="py-6 text-center">
            <span className="text-[11px] text-white/10 font-mono">Waiting for events...</span>
          </div>
        )}
      </div>
    </div>
  );
}
