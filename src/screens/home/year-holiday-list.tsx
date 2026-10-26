import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText as Text } from "@/components/app-text";

import { holidays2026, type Holiday } from "@/data/holidays-2026";
import { fromDateKey, toDateKey } from "@/utils/dates";
import { radii, shadows, spacing, type ThemeColors, useCalendarTheme } from "@/theme";
import { HolidayDetails } from "@/components/holiday-details";
import { holidayYearLoaded } from "@/utils/holiday-info";
import { useToday } from "@/utils/today";

const kindLabels = { general: "J&K", provincial: "Provincial", local: "Local", restricted: "Restricted" } as const;

function HolidayRow({ holiday, past, colors, onOpen, compact = false }: { holiday: Holiday; past: boolean; colors: ThemeColors; onOpen: (holiday: Holiday) => void; compact?: boolean }) {
  const styles = createStyles(colors);
  const {textScale}=useCalendarTheme(),{fontScale}=useWindowDimensions(),factor=Math.max(1,textScale*fontScale),badge=43*Math.sqrt(factor);
  const date = fromDateKey(holiday.date);
  return (
    <Pressable onPress={() => onOpen(holiday)} accessibilityRole="button" accessibilityLabel={`${holiday.name}, ${holiday.date}, ${holiday.scope}, ${past ? "Past" : "Upcoming"}. Open details and source.`} style={[styles.row, compact && {height:Math.ceil(64*factor)}, past && styles.pastRow]}>
      <View style={[styles.dateBubble, {width:badge,height:badge}, past && styles.pastBubble]}>
        <Text style={[styles.month, past && styles.pastText]}>{date.toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</Text>
        <Text style={[styles.day, past && styles.pastText]}>{date.getDate()}</Text>
      </View>
      <View style={styles.text}>
        <Text numberOfLines={compact ? 2 : undefined} style={[styles.name, past && styles.pastName]}>{holiday.name}</Text>
        <Text numberOfLines={compact ? 1 : undefined} style={styles.scope}>{kindLabels[holiday.kind]} · {holiday.scope}{holiday.subjectToMoon ? " · Moon sighting" : ""}</Text>
      </View>
      {factor<=1.4?<Text style={[styles.status, past ? styles.pastStatus : styles.upcomingStatus]}>{past ? "Past" : "Upcoming"}</Text>:null}
    </Pressable>
  );
}

export function YearHolidayList({ year }: { year: number }) {
  const { colors, textScale } = useCalendarTheme();
  const { fontScale }=useWindowDimensions();
  const styles = createStyles(colors);
  const todayKey = toDateKey(useToday());
  const [detail, setDetail] = useState<Holiday | null>(null);
  const [expanded, setExpanded] = useState(false);
  const holidays = holidays2026.filter((holiday) => holiday.date.startsWith(`${year}-`)).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = holidays.filter((holiday) => holiday.date >= todayKey);
  const past = holidays.filter((holiday) => holiday.date < todayKey).reverse();
  const visibleRows = Math.min(10, holidays.length);
  const viewportHeight = visibleRows * Math.ceil(64*Math.max(1,textScale*fontScale)) + Math.max(0, visibleRows - 1) * 8;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Holidays this year</Text>
        <Pressable disabled={!holidayYearLoaded(year)} accessibilityRole="button" accessibilityLabel={holidayYearLoaded(year) ? `${holidays.length} entries. ${expanded ? "Hide" : "Show"} all holidays in one scrollable list` : `Holiday schedule unavailable for ${year}`} accessibilityState={{ expanded, disabled: !holidayYearLoaded(year) }} onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [styles.countButton, pressed && styles.pressed]}>
          <Text style={styles.count}>{holidayYearLoaded(year) ? `${holidays.length} entries ${expanded ? "⌃" : "⌄"}` : "Unavailable"}</Text>
        </Pressable>
      </View>
      {!holidayYearLoaded(year) ? <Text style={styles.empty}>Holiday schedule unavailable for {year}.</Text> : expanded ? <View style={styles.dropdown}>
        <Text style={styles.sectionTitle}>All {holidays.length} holidays · Scroll to browse</Text>
        <ScrollView key={year} nestedScrollEnabled showsVerticalScrollIndicator style={[styles.dropdownScroll, { height: viewportHeight }]} contentContainerStyle={styles.dropdownContent}>
          {holidays.map((holiday, index) => <HolidayRow key={`all-${holiday.date}-${holiday.name}-${index}`} holiday={holiday} past={holiday.date < todayKey} colors={colors} onOpen={setDetail} compact />)}
        </ScrollView>
      </View> : <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming · {upcoming.length}</Text>
          {upcoming.length ? upcoming.slice(0, 3).map((holiday, index) => <HolidayRow key={`future-${holiday.date}-${holiday.name}-${index}`} holiday={holiday} past={false} colors={colors} onOpen={setDetail} />) : <Text style={styles.empty}>No holidays remain this year.</Text>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past · {past.length}</Text>
          {past.slice(0, 2).map((holiday, index) => <HolidayRow key={`past-${holiday.date}-${holiday.name}-${index}`} holiday={holiday} past colors={colors} onOpen={setDetail} />)}
        </View>
        <Text style={styles.empty}>Tap {holidays.length} entries to browse the complete list.</Text>
      </>}
      <HolidayDetails holiday={detail} onClose={() => setDetail(null)} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { width: "100%", maxWidth: 620, gap: spacing.lg, padding: 18, backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: "continuous", boxShadow: shadows.card },
    header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
    title: { color: colors.ink, fontSize: 17, fontWeight: "800" },
    countButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: radii.full },
    count: { color: colors.onPrimary, fontSize: 11, fontWeight: "800" },
    pressed: { opacity: 0.75 },
    section: { gap: 8 },
    sectionTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
    row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 10, padding: 9, backgroundColor: colors.background, borderColor: colors.line, borderWidth: 1, borderRadius: radii.lg, borderCurve: "continuous" },
    compactRow: { height: 64 },
    pastRow: { backgroundColor: colors.background },
    dateBubble: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.primary, borderColor: colors.surface, borderWidth: 2 },
    pastBubble: { backgroundColor: colors.muted },
    month: { color: colors.onPrimary, fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
    day: { color: colors.onPrimary, fontSize: 15, lineHeight: 17, fontWeight: "800", fontVariant: ["tabular-nums"] },
    pastText: { color: colors.surface },
    text: { flex: 1, gap: 3 },
    name: { color: colors.ink, fontSize: 12, fontWeight: "800" },
    pastName: { color: colors.muted },
    scope: { color: colors.muted, fontSize: 9, lineHeight: 13, fontWeight: "600" },
    status: { overflow: "hidden", paddingHorizontal: 7, paddingVertical: 5, borderRadius: radii.full, fontSize: 9, fontWeight: "800" },
    upcomingStatus: { color: colors.todayInk, backgroundColor: colors.today },
    pastStatus: { color: colors.muted, backgroundColor: colors.line },
    empty: { color: colors.muted, fontSize: 12, paddingVertical: 6 },
    dropdown: { gap: 10, padding: 10, borderColor: colors.line, borderWidth: 1, borderRadius: radii.lg, backgroundColor: colors.background },
    dropdownScroll: { flexGrow: 0 },
    dropdownContent: { gap: 8, paddingRight: 3 },
  });
}
