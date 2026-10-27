import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CalendarGrid } from "@/components/calendar-grid";
import { SeasonalScreen } from "@/components/seasonal-screen";
import { MonthJump } from "@/components/month-jump";
import { holidayDateAppearance, todayDateColors, radii, shadows, spacing, type ThemeColors, useCalendarTheme, useSeason } from "@/theme";
import { monthLabel, toDateKey } from "@/utils/dates";
import { useEvents } from "@/utils/events";
import { holidayYearLoaded } from "@/utils/holiday-info";
import { useToday } from "@/utils/today";
import { useOrderStatus } from "@/utils/official-orders";
import { MonthHolidays } from "./month-holidays";
import { MonthCaption } from "./month-caption";
import { seasonDateForMonth } from "@/utils/seasons";
import { ThemePicker } from "./theme-picker";
import { type CalendarView, ViewTabs } from "./view-tabs";
import { YearCalendar } from "./year-calendar";
import { YearHolidayList } from "./year-holiday-list";

const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
const monthFromIndex = (index: number) => new Date(Math.floor(index / 12), index % 12, 1, 12);

export function Home() {
  const { width } = useWindowDimensions();
  const { colors, reduceMotion } = useCalendarTheme(), { setSeasonDateKey } = useSeason();
  const reducedMotion = useReducedMotion() || reduceMotion;
  const styles = useMemo(() => createStyles(colors, width < 400), [colors, width < 400]);
  const [calendarView, setCalendarView] = useState<CalendarView>("monthly");
  const [coloursOpen, setColoursOpen] = useState(false);
  const [detailsDate, setDetailsDate] = useState<Date | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  // While the year view is zoomed, one finger pans the year instead of scrolling the page.
  const [yearZoomed, setYearZoomed] = useState(false);
  const today = useToday();
  const followToday = useRef(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const { events, deleteEvent } = useEvents();
  const { unseen } = useOrderStatus();
  useEffect(()=>{setSeasonDateKey(toDateKey(seasonDateForMonth(viewMonth,today)));},[viewMonth.getFullYear(),viewMonth.getMonth(),today,setSeasonDateKey]);
  // Screen minus page padding (2 × 16) and card padding (2 × 10). The grid always fits; it never scrolls sideways.
  const contentWidth = Math.min(Math.max(width - 52, 238), 560);
  useEffect(() => { if (followToday.current) { setSelectedDate(today); setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12)); } }, [today]);

  function selectDate(date: Date) {
    setDetailsDate(null);
    followToday.current = toDateKey(date) === toDateKey(today);
    setSelectedDate(date);
    if (date.getMonth() !== viewMonth.getMonth() || date.getFullYear() !== viewMonth.getFullYear()) {
      setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12));
    }
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
  }

  // The previous, current and next months stay mounted side by side and the strip slides on the UI thread. A swipe
  // only moves pages that already exist; the new neighbour mounts off screen afterwards. Re-rendering the visible
  // month instead updated ~127 texts at once on Android, a ~100 ms freeze in the middle of every swipe.
  const index = monthIndex(viewMonth);
  const [base] = useState(index);
  const pageStride = contentWidth + 24;
  const rest = -(index - base) * pageStride;
  // The title and month details update first; the off-screen neighbour follows in a later, lower-priority render.
  const deferredIndex = useDeferredValue(index);
  const centre = Math.abs(index - deferredIndex) > 1 ? index : deferredIndex;
  const strip = useSharedValue(rest);
  const restPosition = useSharedValue(rest);
  const viewMonthRef = useRef(viewMonth);
  viewMonthRef.current = viewMonth;
  useEffect(() => { restPosition.value = rest; strip.value = rest; }, [rest]);
  const changeMonth = useCallback((offset: number) => {
    const current = viewMonthRef.current, nextMonth = new Date(current.getFullYear(), current.getMonth() + offset, 1, 12);
    // Outside 1900–2100 the strip slides back to the current month.
    if (nextMonth.getFullYear() < 1900 || nextMonth.getFullYear() > 2100) { restPosition.value = strip.value = -(monthIndex(current) - base) * pageStride; return; }
    setDetailsDate(null);
    followToday.current = false;
    setViewMonth(nextMonth);
  }, [base, pageStride]);
  const settle = useCallback((offset: number) => {
    "worklet";
    const target = restPosition.value - offset * pageStride;
    strip.value = withTiming(target, { duration: 200 }, finished => { if (finished) { restPosition.value = target; scheduleOnRN(changeMonth, offset); } });
  }, [pageStride, changeMonth]);
  function stepMonth(offset: number) {
    if (reducedMotion) { changeMonth(offset); return; }
    settle(offset);
  }
  const stripStyle = useAnimatedStyle(() => ({ transform: [{ translateX: strip.value }] }));

  function goToToday() {
    setDetailsDate(null);
    followToday.current = true;
    const today = new Date();
    setSelectedDate(today);
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12));
  }

  function confirmDelete(id: string, title: string) {
    Alert.alert("Delete event?", title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void deleteEvent(id).then(warning => { if (warning) Alert.alert("Reminders", warning); }).catch(() => Alert.alert("Could not delete event", "Please try again.")); } },
    ]);
  }
  const swipe = useMemo(() => Gesture.Pan().activeOffsetX([-14, 14]).failOffsetY([-14, 14])
    .onUpdate(event => { if (!reducedMotion) strip.value = restPosition.value + Math.max(-pageStride, Math.min(pageStride, event.translationX)); })
    .onEnd(event => {
      const offset = event.translationX < -50 || event.velocityX < -600 ? 1 : event.translationX > 50 || event.velocityX > 600 ? -1 : 0;
      if (!offset) { strip.value = withTiming(restPosition.value, { duration: 160 }); return; }
      if (reducedMotion) { scheduleOnRN(changeMonth, offset); return; }
      settle(offset);
    }), [reducedMotion, pageStride, changeMonth, settle]);

  return (
    <SeasonalScreen>
    <ScrollView scrollEnabled={!(calendarView === "yearly" && yearZoomed)} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View pointerEvents="none" style={[styles.decorativeBubble, styles.bubbleOne]} />
      <View pointerEvents="none" style={[styles.decorativeBubble, styles.bubbleTwo]} />

      <View style={styles.toolbar}>
        <ViewTabs value={calendarView} onChange={value => { setDetailsDate(null); setCalendarView(value); }} />
        <View style={styles.utilities}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: coloursOpen }} onPress={() => setColoursOpen((open) => !open)} style={styles.colourButton}><View style={styles.utilityBubble}><Text style={styles.colourText}>Colours {coloursOpen ? "⌃" : "⌄"}</Text></View></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>router.push("/settings")} style={styles.colourButton}><View style={styles.utilityBubble}><Text style={styles.colourText}>Settings</Text></View></Pressable>
        </View>
      </View>
      {coloursOpen ? <View style={styles.themePanel}><ThemePicker /></View> : null}
      {unseen.length ? <Pressable accessibilityRole="button" onPress={() => router.push("/settings")} style={({ pressed }) => [styles.orderBanner, pressed && styles.buttonPressed]}>
        <Text style={styles.orderBannerTitle}>{unseen.length === 1 ? "New official holiday order" : `${unseen.length} new official holiday orders`}</Text>
        <Text style={styles.orderBannerText}>A holiday date may have changed after moon sighting. Tap to review →</Text>
      </Pressable> : null}

      {calendarView === "monthly" ? (
        <>
          <MonthHolidays viewMonth={viewMonth} onSelect={date => { selectDate(date); setDetailsDate(new Date(date)); }} />
          <GestureDetector gesture={swipe}>
          <View collapsable={false} style={styles.calendarCard}>
            <View style={styles.monthHeader}>
              <View style={styles.monthRow}>
                <Pressable accessibilityLabel="Choose month and year" onPress={() => setJumpOpen(true)} style={styles.monthHeading}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.monthTitle}>{monthLabel(viewMonth)} ⌄</Text></Pressable>
                <View style={styles.navigation}>
                  <Pressable accessibilityLabel="Previous month" hitSlop={6} onPress={() => stepMonth(-1)} style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}><Text allowFontScaling={false} style={styles.roundButtonText}>‹</Text></Pressable>
                  <Pressable hitSlop={6} onPress={goToToday} style={({ pressed }) => [styles.todayButton, pressed && styles.buttonPressed]}><Text style={styles.todayButtonText}>Today</Text></Pressable>
                  <Pressable accessibilityLabel="Next month" hitSlop={6} onPress={() => stepMonth(1)} style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}><Text allowFontScaling={false} style={styles.roundButtonText}>›</Text></Pressable>
                </View>
              </View>
              <MonthCaption month={viewMonth} />
            </View>

            <View style={[styles.pager, { width: contentWidth }]}>
              <Animated.View style={[{ width: contentWidth }, stripStyle]}>
                {[centre - 1, centre, centre + 1].map(page => (
                  // Keyed by slot (page mod 3): the page that slides off one side is reused, off screen, for the new neighbour.
                  <View key={((page % 3) + 3) % 3} style={{ position: page === index ? "relative" : "absolute", top: 0, left: (page - base) * pageStride, width: contentWidth }}>
                    <CalendarGrid viewMonth={monthFromIndex(page)} active={page === index} selectedDate={selectedDate} events={events} width={contentWidth} onSelect={selectDate} detailsDate={page === index ? detailsDate : null} onDeleteEvent={confirmDelete} />
                  </View>
                ))}
              </Animated.View>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={styles.todaySwatch} /><Text style={styles.legendText}>Today</Text></View>
              <View style={styles.legendItem}><View style={styles.holidaySwatch} /><Text style={styles.legendText}>Holiday</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primaryDark }]} /><Text style={styles.legendText}>Personal event</Text></View>
              <Text style={styles.yearNote}>{holidayYearLoaded(viewMonth.getFullYear()) ? "Official list: 2026" : "Holiday schedule unavailable"}</Text>
            </View>
          </View>
          </GestureDetector>
        </>
      ) : (
        <YearCalendar year={viewMonth.getFullYear()} width={contentWidth} selectedDate={selectedDate} onJump={() => setJumpOpen(true)} onZoomChange={setYearZoomed} onSelect={(date) => { selectDate(date); setCalendarView("monthly"); }} />
      )}

      <YearHolidayList year={viewMonth.getFullYear()} />
      <MonthJump visible={jumpOpen} month={viewMonth} onClose={() => setJumpOpen(false)} onChoose={date => { setDetailsDate(null); followToday.current = false; setViewMonth(date); setSelectedDate(date); }} />
    </ScrollView>
    </SeasonalScreen>
  );
}

// Narrow phones get a smaller month title and buttons, so "September 2026" fits beside ‹ Today ›.
function createStyles(colors: ThemeColors, narrow: boolean) {
  return StyleSheet.create({
    content: { alignItems: "center", gap: 10, paddingHorizontal: spacing.md, paddingTop: 4, paddingBottom: spacing.xxl, backgroundColor: colors.background },
    decorativeBubble: { position: "absolute", borderRadius: radii.full, opacity: 0.62 },
    bubbleOne: { width: 170, height: 170, top: -55, right: -70, backgroundColor: colors.today },
    bubbleTwo: { width: 120, height: 120, top: 210, left: -75, backgroundColor: colors.primarySoft },
    toolbar: { width:"100%", maxWidth:620, flexDirection:"row", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:4 },
    utilities: { flexDirection:"row", gap:5, marginLeft:"auto" },
    themePanel: { width:"100%", maxWidth:620 },
    orderBanner: { width:"100%", maxWidth:620, gap:3, padding:14, borderRadius:18, backgroundColor:colors.holiday },
    orderBannerTitle: { color:colors.onPrimary, fontSize:14, fontWeight:"800" },
    orderBannerText: { color:colors.onPrimary, fontSize:12, fontWeight:"600" },
    colourButton: { minHeight:44, justifyContent:"center", paddingVertical:7 },
    utilityBubble: { minHeight:28, paddingHorizontal:10, paddingVertical:4, justifyContent:"center", borderRadius:radii.full, backgroundColor:colors.primarySoft },
    colourText: { color: colors.primaryDark, fontSize: 11, fontWeight: "700" },
    calendarCard: { width: "100%", maxWidth: 620, alignItems: "center", gap: 20, paddingHorizontal: 10, paddingVertical: 20, backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: "continuous", boxShadow: shadows.card },
    monthHeader: { width: "100%", gap: 6, paddingHorizontal: spacing.xs },
    monthRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    monthTitle: { color: colors.ink, fontSize: narrow ? 17 : 20, fontWeight: "700", letterSpacing: -0.4 },
    monthHeading: { flex: 1, minHeight: 44, justifyContent: "center" },
    navigation: { flexDirection: "row", alignItems: "center", gap: narrow ? 4 : 5 },
    roundButton: { width: narrow ? 36 : 40, height: narrow ? 36 : 40, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.primarySoft },
    roundButtonText: { color: colors.primaryDark, fontSize: 24, lineHeight: 25 },
    todayButton: { minHeight: narrow ? 36 : 40, justifyContent: "center", paddingHorizontal: narrow ? 10 : 12, borderRadius: radii.full, backgroundColor: colors.today },
    todayButtonText: { color: colors.todayInk, fontSize: 12, fontWeight: "800" },
    // Clips the neighbouring months; the padding leaves room for the selected bubble's lift.
    pager: { overflow: "hidden", paddingVertical: 6, marginVertical: -6 },
    legend: { width: "100%", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, paddingHorizontal: spacing.xs },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    legendDot: { width: 7, height: 7, borderRadius: radii.full },
    legendText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
    yearNote: { marginLeft: "auto", color: colors.muted, fontSize: 10 },
    holidaySwatch: { width: 10, height: 10, borderRadius: 3, ...holidayDateAppearance(colors) },
    todaySwatch: { width: 10, height: 10, borderRadius: 3, backgroundColor: todayDateColors.fill, borderColor: todayDateColors.ring, borderWidth: 2 },
    buttonPressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
  });
}
