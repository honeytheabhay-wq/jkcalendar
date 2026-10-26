import "expo-sqlite/localStorage/install";
import { useSyncExternalStore } from "react";

export type ReminderStatus = { lastSyncAt: number | null; expected: number; queued: number; granted: boolean | null; error: string | null; testId?: string; testAt?: number; testReceivedAt?: number };
const key = "jk-calendar-reminder-status-v1", listeners = new Set<() => void>();
function read(): ReminderStatus { try { return { lastSyncAt: null, expected: 0, queued: 0, granted: null, error: null, ...JSON.parse(localStorage.getItem(key) ?? "{}") }; } catch { return { lastSyncAt: null, expected: 0, queued: 0, granted: null, error: null }; } }
let status = read();
export function getReminderStatus() { return status; }
export function updateReminderStatus(patch: Partial<ReminderStatus>) { status = { ...status, ...patch }; try { localStorage.setItem(key, JSON.stringify(status)); } catch {} listeners.forEach(fn => fn()); }
export function useReminderStatus() { return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => status, () => status); }
