import { Column, Host, Picker, Switch } from "@expo/ui";
import { Stack } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { useCalendarTheme } from "@/theme";
import { getEvents, useEvents } from "@/utils/events";
import { setPreference, usePreferences } from "@/utils/preferences";
import { useReminderStatus } from "@/utils/reminder-status";
import { sendTestReminder, syncReminders } from "@/utils/reminders";
import { checkOfficialOrders, useOrderStatus } from "@/utils/official-orders";
import { officialOrdersUrl } from "@/utils/official-orders-model";
import { widgetData } from "@/utils/widget-data";
import { syncWidgets } from "@/widgets/sync";
import { labelLanguages } from "@/utils/regional-labels";
import { seasonalMotionLevels } from "@/utils/season-effects";
import { SeasonalScreen } from "@/components/seasonal-screen";

export default function SettingsRoute() {
  const { colors:c, themeName }=useCalendarTheme(), preferences=usePreferences(), reminders=useReminderStatus(), orders=useOrderStatus();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const {events}=useEvents();
  const snapshot=widgetData(events,new Date(),c), dark=themeName==="midnight-indigo";
  async function run(task:()=>Promise<unknown>) { if(busy)return;setBusy(true);setMessage("");try{const result=await task();if(typeof result==="string")setMessage(result);}catch(e){setMessage(e instanceof Error?e.message:"Could not finish. Please try again.");}finally{setBusy(false);} }
  const heading=(text:string)=><Text accessibilityRole="header" style={{color:c.ink,fontSize:18,fontWeight:"800"}}>{text}</Text>;
  const note=(text:string)=><Text selectable style={{color:c.muted,fontSize:12,lineHeight:18}}>{text}</Text>;
  const button=(text:string,task:()=>Promise<unknown>)=><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void run(task)} style={{minHeight:48,justifyContent:"center",alignItems:"center",paddingHorizontal:14,paddingVertical:10,borderRadius:24,backgroundColor:c.primarySoft,opacity:busy?.6:1}}><Text style={{color:c.primaryDark,fontSize:13,fontWeight:"700"}}>{text}</Text></Pressable>;
  const section={padding:18,gap:12,borderRadius:22,backgroundColor:c.surface} as const;
  return <SeasonalScreen><ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:18,paddingBottom:48,gap:16,backgroundColor:c.background}}>
    <Stack.Screen options={{title:"Settings"}} />
    <View style={section}>
      {heading("Regional feel")}
      <Host matchContents colorScheme={dark?"dark":"light"} seedColor={c.primary}><Switch label="Automatic seasonal colours" value={preferences.autoSeasonColours} onValueChange={value=>{try{setPreference("autoSeasonColours",value);}catch{setMessage("Could not save this setting.");}}} /></Host>
      {note("Season colours follow the month you view. Choose a manual colour under Colours whenever you prefer.")}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Seasonal animation</Text>
      <Host matchContents colorScheme={dark?"dark":"light"} seedColor={c.primary}><Picker selectedValue={preferences.seasonalMotion} onValueChange={value=>{if(value!=="off"&&value!=="subtle"&&value!=="lively")return;try{setPreference("seasonalMotion",value);}catch{setMessage("Could not save this setting.");}}}>{seasonalMotionLevels.map(level=><Picker.Item key={level.value} label={level.label} value={level.value} />)}</Picker></Host>
      {note("Seasonal effects cover the whole page, including Settings and event forms. Lively adds more movement; the centre stays softer. Reduced motion and high contrast turn effects off.")}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Extra date labels</Text>
      <Host matchContents colorScheme={dark?"dark":"light"} seedColor={c.primary}><Picker selectedValue={preferences.labelLanguage} onValueChange={value=>{if(value!=="english"&&value!=="kashmiri"&&value!=="dogri")return;try{setPreference("labelLanguage",value);}catch{setMessage("Could not save this setting.");}}}>{labelLanguages.map(language=><Picker.Item key={language.value} label={language.label} value={language.value} />)}</Picker></Host>
      {note("English headings stay visible. Optional Kashmiri or Dogri month and full-date labels work offline.")}
    </View>
    <View style={section}>
      {heading("Accessibility")}
      {note("System text sizes, reduced motion and contrast settings are respected. These controls add your own preferences.")}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Text size</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{(["standard","large","larger"] as const).map(size=><Pressable key={size} accessibilityRole="button" accessibilityState={{selected:preferences.textSize===size}} onPress={()=>{try{setPreference("textSize",size);}catch{setMessage("Could not save this setting. Try again.");}}} style={{minHeight:48,paddingHorizontal:16,justifyContent:"center",borderRadius:24,backgroundColor:preferences.textSize===size?c.primary:c.primarySoft}}><Text style={{color:preferences.textSize===size?c.onPrimary:c.primaryDark,fontSize:13}}>{size[0].toUpperCase()+size.slice(1)}</Text></Pressable>)}</View>
      <Host matchContents colorScheme={dark?"dark":"light"} seedColor={c.primary}><Column><Switch label="High contrast" value={preferences.highContrast} onValueChange={value=>{try{setPreference("highContrast",value);}catch{setMessage("Could not save this setting.");}}} /><Switch label="Reduce motion" value={preferences.reduceMotion} onValueChange={value=>{try{setPreference("reduceMotion",value);}catch{setMessage("Could not save this setting.");}}} /><Switch label="Reduce transparency" value={preferences.reduceTransparency} onValueChange={value=>{try{setPreference("reduceTransparency",value);}catch{setMessage("Could not save this setting.");}}} /></Column></Host>
    </View>
    <View style={section}>
      {heading("Reminders")}
      {note(reminders.granted===null?"Checking notification permission…":reminders.granted?`Notifications allowed · ${reminders.queued}/${reminders.expected} future reminders queued`:"Notifications are off. Events are still saved.")}
      {note(reminders.lastSyncAt?`Last queue check: ${new Date(reminders.lastSyncAt).toLocaleString()}`:"No queue check completed yet.")}
      {reminders.error?<Text accessibilityRole="alert" style={{color:c.danger,fontSize:13}}>{reminders.error}</Text>:null}
      {button("Repair reminders",async()=>{await syncReminders(getEvents());return "Reminder queue checked and repaired.";})}
      {button("Send 30-second test",async()=>{await sendTestReminder();return "Test queued. Lock the phone or switch apps, then tap the notification when it arrives.";})}
      {reminders.testReceivedAt?note(`Last test delivery confirmed: ${new Date(reminders.testReceivedAt).toLocaleString()}`):reminders.testAt?note(`Test scheduled: ${new Date(reminders.testAt).toLocaleTimeString()}. Delivery has not been confirmed; tap the notification to confirm it.`):null}
      {button("Open phone notification settings",()=>Linking.openSettings())}
      {note("The next 40 future alerts are queued locally and refreshed when you use the app. Android battery restrictions can delay alerts. Try a test with the app closed and after restarting your phone.")}
    </View>
    <View style={section}>
      {heading("Official holidays")}
      {note("2026 schedule + Mela Pat and Urs Sheikh Noor-ud-Din Sahib amendments are included. Every holiday shows its scope and source. Moon-dependent dates remain labelled tentative.")}
      <Host matchContents colorScheme={dark?"dark":"light"} seedColor={c.primary}><Switch label="Check official orders daily" value={preferences.autoCheckOrders} onValueChange={value=>{try{setPreference("autoCheckOrders",value);}catch{setMessage("Could not save this setting.");}}} /></Host>
      {note(orders.checking?"Checking recent official orders…":orders.checkedAt?`Last check: ${new Date(orders.checkedAt).toLocaleString()} · ${orders.checkedCount} recent orders read`:"No live check completed. Bundled holidays are available offline.")}
      {orders.error?<Text accessibilityRole="alert" style={{color:c.danger,fontSize:12}}>{orders.error}</Text>:null}
      {button(orders.checking?"Checking…":"Check official orders now",checkOfficialOrders)}
      {orders.checkedAt&&!orders.checking&&!orders.orders.some(o=>!o.included)?note("No additional holiday orders found in the recent records checked. This does not cover the full archive."):null}
      {orders.orders.map(order=><Pressable key={order.id} accessibilityRole="link" onPress={()=>void run(()=>Linking.openURL(order.url))} style={{minHeight:48,gap:4,paddingVertical:10,borderBottomWidth:1,borderColor:c.line}}><Text style={{color:c.primaryDark,fontSize:13,fontWeight:"700"}}>{order.title} ↗</Text>{note(`${order.reference} · ${order.included?"Included in calendar":"Review official order — not applied to dates"}`)}</Pressable>)}
      {button("Open full official archive",()=>Linking.openURL(officialOrdersUrl))}
      {note("Checks read the GAD website’s recent order listing. Newly detected orders require review; the app does not guess amended dates from document titles.")}
    </View>
    <View style={section}>
      {heading("Home-screen widget")}
      <View style={{padding:16,gap:5,borderRadius:18,backgroundColor:c.background}}><Text style={{color:c.primaryDark,fontSize:11,fontWeight:"800"}}>J&K CALENDAR</Text><Text style={{color:c.ink,fontSize:24,fontWeight:"800"}}>{snapshot.dateLabel}</Text><Text style={{color:c.ink,fontSize:14,fontWeight:"700"}}>{snapshot.holiday}</Text>{note(snapshot.holidayNote)}<Text style={{color:c.ink,fontSize:15}}>{snapshot.eventTitle}</Text>{note(snapshot.eventWhen)}<Text style={{color:c.primaryDark,fontSize:13}}>＋ Add event</Text></View>
      {button("Refresh home-screen widget",()=>syncWidgets(getEvents(),c))}
      {note("After installing the native app, long-press your home screen and add J&K Calendar from Widgets. Tap its date to open the app, or + to add an event. Widgets show your next event title.")}
      {note("Android refreshes are requested every 30 minutes and when events change. iPhone uses a timeline of up to 14 days; open the app periodically to refill it. System widget refresh timing can vary. Widgets are unavailable in Expo Go.")}
    </View>
    {message?<Text accessibilityLiveRegion="polite" selectable style={{color:c.primaryDark,fontSize:13,lineHeight:20}}>{message}</Text>:null}
  </ScrollView></SeasonalScreen>;
}
