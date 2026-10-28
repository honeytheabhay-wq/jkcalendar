import { Image, StyleSheet, Text, View } from "react-native";

import { useToday } from "@/utils/today";

const logo = require("../../assets/logo-chinar.png");
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// The chinar-leaf logo beside the home title, with today's day and month in bold white over the leaf.
export function AppLogo({ size = 52 }: { size?: number }) {
  const today = useToday();
  return (
    <View accessible accessibilityLabel={`Today, ${today.getDate()} ${months[today.getMonth()]}`} style={{ width: size, height: size }}>
      <Image source={logo} style={{ width: size, height: size, borderRadius: size * 0.22 }} />
      <View style={[StyleSheet.absoluteFill, styles.date, { paddingTop: size * 0.06 }]}>
        <Text allowFontScaling={false} style={[styles.text, { fontSize: size * 0.42, lineHeight: size * 0.44 }]}>{today.getDate()}</Text>
        <Text allowFontScaling={false} style={[styles.text, { fontSize: size * 0.15, lineHeight: size * 0.17, letterSpacing: 0.6 }]}>{months[today.getMonth()]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  date: { alignItems: "center", justifyContent: "center" },
  text: { color: "#FFFFFF", fontWeight: "900", includeFontPadding: false, textShadowColor: "rgba(80,25,0,0.85)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
