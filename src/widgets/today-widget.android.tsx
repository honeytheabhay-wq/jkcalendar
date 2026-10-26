import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetData } from "@/utils/widget-data";

export function TodayWidget({ data }: { data: WidgetData }) {
  return <FlexWidget accessibilityLabel={`${data.dateLabel}. ${data.holiday}. ${data.holidayNote}. Next plan: ${data.eventTitle}, ${data.eventWhen}. Open J&K Calendar.`} clickAction="OPEN_APP" style={{ width: "match_parent", height: "match_parent", padding: 16, borderRadius: 22, backgroundColor: data.background, flexDirection: "column", justifyContent: "center" }}>
    <TextWidget text="J&K CALENDAR" style={{ fontSize: 11, fontWeight: "bold", color: data.accent }} />
    <TextWidget text={data.dateLabel} style={{ fontSize: 22, fontWeight: "bold", color: data.ink, marginBottom: 6 }} />
    <TextWidget text={data.holiday} maxLines={1} style={{ fontSize: 13, color: data.ink, fontWeight: "bold" }} />
    <TextWidget text={data.holidayNote} maxLines={1} style={{ fontSize: 10, color: data.ink, marginBottom: 8 }} />
    <TextWidget text={data.eventTitle} maxLines={1} style={{ fontSize: 14, color: data.ink }} />
    <TextWidget text={data.eventWhen} maxLines={1} style={{ fontSize: 11, color: data.ink }} />
    <TextWidget accessibilityLabel="Add an event to J&K Calendar" text="＋ Add event" clickAction="OPEN_URI" clickActionData={{ uri: "jkcalendar://add-event" }} style={{ fontSize: 13, fontWeight: "bold", color: data.accent, paddingTop: 8, paddingBottom: 5 }} />
  </FlexWidget>;
}
