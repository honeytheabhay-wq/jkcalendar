import type { Holiday } from "../data/holidays-2026";
import { fromDateKey } from "./dates";

const scopeTag = (holiday: Holiday) => holiday.kind === "general" ? "" : ` (${holiday.scope}${holiday.kind === "restricted" ? ", restricted" : ""})`;
const shortDate = (key: string) => fromDateKey(key).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

// Plain text that reads well in WhatsApp: one line per holiday, local ones tagged with their area.
export function holidayListText(holidays: Holiday[], year: number) {
  const lines = [...holidays].sort((a, b) => a.date.localeCompare(b.date)).map(h => `${shortDate(h.date)} – ${h.name}${scopeTag(h)}${h.subjectToMoon ? " *" : ""}`);
  return [`J&K Holidays ${year} (official list)`, "", ...lines, "", "* Subject to moon sighting", "Shared from J&K Calendar"].join("\n");
}
export function holidayText(holiday: Holiday) {
  return `${holiday.name}: ${fromDateKey(holiday.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${holiday.scope}${holiday.subjectToMoon ? " · subject to moon sighting" : ""}. Shared from J&K Calendar`;
}
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
