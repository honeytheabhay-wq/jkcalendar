import type { Holiday } from "../data/holidays-2026";
import { fromDateKey } from "./dates";

// Opens Google Calendar's "new event" page with the holiday as an all-day event.
export function googleCalendarUrl(holiday: Holiday) {
  const day = holiday.date.replaceAll("-", ""), next = fromDateKey(holiday.date); next.setDate(next.getDate() + 1);
  const end = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`;
  const details = `${holiday.scope} · ${holiday.kind} holiday${holiday.subjectToMoon ? " · subject to moon sighting" : ""}. From J&K Calendar.`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(holiday.name)}&dates=${day}/${end}&details=${encodeURIComponent(details)}`;
}
// Case- and punctuation-insensitive match on name and area, so "eid", "Eid ul fitr" and "kishtwar" all work.
export function searchHolidays(holidays: Holiday[], query: string) {
  const simple = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const words = simple(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  return holidays.filter(h => { const haystack = simple(`${h.name} ${h.scope}`); return words.every(word => haystack.includes(word)); }).sort((a, b) => a.date.localeCompare(b.date));
}
