import { holidays2026 } from "../data/holidays-2026";
import { fromDateKey, toDateKey } from "./dates";
import { normaliseTime, occursOn, type CalendarEvent } from "./event-model";
import { hijriDate, hindiLabel, kashmiriPanchang } from "./regional-calendars";

type Hex = `#${string}`;
export type WidgetData = { dateLabel: string; hijri: string; pandit: string; hindi: string; holidayHeading: string; holiday: string; holidayNote: string; eventTitle: string; eventWhen: string; background: Hex; ink: Hex; accent: Hex; expired?: boolean };
export type WidgetPalette = { background: string; ink: string; primary: string };
export function widgetData(events: CalendarEvent[], at = new Date(), palette: WidgetPalette = { background: "#F4F9FA", ink: "#233642", primary: "#347B9B" }, hijriOffset = -1): WidgetData {
  const hex=(value:string,fallback:Hex):Hex=>/^#[0-9a-f]{6}$/i.test(value)?value as Hex:fallback;
  const key = toDateKey(at), holidays = holidays2026.filter(h => h.date === key);
  const nextHoliday = [...holidays2026].sort((a,b) => a.date.localeCompare(b.date)).find(h => h.date > key);
  const holiday = holidays[0] ?? nextHoliday;
  let nextEvent: { title: string; date: string; time?: string } | undefined;
  const cursor = fromDateKey(key);
  for (let n=0; n<31 && !nextEvent; n++, cursor.setDate(cursor.getDate()+1)) {
    const date = toDateKey(cursor);
    const candidates = events.filter(e => occursOn(e, date)).map(e => { let time: string | undefined; try { time=normaliseTime(e.time); } catch {} return { title: e.title, date, time }; }).filter(e => !e.time || date > key || e.time >= `${String(at.getHours()).padStart(2,"0")}:${String(at.getMinutes()).padStart(2,"0")}`).sort((a,b) => (a.time ?? "").localeCompare(b.time ?? ""));
    nextEvent=candidates[0];
  }
  // Today's three calendars, short enough for one widget line each.
  const h = hijriDate(at, hijriOffset), p = kashmiriPanchang(at);
  const dates = { hijri: `${h.day} ${h.monthName} ${h.year} AH`, pandit: `${p.adhik ? "Adhik " : ""}${p.kashmiriMonth} ${p.paksha} ${p.tithiName} · Saptarishi ${p.saptarishiYear}`, hindi: hindiLabel(p) };
  return { ...dates, dateLabel: at.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }), holidayHeading: holidays.length ? "Today’s holiday" : "Next listed holiday", holiday: holiday ? holiday.name + (holidays.length>1 ? ` +${holidays.length-1}` : "") : "Schedule unavailable beyond 2026", holidayNote: holiday ? `${holiday.date.slice(8)} ${fromDateKey(holiday.date).toLocaleDateString("en-IN",{month:"short"})} · ${holiday.scope}${holiday.subjectToMoon ? " · Tentative" : ""}` : "Open app for details", eventTitle: nextEvent?.title.slice(0,100) ?? "No plans in the next 31 days", eventWhen: nextEvent ? `${nextEvent.date===key ? "Today" : fromDateKey(nextEvent.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} · ${nextEvent.time ?? "All day"}` : "Tap + to add an event", background: hex(palette.background,"#F4F9FA"), ink: hex(palette.ink,"#233642"), accent: hex(palette.primary,"#347B9B") };
}
export function widgetTimeline(events: CalendarEvent[], now = new Date(), palette?: WidgetPalette, hijriOffset = -1) {
  const times = new Set([now.getTime()]);
  for (let day=0; day<14; day++) {
    const d = new Date(now.getFullYear(),now.getMonth(),now.getDate()+day);
    if (d > now) times.add(d.getTime());
    const key=toDateKey(d);
    for (const event of events) if (occursOn(event,key) && event.time) { try { const t=normaliseTime(event.time); if(t){const [h,m]=t.split(":").map(Number);const at=new Date(d);at.setHours(h,m+1,0,0);if(at>now)times.add(at.getTime());} } catch {} }
  }
  const entries=[...times].sort((a,b)=>a-b).slice(0,63).map(time=>({date:new Date(time),props:widgetData(events,new Date(time),palette,hijriOffset)}));
  const expires=entries.length===63 ? new Date(entries[62].date.getTime()+60_000) : new Date(now.getFullYear(),now.getMonth(),now.getDate()+14);
  entries.push({date:expires,props:{...widgetData([],expires,palette,hijriOffset),expired:true,eventTitle:"Open J&K Calendar to refresh",eventWhen:"Widget timeline needs updating"}});
  return entries;
}
