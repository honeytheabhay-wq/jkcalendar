import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { useEffect, useRef, useState } from "react";

import { holidays2026, type Holiday } from "@/data/holidays-2026";
import { HolidayDetails } from "@/components/holiday-details";
import { useHoverDetails } from "@/utils/hover-details";
import { monthGrid, toDateKey } from "@/utils/dates";
import { glassSettings, holidayDateAppearance, todayDateColors, radii, shadows, spacing, type ThemeColors, useCalendarTheme } from "@/theme";
import { useToday } from "@/utils/today";
import { usePreferences } from "@/utils/preferences";
import { regionalDateLabel } from "@/utils/regional-labels";
import { holidayYearLoaded } from "@/utils/holiday-info";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function YearCalendar({ year, width, selectedDate, onSelect, onJump }: { year: number; width: number; selectedDate: Date; onSelect: (date: Date) => void; onJump: () => void }) {
  const { colors, glassLevel, reduceTransparency } = useCalendarTheme();
  const styles = createStyles(colors);
  const todayKey = toDateKey(useToday());
  const {labelLanguage}=usePreferences();
  const [zoom, setZoom] = useState(1);
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [popupTop, setPopupTop] = useState(90);
  const [detail, setDetail] = useState<Holiday | null>(null);
  const layout = useRef({ scrollY: 0, months: {} as Record<number, number>, grids: {} as Record<number, number>, dates: {} as Record<string, number> });
  const hover = useHoverDetails(() => setPreviewDate(null));
  useEffect(() => { hover.keepOpen(); setPreviewDate(null); }, [year, zoom]);
  function preview(date: Date) {
    hover.keepOpen();
    const index = date.getMonth();
    setPopupTop(layout.current.scrollY + (layout.current.months[index] ?? 0) + (layout.current.grids[index] ?? 0) + (layout.current.dates[toDateKey(date)] ?? 0) + 18 * zoom + 8);
    setPreviewDate(date);
  }
  const previewHolidays = previewDate ? holidays2026.filter((holiday) => holiday.date === toDateKey(previewDate)) : [];
  const canvasWidth = Math.max(330, width) * zoom;
  const gap = 8 * zoom;
  const monthWidth = (canvasWidth - gap * 2) / 3;
  const bubbleSize = Math.min(16 * zoom, (monthWidth - 14 * zoom - 2) / 7 - 1);
  const holidayDates = new Set(holidays2026.map((holiday) => holiday.date));

  function changeZoom(amount: number) {
    setZoom((current) => Math.min(1.7, Math.max(0.75, Number((current + amount).toFixed(2)))));
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}><Pressable accessibilityLabel="Choose month and year" onPress={onJump}><Text style={styles.title}>{year} at a glance ⌄</Text></Pressable><Text style={styles.hint}>Tap a month to open it. Use − and + to zoom.</Text></View>
        <View style={styles.zoomControls}>
          <Pressable accessibilityLabel="Zoom out" onPress={() => changeZoom(-0.25)} style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed]}><Text allowFontScaling={false} style={styles.zoomText}>−</Text></Pressable>
          <Pressable accessibilityLabel="Reset zoom" onPress={() => setZoom(1)} style={({ pressed }) => [styles.zoomValue, pressed && styles.pressed]}><Text style={styles.zoomValueText}>{Math.round(zoom * 100)}%</Text></Pressable>
          <Pressable accessibilityLabel="Zoom in" onPress={() => changeZoom(0.25)} style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed]}><Text allowFontScaling={false} style={styles.zoomText}>＋</Text></Pressable>
        </View>
      </View>
      {!holidayYearLoaded(year) ? <Text style={styles.warning}>Holiday schedule unavailable for {year}.</Text> : null}
      <ScrollView horizontal onLayout={event => { layout.current.scrollY = event.nativeEvent.layout.y; }} onScrollBeginDrag={() => setPreviewDate(null)} showsHorizontalScrollIndicator={canvasWidth > width} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.yearGrid, { width: canvasWidth, gap }]}> 
          {months.map((monthName, monthIndex) => {
            const viewMonth = new Date(year, monthIndex, 1, 12);
            const dates = monthGrid(viewMonth);
            return (
              <View key={monthName} onLayout={event => { layout.current.months[monthIndex] = event.nativeEvent.layout.y; }} style={[styles.monthCard, { width: monthWidth, padding: 7 * zoom, borderRadius: 13 * zoom }]}>
                <Pressable accessibilityRole="button" style={{minHeight:44,justifyContent:"center"}} accessibilityLabel={`Open ${monthName} ${year}`} onPress={() => onSelect(new Date(year, monthIndex, 1, 12))}><Text style={[styles.monthName, { fontSize: 11 * zoom, marginBottom: 5 * zoom }]}>{monthName} ↗</Text></Pressable>
                <View onLayout={event => { layout.current.grids[monthIndex] = event.nativeEvent.layout.y; }} style={styles.miniGrid}>
                  {weekDays.map((day, index) => <Text allowFontScaling={false} key={`${day}-${index}`} style={[styles.weekDay, { width: `${100 / 7}%`, fontSize: 5.5 * zoom, marginBottom: 4 * zoom }]}>{day}</Text>)}
                  {dates.map((date) => {
                    const muted = date.getMonth() !== monthIndex;
                    const dateKey = toDateKey(date);
                    const selected = dateKey === toDateKey(selectedDate);
                    const holiday = holidayDates.has(dateKey);
                    const today = dateKey === todayKey;
                    return (
                      <Pressable
                        key={dateKey}
                        disabled={muted}
                        accessible={false}
                        importantForAccessibility="no"
                        accessibilityLabel={muted ? undefined : date.toLocaleDateString()}
                        onLayout={event => { if (!muted) layout.current.dates[dateKey] = event.nativeEvent.layout.y; }}
                        onPress={() => onSelect(date)}
                        onHoverIn={() => preview(date)}
                        onHoverOut={hover.leave}
                        onFocus={() => preview(date)}
                        onBlur={hover.leave}
                        style={[styles.miniDay, { width: `${100 / 7}%`, height: 18 * zoom }]}
                      >
                        {!muted ? <View style={[styles.miniBubble, { width: bubbleSize, height: bubbleSize, backgroundColor: `${colors.bubble}${reduceTransparency ? "FF" : glassSettings[glassLevel].alpha}` }, selected && styles.selectedBubble, holiday && styles.holidayBubble, selected && holiday && { borderColor: colors.primaryDark }, today && {borderColor:todayDateColors.ring,borderWidth:1.5}, today && !holiday && {backgroundColor:todayDateColors.fill}]}><Text allowFontScaling={false} style={[styles.dayText, { fontSize: Math.min(7.5 * zoom, bubbleSize * .62) }, selected && styles.selectedText, holiday && styles.holidayText, today && !holiday && {color:todayDateColors.ink}]}>{date.getDate()}</Text></View> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.legend}><View style={[styles.dot, { ...holidayDateAppearance(colors), borderRadius: 2 }]} /><Text style={styles.legendText}>Holiday</Text><View style={[styles.dot, { backgroundColor: todayDateColors.fill, borderColor:todayDateColors.ring, borderWidth:1.5 }]} /><Text style={styles.legendText}>Today</Text><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Selected</Text></View>
      {previewDate ? <Pressable onHoverIn={hover.keepOpen} onHoverOut={hover.leave} onFocus={hover.keepOpen} onBlur={hover.leave} onAccessibilityEscape={() => setPreviewDate(null)} accessibilityLiveRegion="polite" style={[styles.datePopup, { top: popupTop }]}>
        <View style={styles.popupHeader}><View style={{flex:1,gap:3}}><Text style={styles.popupDate}>{previewDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text>{labelLanguage!=="english"?<Text selectable style={[styles.popupHoliday,{writingDirection:labelLanguage==="kashmiri"?"rtl":"ltr",textAlign:"left"}]}>{regionalDateLabel(previewDate,labelLanguage)}</Text>:null}</View><Pressable accessibilityLabel="Close date details" onPress={() => setPreviewDate(null)} style={styles.popupClose}><Text allowFontScaling={false} style={styles.popupCloseText}>×</Text></Pressable></View>
        {previewHolidays.length ? previewHolidays.map((holiday) => <Pressable onPress={() => { setDetail(holiday); setPreviewDate(null); }} key={`${holiday.date}-${holiday.name}`}><Text style={styles.popupHoliday}>{holiday.name} · {holiday.scope} · Details & source ↗</Text></Pressable>) : <Text style={styles.popupHoliday}>{holidayYearLoaded(year) ? "No holiday listed for this date." : `Holiday schedule unavailable for ${year}.`}</Text>}
      </Pressable> : null}
      <HolidayDetails holiday={detail} onClose={() => setDetail(null)} />
    </View>
  );
}

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
    scrollContent: { minWidth: "100%" },
    yearGrid: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
    monthCard: { backgroundColor: colors.background, borderColor: colors.line, borderWidth: 1.5, boxShadow: `0 5px 12px ${colors.primarySoft}` },
    monthName: { color: colors.ink, fontWeight: "800" },
    miniGrid: { flexDirection: "row", flexWrap: "wrap" },
    weekDay: { color: colors.muted, textAlign: "center", fontWeight: "800" },
    miniDay: { alignItems: "center", justifyContent: "center" },
    miniBubble: { alignItems: "center", justifyContent: "center", borderRadius: 5, backgroundColor: `${colors.bubble}AA`, borderColor: `${colors.surface}DD`, borderWidth: 1, boxShadow: `inset 0 1px 1px ${colors.surface}99, 0 3px 5px ${colors.primary}25` },
    holidayBubble: { ...holidayDateAppearance(colors), borderWidth: 1.5 },
    holidayText: { color: colors.ink },
    selectedBubble: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
    dayText: { color: colors.ink, fontWeight: "700", fontVariant: ["tabular-nums"] },
    selectedText: { color: colors.onPrimary },
    legend: { flexDirection: "row", alignItems: "center", gap: 5 },
    dot: { width: 7, height: 7, borderRadius: radii.full, marginLeft: 5 },
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
