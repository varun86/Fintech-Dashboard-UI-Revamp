import { Activity, BarChart2, Bell, Pause, Play } from "lucide-react";
import type { Metrics } from "../hooks/usePipelineStore";

interface HeaderProps {
  metrics: Metrics;
  isPaused: boolean;
  onTogglePause: () => void;
}

function HealthDot({ health }: { health: number }) {
  const color =
    health > 95
      ? "bg-status-success"
      : health > 80
        ? "bg-status-amber"
        : "bg-status-error";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`}
      style={{
        boxShadow: health > 95 ? "0 0 6px oklch(0.72 0.19 145)" : undefined,
      }}
    />
  );
}

function MetricCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-card px-5 py-4 flex flex-col gap-1 min-w-[140px]">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {children}
        <span className="text-2xl font-bold text-foreground leading-none">
          {value}
        </span>
      </div>
    </div>
  );
}

export function Header({ metrics, isPaused, onTogglePause }: HeaderProps) {
  return (
    <header>
      {/* Top bar */}
      <div
        className="px-6 py-3.5 flex items-center justify-between"
        style={{ background: "oklch(var(--header))" }}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-success" />
          </span>
          <span
            className="text-[19px] font-semibold tracking-tight"
            style={{ color: "oklch(var(--header-foreground))" }}
          >
            GBM Pipeline Monitor
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {["Dashboard", "Alerts", "Reporting", "Setup"].map((item, i) => (
            <button
              type="button"
              key={item}
              data-ocid={`nav.${item.toLowerCase()}.link`}
              className="px-3.5 py-1.5 text-sm rounded-lg transition-colors"
              style={{
                color:
                  i === 0 ? "white" : "oklch(var(--header-foreground) / 0.7)",
                background:
                  i === 0 ? "oklch(var(--primary) / 0.25)" : "transparent",
              }}
            >
              {item}
            </button>
          ))}
          <div
            className="ml-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "oklch(var(--primary))", color: "white" }}
          >
            GB
          </div>
        </nav>
      </div>

      {/* KPI Row */}
      <div
        className="px-6 py-3 flex items-center gap-3 flex-wrap"
        style={{
          background: "oklch(var(--header) / 0.92)",
          borderBottom: "1px solid oklch(var(--header) / 0.5)",
        }}
      >
        <MetricCard
          label="Total Volume"
          value={metrics.totalVolume.toLocaleString()}
        >
          <BarChart2 size={16} className="text-status-blue shrink-0" />
        </MetricCard>

        <MetricCard
          label="Health"
          value={`${metrics.healthPercent.toFixed(1)}%`}
        >
          <HealthDot health={metrics.healthPercent} />
        </MetricCard>

        <MetricCard label="Active Issues" value={metrics.activeIssues}>
          <Bell
            size={15}
            className={
              metrics.activeIssues > 0
                ? "text-status-error"
                : "text-muted-foreground"
            }
          />
        </MetricCard>

        <div className="ml-auto">
          <button
            type="button"
            data-ocid="pipeline.toggle.button"
            onClick={onTogglePause}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
            style={{
              background: isPaused
                ? "oklch(var(--status-success))"
                : "oklch(var(--primary))",
              color: "white",
            }}
          >
            {isPaused ? (
              <>
                <Play size={15} className="fill-white" />
                Resume Data Flow
              </>
            ) : (
              <>
                <Pause size={15} className="fill-white" />
                Pause Data Flow
              </>
            )}
          </button>
        </div>

        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "oklch(var(--header-foreground) / 0.6)" }}
        >
          <Activity size={12} />
          <span>{isPaused ? "PAUSED" : "LIVE"}</span>
        </div>
      </div>
    </header>
  );
}
