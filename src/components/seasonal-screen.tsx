import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { SeasonalBackground } from "./seasonal-background";
import { useCalendarTheme } from "@/theme";

// A viewport-sized, touch-transparent atmosphere shared by every app page/dialog.
export function SeasonalScreen({children,modal=false}:PropsWithChildren<{modal?:boolean}>) {
  const {colors}=useCalendarTheme();
  return <View style={{flex:1,backgroundColor:modal?"transparent":colors.background}}>
    {children}
    <SeasonalBackground modal={modal} />
  </View>;
}
