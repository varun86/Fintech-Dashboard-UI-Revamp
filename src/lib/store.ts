import { create } from 'zustand';

export type TransactionStage = 'DISPATCHER' | 'SCENARIO' | 'PAYLOAD' | 'CONNECT' | 'EVENT_STORE';
export type TransactionStatus = 'PROCESSING' | 'SUCCESS' | 'ERROR';

export type Transaction = {
  id: string;
  type: string;
  stage: TransactionStage;
  status: TransactionStatus;
  timestamp: number;
  completedStages: TransactionStage[];
  error?: string;
  failedStage?: TransactionStage;
};

export type LogEntry = {
  id: string;
  timestamp: number;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  txId?: string;
  topic?: string;
};

export type Incident = {
  id: string;
  txId: string;
  txType: string;
  failedStage: TransactionStage;
  timestamp: number;
  errorMessage: string;
};

export type NodeMetrics = {
  total: number;
  success: number;
  error: number;
  processing: number;
};

export type Metrics = {
  totalVolume: number;
  successCount: number;
  errorCount: number;
  processingCount: number;
  healthPercent: number;
  activeIssues: number;
  nodes: Record<TransactionStage, NodeMetrics>;
};

export const STAGES: TransactionStage[] = ['DISPATCHER', 'SCENARIO', 'PAYLOAD', 'CONNECT', 'EVENT_STORE'];

const KAFKA_TOPICS = [
  'T24.RAW',
  'T24.PROCESSED',
  'FX.TRADES',
  'PAYMENT.INBOUND',
  'POSITION.UPDATES',
];

const TX_TYPES = ['FX_TRADE', 'PAYMENT', 'TRANSFER', 'POSITION_UPDATE', 'SETTLEMENT', 'RECONCILIATION'];

export { KAFKA_TOPICS, TX_TYPES };

type DashboardStore = {
  transactions: Transaction[];
  logs: LogEntry[];
  incidents: Incident[];
  metrics: Metrics;
  isRunning: boolean;

  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  addLog: (log: LogEntry) => void;
  addIncident: (incident: Incident) => void;
  recalculateMetrics: () => void;
  setRunning: (running: boolean) => void;
  resetAll: () => void;
};

let logCounter = 0;
let incidentCounter = 0;

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  transactions: [],
  logs: [],
  incidents: [],
  isRunning: false,
  metrics: {
    totalVolume: 0,
    successCount: 0,
    errorCount: 0,
    processingCount: 0,
    healthPercent: 100,
    activeIssues: 0,
    nodes: {
      DISPATCHER: { total: 0, success: 0, error: 0, processing: 0 },
      SCENARIO: { total: 0, success: 0, error: 0, processing: 0 },
      PAYLOAD: { total: 0, success: 0, error: 0, processing: 0 },
      CONNECT: { total: 0, success: 0, error: 0, processing: 0 },
      EVENT_STORE: { total: 0, success: 0, error: 0, processing: 0 },
    },
  },

  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions].slice(0, 50),
    })),

  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  addLog: (log) => {
    logCounter++;
    const enrichedLog = { ...log, id: `log-${logCounter}-${log.timestamp}` };
    set((state) => ({
      logs: [...state.logs, enrichedLog].slice(-200),
    }));
  },

  addIncident: (incident) => {
    incidentCounter++;
    const enrichedIncident = { ...incident, id: `inc-${incidentCounter}` };
    set((state) => ({
      incidents: [enrichedIncident, ...state.incidents].slice(0, 30),
    }));
  },

  setRunning: (running) => set({ isRunning: running }),

  resetAll: () => {
    logCounter = 0;
    incidentCounter = 0;
    set({
      transactions: [],
      logs: [],
      incidents: [],
      isRunning: false,
      metrics: {
        totalVolume: 0,
        successCount: 0,
        errorCount: 0,
        processingCount: 0,
        healthPercent: 100,
        activeIssues: 0,
        nodes: {
          DISPATCHER: { total: 0, success: 0, error: 0, processing: 0 },
          SCENARIO: { total: 0, success: 0, error: 0, processing: 0 },
          PAYLOAD: { total: 0, success: 0, error: 0, processing: 0 },
          CONNECT: { total: 0, success: 0, error: 0, processing: 0 },
          EVENT_STORE: { total: 0, success: 0, error: 0, processing: 0 },
        },
      },
    });
  },

  recalculateMetrics: () => {
    const { transactions, incidents } = get();
    const totalVolume = transactions.length;
    const successCount = transactions.filter((t) => t.status === 'SUCCESS').length;
    const errorCount = transactions.filter((t) => t.status === 'ERROR').length;
    const processingCount = transactions.filter(
      (t) => t.status === 'PROCESSING'
    ).length;
    const completedCount = successCount + errorCount;
    const healthPercent =
      completedCount > 0
        ? Math.round((successCount / completedCount) * 100)
        : 100;
    const activeIssues = incidents.filter(
      (inc) => Date.now() - inc.timestamp < 60000
    ).length;

    // Per-node metrics
    const nodes = {} as Record<TransactionStage, NodeMetrics>;
    for (const stage of STAGES) {
      const atNode = transactions.filter(
        (t) => t.completedStages.includes(stage) || (t.stage === stage && t.status === 'PROCESSING') || (t.failedStage === stage)
      );
      const success = transactions.filter(
        (t) => t.completedStages.includes(stage) && t.status !== 'ERROR'
      ).length;
      const error = transactions.filter(
        (t) => t.failedStage === stage
      ).length;
      const processing = transactions.filter(
        (t) => t.stage === stage && t.status === 'PROCESSING'
      ).length;
      nodes[stage] = { total: atNode.length, success, error, processing };
    }

    set({
      metrics: {
        totalVolume,
        successCount,
        errorCount,
        processingCount,
        healthPercent,
        activeIssues,
        nodes,
      },
    });
  },
}));
