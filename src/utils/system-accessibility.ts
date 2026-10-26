import { useEffect, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";

export function useSystemAccessibility() {
  const [settings, setSettings] = useState({ reduceMotion: false, reduceTransparency: false, highContrast: false });
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const values = await Promise.allSettled([AccessibilityInfo.isReduceMotionEnabled(), AccessibilityInfo.isReduceTransparencyEnabled(), AccessibilityInfo.isHighTextContrastEnabled(), AccessibilityInfo.isDarkerSystemColorsEnabled()]);
      if (active) setSettings({ reduceMotion: values[0].status === "fulfilled" && values[0].value, reduceTransparency: values[1].status === "fulfilled" && values[1].value, highContrast: (values[2].status === "fulfilled" && values[2].value)||(values[3].status === "fulfilled" && values[3].value) });
    };
    void refresh();
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", value => setSettings(s => ({ ...s, reduceMotion: value })));
    const transparency = AccessibilityInfo.addEventListener("reduceTransparencyChanged", value => setSettings(s => ({ ...s, reduceTransparency: value })));
    const contrast = AccessibilityInfo.addEventListener("highTextContrastChanged", value => setSettings(s=>({...s,highContrast:value})));
    const darker = AccessibilityInfo.addEventListener("darkerSystemColorsChanged", value => setSettings(s=>({...s,highContrast:value})));
    const app = AppState.addEventListener("change", state => { if (state === "active") void refresh(); });
    return () => { active = false; motion.remove(); transparency.remove(); contrast.remove(); darker.remove(); app.remove(); };
  }, []);
  return settings;
}
