import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { radii, useCalendarTheme } from "@/theme";
import { useSeasonOverlay } from "@/utils/season-motion-state";
import { SeasonalScreen } from "./seasonal-screen";

export function MonthJump({ visible, month, onClose, onChoose }: { visible: boolean; month: Date; onClose: () => void; onChoose: (date: Date) => void }) {
  const { colors: c } = useCalendarTheme();
  const [year, setYear] = useState(String(month.getFullYear()));
  const [selected, setSelected] = useState(month.getMonth());
  useSeasonOverlay(visible);
  useEffect(() => { if (visible) { setYear(String(month.getFullYear())); setSelected(month.getMonth()); } }, [visible, month]);
  const valid = /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= 2100;
  const s = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 24 }, panel: { backgroundColor: c.surface, borderRadius: 24, padding: 20, gap: 14 }, title: { color: c.ink, fontSize: 18, fontWeight: "800" }, row: { flexDirection: "row", alignItems: "center", gap: 8 }, input: { flex: 1, minHeight: 46, textAlign: "center", color: c.ink, backgroundColor: c.background, borderRadius: 14, borderColor: c.line, borderWidth: 1, fontSize: 20 }, button: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: radii.full, backgroundColor: c.primarySoft }, label: { color: c.primaryDark, fontSize: 13, fontWeight: "700" }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, month: { width: "30%", minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: c.background }, active: { backgroundColor: c.primary }, activeText: { color: c.onPrimary }, error: { color: c.danger, fontSize: 12 } });
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <SeasonalScreen modal>
    <View style={s.backdrop}><View accessibilityViewIsModal style={s.panel}>
      <Text style={s.title}>Jump to month</Text>
      <View style={s.row}><Pressable accessibilityLabel="Previous year" style={s.button} onPress={() => setYear(String(Math.max(1900, (Number(year) || month.getFullYear()) - 1)))}><Text style={s.label}>−</Text></Pressable><TextInput accessibilityLabel="Year" style={s.input} keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} /><Pressable accessibilityLabel="Next year" style={s.button} onPress={() => setYear(String(Math.min(2100, (Number(year) || month.getFullYear()) + 1)))}><Text style={s.label}>+</Text></Pressable></View>
      <View style={s.grid}>{Array.from({ length: 12 }, (_, index) => <Pressable key={index} accessibilityState={{ selected: selected === index }} onPress={() => setSelected(index)} style={[s.month, selected === index && s.active]}><Text style={[s.label, selected === index && s.activeText]}>{new Date(2026, index, 1).toLocaleDateString(undefined, { month: "short" })}</Text></Pressable>)}</View>
      {!valid ? <Text accessibilityRole="alert" style={s.error}>Enter a year from 1900 to 2100.</Text> : null}
      <View style={s.row}><Pressable style={s.button} onPress={onClose}><Text style={s.label}>Cancel</Text></Pressable><Pressable disabled={!valid} style={[s.button, s.active, { flex: 1, opacity: valid ? 1 : .4 }]} onPress={() => { onChoose(new Date(Number(year), selected, 1, 12)); onClose(); }}><Text style={[s.label, s.activeText]}>Open month</Text></Pressable></View>
    </View></View>
    </SeasonalScreen>
  </Modal>;
}
