import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetData } from "@/utils/widget-data";

export function TodayWidget({ data }: { data: WidgetData }) {
  // Same colours as the app: page background, white cards, the theme colour for the date and the orange countdown pill.
  return <FlexWidget accessibilityLabel={`${data.dateLabel}. Hijri ${data.hijri}. Kashmiri Pandit ${data.pandit}. ${data.hindi}. ${data.holiday} ${data.holidayDays}. Next plan: ${data.eventTitle}, ${data.eventWhen}. Open J&K Calendar.`} clickAction="OPEN_APP" style={{ width: "match_parent", height: "match_parent", padding: 10, borderRadius: 24, backgroundColor: data.background, flexDirection: "column", justifyContent: "space-between" }}>
    <FlexWidget style={{ width: "match_parent", flexDirection: "row", alignItems: "center", flexGap: 8 }}>
      <FlexWidget style={{ backgroundColor: data.accent, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }}>
        <TextWidget text={data.dateLabel} style={{ fontSize: 15, fontWeight: "bold", color: data.onPrimary }} />
      </FlexWidget>
      <FlexWidget style={{ flex: 1, flexDirection: "column" }}>
        <TextWidget text={data.hijri} maxLines={1} style={{ fontSize: 10, color: data.accent }} />
        <TextWidget text={data.pandit} maxLines={1} style={{ fontSize: 10, color: data.accent }} />
        <TextWidget text={data.hindi} maxLines={1} style={{ fontSize: 10, color: data.accent }} />
      </FlexWidget>
    </FlexWidget>
    <FlexWidget style={{ width: "match_parent", backgroundColor: data.surface, borderRadius: 16, padding: 8, flexDirection: "row", alignItems: "center", flexGap: 10 }}>
      {data.holidayDays ? <FlexWidget style={{ backgroundColor: data.holidayColour, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 }}><TextWidget text={data.holidayDays} style={{ fontSize: 12, fontWeight: "bold", color: data.onPrimary }} /></FlexWidget> : null}
      <FlexWidget style={{ flex: 1, flexDirection: "column" }}>
        <TextWidget text={data.holiday} maxLines={1} style={{ fontSize: 13, fontWeight: "bold", color: data.ink }} />
        <TextWidget text={data.holidayWhen || data.holidayNote} maxLines={1} style={{ fontSize: 10, color: data.muted }} />
      </FlexWidget>
    </FlexWidget>
    <FlexWidget style={{ width: "match_parent", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <FlexWidget style={{ flex: 1 }}><TextWidget text={`${data.eventTitle} · ${data.eventWhen}`} maxLines={1} style={{ fontSize: 11, color: data.ink }} /></FlexWidget>
      <TextWidget accessibilityLabel="Add an event to J&K Calendar" text="＋ Add" clickAction="OPEN_URI" clickActionData={{ uri: "jkcalendar://add-event" }} style={{ fontSize: 13, fontWeight: "bold", color: data.accent, paddingLeft: 8 }} />
    </FlexWidget>
  </FlexWidget>;
}
