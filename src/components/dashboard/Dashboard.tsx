'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { PipelineView } from './PipelineView';
import { EventStream } from './EventStream';
import { IncidentView } from './IncidentView';
import { KafkaLogPanel } from './KafkaLogPanel';

type ViewTab = 'pipeline' | 'incidents';

function ViewSwitcher({ activeTab, onTabChange }: { activeTab: ViewTab; onTabChange: (tab: ViewTab) => void }) {
  const tabs: { id: ViewTab; label: string }[] = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'incidents', label: 'Incidents' },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex items-center gap-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative px-5 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-[0.1em]
            transition-colors duration-200 cursor-pointer z-10
            ${activeTab === tab.id
              ? 'text-white'
              : 'text-white/30 hover:text-white/50'
            }
          `}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 bg-white/[0.06] border border-white/[0.08] rounded-lg"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<ViewTab>('pipeline');

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Top Bar */}
      <TopBar />

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-5 py-4 space-y-4">
        {/* View Switcher */}
        <div className="flex items-center justify-between">
          <ViewSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
          <span className="text-[10px] font-mono text-white/15">
            GBM Platform v2.4.1
          </span>
        </div>

        {/* Switchable content area */}
        <div className="relative">
          {activeTab === 'pipeline' && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PipelineView />
            </motion.div>
          )}
          {activeTab === 'incidents' && (
            <motion.div
              key="incidents"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <IncidentView />
            </motion.div>
          )}
        </div>

        {/* Event Stream — always visible */}
        <EventStream />

        {/* Kafka Log Panel — always visible */}
        <KafkaLogPanel />
      </main>
    </div>
  );
}
