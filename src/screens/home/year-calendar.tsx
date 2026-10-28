import { Platform, Pressable, Text as Span, StyleSheet, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { holidays2026, type Holiday } from "@/data/holidays-2026";
import { HolidayDetails } from "@/components/holiday-details";
import { toDateKey } from "@/utils/dates";
import { todayDateColors, radii, shadows, spacing, type ThemeColors, useLaggedTheme } from "@/theme";
import { useToday } from "@/utils/today";
import { usePreferences } from "@/utils/preferences";
import { regionalDateLabel } from "@/utils/regional-labels";
import { holidayYearLoaded } from "@/utils/holiday-info";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const holidayDates = new Set(holidays2026.map((holiday) => holiday.date));
const maxZoom = 3;

type Styles = ReturnType<typeof createStyles>;
type MonthProps = {
  year: number;
  monthIndex: number;
  monthWidth: number;
  // Only the month that holds the selected date or today gets the key, so other months skip re-rendering.
  selectedKey: string;
  todayKey: string;
  styles: Styles;
  charRatio: number;
  onSelect: (date: Date) => void;
  onPreview: (date: Date) => void;
};
const monthPadding = 6, monthBorder = 1.5;
let measuredCharRatio: number | null = null;
const pad = (day: number) => (day < 10 ? `\u2007${day}` : String(day));

// Each week is one Text in a monospaced font with a span per date, and one Pressable per month works out the tapped
// date from the touch position. A view per date came to 500+ native views for the year: a ~1.4 s freeze on opening.
const MiniMonth = memo(function MiniMonth({ year, monthIndex, monthWidth, selectedKey, todayKey, styles, onSelect, onPreview, charRatio }: MonthProps) {
  const first = new Date(year, monthIndex, 1, 12);
  const lead = (first.getDay() + 6) % 7, days = new Date(year, monthIndex + 1, 0).getDate();
  // 20 characters per row: seven 2-digit dates and six spaces. The monospace width differs between phones, so the
  // first month measures it (charRatio = character width / font size) and every month sizes its text to fit.
  const inner = monthWidth - monthPadding * 2 - monthBorder * 2;
  // 4% spare: glyph advances round to whole pixels, which made a full row ~1 pt wider than calculated.
  const fontSize = Math.floor(Math.min(11, (inner * 0.96) / 20 / charRatio) * 10) / 10, charWidth = fontSize * charRatio, lineHeight = Math.round(fontSize * 1.75);
  const dateAt = (x: number, y: number) => {
    const day = Math.floor(y / lineHeight) * 7 + Math.min(6, Math.floor(x / (charWidth * 3))) - lead + 1;
    return day >= 1 && day <= days ? new Date(year, monthIndex, day, 12) : null;
  };
  const keyPrefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
  const weeks = useMemo(() => {
    const rows: { day: number; key: string }[][] = [];
    for (let cell = 0; cell < lead + days; cell++) {
      if (cell % 7 === 0) rows.push([]);
      const day = cell - lead + 1;
      rows[rows.length - 1].push({ day, key: day >= 1 ? `${keyPrefix}${String(day).padStart(2, "0")}` : "" });
    }
    return rows;
  }, [year, monthIndex]);
  const text = { fontSize, lineHeight };
  return (
    <View style={[styles.monthCard, { width: monthWidth }]}>
      <Pressable accessibilityRole="button" style={{ minHeight: 36, justifyContent: "center" }} accessibilityLabel={`Open ${months[monthIndex]} ${year}`} onPress={() => onSelect(first)}><Text style={styles.monthName}>{months[monthIndex]} ↗</Text></Pressable>
      <Text allowFontScaling={false} numberOfLines={1} style={[styles.weekRow, styles.weekDay, text]}>{weekDays.map(day => day.slice(0, 2)).join(" ")}</Text>
      <Pressable accessible={false} onPress={event => onSelect(dateAt(event.nativeEvent.locationX, event.nativeEvent.locationY) ?? first)} onLongPress={event => { const date = dateAt(event.nativeEvent.locationX, event.nativeEvent.locationY); if (date) onPreview(date); }}>
        <View pointerEvents="none">
          {weeks.map((week, row) => (
            <Text key={row} allowFontScaling={false} numberOfLines={1} style={[styles.weekRow, text]}>
              {week.map(({ day, key }, column) => {
                const gap = column ? " " : "";
                if (day < 1) return gap + "\u2007\u2007";
                const holiday = holidayDates.has(key), selected = key === selectedKey, today = key === todayKey;
                // Plain Text for the nested spans: AppText would give each span its own font size.
                return [gap, <Span key={key} style={[holiday && styles.holidayDay, selected && styles.selectedDay, today && styles.todayDay]}>{pad(day)}</Span>];
              })}
            </Text>
          ))}
        </View>
      </Pressable>
    </View>
  );
});

export const YearCalendar = memo(function YearCalendar({ year, width, selectedDate, onSelect, onJump, onZoomChange, visible = true }: { year: number; width: number; selectedDate: Date; onSelect: (date: Date) => void; onJump: () => void; onZoomChange?: (zoomed: boolean) => void; visible?: boolean }) {
  // While hidden behind the month view, theme changes reach the year a second later.
  const { colors } = useLaggedTheme(visible);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const todayKey = toDateKey(useToday());
  const selectedKey = toDateKey(selectedDate);
  const { labelLanguage } = usePreferences();
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [detail, setDetail] = useState<Holiday | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  // Months render once the character width is known, so they are laid out only once.
  const [charRatio, setCharRatio] = useState(measuredCharRatio);
  const measure = useCallback((ratio: number) => { if (ratio > 0.4 && ratio < 1) { measuredCharRatio = ratio; setCharRatio(ratio); } }, []);
  useEffect(() => { setPreviewDate(null); }, [year]);
  // Press and hold a date for its details; a tap opens it in the month view.
  const preview = useCallback((date: Date) => setPreviewDate(date), []);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const select = useCallback((date: Date) => onSelectRef.current(date), []);
  const previewHolidays = previewDate ? holidays2026.filter((holiday) => holiday.date === toDateKey(previewDate)) : [];
  // The card has more padding than the month card, so the year is laid out to the measured inner width.
  const [gridWidth, setGridWidth] = useState(width - 8);
  const gap = 8;
  // Narrow phones get two months per row so the dates stay readable; pinch zoom covers the rest.
  const columns = gridWidth >= 330 ? 3 : 2;
  const monthWidth = Math.floor((gridWidth - gap * (columns - 1)) / columns);

  // Pinch zoom scales the year as one picture on the UI thread (no re-layout); one finger pans while zoomed.
  const scale = useSharedValue(1), x = useSharedValue(0), y = useSharedValue(0);
  const start = useSharedValue({ scale: 1, x: 0, y: 0, focalX: 0, focalY: 0 });
  const size = useSharedValue({ width: gridWidth, height: 1 });
  const zoomed = zoomPercent > 100;
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const reportZoom = useCallback((value: number) => {
    const percent = Math.round(value * 100);
    setZoomPercent(percent);
    setPreviewDate(null);
    onZoomChangeRef.current?.(percent > 100);
  }, []);
  useEffect(() => () => onZoomChangeRef.current?.(false), []);
  const clampX = (value: number, s: number) => { "worklet"; return Math.min(0, Math.max(size.value.width * (1 - s), value)); };
  const clampY = (value: number, s: number) => { "worklet"; return Math.min(0, Math.max(size.value.height * (1 - s), value)); };
  function zoomTo(target: number) {
    const next = Math.min(maxZoom, Math.max(1, target));
    // Zoom around the middle of the year view.
    const cx = size.value.width / 2, cy = Math.min(size.value.height, 500) / 2;
    const px = (cx - x.value) / scale.value, py = (cy - y.value) / scale.value;
    scale.value = withTiming(next, { duration: 180 });
    x.value = withTiming(clampX(cx - px * next, next), { duration: 180 });
    y.value = withTiming(clampY(cy - py * next, next), { duration: 180 });
    reportZoom(next);
  }
  const gesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onStart(event => { start.value = { scale: scale.value, x: x.value, y: y.value, focalX: event.focalX, focalY: event.focalY }; })
      .onUpdate(event => {
        const s = Math.min(maxZoom, Math.max(1, start.value.scale * event.scale));
        // Keep the point under the fingers in place while zooming.
        const px = (start.value.focalX - start.value.x) / start.value.scale, py = (start.value.focalY - start.value.y) / start.value.scale;
        scale.value = s;
        x.value = clampX(event.focalX - px * s, s);
        y.value = clampY(event.focalY - py * s, s);
      })
      .onEnd(() => {
        if (scale.value < 1.05) { scale.value = withTiming(1, { duration: 160 }); x.value = withTiming(0, { duration: 160 }); y.value = withTiming(0, { duration: 160 }); scheduleOnRN(reportZoom, 1); return; }
        scheduleOnRN(reportZoom, scale.value);
      });
    const pan = Gesture.Pan().enabled(zoomed).maxPointers(1)
      .onStart(() => { start.value = { ...start.value, x: x.value, y: y.value }; })
      .onUpdate(event => {
        x.value = clampX(start.value.x + event.translationX, scale.value);
        y.value = clampY(start.value.y + event.translationY, scale.value);
      });
    return Gesture.Simultaneous(pinch, pan);
  }, [zoomed, reportZoom]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }] }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}><Pressable accessibilityLabel="Choose month and year" onPress={onJump}><Text style={styles.title}>{year} at a glance ⌄</Text></Pressable><Text style={styles.hint}>Tap a date to open it, hold for details. Pinch to zoom.</Text></View>
        <View style={styles.zoomControls}>
          <Pressable accessibilityLabel="Zoom out" onPress={() => zoomTo(scale.value - 0.5)} style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed]}><Text allowFontScaling={false} style={styles.zoomText}>−</Text></Pressable>
          <Pressable accessibilityLabel="Reset zoom" onPress={() => zoomTo(1)} style={({ pressed }) => [styles.zoomValue, pressed && styles.pressed]}><Text style={styles.zoomValueText}>{zoomPercent}%</Text></Pressable>
          <Pressable accessibilityLabel="Zoom in" onPress={() => zoomTo(scale.value + 0.5)} style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed]}><Text allowFontScaling={false} style={styles.zoomText}>＋</Text></Pressable>
        </View>
      </View>
      {!holidayYearLoaded(year) ? <Text style={styles.warning}>Holiday schedule unavailable for {year}.</Text> : null}
      <GestureDetector gesture={gesture}>
        <View collapsable={false} style={styles.viewport} onLayout={event => { if (event.nativeEvent.layout.width > 0) size.value = { width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height }; if (event.nativeEvent.layout.width > 0 && Math.abs(event.nativeEvent.layout.width - gridWidth) > 1) setGridWidth(event.nativeEvent.layout.width); }}>
          {/* Measures this phone's monospace character width once, off screen and unconstrained. */}
          {charRatio ? null : <View pointerEvents="none" style={styles.measure}><Text allowFontScaling={false} onTextLayout={event => { const line = event.nativeEvent.lines[0]; if (line) measure(line.width / 20 / 10); }} style={[styles.weekRow, { fontSize: 10 }]}>{"00 00 00 00 00 00 00"}</Text></View>}
          <Animated.View style={[styles.yearGrid, { width: gridWidth, gap }, zoomStyle]}>
            {charRatio ? months.map((monthName, monthIndex) => (
              <MiniMonth
                key={monthName}
                year={year}
                monthIndex={monthIndex}
                monthWidth={monthWidth}
                selectedKey={selectedDate.getFullYear() === year && selectedDate.getMonth() === monthIndex ? selectedKey : ""}
                todayKey={todayKey.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`) ? todayKey : ""}
                styles={styles}
                onSelect={select}
                onPreview={preview}
                charRatio={charRatio}
              />
            )) : null}
          </Animated.View>
        </View>
      </GestureDetector>
      <View style={styles.legend}><View style={[styles.dot, { backgroundColor: `${colors.holiday}55`, borderRadius: 2 }]} /><Text style={styles.legendText}>Holiday</Text><View style={[styles.dot, { backgroundColor: todayDateColors.fill, borderColor: todayDateColors.ring, borderWidth: 1.5 }]} /><Text style={styles.legendText}>Today</Text><Text style={[styles.legendText, styles.legendSelected]}>Selected</Text></View>
      {previewDate ? <Pressable onAccessibilityEscape={() => setPreviewDate(null)} accessibilityLiveRegion="polite" style={styles.datePopup}>
        <View style={styles.popupHeader}><View style={{ flex: 1, gap: 3 }}><Text style={styles.popupDate}>{previewDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text>{labelLanguage !== "english" ? <Text selectable style={[styles.popupHoliday, { writingDirection: labelLanguage === "kashmiri" ? "rtl" : "ltr", textAlign: "left" }]}>{regionalDateLabel(previewDate, labelLanguage)}</Text> : null}</View><Pressable accessibilityLabel="Close date details" onPress={() => setPreviewDate(null)} style={styles.popupClose}><Text allowFontScaling={false} style={styles.popupCloseText}>×</Text></Pressable></View>
        {previewHolidays.length ? previewHolidays.map((holiday) => <Pressable onPress={() => { setDetail(holiday); setPreviewDate(null); }} key={`${holiday.date}-${holiday.name}`}><Text style={styles.popupHoliday}>{holiday.name} · {holiday.scope} · Details & source ↗</Text></Pressable>) : <Text style={styles.popupHoliday}>{holidayYearLoaded(year) ? "No holiday listed for this date." : `Holiday schedule unavailable for ${year}.`}</Text>}
      </Pressable> : null}
      <HolidayDetails holiday={detail} onClose={() => setDetail(null)} />
    </View>
  );
});

// Twelve blurred month shadows add to every frame drawn while scrolling on Android, so they go without there.
const lightShadows = Platform.OS === "android";
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { width: "100%", maxWidth: 620, gap: spacing.md, padding: 14, backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: "continuous", boxShadow: shadows.card },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    title: { color: colors.ink, fontSize: 19, fontWeight: "800" },
    hint: { color: colors.muted, fontSize: 10, marginTop: 3 },
    warning: { color: colors.danger, fontSize: 12 },
    zoomControls: { flexDirection: "row", alignItems: "center", gap: 4 },
    zoomButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.primarySoft, borderColor: colors.line, borderWidth: 1 },
    zoomText: { color: colors.primaryDark, fontSize: 18, fontWeight: "800" },
    zoomValue: { minWidth: 47, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.today },
    zoomValueText: { color: colors.todayInk, fontSize: 10, fontWeight: "800" },
    viewport: { overflow: "hidden" },
    yearGrid: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", transformOrigin: "left top" },
    monthCard: { padding: monthPadding, borderRadius: 13, backgroundColor: colors.background, borderColor: colors.line, borderWidth: monthBorder, boxShadow: lightShadows ? undefined : `0 5px 12px ${colors.primarySoft}` },
    monthName: { color: colors.ink, fontWeight: "800", fontSize: 11, marginBottom: 5 },
    miniGrid: { flexDirection: "row", flexWrap: "wrap" },
    measure: { position: "absolute", left: 0, top: 0, width: 1000, opacity: 0 },
    // One weight throughout: bold monospace is wider on some phones and would no longer fit the measured width.
    weekRow: { fontFamily: "monospace", color: colors.ink },
    weekDay: { color: colors.muted },
    holidayDay: { color: colors.holiday, backgroundColor: `${colors.holiday}2E` },
    // Today is always the green fill; the selected date is underlined (no bold: it would widen the monospace row), so the two never hide each other.
    todayDay: { color: todayDateColors.ink, backgroundColor: todayDateColors.fill },
    selectedDay: { color: colors.primaryDark, textDecorationLine: "underline" },
    legend: { flexDirection: "row", alignItems: "center", gap: 5 },
    dot: { width: 7, height: 7, borderRadius: radii.full, marginLeft: 5 },
    legendSelected: { marginLeft: 5, color: colors.primaryDark, fontWeight: "900", textDecorationLine: "underline" },
    legendText: { color: colors.muted, fontSize: 10, fontWeight: "600" },
    pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
    datePopup: { position: "absolute", top: 90, left: 16, right: 16, padding: 14, gap: 8, zIndex: 100, elevation: 12, backgroundColor: colors.surface, borderColor: colors.primarySoft, borderWidth: 1, borderRadius: 18, boxShadow: `0 12px 28px ${colors.primary}35` },
    popupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    popupDate: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800" },
    popupHoliday: { color: colors.muted, fontSize: 12, lineHeight: 18 },
    popupClose: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    popupCloseText: { color: colors.muted, fontSize: 22 },
  });
}
