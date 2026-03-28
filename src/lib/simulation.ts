import { useDashboardStore, STAGES, KAFKA_TOPICS, TX_TYPES, type TransactionStage } from './store';

const ERROR_MESSAGES: Record<TransactionStage, string[]> = {
  DISPATCHER: [
    'Routing timeout — no matching scenario found',
    'Dispatcher queue overflow — message dropped',
    'Invalid message format — schema validation failed',
  ],
  SCENARIO: [
    'Scenario execution failed — validation rule violation',
    'Condition evaluation error — null pointer exception',
    'Scenario lookup timeout — registry unavailable',
  ],
  PAYLOAD: [
    'Payload transformation failed — schema mismatch at field mapping',
    'Field mapping error — required field missing from source',
    'Serialization error — unexpected data type in payload',
  ],
  CONNECT: [
    'Downstream connection refused — service unavailable',
    'Kafka publish failed — broker not reachable',
    'Connection pool exhausted — timeout waiting for available connection',
  ],
  EVENT_STORE: [
    'Event store write failed — storage quota exceeded',
    'Persistence error — duplicate event detected',
    'Write timeout — event store latency exceeded threshold',
  ],
};

const STAGE_LOG_MESSAGES: Record<TransactionStage, (txId: string, txType: string, topic?: string) => string> = {
  DISPATCHER: (txId, txType) => `DISPATCHER >> [${txId}] Routing to ${txType} scenario pipeline`,
  SCENARIO: (txId, txType) => `SCENARIO >> [${txId}] Scenario ${txType}_FLOW matched and executed`,
  PAYLOAD: (txId, _txType) => `PAYLOAD >> [${txId}] Payload transformed (${Math.floor(Math.random() * 50 + 10)} fields mapped)`,
  CONNECT: (txId, _txType, topic) => `CONNECT >> [${txId}] Connected to downstream via ${topic || 'default'}`,
  EVENT_STORE: (txId) => `EVENT_STORE >> [${txId}] Persisted to event store ✓`,
};

let txCounter = 0;
let simulationTimers: ReturnType<typeof setTimeout>[] = [];
let generationInterval: ReturnType<typeof setInterval> | null = null;
let logCounter = 0;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTxId(): string {
  txCounter++;
  return `GBM-${String(txCounter).padStart(5, '0')}`;
}

function processStage(
  txId: string,
  stageIndex: number,
  txType: string,
  topic: string,
  completedSoFar: TransactionStage[]
) {
  const store = useDashboardStore.getState();
  const tx = store.transactions.find((t) => t.id === txId);
  if (!tx || tx.status === 'ERROR') return;

  const stage = STAGES[stageIndex];

  // Update transaction to current stage
  const newCompleted = [...completedSoFar, stage];
  store.updateTransaction(txId, {
    stage,
    completedStages: newCompleted,
  });

  // Generate INFO log for entering this stage
  store.addLog({
    id: '',
    timestamp: Date.now(),
    message: STAGE_LOG_MESSAGES[stage](txId, txType, topic),
    level: 'INFO',
    txId,
    topic: stage === 'CONNECT' ? topic : undefined,
  });

  // Extra Kafka log for CONNECT stage
  if (stage === 'CONNECT') {
    store.addLog({
      id: '',
      timestamp: Date.now(),
      message: `KAFKA >> [${txId}] Published to ${topic} (partition ${randomBetween(0, 7)})`,
      level: 'INFO',
      txId,
      topic,
    });
  }

  store.recalculateMetrics();

  const stageDuration = randomBetween(600, 1500);

  const timer = setTimeout(() => {
    const currentState = useDashboardStore.getState();
    const currentTx = currentState.transactions.find((t) => t.id === txId);
    if (!currentTx || currentTx.status === 'ERROR') return;

    // 10% failure chance (2% for EVENT_STORE)
    const failureChance = stage === 'EVENT_STORE' ? 0.02 : 0.10;
    const shouldFail = Math.random() < failureChance;

    if (shouldFail) {
      const errorMsg = randomItem(ERROR_MESSAGES[stage]);
      store.updateTransaction(txId, {
        status: 'ERROR',
        stage,
        error: errorMsg,
        failedStage: stage,
      });

      // Generate ERROR log
      const errorPrefix = stage === 'DISPATCHER'
        ? 'DISPATCHER'
        : stage === 'SCENARIO'
        ? 'SCENARIO'
        : stage === 'PAYLOAD'
        ? 'PAYLOAD'
        : stage === 'CONNECT'
        ? 'CONNECT'
        : 'EVENT_STORE';

      store.addLog({
        id: '',
        timestamp: Date.now(),
        message: `${errorPrefix} >> [${txId}] ERROR: ${errorMsg}`,
        level: 'ERROR',
        txId,
        topic: stage === 'CONNECT' ? topic : undefined,
      });

      store.addIncident({
        id: '',
        txId,
        txType,
        failedStage: stage,
        timestamp: Date.now(),
        errorMessage: `Processing failed at ${stage}: ${errorMsg}`,
      });
      store.recalculateMetrics();
      return;
    }

    // Success - move to next stage
    if (stageIndex < STAGES.length - 1) {
      processStage(txId, stageIndex + 1, txType, topic, newCompleted);
    } else {
      // All stages completed
      store.updateTransaction(txId, {
        status: 'SUCCESS',
        stage: 'EVENT_STORE',
        completedStages: [...STAGES],
      });
      store.addLog({
        id: '',
        timestamp: Date.now(),
        message: `EVENT_STORE >> [${txId}] Transaction completed successfully ✓`,
        level: 'INFO',
        txId,
      });
      store.recalculateMetrics();
    }
  }, stageDuration);

  simulationTimers.push(timer);
}

function createTransaction() {
  const store = useDashboardStore.getState();
  const txId = generateTxId();
  const txType = randomItem(TX_TYPES);
  const topic = randomItem(KAFKA_TOPICS);

  const tx = {
    id: txId,
    type: txType,
    stage: 'DISPATCHER' as TransactionStage,
    status: 'PROCESSING' as const,
    timestamp: Date.now(),
    completedStages: [] as TransactionStage[],
  };

  store.addTransaction(tx);

  // Kafka-style INGEST log
  store.addLog({
    id: '',
    timestamp: Date.now(),
    message: `INGEST >> [${txId}] Topic: ${topic} | Type: ${txType}`,
    level: 'INFO',
    txId,
    topic,
  });

  store.recalculateMetrics();

  // Start processing through stages (begin with DISPATCHER at index 0)
  processStage(txId, 0, txType, topic, []);
}

export function startSimulation() {
  const store = useDashboardStore.getState();
  if (store.isRunning) return;

  store.setRunning(true);

  // Generate first few transactions quickly
  for (let i = 0; i < 3; i++) {
    const timer = setTimeout(() => createTransaction(), i * 300);
    simulationTimers.push(timer);
  }

  // Generate new transactions at random intervals (1.5-3 seconds)
  generationInterval = setInterval(() => {
    const interval = randomBetween(1500, 3000);
    const timer = setTimeout(() => {
      createTransaction();
    }, interval);
    simulationTimers.push(timer);
  }, 1200);
}

export function stopSimulation() {
  const store = useDashboardStore.getState();
  store.setRunning(false);

  if (generationInterval) {
    clearInterval(generationInterval);
    generationInterval = null;
  }
  simulationTimers.forEach(clearTimeout);
  simulationTimers = [];
}

export function resetSimulation() {
  stopSimulation();
  const store = useDashboardStore.getState();
  store.resetAll();
  txCounter = 0;
}
