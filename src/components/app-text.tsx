import { StyleSheet, Text, type TextProps } from "react-native";
import { useCalendarTheme } from "@/theme";

export function AppText({ style, allowFontScaling = true, ...props }: TextProps) {
  const { textScale } = useCalendarTheme();
  const flat = StyleSheet.flatten(style) ?? {};
  const scale = allowFontScaling ? textScale : 1;
  return <Text {...props} allowFontScaling={allowFontScaling} style={[style, { fontSize: (flat.fontSize ?? 14) * scale, ...(flat.lineHeight ? { lineHeight: flat.lineHeight * scale } : {}) }]} />;
}
