import { Host, Switch } from "@expo/ui";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { radii, type ThemeColors, useCalendarTheme } from "@/theme";
import { fromDateKey, longDateLabel, toDateKey } from "@/utils/dates";
import { normaliseTime, validateEvent, validDateKey, type Repeat } from "@/utils/event-model";
import { useEvents } from "@/utils/events";
import { requestReminderPermission } from "@/utils/reminders";
import { parseQuickEntry } from "@/utils/quick-entry";
import { SeasonalScreen } from "@/components/seasonal-screen";

export default function AddEventRoute() {
  const { colors, themeName } = useCalendarTheme(), s = styles(colors);
  const params = useLocalSearchParams<{ date?: string; id?: string }>();
  const { events, saveEvent } = useEvents();
  const id = typeof params.id === "string" ? params.id : undefined;
  const existing = events.find(event => event.id === id);
  const initialDate = existing?.date ?? (typeof params.date === "string" && validDateKey(params.date) ? params.date : toDateKey(new Date()));
  let initialTime = "09:00"; try { initialTime = normaliseTime(existing?.time) ?? initialTime; } catch {}
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(fromDateKey(initialDate));
  const [allDay, setAllDay] = useState(!existing?.time);
  const [time, setTime] = useState(initialTime);
  const [repeat, setRepeat] = useState<Repeat>(existing?.repeat ?? "none");
  const [reminder, setReminder] = useState<number | null>(existing?.reminderMinutes ?? null);
  const [picker, setPicker] = useState<"date" | "time" | null>(null);
  const [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const [phrase, setPhrase] = useState(""), [quickNote, setQuickNote] = useState("");
  function fillFromPhrase() {
    try {
      const parsed = parseQuickEntry(phrase), event = parsed.event;
      setTitle(event.title); setDate(fromDateKey(event.date)); setAllDay(!event.time); setTime(event.time ?? "09:00"); setRepeat(event.repeat ?? "none"); setReminder(null); setError("");
      setQuickNote(["Details filled. Review the date and time, then save.", ...parsed.notes].join(" "));
    } catch (e) { setQuickNote(""); setError(e instanceof Error ? e.message : "Could not understand that event."); }
  }

  async function save() {
    if (saving) return;
    setError(""); setSaving(true);
    try {
      const input = validateEvent({ title, date: toDateKey(date), time: allDay ? undefined : time, repeat, reminderMinutes: allDay ? null : reminder });
      if (id && !existing) throw new Error("This event no longer exists.");
      let permitted = true;
      if (input.reminderMinutes != null) permitted = await requestReminderPermission();
      const warning = await saveEvent(input, id);
      if (Platform.OS === "ios") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (warning || !permitted) Alert.alert("Event saved", warning ?? "Notifications are off. Your event is saved; enable notifications in phone settings and reopen the app to activate reminders.");
      router.back();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this event."); }
    finally { setSaving(false); }
  }
  const timeDate = new Date(date); const [hour, minute] = time.split(":").map(Number); timeDate.setHours(hour, minute, 0, 0);
  return <SeasonalScreen><ScrollView contentInsetAdjustmentBehavior="automatic" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <Stack.Screen options={{ title: id ? "Edit event" : "New event" }} />
    {!id ? <><Text style={s.label}>Quick entry</Text><TextInput accessibilityLabel="Describe an event in English" style={s.input} value={phrase} onChangeText={setPhrase} placeholder="Meeting tomorrow at 11am" placeholderTextColor={colors.muted} maxLength={350} onSubmitEditing={fillFromPhrase} /><Pressable onPress={fillFromPhrase} style={s.smallButton}><Text style={s.buttonText}>Fill event details</Text></Pressable><Text accessibilityLiveRegion="polite" style={s.note}>{quickNote || "English · day/month dates · Works offline. You can also use your keyboard’s dictation."}</Text></> : null}
    <Text style={s.label}>What’s the plan?</Text>
    <TextInput accessibilityLabel="Event title" style={s.input} value={title} onChangeText={setTitle} placeholder="Event title" placeholderTextColor={colors.muted} maxLength={150} />
    <Text style={s.label}>Date</Text>
    <Pressable style={s.input} onPress={() => setPicker("date")}><Text style={s.value}>{longDateLabel(date)}</Text></Pressable>
    <Host matchContents colorScheme={themeName === "midnight-indigo" ? "dark" : "light"} seedColor={colors.primary}><Switch label="All day" value={allDay} onValueChange={value => { setAllDay(value); if (value) setReminder(null); }} /></Host>
    {!allDay ? <><Text style={s.label}>Time</Text><Pressable style={s.input} onPress={() => setPicker("time")}><Text style={s.value}>{timeDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</Text></Pressable></> : null}
    {picker ? <View style={s.picker}>
      <DateTimePicker themeVariant={themeName === "midnight-indigo" ? "dark" : "light"} accentColor={colors.primary} value={picker === "date" ? date : timeDate} mode={picker} display={Platform.OS === "ios" ? "spinner" : "default"} minimumDate={picker === "date" ? new Date(1900, 0, 1) : undefined} maximumDate={picker === "date" ? new Date(2100, 11, 31) : undefined} onChange={(event, value) => { if (Platform.OS !== "ios") setPicker(null); if (event.type === "dismissed" || !value) return; if (picker === "date") setDate(new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12)); else setTime(`${String(value.getHours()).padStart(2,"0")}:${String(value.getMinutes()).padStart(2,"0")}`); }} />
      {Platform.OS === "ios" ? <Pressable style={s.smallButton} onPress={() => setPicker(null)}><Text style={s.buttonText}>Done</Text></Pressable> : null}
    </View> : null}
    <Text style={s.label}>Repeat</Text>
    <View style={s.choices}>{(["none", "daily", "weekly", "monthly", "yearly"] as const).map(value => <Pressable key={value} accessibilityState={{ selected: repeat === value }} onPress={() => setRepeat(value)} style={[s.choice, repeat === value && s.chosen]}><Text style={[s.choiceText, repeat === value && s.chosenText]}>{value === "none" ? "Does not repeat" : value[0].toUpperCase() + value.slice(1)}</Text></Pressable>)}</View>
    {repeat === "monthly" || repeat === "yearly" ? <Text style={s.note}>Repeats on the same calendar date. Months/years without that date are skipped.</Text> : null}
    {id && repeat !== "none" ? <Text style={s.note}>Editing saves changes to the whole repeating series.</Text> : null}
    {!allDay ? <><Text style={s.label}>Reminder</Text><View style={s.choices}>{([null, 0, 30, 60, 1440] as const).map(value => <Pressable key={String(value)} accessibilityState={{ selected: reminder === value }} onPress={() => setReminder(value)} style={[s.choice, reminder === value && s.chosen]}><Text style={[s.choiceText, reminder === value && s.chosenText]}>{value === null ? "Off" : value === 0 ? "At event time" : value === 1440 ? "1 day before" : `${value} min before`}</Text></Pressable>)}</View><Text style={s.note}>The next 40 alerts across your events are queued on the phone and refreshed when you reopen the app. Alerts already queued work offline.</Text></> : null}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Pressable disabled={saving} onPress={save} style={[s.save, saving && { opacity: .6 }]}><Text style={s.saveText}>{saving ? "Saving…" : "Save event"}</Text></Pressable>
    <Pressable onPress={() => router.back()} style={s.smallButton}><Text style={s.buttonText}>Cancel</Text></Pressable>
  </ScrollView></SeasonalScreen>;
}
function styles(c: ThemeColors) { return StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 12, backgroundColor: c.background }, heading: { color: c.ink, fontSize: 23, fontWeight: "800" }, label: { color: c.ink, fontSize: 13, fontWeight: "700" }, input: { minHeight: 50, justifyContent: "center", padding: 13, color: c.ink, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.line, fontSize: 16 }, value: { color: c.ink, fontSize: 14 }, switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }, picker: { backgroundColor: c.surface, borderRadius: 16, padding: 10 }, choices: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, choice: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, backgroundColor: c.primarySoft, borderRadius: radii.full }, chosen: { backgroundColor: c.primary }, choiceText: { color: c.primaryDark, fontSize: 12 }, chosenText: { color: c.onPrimary }, note: { color: c.muted, fontSize: 11, lineHeight: 17 }, error: { color: c.danger, fontSize: 13 }, save: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: c.primary }, saveText: { color: c.onPrimary, fontSize: 15, fontWeight: "800" }, smallButton: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: c.primarySoft }, buttonText: { color: c.primaryDark, fontSize: 13, fontWeight: "700" },
}); }

