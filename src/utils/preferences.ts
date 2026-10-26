import "expo-sqlite/localStorage/install";
import { useSyncExternalStore } from "react";
import type { LabelLanguage } from "./regional-labels";
import { normaliseSeasonalMotion, type SeasonalMotionLevel } from "./season-effects";

export type Preferences = { textSize: "standard" | "large" | "larger"; highContrast: boolean; reduceMotion: boolean; reduceTransparency: boolean; autoCheckOrders: boolean; autoSeasonColours: boolean; seasonalMotion: SeasonalMotionLevel; labelLanguage: LabelLanguage };
export const defaultPreferences: Preferences = { textSize: "standard", highContrast: false, reduceMotion: false, reduceTransparency: false, autoCheckOrders: true, autoSeasonColours: true, seasonalMotion: "lively", labelLanguage: "english" };
const key = "jk-calendar-preferences-v1", listeners = new Set<() => void>();
function read(): Preferences { try { const p = JSON.parse(localStorage.getItem(key) ?? "{}"); return { textSize: ["standard", "large", "larger"].includes(p.textSize) ? p.textSize : "standard", highContrast: p.highContrast === true, reduceMotion: p.reduceMotion === true, reduceTransparency: p.reduceTransparency === true, autoCheckOrders: p.autoCheckOrders !== false, autoSeasonColours: p.autoSeasonColours !== false, seasonalMotion: normaliseSeasonalMotion(p.seasonalMotion,p.seasonalAnimation), labelLanguage: p.labelLanguage==="kashmiri"||p.labelLanguage==="dogri"?p.labelLanguage:"english" }; } catch { return { ...defaultPreferences }; } }
let cache = read();
export function getPreferences() { return cache; }
export function setPreference<K extends keyof Preferences>(name: K, value: Preferences[K]) { const next = { ...cache, [name]: value }; localStorage.setItem(key, JSON.stringify(next)); cache = next; listeners.forEach(fn => fn()); }
export function usePreferences() { return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => cache, () => cache); }
export function textMultiplier(size: Preferences["textSize"]) { return size === "large" ? 1.15 : size === "larger" ? 1.3 : 1; }
