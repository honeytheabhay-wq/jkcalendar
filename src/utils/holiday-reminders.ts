import type { Holiday } from "../data/holidays-2026";
import { fromDateKey } from "./dates";

export type HolidayReminderScope = "off" | "general" | "all";
export const holidayReminderScopes = [{ value: "off", label: "Off" }, { value: "general", label: "All J&K holidays" }, { value: "all", label: "All holidays, incl. local" }] as const;
export const holidayReminderHours = [18, 19, 20, 21] as const;
export type HolidayReminderPlan = { id: string; title: string; body: string; date: string; at: number };

// One alert on the evening before each holiday date; several holidays on the same date share one alert.
export function buildHolidayReminderPlan(holidays: Holiday[], scope: HolidayReminderScope, hour: number, now = new Date(), limit = 20): HolidayReminderPlan[] {
  if (scope === "off") return [];
  const byDate = new Map<string, Holiday[]>();
  for (const holiday of holidays) {
    if (scope === "general" && holiday.kind !== "general") continue;
    byDate.set(holiday.date, [...(byDate.get(holiday.date) ?? []), holiday]);
  }
  const plans: HolidayReminderPlan[] = [];
  for (const [date, items] of [...byDate].sort(([a], [b]) => a.localeCompare(b))) {
    const evening = fromDateKey(date); evening.setDate(evening.getDate() - 1); evening.setHours(hour, 0, 0, 0);
    if (evening.getTime() <= now.getTime()) continue;
    const names = items.map(item => item.name).join(" & ");
    const closed = items.some(item => item.kind === "general") ? "Government offices closed" : items[0].kind === "restricted" ? "Restricted holiday" : `Holiday in ${items[0].scope}`;
    const moon = items.some(item => item.subjectToMoon) ? " Date subject to moon sighting." : "";
    plans.push({ id: `jkcalendar-holiday:${date}:${hour}:${items.length}`, title: `Tomorrow: ${names}`, body: `${closed}.${moon}`, date, at: evening.getTime() });
    if (plans.length >= limit) break;
  }
  return plans;
}
export function holidayReminderPreview(hour: number) { const d = new Date(); d.setHours(hour, 0, 0, 0); return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
