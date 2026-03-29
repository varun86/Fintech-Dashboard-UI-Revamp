/**
 * GBM Pipeline Monitor — Single-file dashboard
 * Uses: zustand, motion/react, lucide-react, shadcn/ui
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertCircle,
  BarChart2,
  Bell,
  CheckCircle2,
  Pause,
  Play,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { create } from "zustand";

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGES = ["DISPATCHER", "SCENARIO", "PAYLOAD", "CONNECT"];
const MAX_TXS = 20;
const MAX_LOGS = 50;
const MAX_INCIDENTS = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomId() {
  return `GBM-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
}
function fmt(ts) {
  const d = new Date(ts);
  return [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join(":");
}
function relativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}
function makeLog(txId, stage, ts) {
  return `[${fmt(ts)}] INGEST >> ${txId} Topic: T24.RAW | Type: FX_TRADE | Stage: ${stage}`;
}

// ─── Zustand Store ────────────────────────────────────────────────────────────
const usePipelineStore = create((set, get) => ({
  transactions: [],
  logs: [],
  incidents: [],
  metrics: { total: 0, success: 0, errors: 0, throughput: 0 },
  paused: false,
  rightPanel: "incidents",
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setRightPanel: (panel) => set({ rightPanel: panel }),
  tick: () => {
    const { paused, transactions, logs, incidents } = get();
    if (paused) return;
    const now = Date.now();
    const newLogs = [];
    const newIncidentEntries = [];

    // Advance existing transactions
    const updated = transactions.map((tx) => {
      if (tx.status !== "PROCESSING") return tx;
      const idx = STAGES.indexOf(tx.stage);
      if (Math.random() < 0.15) {
        const errMsg = `Pipeline error at ${tx.stage}: connection timeout`;
        newIncidentEntries.push({ ...tx, error: errMsg, timestamp: now });
        newLogs.push({
          id: `${now}-err-${tx.id}`,
          message: `[${fmt(now)}] ERROR >> ${tx.id} | Stage: ${tx.stage} | connection timeout`,
          timestamp: now,
          level: "ERROR",
        });
        return { ...tx, status: "ERROR", error: errMsg, timestamp: now };
      }
      if (idx === STAGES.length - 1) {
        newLogs.push({
          id: `${now}-ok-${tx.id}`,
          message: `[${fmt(now)}] SUCCESS >> ${tx.id} | Stage: ${tx.stage} | completed`,
          timestamp: now,
          level: "INFO",
        });
        return { ...tx, status: "SUCCESS", timestamp: now };
      }
      const next = STAGES[idx + 1];
      newLogs.push({
        id: `${now}-${tx.id}-${next}`,
        message: makeLog(tx.id, next, now),
        timestamp: now,
        level: "INFO",
      });
      return { ...tx, stage: next, timestamp: now };
    });

    // New transaction
    const newId = randomId();
    const newTx = {
      id: newId,
      type: "FX_TRADE",
      stage: "DISPATCHER",
      status: "PROCESSING",
      timestamp: now,
    };
    newLogs.push({
      id: `${now}-new-${newId}`,
      message: makeLog(newId, "DISPATCHER", now),
      timestamp: now,
      level: "INFO",
    });
    const withNew = [newTx, ...updated].slice(0, MAX_TXS);

    // Incidents (deduplicate by tx id)
    const existingIds = new Set(incidents.map((i) => i.id));
    const freshIncidents = newIncidentEntries.filter(
      (i) => !existingIds.has(i.id),
    );
    const updatedIncidents = [...freshIncidents, ...incidents].slice(
      0,
      MAX_INCIDENTS,
    );

    // Metrics
    const total = withNew.length;
    const success = withNew.filter((t) => t.status === "SUCCESS").length;
    const errors = withNew.filter((t) => t.status === "ERROR").length;
    const throughput = withNew.filter((t) => t.status === "PROCESSING").length;

    set({
      transactions: withNew,
      logs: [...newLogs, ...logs].slice(0, MAX_LOGS),
      incidents: updatedIncidents,
      metrics: { total, success, errors, throughput },
    });
  },
}));

// ─── Header ───────────────────────────────────────────────────────────────────
function MetricPill({ label, value, color }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4px 16px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid ${color}40`,
        minWidth: 80,
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.2 }}>
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.5)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Header({ metrics, paused, onTogglePause }) {
  return (
    <header
      style={{
        background: "#0F1923",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                position: "absolute",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: paused ? "#F59E0B" : "#22C55E",
                opacity: 0.6,
                animation: paused
                  ? "none"
                  : "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: paused ? "#F59E0B" : "#22C55E",
                display: "inline-block",
              }}
            />
          </span>
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            GBM Pipeline Monitor
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: paused ? "#F59E0B" : "#22C55E",
              padding: "2px 8px",
              borderRadius: 999,
              border: `1px solid ${paused ? "#F59E0B" : "#22C55E"}40`,
            }}
          >
            {paused ? "PAUSED" : "LIVE"}
          </span>
        </div>

        {/* Metrics */}
        <div
          style={{ display: "flex", gap: 8, alignItems: "center" }}
          data-ocid="header.section"
        >
          <MetricPill label="Total" value={metrics.total} color="#60A5FA" />
          <MetricPill label="Success" value={metrics.success} color="#22C55E" />
          <MetricPill label="Errors" value={metrics.errors} color="#EF4444" />
          <MetricPill
            label="Active"
            value={metrics.throughput}
            color="#F59E0B"
          />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            onClick={onTogglePause}
            data-ocid="header.toggle"
            style={{
              borderRadius: 999,
              background: paused ? "#22C55E" : "#3B82F6",
              border: "none",
              padding: "8px 18px",
              fontWeight: 600,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "white",
            }}
          >
            {paused ? (
              <>
                <Play size={13} fill="white" /> Resume
              </>
            ) : (
              <>
                <Pause size={13} fill="white" /> Pause
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Event Stream ─────────────────────────────────────────────────────────────
function StagePills({ tx }) {
  const ci = STAGES.indexOf(tx.stage);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {STAGES.map((stage, i) => {
        let bg = "#F1F5F9";
        let color = "#94A3B8";
        if (tx.status === "ERROR" && i === ci) {
          bg = "#FEE2E2";
          color = "#EF4444";
        } else if (tx.status === "SUCCESS" || i < ci) {
          bg = "#DCFCE7";
          color = "#16A34A";
        } else if (i === ci) {
          bg = "#DBEAFE";
          color = "#2563EB";
        }
        return (
          <span
            key={stage}
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 999,
              background: bg,
              color,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {stage.slice(0, 4)}
          </span>
        );
      })}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "SUCCESS") return <CheckCircle2 size={14} color="#22C55E" />;
  if (status === "ERROR") return <XCircle size={14} color="#EF4444" />;
  return (
    <motion.span
      style={{ display: "inline-flex" }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    >
      <Activity size={14} color="#3B82F6" />
    </motion.span>
  );
}

function EventStream({ transactions }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#64748B",
          }}
        >
          Live Event Stream
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            color: "#3B82F6",
            fontWeight: 600,
          }}
        >
          <motion.span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#3B82F6",
              display: "inline-block",
            }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
          />
          {transactions.filter((t) => t.status === "PROCESSING").length} active
        </span>
      </div>

      <div style={{ overflowY: "auto", flex: 1, maxHeight: 500 }}>
        {transactions.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "64px 0",
              color: "#94A3B8",
              fontSize: 13,
            }}
          >
            Waiting for transactions…
          </div>
        ) : (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "white",
                zIndex: 5,
              }}
            >
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                {["ID", "Type", "Status", "Time", "Pipeline"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 14px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#94A3B8",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {transactions.map((tx, idx) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ borderBottom: "1px solid #F8FAFC" }}
                    data-ocid={`stream.item.${idx + 1}`}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1E293B",
                      }}
                    >
                      {tx.id}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#DBEAFE",
                          color: "#1D4ED8",
                        }}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <StatusIcon status={tx.status} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              tx.status === "SUCCESS"
                                ? "#16A34A"
                                : tx.status === "ERROR"
                                  ? "#EF4444"
                                  : "#2563EB",
                          }}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: 11,
                        color: "#94A3B8",
                      }}
                    >
                      {relativeTime(tx.timestamp)}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <StagePills tx={tx} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Architecture Diagram ─────────────────────────────────────────────────────
const NODES = [
  {
    id: "DISPATCHER",
    label: "Dispatcher",
    color: "#22C55E",
    glow: "rgba(34,197,94,0.3)",
    y: 60,
  },
  {
    id: "SCENARIO",
    label: "Scenario",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.3)",
    y: 160,
  },
  {
    id: "PAYLOAD",
    label: "Payload",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.3)",
    y: 260,
  },
  {
    id: "CONNECT",
    label: "Connect",
    color: "#EF4444",
    glow: "rgba(239,68,68,0.3)",
    y: 360,
  },
];
const PARTICLES = [
  { id: "p1", path: "M 200 88 L 200 138", delay: "0s" },
  { id: "p2", path: "M 200 188 L 200 238", delay: "0.5s" },
  { id: "p3", path: "M 200 288 L 200 338", delay: "1s" },
  { id: "p4", path: "M 200 388 L 200 445", delay: "1.5s" },
];

function ArchitectureDiagram({ transactions }) {
  return (
    <div
      style={{ background: "#0F1923", borderRadius: 14, overflow: "hidden" }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        Pipeline Visual
      </div>
      <div style={{ padding: 16 }}>
        <svg
          viewBox="0 0 400 510"
          style={{ width: "100%" }}
          role="img"
          aria-label="GBM Pipeline Architecture"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>

          {/* Connector lines */}
          {NODES.slice(0, -1).map((node, i) => (
            <line
              key={`conn-${node.id}`}
              x1={200}
              y1={node.y + 28}
              x2={200}
              y2={NODES[i + 1].y - 28}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#arrowhead)"
            />
          ))}
          {/* Final connector to Event Store */}
          <line
            x1={200}
            y1={388}
            x2={200}
            y2={450}
            stroke="rgba(139,92,246,0.4)"
            strokeWidth="2"
            strokeDasharray="4 4"
            markerEnd="url(#arrowhead)"
          />

          {/* Animated particles */}
          {PARTICLES.map((p) => (
            <circle key={p.id} r={3.5} fill="white" opacity="0">
              <animateMotion
                dur="1.8s"
                repeatCount="indefinite"
                begin={p.delay}
                path={p.path}
              />
              <animate
                attributeName="opacity"
                values="0;0.9;0.9;0"
                dur="1.8s"
                repeatCount="indefinite"
                begin={p.delay}
              />
            </circle>
          ))}

          {/* Nodes */}
          {NODES.map((node) => {
            const active = transactions.filter(
              (t) => t.stage === node.id && t.status === "PROCESSING",
            ).length;
            const errors = transactions.filter(
              (t) => t.stage === node.id && t.status === "ERROR",
            ).length;
            return (
              <g key={node.id}>
                {/* Glow */}
                <rect
                  x={130}
                  y={node.y - 28}
                  width={140}
                  height={56}
                  rx={12}
                  fill={node.glow}
                />
                {/* Box */}
                <rect
                  x={132}
                  y={node.y - 26}
                  width={136}
                  height={52}
                  rx={10}
                  fill="#111C28"
                  stroke={node.color}
                  strokeWidth="1.5"
                />
                {/* Color bar */}
                <rect
                  x={132}
                  y={node.y - 26}
                  width={5}
                  height={52}
                  rx={2}
                  fill={node.color}
                />
                {/* Label */}
                <text
                  x={150}
                  y={node.y - 6}
                  fontSize={12}
                  fontWeight={600}
                  fill={node.color}
                  fontFamily="system-ui"
                >
                  {node.label}
                </text>
                <text
                  x={150}
                  y={node.y + 11}
                  fontSize={10}
                  fill="rgba(255,255,255,0.45)"
                  fontFamily="system-ui"
                >
                  active: {active} errors: {errors}
                </text>
                {/* Badge if active */}
                {active > 0 && (
                  <>
                    <circle cx={252} cy={node.y - 12} r={8} fill={node.color} />
                    <text
                      x={252}
                      y={node.y - 9}
                      textAnchor="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill="white"
                      fontFamily="system-ui"
                    >
                      {active}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Event Store */}
          <rect
            x={130}
            y={450}
            width={140}
            height={38}
            rx={19}
            fill="#1A1030"
            stroke="#8B5CF6"
            strokeWidth="2"
          />
          <text
            x={200}
            y={469}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill="#C4B5FD"
            fontFamily="system-ui"
          >
            Event Store
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─── Incident Monitor ─────────────────────────────────────────────────────────
function IncidentItem({ inc, visible }) {
  return (
    <div
      style={{
        borderRadius: 10,
        padding: 12,
        border: "1px solid rgba(239,68,68,0.2)",
        background: "#151F2B",
        transition: "opacity 250ms, transform 250ms",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(16px)",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <AlertCircle size={12} color="#EF4444" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: 700,
                color: "#F59E0B",
              }}
            >
              {inc.id}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#EF4444",
                textTransform: "uppercase",
              }}
            >
              {inc.stage}
            </span>
          </div>
          {inc.error && (
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.4,
                marginBottom: 2,
              }}
            >
              {inc.error}
            </div>
          )}
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            {relativeTime(inc.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentMonitor({ incidents }) {
  const [visible, setVisible] = useState(new Set());
  const prevKeys = useRef(new Set());

  useEffect(() => {
    const toAdd = [];
    for (const inc of incidents) {
      const key = `${inc.id}-${inc.timestamp}`;
      if (!prevKeys.current.has(key)) {
        prevKeys.current.add(key);
        toAdd.push(key);
      }
    }
    if (toAdd.length > 0) {
      setTimeout(() => setVisible((prev) => new Set([...prev, ...toAdd])), 30);
    }
  }, [incidents]);

  return (
    <div
      style={{ background: "#0F1923", borderRadius: 14, overflow: "hidden" }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <AlertCircle size={13} color="#EF4444" />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Incident Monitor
        </span>
        {incidents.length > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 999,
              background: "#EF4444",
              color: "white",
            }}
          >
            {incidents.length}
          </span>
        )}
      </div>
      <div
        style={{
          overflowY: "auto",
          maxHeight: 500,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
        data-ocid="incidents.list"
      >
        {incidents.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "56px 0",
              gap: 12,
            }}
            data-ocid="incidents.empty_state"
          >
            <CheckCircle2 size={32} color="#22C55E" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              All systems operational
            </span>
          </div>
        ) : (
          incidents.map((inc, idx) => {
            const key = `${inc.id}-${inc.timestamp}`;
            return (
              <div key={key} data-ocid={`incidents.item.${idx + 1}`}>
                <IncidentItem inc={inc} visible={visible.has(key)} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ transactions, incidents }) {
  return (
    <Tabs defaultValue="incidents" className="">
      <TabsList
        style={{
          width: "100%",
          background: "#1A2840",
          borderRadius: 10,
          padding: 4,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          marginBottom: 8,
        }}
        data-ocid="right_panel.tab"
      >
        <TabsTrigger
          value="incidents"
          style={{ borderRadius: 7, fontSize: 11, fontWeight: 700 }}
          data-ocid="right_panel.incidents.tab"
        >
          <AlertCircle size={12} style={{ marginRight: 5 }} /> Incidents
        </TabsTrigger>
        <TabsTrigger
          value="pipeline"
          style={{ borderRadius: 7, fontSize: 11, fontWeight: 700 }}
          data-ocid="right_panel.pipeline.tab"
        >
          <Activity size={12} style={{ marginRight: 5 }} /> Pipeline
        </TabsTrigger>
      </TabsList>
      <TabsContent value="incidents" style={{ marginTop: 0 }}>
        <IncidentMonitor incidents={incidents} />
      </TabsContent>
      <TabsContent value="pipeline" style={{ marginTop: 0 }}>
        <ArchitectureDiagram transactions={transactions} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Kafka Log Panel ──────────────────────────────────────────────────────────
function colorizeLog(msg) {
  const timeMatch = msg.match(/^(\[\d{2}:\d{2}:\d{2}\])/);
  if (!timeMatch)
    return <span style={{ color: "rgba(255,255,255,0.35)" }}>{msg}</span>;
  const time = timeMatch[1];
  const rest = msg.slice(time.length);
  const parts = rest.split(/(GBM-\d{5}|T24\.\w+|ERROR|SUCCESS|INGEST)/g);
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
        if (part === "ERROR")
          return (
            <span key={key} style={{ color: "#EF4444", fontWeight: 700 }}>
              {part}
            </span>
          );
        if (part === "SUCCESS")
          return (
            <span key={key} style={{ color: "#22C55E", fontWeight: 700 }}>
              {part}
            </span>
          );
        if (part === "INGEST")
          return (
            <span key={key} style={{ color: "#A78BFA" }}>
              {part}
            </span>
          );
        return (
          <span key={key} style={{ color: "rgba(255,255,255,0.45)" }}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

function KafkaLogPanel({ logs }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  return (
    <div
      style={{
        background: "#080E16",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
            <span
              key={c}
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: c,
                display: "inline-block",
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          Kafka System Trace
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            fontFamily: "monospace",
          }}
        >
          {logs.length} entries
        </span>
      </div>
      <div
        ref={scrollRef}
        style={{ overflowY: "auto", maxHeight: 160, padding: "8px 16px" }}
        data-ocid="log.panel"
      >
        {logs.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "monospace",
              padding: "8px 0",
            }}
          >
            Waiting for events...
          </div>
        ) : (
          [...logs].reverse().map((log, idx) => (
            <div
              key={`${log.id}-${idx}`}
              style={{ fontSize: 12, lineHeight: 1.8, fontFamily: "monospace" }}
            >
              {colorizeLog(log.message)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Simulation Hook ──────────────────────────────────────────────────────────
function useSimulation() {
  const tick = usePipelineStore((s) => s.tick);
  useEffect(() => {
    const id = setInterval(tick, 1500);
    return () => clearInterval(id);
  }, [tick]);
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function GBMDashboard() {
  const transactions = usePipelineStore((s) => s.transactions);
  const logs = usePipelineStore((s) => s.logs);
  const incidents = usePipelineStore((s) => s.incidents);
  const metrics = usePipelineStore((s) => s.metrics);
  const paused = usePipelineStore((s) => s.paused);
  const togglePause = usePipelineStore((s) => s.togglePause);
  useSimulation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFC",
      }}
    >
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <Header metrics={metrics} paused={paused} onTogglePause={togglePause} />

      <main
        style={{
          flex: 1,
          padding: 16,
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 16,
          alignItems: "start",
        }}
      >
        <EventStream transactions={transactions} />
        <RightPanel transactions={transactions} incidents={incidents} />
      </main>

      <KafkaLogPanel logs={logs} />

      <footer
        style={{
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#94A3B8",
          background: "#F8FAFC",
          borderTop: "1px solid #E2E8F0",
        }}
      >
        <span>GBM Pipeline Monitor &copy; {new Date().getFullYear()}</span>
        <span>
          Built with{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#3B82F6", textDecoration: "underline" }}
          >
            caffeine.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
