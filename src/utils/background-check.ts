import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
import { getEvents } from "./events";
import { refreshHolidayList } from "./holiday-store";
import { checkOfficialOrders } from "./official-orders";
import { getPreferences } from "./preferences";
import { notifyHolidayListChanges, syncReminders } from "./reminders";

// A few times a day, even with the app closed, Android/iOS wake the app briefly to download the online holiday list
// (moon-sighting dates, special closures) and check GAD for new holiday orders, so a change announced the evening
// before still reaches the phone. The OS decides the exact timing (Android: no more often than every 15 minutes).
const taskName = "jk-calendar-holiday-check";

type TaskManagerModule = typeof import("expo-task-manager");
type BackgroundTaskModule = typeof import("expo-background-task");
// Loaded defensively: builds made before these native modules were added must keep working without them.
function modules(): { TaskManager: TaskManagerModule; BackgroundTask: BackgroundTaskModule } | null {
  if (Platform.OS === "web") return null;
  // Check for the native parts first: requiring a JS package whose native module is missing shows an error screen
  // even when caught.
  if (!requireOptionalNativeModule("ExpoTaskManager") || !requireOptionalNativeModule("ExpoBackgroundTask")) return null;
  try { return { TaskManager: require("expo-task-manager"), BackgroundTask: require("expo-background-task") }; } catch { return null; }
}

export async function runHolidayCheck() {
  const changes = await refreshHolidayList(true);
  if (changes.length) { await notifyHolidayListChanges(changes).catch(() => {}); await syncReminders(getEvents()).catch(() => {}); }
  if (getPreferences().autoCheckOrders) await checkOfficialOrders().catch(() => {});
}

// Must run at startup (index.js), before the OS asks the app to run the task.
export function defineHolidayCheckTask() {
  const m = modules();
  if (!m) return;
  try {
    m.TaskManager.defineTask(taskName, async () => {
      try { await runHolidayCheck(); return m.BackgroundTask.BackgroundTaskResult.Success; }
      catch { return m.BackgroundTask.BackgroundTaskResult.Failed; }
    });
  } catch {}
}

export async function registerHolidayCheckTask() {
  const m = modules();
  if (!m) return;
  try {
    if ((await m.BackgroundTask.getStatusAsync()) !== m.BackgroundTask.BackgroundTaskStatus.Available) return;
    if (!(await m.TaskManager.isTaskRegisteredAsync(taskName))) await m.BackgroundTask.registerTaskAsync(taskName, { minimumInterval: 240 });
  } catch {}
}
