import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { useState } from "react";

import { holidays2026 } from "@/data/holidays-2026";
import { fromDateKey } from "@/utils/dates";
import { radii, shadows, spacing, type ThemeColors, useCalendarTheme } from "@/theme";

type Calculation = { working: number; weeklyOffs: number; holidayClosures: number };

function calculateWorkingDays(year: number, fiveDayWeek: boolean): Calculation {
  const totalDays = Math.round((new Date(year + 1, 0, 1, 12).getTime() - new Date(year, 0, 1, 12).getTime()) / 86_400_000);
  let weeklyOffs = 0;
  for (let index = 0; index < totalDays; index += 1) {
    const date = new Date(year, 0, index + 1, 12);
    if (date.getDay() === 0 || (fiveDayWeek && date.getDay() === 6)) weeklyOffs += 1;
  }

  const generalDates = [...new Set(holidays2026.filter((holiday) => holiday.kind === "general" && holiday.date.startsWith(`${year}-`)).map((holiday) => holiday.date))];
  const holidayClosures = generalDates.filter((dateKey) => {
    const day = fromDateKey(dateKey).getDay();
    return day !== 0 && (!fiveDayWeek || day !== 6);
  }).length;

  return { working: totalDays - weeklyOffs - holidayClosures, weeklyOffs, holidayClosures };
}

export function WorkingDays({ year }: { year: number }) {
  const { colors } = useCalendarTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const fiveDay = calculateWorkingDays(year, true);
  const sixDay = calculateWorkingDays(year, false);

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerText}><Text style={styles.title}>Working days in {year}</Text><Text style={styles.subtitle}>5-day: {fiveDay.working} · 6-day: {sixDay.working}</Text></View>
        <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
      </Pressable>
      {expanded ? (
        <>
          <Text style={styles.subtitle}>Calculated after weekly offs and unique J&K general holidays.</Text>
          <View style={styles.results}>
            <View style={styles.result}>
              <Text style={styles.schedule}>5-day week</Text>
              <Text selectable style={styles.total}>{fiveDay.working}</Text>
              <Text style={styles.breakdown}>{fiveDay.weeklyOffs} Sat/Sun offs · {fiveDay.holidayClosures} holiday closures</Text>
            </View>
            <View style={styles.result}>
              <Text style={styles.schedule}>6-day week</Text>
              <Text selectable style={styles.total}>{sixDay.working}</Text>
              <Text style={styles.breakdown}>{sixDay.weeklyOffs} Sunday offs · {sixDay.holidayClosures} holiday closures</Text>
            </View>
        </View>
          <Text style={styles.note}>Provincial, local and restricted holidays are shown in the calendar but are not deducted here because their applicability varies by office and location.</Text>
        </>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: { width: "100%", maxWidth: 620, gap: spacing.sm, padding: 18, backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: "continuous", boxShadow: shadows.card },
    header: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    headerText: { flex: 1, gap: 4 },
    title: { color: colors.ink, fontSize: 18, fontWeight: "800" },
    subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
    results: { flexDirection: "row", gap: 10, paddingTop: 4 },
    result: { flex: 1, minHeight: 118, justifyContent: "space-between", padding: 14, backgroundColor: colors.primarySoft, borderRadius: radii.lg, borderCurve: "continuous", borderColor: colors.line, borderWidth: 1.5 },
    schedule: { color: colors.primaryDark, fontSize: 12, fontWeight: "800" },
    total: { color: colors.ink, fontSize: 32, fontWeight: "800", fontVariant: ["tabular-nums"] },
    breakdown: { color: colors.muted, fontSize: 10, lineHeight: 14, fontWeight: "600" },
    note: { color: colors.muted, fontSize: 10, lineHeight: 15 },
    chevron: { width: 32, color: colors.primaryDark, fontSize: 22, lineHeight: 24, textAlign: "center", fontWeight: "800" },
    pressed: { opacity: 0.74 },
  });
}
