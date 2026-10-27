import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useCalendarTheme } from "@/theme";

let runFade: ((colour: string, apply: () => void) => void) | null = null;

// Recolouring every screen takes a few hundred milliseconds on a mid-range phone. The screen first fades (on the UI
// thread) to the new background colour, the theme changes behind that cover, then the cover fades away, so the switch
// reads as one smooth transition instead of a frozen tap.
export function switchThemeWithFade(colour: string, apply: () => void) {
  if (runFade) runFade(colour, apply);
  else apply();
}

export function ThemeFade() {
  const { themeName, reduceMotion } = useCalendarTheme();
  const opacity = useSharedValue(0), colour = useSharedValue("#000000");
  const pending = useRef<(() => void) | null>(null);
  const reveal = useCallback(() => { opacity.value = withTiming(0, { duration: 220 }); }, []);
  const applyPending = useCallback(() => {
    const apply = pending.current;
    pending.current = null;
    apply?.();
    // Fallback in case the theme did not change, so the cover never stays up.
    setTimeout(() => { if (opacity.value > 0.99) reveal(); }, 1200);
  }, [reveal]);
  useEffect(() => {
    runFade = (target, apply) => {
      if (reduceMotion) { apply(); return; }
      pending.current = apply;
      colour.value = target;
      opacity.value = withTiming(1, { duration: 140 }, finished => { if (finished) scheduleOnRN(applyPending); });
    };
    return () => { runFade = null; };
  }, [reduceMotion, applyPending]);
  // The new theme has been committed; give the deferred off-screen updates a moment, then reveal.
  useEffect(() => {
    if (opacity.value === 0) return;
    const timer = setTimeout(reveal, 180);
    return () => clearTimeout(timer);
  }, [themeName]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, backgroundColor: colour.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.cover, style]} />;
}

const styles = StyleSheet.create({ cover: { zIndex: 100000, elevation: 100000 } });
