import * as Haptics from "expo-haptics";
import { Host, Switch } from "@expo/ui";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "@/components/app-text";

import { radii, spacing, themes, type ThemeColors, type ManualThemeName, useCalendarTheme } from "@/theme";
import { setPreference, usePreferences } from "@/utils/preferences";

export function ThemePicker() {
  const { themeName, colors, setThemeName, glassLevel, setGlassLevel, season } = useCalendarTheme();
  const preferences=usePreferences();
  const styles = createStyles(colors);

  function chooseTheme(name: ManualThemeName) {
    try {
      setThemeName(name);
      if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    } catch { Alert.alert("Could not save colour", "Please try again."); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>COLOUR THEME</Text>
      <Host matchContents colorScheme={themeName==="midnight-indigo"?"dark":"light"} seedColor={colors.primary}><Switch label="Automatic seasonal colours" value={preferences.autoSeasonColours} onValueChange={value=>{try{setPreference("autoSeasonColours",value);}catch{Alert.alert("Could not save colour", "Please try again.");}}} /></Host>
      <Text style={{color:colors.muted,fontSize:12,lineHeight:17}}>{preferences.autoSeasonColours?`${season.name} · ${season.colour}`:"Manual colour choice"}</Text>
      <View style={styles.options}>
        {(Object.entries(themes) as [ManualThemeName, (typeof themes)[ManualThemeName]][]).map(([name, theme]) => {
          const selected = !preferences.autoSeasonColours && name === themeName;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => chooseTheme(name)}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
            >
              <View style={styles.swatches}>
                <View style={[styles.swatch, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.swatch, styles.overlap, { backgroundColor: theme.colors.today }]} />
                <View style={[styles.swatch, styles.overlap, { backgroundColor: theme.colors.weekend }]} />
              </View>
              <Text numberOfLines={1} style={[styles.optionText, selected && styles.optionTextSelected]}>{theme.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>GLASS INTENSITY</Text>
      <View style={styles.glassOptions}>{(["subtle", "standard", "strong"] as const).map(level => <Pressable key={level} accessibilityState={{ selected: glassLevel === level }} onPress={() => setGlassLevel(level)} style={[styles.glassOption, glassLevel === level && styles.optionSelected]}><Text style={styles.optionTextSelected}>{level[0].toUpperCase() + level.slice(1)}</Text></Pressable>)}</View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { gap: spacing.sm },
    label: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
    options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    glassOptions: { flexDirection: "row", gap: spacing.sm },
    glassOption: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.full, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.surface },
    option: { width: "47%", minHeight: 62, justifyContent: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 8, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radii.lg, borderCurve: "continuous" },
    optionSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft },
    swatches: { flexDirection: "row", alignItems: "center" },
    swatch: { width: 18, height: 18, borderColor: colors.surface, borderWidth: 2, borderRadius: radii.full },
    overlap: { marginLeft: -6 },
    optionText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
    optionTextSelected: { color: colors.primaryDark },
    pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  });
}
