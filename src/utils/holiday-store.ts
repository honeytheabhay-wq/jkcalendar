import "expo-sqlite/localStorage/install";
import { useSyncExternalStore } from "react";
import { holidays2026, type Holiday } from "../data/holidays-2026";
import { toDateKey, fromDateKey } from "./dates";

// The holiday list can be updated online, without a new app version: moon-sighting dates (Eid, Muharram,
// Shab-e-Barat…), special closures and next year's schedule. The app keeps the bundled list as a fallback, caches the
// last good download, and replaces the shared holiday array in place so every screen reads the same list.
export const holidayListUrl = "https://raw.githubusercontent.com/honeytheabhay-wq/jkcalendar/main/holidays.json";
const cacheKey = "jk-calendar-holidays-online-v1";
const kinds = ["general", "provincial", "local", "restricted", "special"];
const listeners = new Set<() => void>();
let version = 0;
let lastChecked = 0;

export type HolidayChange = { name: string; from?: string; to?: string };

export function validateHolidayList(data: unknown): Holiday[] | null {
  if (!data || typeof data !== "object" || (data as { app?: unknown }).app !== "jk-calendar") return null;
  const list = (data as { holidays?: unknown }).holidays;
  if (!Array.isArray(list) || list.length < 1 || list.length > 400) return null;
  const out: Holiday[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") return null;
    const h = item as Record<string, unknown>;
    if (typeof h.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(h.date) || toDateKey(fromDateKey(h.date)) !== h.date) return null;
    if (typeof h.name !== "string" || !h.name.trim() || h.name.length > 120) return null;
    if (typeof h.scope !== "string" || !h.scope.trim() || h.scope.length > 120) return null;
    if (typeof h.kind !== "string" || !kinds.includes(h.kind)) return null;
    const holiday: Holiday = { date: h.date, name: h.name.trim(), scope: h.scope.trim(), kind: h.kind as Holiday["kind"], subjectToMoon: h.subjectToMoon === true };
    const s = h.source as Record<string, unknown> | undefined;
    if (s && typeof s.order === "string" && typeof s.date === "string" && typeof s.note === "string" && typeof s.url === "string" && /^https:\/\/jkgad\.nic\.in\//.test(s.url)) {
      holiday.source = { order: s.order.slice(0, 80), date: s.date.slice(0, 40), url: s.url, note: s.note.slice(0, 200) };
    }
    out.push(holiday);
  }
  return out;
}

function apply(list: Holiday[]) {
  holidays2026.splice(0, holidays2026.length, ...list);
  version++;
  listeners.forEach(fn => fn());
}

// Load the last good online list straight away, so the calendar, reminders and widget all start with it.
try { const cached = validateHolidayList(JSON.parse(localStorage.getItem(cacheKey) ?? "null")); if (cached) holidays2026.splice(0, holidays2026.length, ...cached); } catch {}

export function holidayListVersion() { return version; }
export function useHolidayListVersion() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => version, () => version);
}

// Upcoming holidays that moved, were added or were removed, matched by name and scope.
export function holidayChanges(before: Holiday[], after: Holiday[], today = toDateKey(new Date())): HolidayChange[] {
  const id = (h: Holiday) => `${h.name}|${h.scope}`;
  const old = new Map(before.filter(h => h.date >= today).map(h => [id(h), h.date]));
  const fresh = new Map(after.filter(h => h.date >= today).map(h => [id(h), h.date]));
  const changes: HolidayChange[] = [];
  for (const [key, to] of fresh) { const from = old.get(key); if (from !== to) changes.push({ name: key.split("|")[0], from, to }); }
  for (const [key, from] of old) if (!fresh.has(key) && !after.some(h => id(h) === key)) changes.push({ name: key.split("|")[0], from });
  return changes;
}

// Downloads the online list (at most every 3 hours unless forced). Returns the upcoming changes it applied.
export async function refreshHolidayList(force = false): Promise<HolidayChange[]> {
  if (!force && Date.now() - lastChecked < 3 * 3_600_000) return [];
  lastChecked = Date.now();
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${holidayListUrl}?t=${Math.floor(Date.now() / 3_600_000)}`, { signal: controller.signal });
    if (!response.ok) return [];
    const text = await response.text();
    if (text.length > 500_000) return [];
    const list = validateHolidayList(JSON.parse(text));
    if (!list || JSON.stringify(list) === JSON.stringify(holidays2026)) return [];
    const changes = holidayChanges(holidays2026, list);
    localStorage.setItem(cacheKey, JSON.stringify({ app: "jk-calendar", holidays: list }));
    apply(list);
    return changes;
  } catch { return []; }
  finally { clearTimeout(timer); }
}
