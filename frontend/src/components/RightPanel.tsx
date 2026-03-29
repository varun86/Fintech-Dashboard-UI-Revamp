import { useState } from "react";
import type { Transaction } from "../hooks/usePipelineStore";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { IncidentMonitor } from "./IncidentMonitor";

type Tab = "incidents" | "pipeline";

interface RightPanelProps {
  transactions: Transaction[];
  incidents: Transaction[];
}

const TABS: { key: Tab; label: string }[] = [
  { key: "incidents", label: "Incident Monitor" },
  { key: "pipeline", label: "Pipeline Visual" },
];

export function RightPanel({ transactions, incidents }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("incidents");

  return (
    <div className="flex flex-col gap-3">
      <div
        className="p-1 rounded-full flex gap-1"
        style={{ background: "oklch(0.23 0.04 253)" }}
      >
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            data-ocid={`rightpanel.${tab.key}.tab`}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 text-[11px] font-semibold uppercase tracking-wide rounded-full transition-all duration-200"
            style={{
              background: activeTab === tab.key ? "white" : "transparent",
              color:
                activeTab === tab.key
                  ? "oklch(var(--foreground))"
                  : "rgba(255,255,255,0.55)",
              boxShadow:
                activeTab === tab.key
                  ? "0 1px 4px rgba(0,0,0,0.15)"
                  : undefined,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "incidents" ? (
        <IncidentMonitor incidents={incidents} />
      ) : (
        <ArchitectureDiagram transactions={transactions} />
      )}
    </div>
  );
}
