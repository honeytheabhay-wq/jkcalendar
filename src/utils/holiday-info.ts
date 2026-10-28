import { holidays2026, type Holiday } from "../data/holidays-2026";
import { toDateKey } from "./dates";

// Years covered by the current list (bundled or online), e.g. 2027 once its schedule is published.
export function holidayYearLoaded(year: number) { return holidays2026.some(holiday => holiday.date.startsWith(`${year}-`)); }
export function holidaySource(holiday: Holiday) {
  if (holiday.source) return { ...holiday.source, amended: true };
  if (holiday.name === "Mela Pat") return { order: "1528-JK(GAD) of 2026", date: "16 September 2026", url: "https://jkgad.nic.in/common/showOrder.aspx?actCode=O45600", note: "Amended to 17–18 September 2026.", amended: true };
  if (holiday.name === "Urs Sheikh Noor-ud-Din Sahib") return { order: "1614-JK(GAD) of 2026", date: "7 October 2026", url: "https://jkgad.nic.in/common/showOrder.aspx?actCode=O45638", note: "Amended to 9 October 2026.", amended: true };
  return { order: "1894-JK(GAD) of 2025", date: "12 December 2025", url: "https://jkgad.nic.in/common/showOrder.aspx?actCode=O44738", note: "Official J&K holiday schedule for 2026.", amended: false };
}

export function nextHoliday(today: Date) {
  const key = toDateKey(today);
  const holiday = [...holidays2026].sort((a, b) => a.date.localeCompare(b.date)).find((item) => item.date >= key);
  if (!holiday) return null;
  const [year, month, day] = holiday.date.split("-").map(Number);
  const remaining = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86_400_000);
  // Every holiday on that date, so the countdown can show "Mahanavami & Dussehra".
  const sameDay = holidays2026.filter((item) => item.date === holiday.date);
  return { holiday, remaining, names: [...new Set(sameDay.map((item) => item.name))].join(" & ") };
}
