import Constants, { ExecutionEnvironment } from "expo-constants";
import type { CalendarEvent } from "@/utils/event-model";
import { getPreferences } from "@/utils/preferences";
import { widgetTimeline, type WidgetPalette } from "@/utils/widget-data";

export async function syncWidgets(events: CalendarEvent[], palette: WidgetPalette): Promise<string> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return "Widgets require an installed native build; Expo Go cannot show them.";
  // require, not import(): production bundles cannot fetch split chunks on native.
  try { const { default: widget } = require("./today-widget.ios") as typeof import("./today-widget.ios"); widget.updateTimeline(widgetTimeline(events,new Date(),palette,getPreferences().hijriOffset)); return "Widget timeline refreshed. Add J&K Calendar from your home-screen widget gallery."; }
  catch { return "The widget extension is unavailable in this build. Rebuild the app with widget support."; }
}
