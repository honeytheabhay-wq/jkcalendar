import * as chrono from "chrono-node";
import { toDateKey } from "./dates";
import { validateEvent, type EventInput, type Repeat } from "./event-model";

export function parseQuickEntry(phrase: string, now = new Date()): { event: EventInput; notes: string[] } {
  if (!phrase.trim() || phrase.length > 350) throw new Error("Enter an event and date, for example: Meeting tomorrow at 11am.");
  if (/\bevery\s+\d+\b/i.test(phrase)) throw new Error("Numbered repeat intervals are not supported. Choose daily, weekly, monthly or yearly.");
  let repeat: Repeat = "none", text = phrase.trim();
  const weekday = /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const pattern = /\b(?:every\s+(day|week|month|year)|daily|weekly|monthly|yearly)\b/i;
  const recurrence = text.match(pattern);
  if (weekday.test(text)) { repeat = "weekly"; text = text.replace(weekday, "$1"); }
  else if (recurrence) {
    const value = (recurrence[1] ?? recurrence[0]).toLowerCase();
    repeat = value.startsWith("day") || value === "daily" ? "daily" : value.startsWith("week") ? "weekly" : value.startsWith("month") ? "monthly" : "yearly";
    text = text.replace(pattern, "").replace(/\s+/g, " ").trim();
  }
  const parser = chrono.en.GB;
  const results = parser.parse(text, now, { forwardDate: true, timezones: { IST: 330 } });
  if (results.length !== 1 || results[0].end) throw new Error("Enter one event with a single date and start time. Date ranges can be added separately.");
  const result = results[0], date = result.start.date();
  const title = (text.slice(0, result.index) + " " + text.slice(result.index + result.text.length)).replace(/\s+/g, " ").replace(/\b(?:on|at)\s*$/i, "").replace(/^[\s,.-]+|[\s,.-]+$/g, "").trim();
  if (!title) throw new Error("Include an event title, for example: Meeting tomorrow at 11am.");
  const timed = result.start.isCertain("hour");
  const time = timed ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : undefined;
  const notes = [];
  if (timed && !result.start.isCertain("meridiem") && (result.start.get("hour") ?? 0) <= 12) notes.push("Check AM/PM before saving.");
  if (result.start.isCertain("timezoneOffset")) notes.push("The time is shown in your phone’s local time zone.");
  return { event: validateEvent({ title, date: toDateKey(date), time, repeat, reminderMinutes: null }), notes };
}
