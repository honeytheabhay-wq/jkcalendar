import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { buildReminderPlan, type CalendarEvent } from "./event-model";
import { holidays2026 } from "../data/holidays-2026";
import { buildHolidayReminderPlan } from "./holiday-reminders";
import { getPreferences } from "./preferences";
import { getReminderStatus, updateReminderStatus } from "./reminder-status";

const owner = "jk-calendar";
let chain: Promise<void> = Promise.resolve();
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

export async function requestReminderPermission() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("calendar-reminders", { name: "Calendar reminders", importance: Notifications.AndroidImportance.DEFAULT });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const permission = await Notifications.requestPermissionsAsync();
  return permission.granted;
}

export function syncReminders(events: CalendarEvent[]): Promise<void> {
  const run = async () => {
    if (Platform.OS === "web") return;
    const permission = await Notifications.getPermissionsAsync();
    const { holidayReminders, holidayReminderHour } = getPreferences();
    // Personal events (up to 40) plus the evening-before alerts for the next 20 holidays: under iOS's 64-alert cap.
    const plans = permission.granted ? [
      ...buildReminderPlan(events).map(plan => ({ id: plan.id, at: plan.at, title: plan.title, body: `${plan.date} at ${plan.time}`, data: { eventId: plan.eventId, date: plan.date } })),
      ...buildHolidayReminderPlan(holidays2026, holidayReminders, holidayReminderHour).map(plan => ({ id: plan.id, at: plan.at, title: plan.title, body: plan.body, data: { holidayDate: plan.date } })),
    ] : [];
    updateReminderStatus({ granted: permission.granted, expected: plans.length, error: null });
    const desired = new Set(plans.map(plan => plan.id));
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ours = scheduled.filter(item => item.content.data?.calendarOwner === owner);
    for (const item of ours) if (!desired.has(item.identifier)) await Notifications.cancelScheduledNotificationAsync(item.identifier);
    if (!permission.granted) { updateReminderStatus({ queued: 0, lastSyncAt: Date.now() }); return; }
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("calendar-reminders", { name: "Calendar reminders", importance: Notifications.AndroidImportance.DEFAULT });
    const existing = new Set(ours.map(item => item.identifier));
    for (const plan of plans) if (!existing.has(plan.id)) await Notifications.scheduleNotificationAsync({
      identifier: plan.id,
      content: { title: plan.title, body: plan.body, data: { calendarOwner: owner, ...plan.data } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(plan.at), channelId: "calendar-reminders" },
    });
    const verified = await Notifications.getAllScheduledNotificationsAsync();
    const queued = verified.filter(item => desired.has(item.identifier)).length;
    if (queued !== plans.length) throw new Error("Some reminders were not queued. Tap Repair reminders to retry.");
    updateReminderStatus({ queued, lastSyncAt: Date.now(), error: null });
  };
  const attempt = async () => {
    try { await run(); }
    catch {
      await new Promise(resolve => setTimeout(resolve, 750));
      try { await run(); }
      catch (e) { updateReminderStatus({ error: e instanceof Error ? e.message : "Could not update reminders. Tap Repair reminders to retry." }); throw e; }
    }
  };
  const result = chain.then(attempt, attempt); chain = result.catch(() => {}); return result;
}

export async function sendTestReminder() {
  if (!await requestReminderPermission()) throw new Error("Enable notifications in phone settings to send a test.");
  const id = `jkcalendar-test:${Date.now()}`, at = Date.now() + 30_000;
  const previous = getReminderStatus().testId;
  if (previous) await Notifications.cancelScheduledNotificationAsync(previous);
  await Notifications.scheduleNotificationAsync({ identifier: id, content: { title: "J&K Calendar test", body: "Your test reminder arrived. Tap to confirm delivery.", data: { calendarOwner: "jk-calendar-test" } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at), channelId: "calendar-reminders" } });
  updateReminderStatus({ testId: id, testAt: at, testReceivedAt: undefined });
}

export function startReminderDeliveryListener() {
  if (Platform.OS === "web") return () => {};
  const record = (notification: Notifications.Notification) => { const status=getReminderStatus();if (!status.testReceivedAt && notification.request.content.data?.calendarOwner === "jk-calendar-test" && notification.request.identifier === status.testId) updateReminderStatus({ testReceivedAt: Date.now() }); };
  const received = Notifications.addNotificationReceivedListener(record);
  const response = Notifications.addNotificationResponseReceivedListener(event => record(event.notification));
  void Notifications.getLastNotificationResponseAsync().then(event => { if (event) record(event.notification); }).catch(() => {});
  return () => { received.remove(); response.remove(); };
}
