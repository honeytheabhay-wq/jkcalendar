import MaskedViewModule from "@react-native-masked-view/masked-view";
import { type ComponentType, type ReactElement, type ReactNode, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useSeason } from "@/theme";
import type { SeasonId } from "@/utils/seasons";

// The library's class typings predate React 19's JSX types; the component itself works as normal.
const MaskedView = MaskedViewModule as unknown as ComponentType<{ maskElement: ReactElement; children?: ReactNode }>;

// The home title coloured like a chinar leaf, following the leaf through the year: fresh green in spring, deep green
// in summer, the first yellow in the rains, gold to red in autumn, red-brown in early winter, dry and frosty in deep
// winter. Greens are a shade darker than the leaf so the title stays readable on the light backgrounds.
const leafColours: Record<SeasonId, string[]> = {
  sonth: ["#5E9A3A", "#7FB24A", "#4E8A34"],
  grishm: ["#2F6B35", "#4C8B3A", "#5E9640"],
  wahrath: ["#3F7A45", "#7E9C3C", "#B09A2A"],
  harud: ["#7E9C3C", "#D9A42A", "#E88A26", "#D9542A", "#B93A1E"],
  wand: ["#B93A1E", "#9C3E26", "#743720"],
  shishur: ["#6E5240", "#8C7A70", "#6F98B5"],
};

function greeting(hour: number) {
  return hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : hour >= 17 && hour < 21 ? "Good evening" : "Good night";
}

export function ChinarTitle() {
  const { season } = useSeason();
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => { const timer = setInterval(() => setHour(new Date().getHours()), 60_000); return () => clearInterval(timer); }, []);
  const colours = leafColours[season.id];
  const title: ReactElement = <Text allowFontScaling={false} style={styles.title}>J&K <Text style={styles.italic}>Calendar</Text></Text>;
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`J&K Calendar. ${greeting(hour)}, ${season.name}`}>
      <Text allowFontScaling={false} style={[styles.greeting, { color: colours[Math.min(1, colours.length - 1)] }]}>{greeting(hour)} · {season.name}</Text>
      <MaskedView maskElement={title}>
        {/* The text is drawn invisibly to size the gradient, then the gradient shows through the text's shape. */}
        <Text allowFontScaling={false} style={[styles.title, styles.sizer]}>J&K <Text style={styles.italic}>Calendar</Text></Text>
        <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: `linear-gradient(90deg, ${colours.join(", ")})` }]} />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 12, fontWeight: "700", marginBottom: 1 },
  title: { fontFamily: "serif", fontSize: 24, fontWeight: "700", lineHeight: 28, color: "#000" },
  italic: { fontStyle: "italic", fontWeight: "400" },
  sizer: { opacity: 0 },
});
