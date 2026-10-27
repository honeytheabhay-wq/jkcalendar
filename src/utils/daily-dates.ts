import type { Holiday } from "../data/holidays-2026";
import { toDateKey } from "./dates";
import { hijriDate, hijriLabel, hindiLabel, kashmiriPanchang, panchangLabel } from "./regional-calendars";

export type DailyDatePlan = { id: string; title: string; body: string; date: string; at: number };
export const dailyDatesHour = 7;

// A morning note with the day's Hijri, Kashmiri Pandit and Hindi dates (and any holiday). The content changes daily,
// so each morning is its own scheduled alert, refilled whenever the app opens.
export function buildDailyDatePlan(holidays: Holiday[], hijriOffset: number, days: number, now = new Date()): DailyDatePlan[] {
  const plans: DailyDatePlan[] = [];
  for (let step = 0; plans.length < days && step <= days; step++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + step, dailyDatesHour, 0, 0, 0);
    if (day.getTime() <= now.getTime()) continue;
    const date = toDateKey(day), panchang = kashmiriPanchang(day);
    const names = holidays.filter(holiday => holiday.date === date).map(holiday => holiday.name);
    plans.push({
      id: `jkcalendar-daily:${date}:${hijriOffset}`,
      title: `${day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}${names.length ? ` · ${names.join(" & ")}` : ""}`,
      body: `Hijri: ${hijriLabel(hijriDate(day, hijriOffset))}\nKashmiri Pandit: ${panchangLabel(panchang)}\nHindi: ${hindiLabel(panchang)}`,
      date,
      at: day.getTime(),
    });
  }
  return plans;
}
