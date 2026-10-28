import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text as Span, useWindowDimensions, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { router } from "expo-router";
import Animated, { cubicBezier, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { holidays2026, type Holiday } from "@/data/holidays-2026";
import { glassSettings, holidayDateAppearance, todayDateColors, radii, type ThemeColors, type GlassLevel, useLaggedTheme } from "@/theme";
import { HolidayDetails } from "./holiday-details";
import { holidayYearLoaded } from "@/utils/holiday-info";
import { holidayListVersion } from "@/utils/holiday-store";
import { useHoverDetails } from "@/utils/hover-details";
import { occursOn } from "@/utils/event-model";
import { useToday } from "@/utils/today";
import { monthGrid, toDateKey } from "@/utils/dates";
import type { CalendarEvent } from "@/utils/events";
import { usePreferences } from "@/utils/preferences";
import { regionalDateLabel } from "@/utils/regional-labels";
import { hijriDate, hijriLabel, hijriShortLabel, hindiLabel, hindiShort, kashmiriPanchang, panchangLabel, panchangShort } from "@/utils/regional-calendars";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const noHolidays: string[] = [];
// Rebuilt when the online holiday list changes.
let holidaysByDate = new Map<string, string[]>(), holidaysByDateVersion = -1;
function holidayNamesOn(dateKey: string) {
  if (holidaysByDateVersion !== holidayListVersion()) {
    holidaysByDate = new Map();
    holidays2026.forEach((holiday) => holidaysByDate.set(holiday.date, [...(holidaysByDate.get(holiday.date) ?? []), holiday.name]));
    holidaysByDateVersion = holidayListVersion();
  }
  return holidaysByDate.get(dateKey);
}

// Date strings are cached: toLocaleDateString is slow on Hermes and every theme change re-renders 126 bubbles.
const spokenDates = new Map<string, string>();
function spokenDate(date: Date) {
  const key = toDateKey(date);
  let text = spokenDates.get(key);
  if (!text) { text = date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); spokenDates.set(key, text); }
  return text;
}
const regionalLabels = new Map<string, string>();
function regionalLabelFor(date: Date, labelLanguage: Parameters<typeof regionalDateLabel>[1], hijriOffset: number) {
  const key = `${toDateKey(date)}|${labelLanguage}|${hijriOffset}`;
  let text = regionalLabels.get(key);
  if (!text) { text = [regionalDateLabel(date, labelLanguage), hijriLabel(hijriDate(date, hijriOffset)), panchangLabel(kashmiriPanchang(date)), hindiLabel(kashmiriPanchang(date))].filter(Boolean).join(". "); regionalLabels.set(key, text); }
  return text;
}

type Props = {
  viewMonth: Date;
  // False for the neighbouring months kept mounted off screen.
  active?: boolean;
  selectedDate: Date;
  events: CalendarEvent[];
  width: number;
  onSelect: (date: Date) => void;
  detailsDate: Date | null;
  onDeleteEvent: (id: string, title: string) => void;
};

type GridStyles = ReturnType<typeof createStyles>;
type DayBubbleProps = {
  date: Date;
  index: number;
  cellSize: number;
  selected: boolean;
  today: boolean;
  muted: boolean;
  weekend: boolean;
  hasEvent: boolean;
  holidayNames: string[];
  regionalLabel: string;
  lunarLeft: string;
  lunarRight: string;
  colors: ThemeColors;
  styles: GridStyles;
  glassLevel: GlassLevel;
  reducedMotion: boolean;
  reduceTransparency: boolean;
  highContrast: boolean;
  onSelect: (date: Date) => void;
  onPreview: (date: Date, index: number, pinned: boolean) => void;
  onPreviewEnd: () => void;
};

// Memoised: a tap or month change only re-renders the bubbles whose props changed.
const DayBubble = memo(function DayBubble({
  date,
  index,
  cellSize,
  selected,
  today,
  muted,
  weekend,
  hasEvent,
  holidayNames,
  regionalLabel,
  lunarLeft,
  lunarRight,
  colors,
  styles,
  glassLevel,
  reducedMotion,
  reduceTransparency,
  highContrast,
  onSelect,
  onPreview,
  onPreviewEnd,
}: DayBubbleProps) {
  const glass = glassSettings[glassLevel];
  // Press and selection run on the UI thread, so the bubble responds even while React is busy.
  const press = useSharedValue(0);
  const lift = useSharedValue(selected ? 1 : 0);
  useEffect(() => { lift.value = reducedMotion ? (selected ? 1 : 0) : withSpring(selected ? 1 : 0, { damping: 14, stiffness: 220 }); }, [selected, reducedMotion]);
  const motionStyle = useAnimatedStyle(() => reducedMotion ? { opacity: muted ? 0.5 : 1 - press.value * 0.16 } : {
    opacity: (muted ? 0.5 : 1) - press.value * 0.16,
    transform: [{ translateY: -3 * lift.value }, { scale: 1 + 0.025 * lift.value - 0.07 * press.value }],
  });
  const holidayText = (holidayNames.length ? `. Holiday: ${holidayNames.join(", ")}` : "")+(hasEvent?". Personal event":"");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${spokenDate(date)}${today ? ". Today" : ""}${holidayText}${regionalLabel?`. ${regionalLabel}`:""}`}
      accessibilityState={{ selected }}
      accessibilityHint="Opens this day’s holiday and personal event details"
      hitSlop={2}
      pressRetentionOffset={10}
      onHoverIn={() => onPreview(date, index, false)}
      onHoverOut={onPreviewEnd}
      onFocus={() => onPreview(date, index, false)}
      onBlur={onPreviewEnd}
      onPressIn={() => { press.value = withTiming(1, { duration: 80 }); }}
      onPressOut={() => { press.value = withSpring(0, { damping: 12, stiffness: 260 }); }}
      onPress={() => { onSelect(date); onPreview(date, index, true); }}
    >
        <Animated.View
          style={[
            styles.dayBubble,
            { backgroundColor: `${colors.bubble}${reduceTransparency ? "FF" : "E6"}`, borderColor: highContrast ? colors.ink : `${colors.primary}40` },
            { width: cellSize, height: cellSize, borderRadius: Math.min(14, cellSize * 0.28) },
            weekend && styles.weekendBubble,
            muted && styles.mutedBubble,
            today && styles.todayBubble,
            selected && styles.selectedBubble,
            reduceTransparency && {backgroundColor:selected?colors.primary:today?colors.today:weekend?colors.weekend:colors.bubble},
            holidayNames.length > 0 && (weekend ? styles.weekendHolidayBubble : styles.holidayBubble),
            holidayNames.length > 0 && selected && { borderColor: colors.primaryDark, borderWidth: 2.5 },
            today && styles.todayOutline,
            today && !holidayNames.length && { backgroundColor: todayDateColors.fill },
            motionStyle,
          ]}
        >
          <View pointerEvents="none" style={[styles.gloss, { opacity: reduceTransparency ? 0 : glass.shine }]} />
          <View pointerEvents="none" style={[styles.glassShine, { opacity: reduceTransparency ? 0 : glass.shine }]} />
          {today ? <Animated.View pointerEvents="none" style={[styles.todayHalo, { borderRadius: Math.min(11, cellSize * 0.22) }, !reducedMotion && { animationName: { from: { opacity: 0.25 }, "50%": { opacity: 1 }, to: { opacity: 0.25 } }, animationDuration: 1200, animationIterationCount: 2, animationTimingFunction: cubicBezier(0.77, 0, 0.175, 1) }]} /> : null}
          <Text style={[styles.dayNumber, (lunarLeft || lunarRight) && styles.dayNumberRaised, muted && styles.mutedNumber, selected && styles.selectedNumber, holidayNames.length > 0 && styles.holidayNumber, today && !holidayNames.length && styles.todayNumber]}>
            {date.getDate()}
          </Text>
          {lunarLeft || lunarRight ? <View pointerEvents="none" style={[styles.lunarRow, !(lunarLeft && lunarRight) && styles.lunarRowSingle]}>
            {lunarLeft ? <Text allowFontScaling={false} numberOfLines={1} style={[styles.lunarText, selected && !holidayNames.length && styles.selectedLunar]}>{lunarLeft}</Text> : null}
            {lunarRight ? <Text allowFontScaling={false} numberOfLines={1} style={[styles.lunarText, selected && !holidayNames.length && styles.selectedLunar]}>{lunarRight}</Text> : null}
          </View> : null}
          <View style={[styles.markers, (lunarLeft || lunarRight) && styles.markersTop]}>
            {hasEvent ? <View style={[styles.marker, styles.eventDot, selected && styles.selectedDot, holidayNames.length > 0 && { backgroundColor: colors.ink }, today && !holidayNames.length && { backgroundColor: todayDateColors.ink }]} /> : null}
          </View>
        </Animated.View>
    </Pressable>
  );
});

// Memoised: the neighbouring month pages skip re-rendering (and recomputing their lunar labels) on unrelated updates.
export const CalendarGrid = memo(function CalendarGrid({ viewMonth, active = true, selectedDate, events, width, onSelect, detailsDate, onDeleteEvent }: Props) {
  const {labelLanguage, lunarDates, hijriOffset}=usePreferences();
  const showHijri = lunarDates === "hijri" || lunarDates === "both" || lunarDates === "hijri-hindi";
  // The right-hand label is the tithi, in Kashmiri Pandit (S7) or Hindi (शु7) form.
  const tithiShort = lunarDates === "kashmiri" || lunarDates === "both" ? panchangShort : lunarDates === "hindi" || lunarDates === "hijri-hindi" ? hindiShort : null;
  // The visible month takes a theme change at once; the off-screen neighbours follow a second later.
  const { colors, glassLevel, textScale, reduceTransparency, reduceMotion, highContrast } = useLaggedTheme(active);
  const reducedMotion = useReducedMotion() || reduceMotion;
  const { fontScale } = useWindowDimensions();
  const weekHeight=Math.max(36,Math.ceil(24*textScale*fontScale));
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [popup, setPopup] = useState<{ date: Date; index: number; pinned: boolean } | null>(null);
  const [detail, setDetail] = useState<Holiday | null>(null);
  const [popupHeight, setPopupHeight] = useState(200);
  const hover = useHoverDetails(() => setPopup(current => current?.pinned ? current : null));
  useEffect(() => { hover.keepOpen(); setPopup(null); }, [viewMonth.getFullYear(), viewMonth.getMonth(), active]);
  useEffect(() => {
    if (!detailsDate) return;
    const index=monthGrid(new Date(detailsDate.getFullYear(),detailsDate.getMonth(),1,12)).findIndex(date=>toDateKey(date)===toDateKey(detailsDate));
    hover.keepOpen();
    setPopup({date:detailsDate,index,pinned:true});
  }, [detailsDate]);
  const dates = useMemo(() => monthGrid(viewMonth), [viewMonth.getFullYear(), viewMonth.getMonth()]);
  const eventDates = useMemo(() => new Set(dates.map(toDateKey).filter(key => events.some(event => occursOn(event, key)))), [dates, events]);
  const selectedKey = toDateKey(selectedDate);
  const todayKey = toDateKey(useToday());
  // Stable handlers keep the memoised bubbles from re-rendering on every parent render.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectDate = useCallback((date: Date) => onSelectRef.current(date), []);
  const preview = useCallback((date: Date, index: number, pinned: boolean) => { hover.keepOpen(); setPopup((current) => !pinned && current?.pinned ? current : { date, index, pinned }); }, [hover.keepOpen]);
  const gap = width < 380 ? 4 : 6;
  const cellSize = Math.floor((width - gap * 6) / 7);
  const popupWidth = Math.min(width, 280);
  const popupLeft = popup ? Math.max(0, Math.min(width - popupWidth, (popup.index % 7) * (cellSize + gap) + cellSize / 2 - popupWidth / 2)) : 0;
  const popupRow = popup ? Math.floor(popup.index / 7) : 0;
  const popupRowTop = weekHeight + 18 + popupRow * (cellSize + gap);
  const calendarHeight=weekHeight+18+cellSize*6+gap*5;
  // The pop-up may use the whole calendar height (its header alone now holds three calendars). It sits below the
  // tapped row if it fits, else above it, else as low as it fits while covering the row as little as possible.
  const popupMaxHeight=calendarHeight-8;
  const shown=Math.min(popupHeight,popupMaxHeight), belowTop=popupRowTop+cellSize+8, aboveTop=popupRowTop-shown-8;
  const popupTop=belowTop+shown<=calendarHeight?belowTop:aboveTop>=0?aboveTop:Math.max(0,calendarHeight-shown);
  const popupHolidays = popup ? holidays2026.filter((holiday) => holiday.date === toDateKey(popup.date)) : [];
  const popupKey=popup ? toDateKey(popup.date) : "";
  const popupEvents=events.filter(event=>occursOn(event,popupKey)).sort((a,b)=>(a.time??"").localeCompare(b.time??""));

  return (
    <View style={[styles.calendar, { width }]}> 
      <View style={[styles.weekHeader, { width, gap }]}> 
        {weekDays.map((day, index) => (
          <View key={`${day}-${index}`} style={[styles.weekDay, { width: cellSize, height: weekHeight, alignItems:"center", justifyContent:"center" }, index > 4 && styles.weekendLabel]}><Text style={{color:colors.onPrimary,fontSize:11,fontWeight:"800"}}>{day}</Text></View>
        ))}
      </View>
      <View style={[styles.dateGrid, { width, gap }]}> 
        {dates.map((date, index) => {
          const dateKey = toDateKey(date);
          return (
            // Keyed by grid position, so a month change updates the 42 bubbles instead of rebuilding them.
            <DayBubble
              key={index}
              date={date}
              index={index}
              cellSize={cellSize}
              selected={dateKey === selectedKey}
              today={dateKey === todayKey}
              muted={date.getMonth() !== viewMonth.getMonth()}
              weekend={date.getDay() === 0 || date.getDay() === 6}
              hasEvent={eventDates.has(dateKey)}
              holidayNames={holidayNamesOn(dateKey) ?? noHolidays}
              regionalLabel={regionalLabelFor(date, labelLanguage, hijriOffset)}
              lunarLeft={showHijri ? hijriShortLabel(hijriDate(date,hijriOffset)) : ""}
              lunarRight={tithiShort ? tithiShort(kashmiriPanchang(date)) : ""}
              colors={colors}
              styles={styles}
              glassLevel={glassLevel}
              reducedMotion={reducedMotion}
              reduceTransparency={reduceTransparency}
              highContrast={highContrast}
              onSelect={selectDate}
              onPreview={preview}
              onPreviewEnd={hover.leave}
            />
          );
        })}
      </View>
      {popup ? <Pressable onHoverIn={hover.keepOpen} onHoverOut={hover.leave} onFocus={hover.keepOpen} onBlur={hover.leave} onLayout={event => setPopupHeight(event.nativeEvent.layout.height)} accessibilityLiveRegion="polite" onAccessibilityEscape={() => setPopup(null)} style={[styles.popupCard, { width: popupWidth, left: popupLeft, top: popupTop, maxHeight:popupMaxHeight }]}>
        <View style={styles.popupHeader}><View style={{flex:1,gap:3}}><Text style={styles.popupDate}>{popup.date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text>{labelLanguage!=="english"?<Text selectable style={[styles.popupScope,{writingDirection:labelLanguage==="kashmiri"?"rtl":"ltr",textAlign:"left"}]}>{regionalDateLabel(popup.date,labelLanguage)}</Text>:null}<Text selectable style={styles.popupScope}>Hijri: {hijriLabel(hijriDate(popup.date,hijriOffset))} (approx.)</Text><Text selectable style={styles.popupScope}>Kashmiri Pandit: {panchangLabel(kashmiriPanchang(popup.date))}</Text><Text selectable style={styles.popupScope}>Hindi: {hindiLabel(kashmiriPanchang(popup.date))}</Text></View><Pressable accessibilityLabel="Close date details" onPress={() => { hover.keepOpen(); setPopup(null); }} style={styles.popupClose}><Text allowFontScaling={false} style={styles.popupCloseText}>×</Text></Pressable></View>
        <ScrollView style={styles.popupScroll} contentContainerStyle={{gap:8}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {popupHolidays.length ? popupHolidays.map((holiday) => <Pressable accessibilityRole="button" onPress={() => { setDetail(holiday); setPopup(null); }} key={`${holiday.date}-${holiday.name}`} style={styles.popupHoliday}><Text style={styles.popupName}>{holiday.name}</Text><Text style={styles.popupScope}>{holiday.scope} · {holiday.kind}{holiday.subjectToMoon ? " · Subject to moon sighting" : ""} · <Span style={styles.popupLink}>Details & source ↗</Span></Text></Pressable>) : <Text style={styles.popupScope}>{holidayYearLoaded(popup.date.getFullYear()) ? "No holiday listed for this date." : `Holiday schedule unavailable for ${popup.date.getFullYear()}.`}</Text>}
          {popupEvents.map(event=><View key={event.id} style={styles.popupEvent}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${event.title}`} onPress={()=>router.push({pathname:"/add-event",params:{id:event.id}})} style={styles.popupEventText}><Text style={styles.popupName}>{event.title}</Text><Text style={styles.popupScope}>{event.time||"All day"}{event.repeat&&event.repeat!=="none"?` · ${event.repeat}`:""}{event.reminderMinutes!=null?" · Reminder":""} · Edit</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${event.title}`} onPress={()=>onDeleteEvent(event.id,event.title)} style={styles.popupClose}><Text style={{color:colors.danger,fontSize:20}}>×</Text></Pressable>
          </View>)}
          <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:"/add-event",params:{date:popupKey}})} style={styles.popupAdd}><Text style={styles.popupAddText}>＋ Add an event</Text></Pressable>
        </ScrollView>
      </Pressable> : null}
      <HolidayDetails holiday={detail} onClose={() => setDetail(null)} />
    </View>
  );
});

// Box shadows are costly on Android: redrawn while the season layer animates above the grid and rebuilt for all 126
// bubbles on every theme change. Android bubbles go without; the gloss layers still give the glass look.
const lightShadows = Platform.OS === "android";
const weekendTint = { fill: "#F0913A2E", line: "#E07B2A66" };
// Holidays: an emerald rim fading to the centre. The centre is the plain surface, or the weekend's pale orange when the
// holiday falls on a Saturday or Sunday, so it reads as both.
const emerald = { light: "#1E9E6A", dark: "#4FD1A0" };
const isDarkSurface = (hex: string) => { const n = parseInt(hex.slice(1, 7), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128; };
export function holidayGlow(colors: ThemeColors, weekend = false) {
  const rim = isDarkSurface(colors.surface) ? emerald.dark : emerald.light, centre = weekend ? weekendTint.fill : colors.surface;
  return { backgroundColor: colors.surface, borderColor: rim, borderWidth: 1.5, experimental_backgroundImage: `radial-gradient(ellipse at center, ${centre} 0%, ${centre} 30%, ${rim}99 100%)` };
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    calendar: { gap: 16, position: "relative", zIndex: 5 },
    weekHeader: { flexDirection: "row" },
    dateGrid: { flexDirection: "row", flexWrap: "wrap", paddingTop: 2 },
    weekDay: { height: 32, color: colors.onPrimary, fontSize: 11, lineHeight: 30, fontWeight: "800", letterSpacing: 0.45, textAlign: "center", textAlignVertical: "center", backgroundColor: colors.primary, borderColor: colors.primaryDark, borderWidth: 1, borderRadius: radii.full, overflow: "hidden" },
    weekendLabel: { color: colors.onPrimary, backgroundColor: colors.holiday, borderColor: colors.holiday },
    dayBubble: { overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: `${colors.bubble}99`, borderColor: `${colors.surface}E6`, borderWidth: 1.5, borderCurve: "continuous", boxShadow: lightShadows ? undefined : `inset 0 1px 1px ${colors.surface}CC, inset 0 -1px 2px ${colors.primary}25, 0 1px 0 ${colors.primary}35, 0 8px 16px ${colors.primary}25` },
    gloss: { position: "absolute", width: "94%", height: "42%", top: 1, left: "3%", borderRadius: 10, backgroundColor: `${colors.surface}66` },
    glassShine: { position: "absolute", width: "23%", height: "150%", top: "-25%", left: "12%", transform: [{ rotate: "28deg" }], backgroundColor: `${colors.surface}28` },
    // Saturday and Sunday: the same light orange in every colour theme.
    weekendBubble: { backgroundColor: weekendTint.fill, borderColor: weekendTint.line },
    mutedBubble: { backgroundColor: colors.background, borderColor: colors.line, borderWidth: 1, boxShadow: "none" },
    todayBubble: { backgroundColor: colors.today, borderColor: colors.todayInk, borderWidth: 2, boxShadow: lightShadows ? undefined : `0 0 0 3px ${colors.surface}, 0 0 0 5px ${colors.today}` },
    selectedBubble: { backgroundColor: `${colors.primary}E6`, borderColor: `${colors.surface}CC`, borderWidth: 1.5, boxShadow: lightShadows ? `0 4px 6px ${colors.primary}40` : `inset 0 1px 2px ${colors.surface}88, 0 2px 0 ${colors.primary}66, 0 10px 18px ${colors.primary}35` },
    dayNumber: { color: colors.ink, fontSize: 17, marginBottom: 3, fontWeight: "700", fontVariant: ["tabular-nums"] },
    dayNumberRaised: { fontSize: 16, marginBottom: 11 },
    lunarRow: { position: "absolute", bottom: 3, left: 3, right: 3, flexDirection: "row", justifyContent: "space-between" },
    lunarRowSingle: { justifyContent: "center" },
    lunarText: { color: colors.muted, fontSize: 8, lineHeight: 10, fontWeight: "700", fontVariant: ["tabular-nums"] },
    selectedLunar: { color: colors.onPrimary },
    markersTop: { top: 4, right: 4, bottom: undefined },
    mutedNumber: { color: colors.muted },
    todayNumber: { color: todayDateColors.ink, fontWeight: "800" },
    todayOutline: { borderColor: todayDateColors.ring, borderWidth: 2.5, boxShadow: lightShadows ? `0 3px 5px ${todayDateColors.ring}30` : `inset 0 0 0 1px ${todayDateColors.ring}55, 0 0 0 2px ${todayDateColors.ring}25, 0 7px 15px ${todayDateColors.ring}22` },
    todayHalo: { position: "absolute", inset: 2, borderColor: todayDateColors.ring, borderWidth: 1.5, opacity: 0.7 },
    selectedNumber: { color: colors.onPrimary, fontWeight: "800" },
    markers: { position: "absolute", bottom: 4, flexDirection: "row", gap: 3 },
    marker: { width: 5, height: 5, borderRadius: radii.full },
    holidayBubble: holidayGlow(colors),
    weekendHolidayBubble: holidayGlow(colors, true),
    holidayNumber: { color: colors.ink },
    eventDot: { backgroundColor: colors.primaryDark },
    selectedDot: { backgroundColor: colors.onPrimary },
    popupCard: { position: "absolute", zIndex: 100, elevation: 12, padding: 13, borderRadius: 18, backgroundColor: colors.surface, borderColor: colors.primarySoft, borderWidth: 1, boxShadow: `0 12px 30px ${colors.primary}35` },
    popupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    popupDate: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800" },
    popupClose: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    popupCloseText: { color: colors.muted, fontSize: 22 },
    // Shrinks to fit inside the card's maximum height and scrolls if the holidays and events are longer.
    popupScroll: { flexShrink: 1, marginTop: 8 },
    popupHoliday: { marginBottom: 2, gap: 2 },
    popupLink: { color: colors.primaryDark, fontWeight: "700" },
    popupName: { color: colors.primaryDark, fontSize: 13, lineHeight: 18, fontWeight: "700" },
    popupScope: { color: colors.muted, fontSize: 11, lineHeight: 16 },
    popupEvent: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, borderTopColor: colors.line },
    popupEventText: { flex: 1, minHeight: 44, justifyContent: "center", gap: 3 },
    popupAdd: { minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 14, backgroundColor: colors.primary },
    popupAddText: { color: colors.onPrimary, fontSize: 12, fontWeight: "700" },
  });
}
