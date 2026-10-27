import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetData } from "@/utils/widget-data";

export function TodayWidget({ data }: { data: WidgetData }) {
  return <FlexWidget accessibilityLabel={`${data.dateLabel}. Hijri ${data.hijri}. Kashmiri Pandit ${data.pandit}. Hindi ${data.hindi}. ${data.holiday}. ${data.holidayNote}. Next plan: ${data.eventTitle}, ${data.eventWhen}. Open J&K Calendar.`} clickAction="OPEN_APP" style={{ width: "match_parent", height: "match_parent", padding: 16, borderRadius: 22, backgroundColor: data.background, flexDirection: "column", justifyContent: "center" }}>
    {/* Compact: the date, today's Hijri, Kashmiri Pandit and Hindi dates, then one line each for holiday and plan. */}
    <TextWidget text={data.dateLabel} style={{ fontSize: 20, fontWeight: "bold", color: data.ink, marginBottom: 2 }} />
    <TextWidget text={data.hijri} maxLines={1} style={{ fontSize: 10, color: data.accent }} />
    <TextWidget text={data.pandit} maxLines={1} style={{ fontSize: 10, color: data.accent }} />
    <TextWidget text={data.hindi} maxLines={1} style={{ fontSize: 10, color: data.accent, marginBottom: 6 }} />
    <TextWidget text={`${data.holiday} · ${data.holidayNote}`} maxLines={1} style={{ fontSize: 12, color: data.ink, fontWeight: "bold" }} />
    <TextWidget text={`${data.eventTitle} · ${data.eventWhen}`} maxLines={1} style={{ fontSize: 12, color: data.ink }} />
    <TextWidget accessibilityLabel="Add an event to J&K Calendar" text="＋ Add event" clickAction="OPEN_URI" clickActionData={{ uri: "jkcalendar://add-event" }} style={{ fontSize: 13, fontWeight: "bold", color: data.accent, paddingTop: 6, paddingBottom: 4 }} />
  </FlexWidget>;
}
