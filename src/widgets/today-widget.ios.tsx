import { Link, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, lineLimit, padding, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget } from "expo-widgets";
import type { WidgetData } from "@/utils/widget-data";

const TodayWidget = (props: WidgetData) => {
  "widget";
  return <VStack alignment="leading" spacing={3} modifiers={[padding({all:12}),containerBackground(props.background,"widget"),widgetURL("jkcalendar://")]}>
    <Text modifiers={[font({size:20,weight:"bold"}),foregroundStyle(props.ink)]}>{props.expired ? "Refresh calendar" : props.dateLabel}</Text>
    <Text modifiers={[font({size:10}),foregroundStyle(props.accent),lineLimit(1)]}>{props.expired ? "" : props.hijri}</Text>
    <Text modifiers={[font({size:10}),foregroundStyle(props.accent),lineLimit(1)]}>{props.expired ? "" : props.pandit}</Text>
    <Text modifiers={[font({size:10}),foregroundStyle(props.accent),lineLimit(1)]}>{props.expired ? "" : props.hindi}</Text>
    <Text modifiers={[font({size:13,weight:"semibold"}),foregroundStyle(props.ink),lineLimit(1)]}>{props.expired ? "Open app to refresh" : props.holiday}</Text>
    <Text modifiers={[font({size:10}),foregroundStyle(props.ink),lineLimit(1)]}>{props.expired ? "" : props.holidayNote}</Text>
    <Text modifiers={[font({size:13}),foregroundStyle(props.ink),lineLimit(1)]}>{props.eventTitle}</Text>
    <Text modifiers={[font({size:11}),foregroundStyle(props.ink),lineLimit(1)]}>{props.eventWhen}</Text>
    <Link destination="jkcalendar://add-event"><Text modifiers={[font({size:12,weight:"semibold"}),foregroundStyle(props.accent)]}>＋ Add event</Text></Link>
  </VStack>;
};
export default createWidget<WidgetData>("JKCalendarToday",TodayWidget);
