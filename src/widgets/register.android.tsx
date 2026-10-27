import "expo-sqlite/localStorage/install";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { widgetData, type WidgetPalette } from "@/utils/widget-data";
import { validDateKey, type CalendarEvent } from "@/utils/event-model";

export function readWidgetEvents(): CalendarEvent[] { try { const value=JSON.parse(localStorage.getItem("jk-calendar-events-v1") ?? "[]"); return Array.isArray(value) ? value.filter(e=>e&&typeof e.id==="string"&&typeof e.title==="string"&&validDateKey(e.date)) : []; } catch { return []; } }
export function readWidgetHijriOffset(): number { try { const value=JSON.parse(localStorage.getItem("jk-calendar-preferences-v1") ?? "{}").hijriOffset; return [-2,-1,0,1].includes(value) ? value : -1; } catch { return -1; } }
export function readWidgetPalette(): WidgetPalette | undefined { try { return JSON.parse(localStorage.getItem("jk-calendar-widget-palette-v1") ?? "null") ?? undefined; } catch { return undefined; } }
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  const { registerWidgetTaskHandler } = require("react-native-android-widget") as typeof import("react-native-android-widget");
  registerWidgetTaskHandler(async props => {
    if(props.widgetInfo.widgetName!=="JKCalendarToday"||props.widgetAction==="WIDGET_DELETED") return;
    const { TodayWidget }=await import("./today-widget.android");
    props.renderWidget(<TodayWidget data={widgetData(readWidgetEvents(),new Date(),readWidgetPalette(),readWidgetHijriOffset())} />);
  });
}
