import * as Haptics from "expo-haptics";
import { Alert, Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { AppText as Text } from "@/components/app-text";

import { radii, spacing, themes, type ThemeColors, type ManualThemeName, useCalendarTheme, useSeason } from "@/theme";
import { setPreference, usePreferences } from "@/utils/preferences";

export function ThemePicker() {
  const { themeName, colors, setThemeName } = useCalendarTheme(), { season } = useSeason();
  const preferences=usePreferences();
  // Dark appearance always shows Midnight Indigo, so choosing any other colour switches the app to Light.
  const systemScheme=useColorScheme();
  const darkAppearance=preferences.appearance==="dark"||(preferences.appearance==="system"&&systemScheme==="dark");
  function showColours() { if (darkAppearance) setPreference("appearance","light"); }
  const styles = createStyles(colors);

  function chooseTheme(name: ManualThemeName) {
    try {
      setThemeName(name);
      if (name !== "midnight-indigo") showColours();
      if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    } catch { Alert.alert("Could not save colour", "Please try again."); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>COLOUR THEME</Text>
      {/* A plain React Native switch: the native Compose switch made the Colours panel slow to open. */}
      <Pressable accessibilityRole="switch" accessibilityState={{checked:preferences.autoSeasonColours}} onPress={()=>{const value=!preferences.autoSeasonColours;try{setPreference("autoSeasonColours",value);if(value)showColours();}catch{Alert.alert("Could not save colour", "Please try again.");}}} style={styles.switchRow}>
        <Text style={styles.switchLabel}>Automatic seasonal colours</Text>
        <View style={[styles.track, preferences.autoSeasonColours && styles.trackOn]}><View style={[styles.thumb, preferences.autoSeasonColours && styles.thumbOn]} /></View>
      </Pressable>
      <Text style={{color:colors.muted,fontSize:12,lineHeight:17}}>{darkAppearance?"Dark mode uses Midnight Indigo. Choosing another colour switches to Light.":preferences.autoSeasonColours?`${season.name} · ${season.colour}`:"Manual colour choice"}</Text>
      <View style={styles.options}>
        {(Object.entries(themes) as [ManualThemeName, (typeof themes)[ManualThemeName]][]).map(([name, theme]) => {
          const selected = darkAppearance ? name === "midnight-indigo" : !preferences.autoSeasonColours && name === themeName;
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
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { gap: spacing.sm },
    label: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
    switchRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 },
    switchLabel: { flex: 1, color: colors.ink, fontSize: 15 },
    track: { width: 48, height: 28, borderRadius: 14, padding: 3, backgroundColor: colors.line, alignItems: "flex-start" },
    trackOn: { backgroundColor: colors.primary, alignItems: "flex-end" },
    thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface },
    thumbOn: { backgroundColor: colors.onPrimary },
    options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
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
