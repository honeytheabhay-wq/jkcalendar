import { useState } from "react";
import { Linking, Modal, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import type { Holiday } from "@/data/holidays-2026";
import { useCalendarTheme } from "@/theme";
import { fromDateKey } from "@/utils/dates";
import { holidaySource } from "@/utils/holiday-info";
import { useSeasonOverlay } from "@/utils/season-motion-state";
import { SeasonalScreen } from "./seasonal-screen";

export function HolidayDetails({ holiday, onClose }: { holiday: Holiday | null; onClose: () => void }) {
  const { colors: c } = useCalendarTheme();
  const [error, setError] = useState("");
  useSeasonOverlay(Boolean(holiday));
  if (!holiday) return null;
  const source = holidaySource(holiday);
  async function openSource() {
    setError("");
    try { await Linking.openURL(source.url); } catch { setError("Could not open the order. Please try again when connected."); }
  }
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <SeasonalScreen modal>
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: `${c.ink}66` }}>
      <View accessibilityViewIsModal style={{ width: "100%", maxWidth: 480, alignSelf: "center", maxHeight: "85%", borderRadius: 24, padding: 22, gap: 16, backgroundColor: c.surface }}>
        <ScrollView contentContainerStyle={{ gap: 12 }}>
          <Text selectable style={{ color: c.ink, fontSize: 21, fontWeight: "800" }}>{holiday.name}</Text>
          <Text selectable style={{ color: c.ink, fontSize: 14 }}>{fromDateKey(holiday.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text>
          <Text selectable style={{ color: c.muted, fontSize: 13 }}>{holiday.scope} · {holiday.kind} holiday</Text>
          <Text style={{ color: c.primaryDark, fontSize: 12 }}>{holiday.subjectToMoon ? "Tentative · Subject to moon sighting" : "Scheduled · Official holiday order"}</Text>
          <Text style={{ color: c.primaryDark, fontSize: 12, fontWeight: "800" }}>{source.amended ? "AMENDED ORDER" : "SOURCE ORDER"}</Text>
          <Text selectable style={{ color: c.ink, fontSize: 14 }}>{source.order}</Text>
          <Text selectable style={{ color: c.muted, fontSize: 12 }}>{source.date} · J&K General Administration Department</Text>
          <Text selectable style={{ color: c.ink, fontSize: 13 }}>{source.note}</Text>
          <Pressable accessibilityRole="link" onPress={openSource} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: c.primaryDark, fontSize: 14, textDecorationLine: "underline" }}>Open official order ↗</Text></Pressable>
          {error ? <Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text> : null}
        </ScrollView>
        <Pressable onPress={onClose} accessibilityLabel="Close holiday details" style={{ minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: c.primary }}><Text style={{ color: c.onPrimary, fontWeight: "700" }}>Done</Text></Pressable>
      </View>
    </View>
    </SeasonalScreen>
  </Modal>;
}
