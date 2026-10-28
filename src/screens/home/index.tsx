import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CalendarGrid } from "@/components/calendar-grid";
import { SeasonalScreen } from "@/components/seasonal-screen";
import { MonthJump } from "@/components/month-jump";
import { holidayDateAppearance, todayDateColors, radii, shadows, spacing, darkBackground, lightBackground, switchToLight, type ThemeColors, useCalendarTheme, useSeason } from "@/theme";
import { fromDateKey, monthLabel, toDateKey } from "@/utils/dates";
import { useEvents } from "@/utils/events";
import { setPreference } from "@/utils/preferences";
import { holidayText } from "@/utils/holiday-share";
import { switchThemeWithFade } from "@/components/theme-fade";
import { AppLogo } from "@/components/app-logo";
import { holidayYearLoaded, nextHoliday } from "@/utils/holiday-info";
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
// Cached so each month page keeps the same Date object and its memoised grid can skip re-rendering.
const monthDates = new Map<number, Date>();
const monthFromIndex = (index: number) => { let date = monthDates.get(index); if (!date) { date = new Date(Math.floor(index / 12), index % 12, 1, 12); monthDates.set(index, date); } return date; };

export function Home() {
  const { width } = useWindowDimensions();
  const { colors, reduceMotion, themeName } = useCalendarTheme(), { season, setSeasonDateKey } = useSeason();
  // Dark mode is the Midnight Indigo palette; the moon/sun button beside Colours switches it.
  const dark = themeName === "midnight-indigo";
  const reducedMotion = useReducedMotion() || reduceMotion;
  const styles = useMemo(() => createStyles(colors, width < 400), [colors, width < 400]);
  const [calendarView, setCalendarView] = useState<CalendarView>("monthly");
  const [coloursOpen, setColoursOpen] = useState(false);
  const [detailsDate, setDetailsDate] = useState<Date | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  // While the year view is zoomed, one finger pans the year instead of scrolling the page.
  const [yearZoomed, setYearZoomed] = useState(false);
  const [yearOpened, setYearOpened] = useState(false);
  if (calendarView === "yearly" && !yearOpened) setYearOpened(true);
  // The year view is built quietly a few seconds after launch, so even the first switch to Yearly only shows it.
  useEffect(() => { const timer = setTimeout(() => startTransition(() => setYearOpened(true)), 3000); return () => clearTimeout(timer); }, []);
  const today = useToday();
  const followToday = useRef(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const { events, deleteEvent } = useEvents();
  const { unseen } = useOrderStatus();
  // Countdown to the next listed holiday (today counts as 0 days).
  const countdown = useMemo(() => nextHoliday(today), [today]);
  const countdownLabel = countdown ? `${countdown.holiday.name} ${countdown.remaining === 0 ? "is today" : countdown.remaining === 1 ? "is tomorrow" : `in ${countdown.remaining} days`}` : "";
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

  // Stable handlers for the memoised month pages and year view.
  const latest = useRef({ selectDate, confirmDelete: (id: string, title: string) => confirmDelete(id, title) });
  latest.current = { selectDate, confirmDelete: (id: string, title: string) => confirmDelete(id, title) };
  const onGridSelect = useCallback((date: Date) => latest.current.selectDate(date), []);
  const onGridDelete = useCallback((id: string, title: string) => latest.current.confirmDelete(id, title), []);
  const onYearSelect = useCallback((date: Date) => { latest.current.selectDate(date); setCalendarView("monthly"); }, []);
  const openJump = useCallback(() => setJumpOpen(true), []);

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
    <Stack.Screen options={{ headerTitle: () => <View style={styles.brand}><AppLogo /><Text style={styles.brandText}>J&K Calendar</Text></View>, headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel={dark ? "Switch to light mode" : "Switch to dark mode"} hitSlop={8} onPress={() => switchThemeWithFade(dark ? lightBackground(season.id) : darkBackground(), () => { if (dark) switchToLight(); else setPreference("appearance", "dark"); })} style={styles.modeButton}><Text allowFontScaling={false} style={styles.modeText}>{dark ? "☀" : "☾"}</Text></Pressable> }} />
    <ScrollView scrollEnabled={!(calendarView === "yearly" && yearZoomed)} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} stickyHeaderIndices={[0]}>

      {/* Stays pinned at the top while the page scrolls (stickyHeaderIndices: the first child). */}
      <View style={styles.toolbarDock}><View style={styles.toolbar}>
        <ViewTabs value={calendarView} onChange={value => { setDetailsDate(null); setCalendarView(value); }} />
        <View style={styles.utilities}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: coloursOpen }} onPress={() => setColoursOpen((open) => !open)} style={styles.colourButton}><View style={styles.utilityBubble}><Text style={styles.colourText}>Colours {coloursOpen ? "⌃" : "⌄"}</Text></View></Pressable>
          <Pressable accessibilityRole="button" onPress={()=>router.push("/settings")} style={styles.colourButton}><View style={styles.utilityBubble}><Text style={styles.colourText}>Settings</Text></View></Pressable>
        </View>
      </View></View>
      {countdown ? <Pressable accessibilityRole="button" accessibilityLabel={countdownLabel} onPress={() => { const date = fromDateKey(countdown.holiday.date); selectDate(date); setCalendarView("monthly"); setDetailsDate(new Date(date)); }} style={({ pressed }) => [styles.countdown, pressed && styles.buttonPressed]}>
        <Text style={styles.countdownDays}>{countdown.remaining === 0 ? "Today" : countdown.remaining === 1 ? "Tomorrow" : `${countdown.remaining} days`}</Text>
        <View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.countdownName}>{countdown.holiday.name}</Text><Text numberOfLines={1} style={styles.countdownWhen}>{fromDateKey(countdown.holiday.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {countdown.holiday.scope}{countdown.holiday.subjectToMoon ? " · moon sighting" : ""}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Share ${countdown.holiday.name}`} hitSlop={8} onPress={() => { void Share.share({ message: holidayText(countdown.holiday) }).catch(() => {}); }} style={styles.countdownShare}><Text style={styles.countdownShareText}>Share</Text></Pressable>
      </Pressable> : null}
      {coloursOpen ? <View style={styles.themePanel}><ThemePicker /></View> : null}
      {unseen.length ? <Pressable accessibilityRole="button" onPress={() => router.push("/settings")} style={({ pressed }) => [styles.orderBanner, pressed && styles.buttonPressed]}>
        <Text style={styles.orderBannerTitle}>{unseen.length === 1 ? "New official holiday order" : `${unseen.length} new official holiday orders`}</Text>
        <Text style={styles.orderBannerText}>A holiday date may have changed after moon sighting. Tap to review →</Text>
      </Pressable> : null}

      {/* Both views stay built once opened, so switching between them only shows or hides one instead of rebuilding it. */}
      <View style={[styles.viewPane, calendarView !== "monthly" && styles.hidden]}>
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
                    <CalendarGrid viewMonth={monthFromIndex(page)} active={page === index} selectedDate={selectedDate} events={events} width={contentWidth} onSelect={onGridSelect} detailsDate={page === index ? detailsDate : null} onDeleteEvent={onGridDelete} />
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
      </View>
      {yearOpened ? <View pointerEvents={calendarView === "yearly" ? "auto" : "none"} style={[styles.viewPane, calendarView !== "yearly" && styles.offscreen]}>
        <YearCalendar year={viewMonth.getFullYear()} width={contentWidth} selectedDate={selectedDate} onJump={openJump} onZoomChange={setYearZoomed} onSelect={onYearSelect} visible={calendarView === "yearly"} />
      </View> : null}

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
    toolbarDock: { width:"100%", alignItems:"center", paddingVertical:4, zIndex:20 },
    // A floating pill: surface background and a soft shadow so it reads above the page as it scrolls under it.
    toolbar: { width:"100%", maxWidth:620, flexDirection:"row", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:4, paddingHorizontal:6, borderRadius:radii.full, backgroundColor:colors.surface, boxShadow:`0 4px 14px ${colors.primary}22` },
    countdown: { width:"100%", maxWidth:620, flexDirection:"row", alignItems:"center", gap:12, paddingVertical:10, paddingHorizontal:14, borderRadius:18, backgroundColor:colors.surface },
    countdownDays: { minWidth:72, textAlign:"center", paddingVertical:6, paddingHorizontal:10, borderRadius:radii.full, overflow:"hidden", backgroundColor:colors.holiday, color:colors.onPrimary, fontSize:13, fontWeight:"800" },
    countdownShare: { minHeight: 36, justifyContent: "center", paddingHorizontal: 12, borderRadius: radii.full, backgroundColor: colors.primarySoft },
    countdownShareText: { color: colors.primaryDark, fontSize: 12, fontWeight: "700" },
    countdownName: { color:colors.ink, fontSize:15, fontWeight:"800" },
    countdownWhen: { color:colors.muted, fontSize:12 },
    utilities: { flexDirection:"row", gap:5, marginLeft:"auto" },
    themePanel: { width:"100%", maxWidth:620 },
    orderBanner: { width:"100%", maxWidth:620, gap:3, padding:14, borderRadius:18, backgroundColor:colors.holiday },
    orderBannerTitle: { color:colors.onPrimary, fontSize:14, fontWeight:"800" },
    orderBannerText: { color:colors.onPrimary, fontSize:12, fontWeight:"600" },
    colourButton: { minHeight:44, justifyContent:"center", paddingVertical:7 },
    utilityBubble: { minHeight:28, paddingHorizontal:10, paddingVertical:4, justifyContent:"center", borderRadius:radii.full, backgroundColor:colors.primarySoft },
    viewPane: { width: "100%", alignItems: "center", gap: 10 },
    hidden: { display: "none" },
    // Off screen and invisible rather than display: none, so the hidden year can still measure its text and lay out.
    offscreen: { position: "absolute", top: 0, left: -10000, opacity: 0 },
    brand: { flexDirection: "row", alignItems: "center", gap: 10 },
    brandText: { color: colors.ink, fontSize: 20, fontWeight: "800" },
    modeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.primarySoft },
    modeText: { color: colors.primaryDark, fontSize: 20, lineHeight: 24 },
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
