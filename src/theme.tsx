import "expo-sqlite/localStorage/install";

import { createContext, type PropsWithChildren, use, useMemo, useState, useSyncExternalStore } from "react";
import { useColorScheme } from "react-native";
import { setPreference, textMultiplier, usePreferences } from "@/utils/preferences";
import { useSystemAccessibility } from "@/utils/system-accessibility";
import { seasonOn, type Season, type SeasonId } from "@/utils/seasons";
import { fromDateKey, toDateKey } from "@/utils/dates";

export type ManualThemeName = "kashmir-bloom" | "dal-lake" | "saffron-dawn" | "glacier-mint" | "midnight-indigo";
export type ThemeName = ManualThemeName | SeasonId;
export type GlassLevel = "subtle" | "standard" | "strong";
export const todayDateColors = { fill: "#D9F4EC", ink: "#145B50", ring: "#1C8170" } as const;
export const glassSettings = {
  subtle: { alpha: "E6", shine: 0.12, glow: 0.25, blur: 4 },
  standard: { alpha: "99", shine: 0.45, glow: 0.75, blur: 12 },
  strong: { alpha: "66", shine: 0.7, glow: 1, blur: 18 },
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  bubble: string;
  weekend: string;
  today: string;
  todayInk: string;
  holiday: string;
  line: string;
  danger: string;
  onPrimary: string;
};

export function holidayDateAppearance(colors: ThemeColors) {
  return {
    backgroundColor: colors.surface,
    borderColor: `${colors.holiday}99`,
    experimental_backgroundImage: `radial-gradient(ellipse at center, ${colors.surface} 0%, ${colors.surface} 22%, ${colors.holiday}66 100%)`,
  };
}

export const themes: Record<ManualThemeName, { label: string; colors: ThemeColors }> = {
  "kashmir-bloom": {
    label: "Kashmir Bloom",
    colors: {
      background: "#FBF7F9",
      surface: "#FFFFFF",
      ink: "#352B38",
      muted: "#8F818D",
      primary: "#81556F",
      primaryDark: "#633C54",
      primarySoft: "#F3E4EC",
      bubble: "#F8EDF2",
      weekend: "#F2E9DC",
      today: "#DFEEE3",
      todayInk: "#397352",
      holiday: "#D99758",
      line: "#EEE4EA",
      danger: "#B65454",
      onPrimary: "#FFFFFF",
    },
  },
  "dal-lake": {
    label: "Dal Lake",
    colors: {
      background: "#F4F9FA",
      surface: "#FFFFFF",
      ink: "#233642",
      muted: "#788C96",
      primary: "#347B9B",
      primaryDark: "#205B76",
      primarySoft: "#DFEFF5",
      bubble: "#EAF4F7",
      weekend: "#FFF0DF",
      today: "#DDF2E9",
      todayInk: "#2F7768",
      holiday: "#E2945C",
      line: "#DFEBEF",
      danger: "#B65454",
      onPrimary: "#FFFFFF",
    },
  },
  "saffron-dawn": {
    label: "Saffron Dawn",
    colors: {
      background: "#FFF9F2",
      surface: "#FFFFFF",
      ink: "#402F27",
      muted: "#917E72",
      primary: "#C66B2B",
      primaryDark: "#91451F",
      primarySoft: "#FBE6D4",
      bubble: "#FFF0E0",
      weekend: "#F8E8BA",
      today: "#DDEBDD",
      todayInk: "#356859",
      holiday: "#B64C3B",
      line: "#F0E3D7",
      danger: "#B64C3B",
      onPrimary: "#FFFFFF",
    },
  },
  "glacier-mint": {
    label: "Glacier Mint",
    colors: { background: "#EAF6F3", surface: "#FBFFFE", ink: "#163A3B", muted: "#5F7979", primary: "#188B86", primaryDark: "#0F6664", primarySoft: "#CFEBE5", bubble: "#E0F2EC", weekend: "#FFF0DF", today: "#D4EEDF", todayInk: "#286C50", holiday: "#C96850", line: "#AFD3C7", danger: "#A74545", onPrimary: "#FFFFFF" },
  },
  "midnight-indigo": {
    label: "Midnight Indigo",
    colors: { background: "#10182B", surface: "#1A2540", ink: "#EEF2FF", muted: "#A8B6CF", primary: "#9295EF", primaryDark: "#BFC7FF", primarySoft: "#343C65", bubble: "#344368", weekend: "#443E53", today: "#29494C", todayInk: "#ACEDDE", holiday: "#E7B88D", line: "#526484", danger: "#F2A3A3", onPrimary: "#111A30" },
  },
};

export const seasonalThemes: Record<SeasonId, {label:string;colors:ThemeColors}> = {
  sonth: {label:"Almond pink",colors:{background:"#FCF4F6",surface:"#FFFCFD",ink:"#4B2D3A",muted:"#806474",primary:"#A24F71",primaryDark:"#76334F",primarySoft:"#F6DFE7",bubble:"#FBEAF0",weekend:"#F9E8D9",today:"#DDF2E9",todayInk:"#2F7768",holiday:"#AD5D36",line:"#EBD5DF",danger:"#AC4141",onPrimary:"#FFFFFF"}},
  grishm: {label:"Lake blue",colors:{...themes["dal-lake"].colors,background:"#EFF7FB",primary:"#347B9B",muted:"#617C8B",holiday:"#AD5D36"}},
  wahrath: {label:"Mist green",colors:{background:"#F0F6F2",surface:"#FCFFFD",ink:"#293F36",muted:"#62796B",primary:"#4C7C6B",primaryDark:"#315A4B",primarySoft:"#DAEAE0",bubble:"#E6F1EA",weekend:"#F8EAD9",today:"#DAEDE6",todayInk:"#2C6B57",holiday:"#AD5D36",line:"#CFE0D5",danger:"#A44747",onPrimary:"#FFFFFF"}},
  harud: {label:"Chinar copper",colors:{background:"#FBF4EB",surface:"#FFFCF7",ink:"#4C3228",muted:"#846A58",primary:"#A8532F",primaryDark:"#77381F",primarySoft:"#F3DFC9",bubble:"#FBEDE0",weekend:"#F7E7CD",today:"#DBEBDF",todayInk:"#376B53",holiday:"#A9502D",line:"#E9D6C2",danger:"#A84138",onPrimary:"#FFFFFF"}},
  wand: {label:"Walnut cream",colors:{background:"#F7F2EA",surface:"#FFFCF7",ink:"#43372D",muted:"#7F705F",primary:"#795E46",primaryDark:"#584330",primarySoft:"#EAE0D1",bubble:"#F3EBDD",weekend:"#F4E4CC",today:"#DFEBDD",todayInk:"#3A6952",holiday:"#A95C34",line:"#DDD0BD",danger:"#A5463D",onPrimary:"#FFFFFF"}},
  shishur: {label:"Snow blue",colors:{background:"#EFF6FB",surface:"#FCFEFF",ink:"#2B4053",muted:"#627A8D",primary:"#477B9C",primaryDark:"#2C5674",primarySoft:"#DDECF6",bubble:"#E9F3FA",weekend:"#F8EBDC",today:"#DBEFE9",todayInk:"#306E60",holiday:"#AD5D36",line:"#CFDFEA",danger:"#A94A4A",onPrimary:"#FFFFFF"}},
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radii = { sm: 8, md: 12, lg: 18, card: 28, bubble: 22, full: 999 } as const;
export const shadows = {
  card: "0 14px 34px rgba(45, 49, 66, 0.07)",
  bubble: "0 6px 14px rgba(45, 49, 66, 0.09)",
  raisedBubble: "0 12px 24px rgba(45, 49, 66, 0.18)",
} as const;
export const motion = { press: 120, state: 180, surface: 250 } as const;

const storageKey = "jk-calendar-theme-v1";
const listeners = new Set<() => void>();

function readTheme(): ManualThemeName {
  const stored = localStorage.getItem(storageKey);
  return stored && stored in themes ? (stored as ManualThemeName) : "dal-lake";
}

let themeCache = readTheme();
const glassStorageKey = "jk-calendar-glass-v1";
function readGlass(): GlassLevel { const value = localStorage.getItem(glassStorageKey); return value === "subtle" || value === "strong" ? value : "standard"; }
let glassCache = readGlass();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setTheme(themeName: ManualThemeName) {
  themeCache = themeName;
  localStorage.setItem(storageKey, themeName);
  setPreference("autoSeasonColours",false);
  listeners.forEach((listener) => listener());
}
function setGlassLevel(level: GlassLevel) { localStorage.setItem(glassStorageKey, level); glassCache = level; listeners.forEach(listener => listener()); }

type ThemeContextValue = {
  themeName: ThemeName;
  colors: ThemeColors;
  setThemeName: (themeName: ManualThemeName) => void;
  season: Season;
  setSeasonDateKey: (dateKey: string) => void;
  glassLevel: GlassLevel;
  setGlassLevel: (level: GlassLevel) => void;
  textScale: number;
  reduceMotion: boolean;
  reduceTransparency: boolean;
  highContrast: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function CalendarThemeProvider({ children }: PropsWithChildren) {
  const manualThemeName = useSyncExternalStore(subscribe, () => themeCache, () => themeCache);
  const glassLevel = useSyncExternalStore(subscribe, () => glassCache, () => glassCache);
  const preferences = usePreferences(), system = useSystemAccessibility();
  const [seasonDateKey,setSeasonDateKey] = useState(()=>toDateKey(new Date()));
  const season = seasonOn(fromDateKey(seasonDateKey));
  const systemScheme = useColorScheme();
  // Dark mode uses the Midnight Indigo palette, which every screen and the season effects already support.
  const dark = preferences.appearance === "dark" || (preferences.appearance === "system" && systemScheme === "dark");
  const themeName: ThemeName = dark ? "midnight-indigo" : preferences.autoSeasonColours ? season.id : manualThemeName;
  const reduceMotion = preferences.reduceMotion || system.reduceMotion;
  const reduceTransparency = preferences.reduceTransparency || system.reduceTransparency;
  const highContrast = preferences.highContrast || system.highContrast;
  const textScale = textMultiplier(preferences.textSize);
  const value = useMemo(
    () => {
      const base = themeName in seasonalThemes ? seasonalThemes[themeName as SeasonId].colors : themes[themeName as ManualThemeName].colors;
      const contrast = themeName === "midnight-indigo" ? { ink: "#FFFFFF", muted: "#DBE7FA", line: "#B5CBE5", primary: "#BEDDFF", primaryDark: "#DAEBFF", onPrimary: "#0B1525", holiday: "#FFD9A0" } : { ink: "#102D40", muted: "#344F60", line: "#415E70", primary: "#174C66", primaryDark: "#123D53", onPrimary: "#FFFFFF", holiday: "#843A14" };
      return { themeName, season, setSeasonDateKey, colors: highContrast ? { ...base, ...contrast } : base, setThemeName: setTheme, glassLevel: reduceTransparency ? "subtle" as const : glassLevel, setGlassLevel, textScale, reduceMotion, reduceTransparency, highContrast };
    },
    [themeName, season, glassLevel, textScale, reduceMotion, reduceTransparency, highContrast],
  );
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useCalendarTheme() {
  const value = use(ThemeContext);
  if (!value) throw new Error("useCalendarTheme must be used inside CalendarThemeProvider");
  return value;
}
