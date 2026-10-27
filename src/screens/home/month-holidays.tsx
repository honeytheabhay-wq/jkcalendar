import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { useState } from "react";

import { holidays2026, type Holiday } from "@/data/holidays-2026";
import { fromDateKey, toDateKey } from "@/utils/dates";
import { useToday } from "@/utils/today";
import { holidayYearLoaded } from "@/utils/holiday-info";
import { radii, shadows, type ThemeColors, useCalendarTheme } from "@/theme";

export function MonthHolidays({ viewMonth, onSelect }: { viewMonth: Date; onSelect: (date: Date) => void }) {
  const { colors, textScale } = useCalendarTheme();
  const {fontScale}=useWindowDimensions();
  const todayKey=toDateKey(useToday());
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const prefix = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}-`;
  const holidays = holidays2026.filter((holiday) => holiday.date.startsWith(prefix)).sort((a,b)=>b.date.localeCompare(a.date));
  const groups = Array.from(holidays.reduce((dates, holiday) => {
    dates.set(holiday.date, [...(dates.get(holiday.date) ?? []), holiday]);
    return dates;
  }, new Map<string, Holiday[]>()), ([date, items]) => ({date, items}));
  const cardWidth=Math.min(320,200*Math.max(1,textScale*fontScale));
  // Shown on the collapsed card, so the count and the next holiday are visible without opening it.
  const loaded=holidayYearLoaded(viewMonth.getFullYear());
  const next=[...groups].reverse().find(group=>group.date>=todayKey);
  const summary=!loaded?"Schedule unavailable":!holidays.length?"No holidays":next?`Next: ${next.items[0].name}${next.items.length>1?` +${next.items.length-1}`:""} · ${Number(next.date.slice(-2))} ${fromDateKey(next.date).toLocaleDateString("en-IN",{month:"short"})}`:"All past";

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Holidays this month: ${loaded?holidays.length:"unavailable"}. ${summary}`} accessibilityState={{ expanded }} onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [styles.headingRow, pressed && styles.pressed]}>
        <View style={styles.headingText}>
          <View style={styles.titleRow}>
            <Text style={styles.heading}>Holidays this month</Text>
            {loaded?<View style={[styles.countBadge,!holidays.length&&styles.countBadgeEmpty]}><Text allowFontScaling={false} style={[styles.countText,!holidays.length&&styles.countTextEmpty]}>{holidays.length}</Text></View>:null}
          </View>
          {!expanded?<Text numberOfLines={1} style={styles.summary}>{summary}</Text>:null}
        </View>
        <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
      </Pressable>
      {expanded && holidays.length ? (
        <ScrollView key={prefix} horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.list}>
          {groups.map(({date, items}) => {
            const past=date<todayKey;
            const title=items.length>1 ? `${items.length} holidays` : items[0].name;
            return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`${date}, ${items.length} ${items.length===1?"holiday":"holidays"}: ${items.map(h=>`${h.name}, ${h.scope}`).join("; ")}. ${past?"Past":date===todayKey?"Today":"Upcoming"}. Opens all details.`}
              onPress={() => onSelect(fromDateKey(date))}
              style={({ pressed }) => [styles.item, {width:cardWidth},past&&styles.pastItem, pressed && styles.pressed]}
            >
              <View style={[styles.dateBubble,past&&styles.pastBubble]}><Text allowFontScaling={false} style={[styles.day,past&&styles.pastDay]}>{Number(date.slice(-2))}</Text></View>
              <View style={styles.textWrap}>
                <Text numberOfLines={2} style={[styles.name,past&&styles.pastText]}>{title}</Text>
                <Text numberOfLines={1} style={styles.scope}>{items.length>1 ? "Tap to view all" : items[0].scope} · {past?"Past":date===todayKey?"Today":"Upcoming"}</Text>
              </View>
            </Pressable>
          );})}
        </ScrollView>
      ) : expanded ? <Text style={styles.empty}>{holidayYearLoaded(viewMonth.getFullYear()) ? "No official holidays listed for this month." : `Holiday schedule unavailable for ${viewMonth.getFullYear()}.`}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { width: "100%", maxWidth: 620, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: colors.surface, borderRadius: 20, borderCurve: "continuous", boxShadow: shadows.card },
    headingRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    headingText: { flex: 1, gap: 2, paddingVertical: 6 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    heading: { flexShrink: 1, color: colors.ink, fontSize: 14, fontWeight: "800" },
    countBadge: { minWidth: 24, height: 24, paddingHorizontal: 7, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.holiday },
    countBadgeEmpty: { backgroundColor: colors.line },
    countText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
    countTextEmpty: { color: colors.muted },
    summary: { color: colors.muted, fontSize: 11, fontWeight: "600" },
    list: { gap: 8, paddingTop: 4, paddingBottom:8 },
    item: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 8, padding: 9, backgroundColor: colors.weekend, borderRadius: radii.lg, borderCurve: "continuous", borderColor: colors.line, borderWidth: 1 },
    pastItem: { backgroundColor:colors.background },
    pastBubble: { backgroundColor:colors.muted,boxShadow:"none" },
    pastDay: { color:colors.surface },
    pastText: { color:colors.muted },
    dateBubble: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.holiday, borderColor: colors.surface, borderWidth: 2, boxShadow: `0 5px 12px ${colors.primarySoft}` },
    day: { color: colors.onPrimary, fontSize: 15, fontWeight: "800" },
    chevron: { width: 28, color: colors.primaryDark, fontSize: 20, lineHeight: 22, textAlign: "center", fontWeight: "800" },
    textWrap: { flex: 1, gap: 3 },
    name: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "800" },
    scope: { color: colors.muted, fontSize: 10, fontWeight: "600" },
    empty: { color: colors.muted, fontSize: 13, paddingVertical: 6 },
    pressed: { opacity: 0.76 },
  });
}
