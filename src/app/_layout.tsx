import { router } from "expo-router";
import { Stack } from "expo-router/stack";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { AppState } from "react-native";

import { CalendarThemeProvider, useCalendarTheme } from "@/theme";
import { getEvents, useEvents, useReminderRefresh } from "@/utils/events";
import { notifyHolidayListChanges, syncReminders } from "@/utils/reminders";
import { getPreferences } from "@/utils/preferences";
import { checkOfficialOrders, getOrderStatus } from "@/utils/official-orders";
import { syncWidgets } from "@/widgets/sync";
import { ThemeFade } from "@/components/theme-fade";
import { refreshHolidayList, useHolidayListVersion } from "@/utils/holiday-store";
import { registerHolidayCheckTask } from "@/utils/background-check";

function Navigation() {
  useReminderRefresh();
  const { colors, themeName } = useCalendarTheme();
  const { events }=useEvents();
  // Tapping a "new official holiday order" alert opens Settings, where the order is listed.
  useEffect(()=>{void registerHolidayCheckTask();},[]);
  useEffect(()=>{
    if(Platform.OS==="web")return;
    const open=(response:Notifications.NotificationResponse|null)=>{if(response?.notification.request.content.data?.calendarOwner==="jk-calendar-orders")router.push("/settings");};
    const subscription=Notifications.addNotificationResponseReceivedListener(open);
    return()=>subscription.remove();
  },[]);
  useEffect(()=>{
    const refresh=()=>{void syncWidgets(events,colors).catch(()=>{});
      // Online holiday list (moon-sighting dates, special closures): alert on upcoming changes and re-queue reminders.
      void refreshHolidayList().then(changes=>{if(!changes.length)return;void notifyHolidayListChanges(changes).catch(()=>{});void syncReminders(getEvents()).catch(()=>{});void syncWidgets(getEvents(),colors).catch(()=>{});}).catch(()=>{});const status=getOrderStatus();if(getPreferences().autoCheckOrders&&Date.now()-(status.attemptedAt??0)>(status.error?900_000:86_400_000))void checkOfficialOrders();};
    // Delayed so a dark/light switch (which changes colors) is not competing with the widget refresh.
    const timer=setTimeout(refresh,1500);const listener=AppState.addEventListener("change",state=>{if(state==="active")refresh();});return()=>{clearTimeout(timer);listener.remove();};
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
      <ThemeFade />
    </>
  );
}

export default function RootLayout() {
  // A new online holiday list redraws every screen (rare: only when a date actually changes).
  const holidayList = useHolidayListVersion();
  return <GestureHandlerRootView style={{ flex: 1 }}><CalendarThemeProvider><Navigation key={holidayList} /></CalendarThemeProvider></GestureHandlerRootView>;
}
