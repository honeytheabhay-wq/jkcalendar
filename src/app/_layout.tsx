import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { AppState } from "react-native";

import { CalendarThemeProvider, useCalendarTheme } from "@/theme";
import { useEvents, useReminderRefresh } from "@/utils/events";
import { getPreferences } from "@/utils/preferences";
import { checkOfficialOrders, getOrderStatus } from "@/utils/official-orders";
import { syncWidgets } from "@/widgets/sync";

function Navigation() {
  useReminderRefresh();
  const { colors, themeName } = useCalendarTheme();
  const { events }=useEvents();
  useEffect(()=>{
    const refresh=()=>{void syncWidgets(events,colors).catch(()=>{});const status=getOrderStatus();if(getPreferences().autoCheckOrders&&Date.now()-(status.attemptedAt??0)>(status.error?900_000:86_400_000))void checkOfficialOrders();};
    refresh();const listener=AppState.addEventListener("change",state=>{if(state==="active")refresh();});return()=>listener.remove();
  },[events,colors]);
  return (
    <>
      <StatusBar style={themeName === "midnight-indigo" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.primaryDark,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.ink, fontWeight: "700" },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="index" options={{ title: "J&K Calendar" }} />
        <Stack.Screen name="settings" options={{title:"Settings"}} />
        <Stack.Screen
          name="add-event"
          options={{
            title: "New event",
            presentation: "formSheet",
            sheetAllowedDetents: [0.75, 1],
            sheetGrabberVisible: true,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><CalendarThemeProvider><Navigation /></CalendarThemeProvider></GestureHandlerRootView>;
}
