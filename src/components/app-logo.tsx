import { Image, StyleSheet, Text, View } from "react-native";

import { useToday } from "@/utils/today";

const logo = require("../../assets/logo-chinar.png");
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// The chinar logo with today's date. The card is drawn larger than the one in the artwork (and covers its printed
// date), so the day and month stay readable at header size.
export function AppLogo({ size = 46 }: { size?: number }) {
  const today = useToday();
  const card = size * 0.58;
  return (
    <View accessible accessibilityLabel={`Today, ${today.getDate()} ${months[today.getMonth()]}`} style={{ width: size, height: size }}>
      <Image source={logo} style={{ width: size, height: size, borderRadius: size * 0.22 }} />
      <View style={[styles.card, { width: card, height: card * 0.92, left: (size - card) / 2, top: size * 0.37, borderRadius: card * 0.16 }]}>
        <Text allowFontScaling={false} style={[styles.day, { fontSize: card * 0.5, lineHeight: card * 0.54 }]}>{today.getDate()}</Text>
        <Text allowFontScaling={false} style={[styles.month, { fontSize: card * 0.21, lineHeight: card * 0.24 }]}>{months[today.getMonth()]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: "absolute", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFDF8", borderWidth: 0.5, borderColor: "#E6D8C4", boxShadow: "0 1px 2px rgba(90,40,10,0.3)" },
  day: { fontFamily: "serif", fontWeight: "700", color: "#4A2416", includeFontPadding: false },
  month: { fontWeight: "800", color: "#B5562E", letterSpacing: 0.5, includeFontPadding: false },
});
