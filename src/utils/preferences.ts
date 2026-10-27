import "expo-sqlite/localStorage/install";
import { useSyncExternalStore } from "react";
import type { LabelLanguage } from "./regional-labels";
import { normaliseSeasonalMotion, type SeasonalMotionLevel } from "./season-effects";
import type { HolidayReminderScope } from "./holiday-reminders";
export type LunarDates = "off" | "hijri" | "kashmiri" | "hindi" | "both" | "hijri-hindi";
export type Appearance = "system" | "light" | "dark";

export type Preferences = { textSize: "standard" | "large" | "larger"; highContrast: boolean; reduceMotion: boolean; reduceTransparency: boolean; autoCheckOrders: boolean; autoSeasonColours: boolean; seasonalMotion: SeasonalMotionLevel; labelLanguage: LabelLanguage; holidayReminders: HolidayReminderScope; holidayReminderHour: number; lunarDates: LunarDates; hijriOffset: number; appearance: Appearance; dailyDates: boolean };
export const defaultPreferences: Preferences = { textSize: "standard", highContrast: false, reduceMotion: false, reduceTransparency: false, autoCheckOrders: true, autoSeasonColours: true, seasonalMotion: "lively", labelLanguage: "english", holidayReminders: "general", holidayReminderHour: 19, lunarDates: "both", hijriOffset: -1, appearance: "system", dailyDates: false };
const key = "jk-calendar-preferences-v1", listeners = new Set<() => void>();
function read(): Preferences { try { const p = JSON.parse(localStorage.getItem(key) ?? "{}"); return { textSize: ["standard", "large", "larger"].includes(p.textSize) ? p.textSize : "standard", highContrast: p.highContrast === true, reduceMotion: p.reduceMotion === true, reduceTransparency: p.reduceTransparency === true, autoCheckOrders: p.autoCheckOrders !== false, autoSeasonColours: p.autoSeasonColours !== false, seasonalMotion: normaliseSeasonalMotion(p.seasonalMotion,p.seasonalAnimation), labelLanguage: p.labelLanguage==="kashmiri"||p.labelLanguage==="dogri"?p.labelLanguage:"english", holidayReminders: p.holidayReminders==="off"||p.holidayReminders==="all"?p.holidayReminders:"general", holidayReminderHour: [18,19,20,21].includes(p.holidayReminderHour)?p.holidayReminderHour:19, lunarDates: ["off","hijri","kashmiri","hindi","both","hijri-hindi"].includes(p.lunarDates)?p.lunarDates:"both", hijriOffset: [-2,-1,0,1].includes(p.hijriOffset)?p.hijriOffset:-1, appearance: p.appearance==="light"||p.appearance==="dark"?p.appearance:"system", dailyDates: p.dailyDates===true }; } catch { return { ...defaultPreferences }; } }
let cache = read();
export function getPreferences() { return cache; }
export function setPreference<K extends keyof Preferences>(name: K, value: Preferences[K]) { const next = { ...cache, [name]: value }; localStorage.setItem(key, JSON.stringify(next)); cache = next; listeners.forEach(fn => fn()); }
export function usePreferences() { return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => cache, () => cache); }
export function textMultiplier(size: Preferences["textSize"]) { return size === "large" ? 1.15 : size === "larger" ? 1.3 : 1; }
