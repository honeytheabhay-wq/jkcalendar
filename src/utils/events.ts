import "expo-sqlite/localStorage/install";
import { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { validateEvent, validDateKey, type CalendarEvent, type EventInput } from "./event-model";
import { startReminderDeliveryListener, syncReminders } from "./reminders";
export type { CalendarEvent } from "./event-model";

const storageKey = "jk-calendar-events-v1";
const listeners = new Set<() => void>();
function readEvents(): CalendarEvent[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? value.filter(item => item && typeof item.id === "string" && typeof item.title === "string" && typeof item.date === "string" && validDateKey(item.date)) : [];
  } catch { return []; }
}
let eventCache = readEvents();
function commit(events: CalendarEvent[]) {
  localStorage.setItem(storageKey, JSON.stringify(events));
  eventCache = events; listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useReminderRefresh() {
  useEffect(() => {
    const refresh = () => { void syncReminders(eventCache).catch(() => {}); };
    const stop = startReminderDeliveryListener();
    refresh();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") refresh(); });
    return () => { stop(); subscription.remove(); };
  }, []);
}
export function getEvents() { return eventCache; }
export function useEvents() {
  const events = useSyncExternalStore(subscribe, () => eventCache, () => eventCache);
  return {
    events,
    async saveEvent(input: EventInput, id?: string): Promise<string | null> {
      const clean = validateEvent(input);
      const existing = id ? eventCache.find(event => event.id === id) : undefined;
      if (id && !existing) throw new Error("This event no longer exists.");
      const event: CalendarEvent = { ...clean, id: existing?.id ?? `${Date.now()}-${Math.random()}`, updatedAt: Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1) };
      commit(existing ? eventCache.map(item => item.id === id ? event : item) : [...eventCache, event]);
      try { await syncReminders(eventCache); return null; }
      catch { return "Event saved. Its reminders could not be updated. Reopen the app after checking notification settings."; }
    },
    async deleteEvent(id: string): Promise<string | null> {
      commit(eventCache.filter(event => event.id !== id));
      try { await syncReminders(eventCache); return null; }
      catch { return "Event deleted. A previously scheduled alert may remain until the app next refreshes its reminders."; }
    },
  };
}

