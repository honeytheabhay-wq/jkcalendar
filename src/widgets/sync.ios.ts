import Constants, { ExecutionEnvironment } from "expo-constants";
import type { CalendarEvent } from "@/utils/event-model";
import { widgetTimeline, type WidgetPalette } from "@/utils/widget-data";
export async function syncWidgets(events: CalendarEvent[], palette: WidgetPalette): Promise<string> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return "Widgets require an installed native build; Expo Go cannot show them.";
  try { const { default: widget } = await import("./today-widget.ios"); widget.updateTimeline(widgetTimeline(events,new Date(),palette)); return "Widget timeline refreshed. Add J&K Calendar from your home-screen widget gallery."; }
  catch { return "The widget extension is unavailable in this build. Rebuild the app with widget support."; }
}
