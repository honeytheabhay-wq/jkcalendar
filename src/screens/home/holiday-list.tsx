import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { HolidayDetails } from "@/components/holiday-details";

import type { Holiday } from "@/data/holidays-2026";
import { radii, spacing, type ThemeColors, useCalendarTheme } from "@/theme";

const kindLabels = {
  general: "J&K holiday",
  provincial: "Provincial holiday",
  local: "Local holiday",
  restricted: "Restricted holiday",
} as const;

export function HolidayList({ holidays }: { holidays: Holiday[] }) {
  const { colors } = useCalendarTheme();
  const styles = createStyles(colors);
  const [detail, setDetail] = useState<Holiday | null>(null);
  if (!holidays.length) return null;

  return (
    <View style={styles.list}>
      {holidays.map((holiday, index) => (
        <Pressable key={`${holiday.date}-${holiday.name}-${index}`} accessibilityRole="button" accessibilityLabel={`Details and source for ${holiday.name}`} onPress={() => setDetail(holiday)} style={styles.row}>
          <View style={styles.icon}><Text style={styles.iconText}>H</Text></View>
          <View style={styles.text}>
            <Text selectable style={styles.name}>{holiday.name}</Text>
            <Text style={styles.scope}>{kindLabels[holiday.kind]} · {holiday.scope}</Text>
            <Text style={styles.note}>{holiday.subjectToMoon ? "Tentative · Subject to moon sighting" : "Scheduled · Official order"}</Text>
            <Text style={styles.scope}>Details & source ↗</Text>
          </View>
        </Pressable>
      ))}
      <HolidayDetails holiday={detail} onClose={() => setDetail(null)} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: { gap: spacing.sm },
    row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colors.weekend, borderRadius: radii.lg, borderCurve: "continuous" },
    icon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.holiday },
    iconText: { color: colors.onPrimary, fontSize: 13, fontWeight: "800" },
    text: { flex: 1, gap: 3 },
    name: { color: colors.ink, fontSize: 14, fontWeight: "700" },
    scope: { color: colors.muted, fontSize: 11, fontWeight: "600" },
    note: { color: colors.holiday, fontSize: 10, fontWeight: "600" },
  });
}
