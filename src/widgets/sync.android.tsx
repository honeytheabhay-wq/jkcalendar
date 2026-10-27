import Constants, { ExecutionEnvironment } from "expo-constants";
import type { CalendarEvent } from "@/utils/event-model";
import { getPreferences } from "@/utils/preferences";
import { widgetData, type WidgetPalette } from "@/utils/widget-data";

export async function syncWidgets(events: CalendarEvent[], palette: WidgetPalette): Promise<string> {
  localStorage.setItem("jk-calendar-widget-palette-v1",JSON.stringify(palette));
  if(Constants.executionEnvironment===ExecutionEnvironment.StoreClient)return "Widgets require an installed native build; Expo Go cannot show them.";
  try {
    const { requestWidgetUpdate }=await import("react-native-android-widget"), { TodayWidget }=await import("./today-widget.android");
    let found=true;
    await requestWidgetUpdate({ widgetName:"JKCalendarToday", renderWidget:()=> <TodayWidget data={widgetData(events,new Date(),palette,getPreferences().hijriOffset)} />, widgetNotFound:()=>{found=false;} });
    return found ? "Home-screen widget refreshed." : "Long-press your home screen, open Widgets and add J&K Calendar.";
  } catch { return "The widget module is unavailable in this build. Rebuild the app with widget support."; }
}
