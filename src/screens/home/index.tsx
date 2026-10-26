import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

import { CalendarGrid } from "@/components/calendar-grid";
import { SeasonalScreen } from "@/components/seasonal-screen";
import { MonthJump } from "@/components/month-jump";
import { holidayDateAppearance, todayDateColors, radii, shadows, spacing, type ThemeColors, useCalendarTheme } from "@/theme";
import { monthLabel, toDateKey } from "@/utils/dates";
import { useEvents } from "@/utils/events";
import { holidayYearLoaded } from "@/utils/holiday-info";
import { useToday } from "@/utils/today";
import { MonthHolidays } from "./month-holidays";
import { MonthCaption } from "./month-caption";
import { seasonDateForMonth } from "@/utils/seasons";
import { ThemePicker } from "./theme-picker";
import { type CalendarView, ViewTabs } from "./view-tabs";
import { YearCalendar } from "./year-calendar";
import { YearHolidayList } from "./year-holiday-list";

export function Home() {
  const { width, fontScale } = useWindowDimensions();
  const { colors, textScale, setSeasonDateKey } = useCalendarTheme();
  const styles = createStyles(colors);
  const [calendarView, setCalendarView] = useState<CalendarView>("monthly");
  const [coloursOpen, setColoursOpen] = useState(false);
  const [detailsDate, setDetailsDate] = useState<Date | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const today = useToday();
  const followToday = useRef(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const { events, deleteEvent } = useEvents();
  useEffect(()=>{setSeasonDateKey(toDateKey(seasonDateForMonth(viewMonth,today)));},[viewMonth.getFullYear(),viewMonth.getMonth(),today,setSeasonDateKey]);
  const contentWidth = Math.min(Math.max(width - 52, 238), 560);
  const minimumCell=Math.max(44,Math.ceil(30*fontScale*textScale));
  const gridWidth=Math.max(contentWidth,minimumCell*7+6*(contentWidth<380?4:6));
  const calendar=<CalendarGrid viewMonth={viewMonth} selectedDate={selectedDate} events={events} width={gridWidth} onSelect={selectDate} detailsDate={detailsDate} onDeleteEvent={confirmDelete} />;
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

  function changeMonth(offset: number) {
    setDetailsDate(null);
    followToday.current = false;
    setViewMonth((current) => { const nextMonth = new Date(current.getFullYear(), current.getMonth() + offset, 1, 12); return nextMonth.getFullYear() >= 1900 && nextMonth.getFullYear() <= 2100 ? nextMonth : current; });
  }

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
  const swipe = Gesture.Pan().activeOffsetX([-24, 24]).failOffsetY([-16, 16]).onEnd(event => {
    if (Math.abs(event.translationX) > 50 || Math.abs(event.velocityX) > 600) scheduleOnRN(changeMonth, event.translationX < 0 ? 1 : -1);
  });

  return (
    <SeasonalScreen>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
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

      {calendarView === "monthly" ? (
        <>
          <MonthHolidays viewMonth={viewMonth} onSelect={date => { selectDate(date); setDetailsDate(new Date(date)); }} />
          <View style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <View style={styles.monthHeading}><Pressable accessibilityLabel="Choose month and year" onPress={() => setJumpOpen(true)} style={{minHeight:44,justifyContent:"center"}}><Text style={styles.monthTitle}>{monthLabel(viewMonth)} ⌄</Text></Pressable><MonthCaption month={viewMonth} /></View>
              <View style={styles.navigation}>
                <Pressable accessibilityLabel="Previous month" hitSlop={6} onPress={() => changeMonth(-1)} style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}><Text allowFontScaling={false} style={styles.roundButtonText}>‹</Text></Pressable>
                <Pressable onPress={goToToday} style={({ pressed }) => [styles.todayButton, pressed && styles.buttonPressed]}><Text style={styles.todayButtonText}>Today</Text></Pressable>
                <Pressable accessibilityLabel="Next month" hitSlop={6} onPress={() => changeMonth(1)} style={({ pressed }) => [styles.roundButton, pressed && styles.buttonPressed]}><Text allowFontScaling={false} style={styles.roundButtonText}>›</Text></Pressable>
              </View>
            </View>

            {gridWidth>contentWidth ? <ScrollView horizontal style={{width:contentWidth}} showsHorizontalScrollIndicator>{calendar}</ScrollView> : <GestureDetector gesture={swipe}><View collapsable={false}>{calendar}</View></GestureDetector>}

            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={styles.todaySwatch} /><Text style={styles.legendText}>Today</Text></View>
              <View style={styles.legendItem}><View style={styles.holidaySwatch} /><Text style={styles.legendText}>Holiday</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primaryDark }]} /><Text style={styles.legendText}>Personal event</Text></View>
              <Text style={styles.yearNote}>{holidayYearLoaded(viewMonth.getFullYear()) ? "Official list: 2026" : "Holiday schedule unavailable"}</Text>
            </View>
          </View>
        </>
      ) : (
        <YearCalendar year={viewMonth.getFullYear()} width={contentWidth} selectedDate={selectedDate} onJump={() => setJumpOpen(true)} onSelect={(date) => { selectDate(date); setCalendarView("monthly"); }} />
      )}

      <YearHolidayList year={viewMonth.getFullYear()} />
      <MonthJump visible={jumpOpen} month={viewMonth} onClose={() => setJumpOpen(false)} onChoose={date => { setDetailsDate(null); followToday.current = false; setViewMonth(date); setSelectedDate(date); }} />
    </ScrollView>
    </SeasonalScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { alignItems: "center", gap: 10, paddingHorizontal: spacing.md, paddingTop: 4, paddingBottom: spacing.xxl, backgroundColor: colors.background },
    decorativeBubble: { position: "absolute", borderRadius: radii.full, opacity: 0.62 },
    bubbleOne: { width: 170, height: 170, top: -55, right: -70, backgroundColor: colors.today },
    bubbleTwo: { width: 120, height: 120, top: 210, left: -75, backgroundColor: colors.primarySoft },
    toolbar: { width:"100%", maxWidth:620, flexDirection:"row", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:4 },
    utilities: { flexDirection:"row", gap:5, marginLeft:"auto" },
    themePanel: { width:"100%", maxWidth:620 },
    colourButton: { minHeight:44, justifyContent:"center", paddingVertical:7 },
    utilityBubble: { minHeight:28, paddingHorizontal:10, paddingVertical:4, justifyContent:"center", borderRadius:radii.full, backgroundColor:colors.primarySoft },
    colourText: { color: colors.primaryDark, fontSize: 11, fontWeight: "700" },
    calendarCard: { width: "100%", maxWidth: 620, alignItems: "center", gap: 20, paddingHorizontal: 10, paddingVertical: 20, backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: "continuous", boxShadow: shadows.card },
    monthRow: { width: "100%", flexDirection: "row", flexWrap:"wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, paddingHorizontal: spacing.xs },
    monthTitle: { flexShrink: 1, color: colors.ink, fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
    monthHeading: { flexShrink: 1, minHeight: 44, justifyContent: "center" },
    navigation: { flexDirection: "row", alignItems: "center", gap: 5 },
    roundButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.primarySoft },
    roundButtonText: { color: colors.primaryDark, fontSize: 24, lineHeight: 25 },
    todayButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: radii.full, backgroundColor: colors.today },
    todayButtonText: { color: colors.todayInk, fontSize: 12, fontWeight: "800" },
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
