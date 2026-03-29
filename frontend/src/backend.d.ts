import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    id: string;
    status: string;
    type: string;
    error?: string;
    stage: string;
    timestamp: bigint;
}
export interface LogEntry {
    message: string;
    timestamp: bigint;
}
export interface Metrics {
    totalVolume: bigint;
    healthPercent: number;
    activeIssues: bigint;
}
export interface backendInterface {
    addLog(message: string): Promise<void>;
    addTransaction(transaction: Transaction): Promise<void>;
    clearOldData(): Promise<void>;
    getLogs(): Promise<Array<LogEntry>>;
    getMetrics(): Promise<Metrics>;
    getTransactions(): Promise<Array<Transaction>>;
    updateTransaction(id: string, stage: string, status: string, error: string | null): Promise<void>;
}
