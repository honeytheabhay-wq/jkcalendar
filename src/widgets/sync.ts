import type { CalendarEvent } from "@/utils/event-model";
import type { WidgetPalette } from "@/utils/widget-data";
export async function syncWidgets(_events: CalendarEvent[], _palette: WidgetPalette): Promise<string> { return "Home-screen widgets are available in the installed phone app."; }
