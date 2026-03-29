import type { Transaction } from "../hooks/usePipelineStore";

interface NodeStats {
  success: number;
  error: number;
  active: number;
}

function getNodeStats(transactions: Transaction[], stage: string): NodeStats {
  return {
    success: transactions.filter(
      (t) =>
        (t.stage === stage && t.status === "SUCCESS") ||
        (stage === "CONNECT" &&
          t.status === "SUCCESS" &&
          t.stage === "CONNECT"),
    ).length,
    error: transactions.filter((t) => t.stage === stage && t.status === "ERROR")
      .length,
    active: transactions.filter(
      (t) => t.stage === stage && t.status === "PROCESSING",
    ).length,
  };
}

interface NodeDef {
  id: string;
  label: string;
  color: string;
  glow: string;
  x: number;
  y: number;
}

const NODES: NodeDef[] = [
  {
    id: "DISPATCHER",
    label: "Dispatcher",
    color: "#22C55E",
    glow: "rgba(34,197,94,0.4)",
    x: 200,
    y: 60,
  },
  {
    id: "SCENARIO",
    label: "Scenario",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.4)",
    x: 200,
    y: 160,
  },
  {
    id: "PAYLOAD",
    label: "Payload",
    color: "#EF4444",
    glow: "rgba(239,68,68,0.4)",
    x: 200,
    y: 260,
  },
  {
    id: "CONNECT",
    label: "Connect",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.4)",
    x: 200,
    y: 360,
  },
];

const KAFKA_TOPICS = [
  { label: "T24.RAW", x: 80, y: 310 },
  { label: "T24.PROC", x: 320, y: 310 },
];

const PARTICLES = [
  { id: "p1", x1: 200, y1: 88, x2: 200, y2: 140, delay: "0s" },
  { id: "p2", x1: 200, y1: 188, x2: 200, y2: 240, delay: "0.4s" },
  { id: "p3", x1: 200, y1: 288, x2: 200, y2: 340, delay: "0.8s" },
  { id: "p4", x1: 200, y1: 388, x2: 200, y2: 450, delay: "1.2s" },
];

export function ArchitectureDiagram({
  transactions,
}: { transactions: Transaction[] }) {
  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden"
      style={{ background: "oklch(var(--incident))" }}
    >
      <div className="px-4 py-3 border-b border-white/10">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
          Pipeline Visual
        </span>
      </div>
      <div className="p-2 overflow-y-auto" style={{ maxHeight: "540px" }}>
        <svg
          viewBox="0 0 400 520"
          className="w-full"
          style={{ maxHeight: "500px" }}
          aria-label="Pipeline architecture diagram"
          role="img"
        >
          <title>GBM Pipeline Architecture</title>
          <defs>
            {NODES.map((node) => (
              <filter
                key={`glow-${node.id}`}
                id={`glow-${node.id}`}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
            <filter
              id="glow-store"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
            </marker>
          </defs>

          {/* Connection lines */}
          {NODES.slice(0, -1).map((node, i) => (
            <line
              key={`line-${node.id}`}
              x1={node.x}
              y1={node.y + 28}
              x2={NODES[i + 1].x}
              y2={NODES[i + 1].y - 28}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#arrowhead)"
            />
          ))}

          {/* Kafka connections */}
          <line
            x1={200}
            y1={280}
            x2={80}
            y2={295}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <line
            x1={200}
            y1={280}
            x2={320}
            y2={295}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Event Store connection */}
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

          {/* Animated flow particles */}
          {PARTICLES.map((p) => (
            <circle key={p.id} r="4" fill="white" opacity="0.8">
              <animateMotion
                dur="1.6s"
                repeatCount="indefinite"
                begin={p.delay}
                path={`M ${p.x1} ${p.y1} L ${p.x2} ${p.y2}`}
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                dur="1.6s"
                repeatCount="indefinite"
                begin={p.delay}
              />
            </circle>
          ))}

          {/* Kafka topics */}
          {KAFKA_TOPICS.map((kt) => (
            <g key={kt.label}>
              <ellipse
                cx={kt.x}
                cy={kt.y}
                rx={42}
                ry={18}
                fill="oklch(0.3 0.05 250)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              <text
                x={kt.x}
                y={kt.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.7)"
                fontFamily="JetBrains Mono, monospace"
              >
                {kt.label}
              </text>
            </g>
          ))}

          {/* Pipeline nodes */}
          {NODES.map((node) => {
            const stats = getNodeStats(transactions, node.id);
            return (
              <g key={node.id}>
                <rect
                  x={node.x - 62}
                  y={node.y - 28}
                  width={124}
                  height={56}
                  rx={12}
                  fill={node.glow}
                  filter={`url(#glow-${node.id})`}
                />
                <rect
                  x={node.x - 60}
                  y={node.y - 26}
                  width={120}
                  height={52}
                  rx={10}
                  fill="oklch(0.18 0.04 253)"
                  stroke={node.color}
                  strokeWidth="2"
                />
                <rect
                  x={node.x - 60}
                  y={node.y - 26}
                  width={6}
                  height={52}
                  rx={3}
                  fill={node.color}
                />
                <text
                  x={node.x - 42}
                  y={node.y - 7}
                  fontSize="12"
                  fontWeight="600"
                  fill={node.color}
                  fontFamily="Plus Jakarta Sans, system-ui"
                >
                  {node.label}
                </text>
                <text
                  x={node.x - 42}
                  y={node.y + 10}
                  fontSize="10"
                  fill="rgba(255,255,255,0.5)"
                  fontFamily="Plus Jakarta Sans, system-ui"
                >
                  ✓ {stats.success} ✗ {stats.error} ~ {stats.active}
                </text>
              </g>
            );
          })}

          {/* Event Store */}
          <g>
            <rect
              x={130}
              y={450}
              width={140}
              height={38}
              rx={19}
              fill="oklch(0.22 0.07 300)"
              stroke="#8B5CF6"
              strokeWidth="2"
              filter="url(#glow-store)"
            />
            <text
              x={200}
              y={469}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              fill="#C4B5FD"
              fontFamily="Plus Jakarta Sans, system-ui"
            >
              Event Store
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
