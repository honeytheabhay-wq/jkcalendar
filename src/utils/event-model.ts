import { fromDateKey, toDateKey } from "./dates";

export type Repeat = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type CalendarEvent = { id: string; title: string; date: string; time?: string; repeat?: Repeat; reminderMinutes?: number | null; updatedAt?: number };
export type EventInput = Omit<CalendarEvent, "id" | "updatedAt">;

export function validDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = fromDateKey(value);
  return date.getFullYear() >= 1900 && date.getFullYear() <= 2100 && toDateKey(date) === value;
}

export function normaliseTime(value = ""): string | undefined {
  if (!value.trim()) return undefined;
  const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(value.trim());
  if (!match) throw new Error("Select a valid event time.");
  let hour = Number(match[1]); const minute = Number(match[2]);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) throw new Error("Select a valid event time.");
  if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function validateEvent(input: EventInput): EventInput {
  const title = input.title.trim();
  if (!title || title.length > 150) throw new Error("Enter an event title of 1–150 characters.");
  if (!validDateKey(input.date)) throw new Error("Select a valid date between 1900 and 2100.");
  const repeat = input.repeat ?? "none";
  if (!["none", "daily", "weekly", "monthly", "yearly"].includes(repeat)) throw new Error("Choose a valid repeat option.");
  const time = normaliseTime(input.time);
  const reminderMinutes = input.reminderMinutes ?? null;
  if (reminderMinutes !== null && ![0, 30, 60, 1440].includes(reminderMinutes)) throw new Error("Choose a valid reminder option.");
  if (reminderMinutes !== null && !time) throw new Error("Select a time to enable a reminder.");
  return { title, date: input.date, time, repeat, reminderMinutes };
}

export function occursOn(event: CalendarEvent, key: string): boolean {
  if (!validDateKey(key) || !validDateKey(event.date) || key < event.date) return false;
  if (!event.repeat || event.repeat === "none") return key === event.date;
  const start = fromDateKey(event.date), date = fromDateKey(key);
  if (event.repeat === "daily") return true;
  if (event.repeat === "weekly") return date.getDay() === start.getDay();
  if (event.repeat === "monthly") return date.getDate() === start.getDate();
  return date.getMonth() === start.getMonth() && date.getDate() === start.getDate();
}

export type ReminderPlan = { id: string; eventId: string; title: string; date: string; time: string; at: number };
export function buildReminderPlan(events: CalendarEvent[], now = new Date(), limit = 40): ReminderPlan[] {
  const plans: ReminderPlan[] = [];
  for (const event of events) {
    if (event.reminderMinutes == null || !event.time) continue;
    let time: string | undefined;
    try { time = normaliseTime(event.time); } catch { continue; }
    if (!time || !validDateKey(event.date)) continue;
    const [hour, minute] = time.split(":").map(Number);
    const cursor = fromDateKey(toDateKey(now));
    if (toDateKey(cursor) < event.date) cursor.setTime(fromDateKey(event.date).getTime());
    let found = 0;
    // Rolling queue: up to five years of occurrences, refreshed whenever the app opens.
    for (let step = 0; step < 1830 && found < limit; step += 1, cursor.setDate(cursor.getDate() + 1)) {
      const key = toDateKey(cursor);
      if (!occursOn(event, key)) { if ((!event.repeat || event.repeat === "none") && key > event.date) break; continue; }
      const occurrence = new Date(cursor); occurrence.setHours(hour, minute, 0, 0);
      const at = occurrence.getTime() - event.reminderMinutes * 60_000;
      if (at > now.getTime()) { plans.push({ id: `jkcalendar:${event.id}:${event.updatedAt ?? 0}:${key}:${event.reminderMinutes}:${at}`, eventId: event.id, title: event.title, date: key, time, at }); found += 1; }
      if (!event.repeat || event.repeat === "none") break;
    }
  }
  return plans.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)).slice(0, limit);
}
