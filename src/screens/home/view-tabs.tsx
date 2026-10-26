import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "@/components/app-text";

import { radii, type ThemeColors, useCalendarTheme } from "@/theme";

export type CalendarView = "monthly" | "yearly";

export function ViewTabs({ value, onChange }: { value: CalendarView; onChange: (value: CalendarView) => void }) {
  const { colors } = useCalendarTheme();
  const styles = createStyles(colors);

  return (
    <View accessibilityLabel="Calendar view" style={styles.tabs}>
      <View pointerEvents="none" style={styles.track} />
      {(["monthly", "yearly"] as const).map((tab) => {
        const selected = value === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.pill,selected&&styles.selectedTab]}><Text style={[styles.label, selected && styles.selectedLabel]}>{tab === "monthly" ? "Monthly" : "Yearly"}</Text></View>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tabs: { width: 170, maxWidth: "100%", flexDirection: "row", gap: 2, paddingHorizontal:2, position:"relative" },
    track: { position:"absolute", top:7, bottom:7, left:0, right:0, borderRadius:radii.full, backgroundColor:colors.primarySoft },
    tab: { flex: 1, minHeight: 44, alignItems: "stretch", justifyContent: "center", paddingVertical:7 },
    pill: { minHeight:28, alignItems:"center", justifyContent:"center", paddingHorizontal:6, paddingVertical:4, borderRadius:radii.full },
    selectedTab: { backgroundColor: colors.primary, boxShadow: `0 7px 16px ${colors.primarySoft}` },
    label: { color: colors.primaryDark, fontSize: 11, fontWeight: "800" },
    selectedLabel: { color: colors.onPrimary },
    pressed: { opacity: 0.78 },
  });
}
