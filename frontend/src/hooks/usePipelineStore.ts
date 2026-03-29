import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./useActor";

export type Stage = "DISPATCHER" | "SCENARIO" | "PAYLOAD" | "CONNECT";
export type TxStatus = "PROCESSING" | "SUCCESS" | "ERROR";
export type TxType = "FX_TRADE" | "WIRE_TRANSFER" | "SWAP" | "ACH_PAYMENT";

export interface Transaction {
  id: string;
  type: TxType;
  stage: Stage;
  status: TxStatus;
  timestamp: number;
  error?: string;
}

export interface LogEntry {
  message: string;
  timestamp: number;
}

export interface Metrics {
  totalVolume: number;
  healthPercent: number;
  activeIssues: number;
}

const STAGES: Stage[] = ["DISPATCHER", "SCENARIO", "PAYLOAD", "CONNECT"];
const TX_TYPES: TxType[] = ["FX_TRADE", "WIRE_TRANSFER", "SWAP", "ACH_PAYMENT"];
const MAX_TXS = 50;
const MAX_LOGS = 200;

function randomId() {
  return `GBM-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function makeLog(txId: string, type: TxType, stage: Stage, ts: number): string {
  return `[${formatTime(ts)}] INGEST >> ${txId} Topic: T24.RAW | Type: ${type} | Stage: ${stage}`;
}

export function usePipelineStore() {
  const { actor } = useActor();
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [incidents, setIncidents] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalVolume: 0,
    healthPercent: 100,
    activeIssues: 0,
  });
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      const now = Date.now();
      const a = actorRef.current;

      setTransactions((prev) => {
        const updated = prev.map((tx): Transaction => {
          if (tx.status !== "PROCESSING") return tx;

          const stageIdx = STAGES.indexOf(tx.stage);
          const isError = Math.random() < 0.1;

          if (isError) {
            const errorMsg = `Pipeline error at ${tx.stage}: connection timeout`;
            const next: Transaction = {
              ...tx,
              status: "ERROR",
              error: errorMsg,
              timestamp: now,
            };
            a?.updateTransaction(tx.id, tx.stage, "ERROR", errorMsg).catch(
              () => {},
            );
            return next;
          }

          if (stageIdx === STAGES.length - 1) {
            const next: Transaction = {
              ...tx,
              status: "SUCCESS",
              timestamp: now,
            };
            a?.updateTransaction(tx.id, tx.stage, "SUCCESS", null).catch(
              () => {},
            );
            return next;
          }

          const nextStage = STAGES[stageIdx + 1];
          const next: Transaction = { ...tx, stage: nextStage, timestamp: now };
          a?.updateTransaction(tx.id, nextStage, "PROCESSING", null).catch(
            () => {},
          );
          const logMsg = makeLog(tx.id, tx.type, nextStage, now);
          a?.addLog(logMsg).catch(() => {});
          setLogs((l) =>
            [{ message: logMsg, timestamp: now }, ...l].slice(0, MAX_LOGS),
          );
          return next;
        });

        // Spawn new transaction
        const newId = randomId();
        const newType = TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)];
        const newTx: Transaction = {
          id: newId,
          type: newType,
          stage: "DISPATCHER",
          status: "PROCESSING",
          timestamp: now,
        };
        a?.addTransaction({
          id: newId,
          type: newType,
          stage: "DISPATCHER",
          status: "PROCESSING",
          timestamp: BigInt(now),
        }).catch(() => {});
        const logMsg = makeLog(newId, newType, "DISPATCHER", now);
        a?.addLog(logMsg).catch(() => {});
        setLogs((l) =>
          [{ message: logMsg, timestamp: now }, ...l].slice(0, MAX_LOGS),
        );

        const withNew = [newTx, ...updated].slice(0, MAX_TXS);

        // Update incidents
        const newErrors = withNew.filter(
          (tx) =>
            tx.status === "ERROR" &&
            !prev.find((p) => p.id === tx.id && p.status === "ERROR"),
        );
        if (newErrors.length > 0) {
          setIncidents((p) => [...newErrors, ...p].slice(0, 50));
        }

        // Update local metrics
        const total = withNew.length;
        const errors = withNew.filter((t) => t.status === "ERROR").length;
        const active = withNew.filter((t) => t.status === "PROCESSING").length;
        const health =
          total > 0 ? Math.round(((total - errors) / total) * 100) : 100;
        setMetrics({
          totalVolume: total,
          healthPercent: health,
          activeIssues: active,
        });

        return withNew;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Poll backend metrics every 5s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const m = await actorRef.current?.getMetrics();
        if (m) {
          setMetrics({
            totalVolume: Number(m.totalVolume),
            healthPercent: m.healthPercent,
            activeIssues: Number(m.activeIssues),
          });
        }
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  return { transactions, logs, incidents, metrics, isPaused, togglePause };
}
