import { Stack, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { AppText as Text } from "@/components/app-text";
import { useCalendarTheme } from "@/theme";
import { exportEvents, getEvents, importEvents, useEvents } from "@/utils/events";
import { setPreference, usePreferences } from "@/utils/preferences";
import { useReminderStatus } from "@/utils/reminder-status";
import { requestReminderPermission, sendTestReminder, syncReminders } from "@/utils/reminders";
import { holidayReminderHours, holidayReminderPreview, holidayReminderScopes } from "@/utils/holiday-reminders";
import { dailyDatesHour } from "@/utils/daily-dates";
import { checkOfficialOrders, markOrdersSeen, useOrderStatus } from "@/utils/official-orders";
import { officialOrdersUrl } from "@/utils/official-orders-model";
import { widgetData } from "@/utils/widget-data";
import { syncWidgets } from "@/widgets/sync";
import { labelLanguages } from "@/utils/regional-labels";
import { hijriDate, hijriLabel, hijriOffsets, hindiLabel, kashmiriPanchang, panchangLabel } from "@/utils/regional-calendars";
import { SeasonalScreen } from "@/components/seasonal-screen";

const lunarDateOptions = [{value:"both",label:"Hijri + Kashmiri Pandit"},{value:"hijri-hindi",label:"Hijri + Hindi"},{value:"hijri",label:"Hijri"},{value:"kashmiri",label:"Kashmiri Pandit"},{value:"hindi",label:"Hindi"},{value:"off",label:"Off"}] as const;

export default function SettingsRoute() {
  const { colors:c }=useCalendarTheme(), preferences=usePreferences(), reminders=useReminderStatus(), orders=useOrderStatus();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[backupText,setBackupText]=useState("");
  // Only the first section renders with the slide-in. The rest are added one at a time after it finishes, ~90 ms
  // apart, so no single frame has to build and draw the whole long page.
  const navigation=useNavigation();
  const [stage,setStage]=useState(0);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>|undefined,started=false;
    const next=(n:number)=>{setStage(n);if(n<5)timer=setTimeout(()=>next(n+1),90);};
    const start=()=>{if(started)return;started=true;next(1);};
    const fallback=setTimeout(start,450);const unsubscribe=navigation.addListener("transitionEnd" as never,start);
    return()=>{clearTimeout(fallback);if(timer)clearTimeout(timer);unsubscribe();};
  },[navigation]);
  const {events}=useEvents();
  // Orders that were new when Settings opened stay highlighted on this visit; the home banner is cleared.
  const [newOrders]=useState(()=>orders.unseen);
  useEffect(()=>{markOrdersSeen();},[]);
  const snapshot=stage>=5?widgetData(events,new Date(),c,preferences.hijriOffset):null;
  async function run(task:()=>Promise<unknown>) { if(busy)return;setBusy(true);setMessage("");try{const result=await task();if(typeof result==="string")setMessage(result);}catch(e){setMessage(e instanceof Error?e.message:"Could not finish. Please try again.");}finally{setBusy(false);} }
  const heading=(text:string)=><Text accessibilityRole="header" style={{color:c.ink,fontSize:18,fontWeight:"800"}}>{text}</Text>;
  const note=(text:string)=><Text selectable style={{color:c.muted,fontSize:12,lineHeight:18}}>{text}</Text>;
  const button=(text:string,task:()=>Promise<unknown>)=><Pressable accessibilityRole="button" disabled={busy} onPress={()=>void run(task)} style={{minHeight:48,justifyContent:"center",alignItems:"center",paddingHorizontal:14,paddingVertical:10,borderRadius:24,backgroundColor:c.primarySoft,opacity:busy?.6:1}}><Text style={{color:c.primaryDark,fontSize:13,fontWeight:"700"}}>{text}</Text></Pressable>;
  const section={padding:18,gap:12,borderRadius:22,backgroundColor:c.surface} as const;
  // Plain React Native controls: each native Compose Picker/Switch host took tens of milliseconds to create, which
  // made Settings open with a ~0.7 s freeze.
  const save=(task:()=>void)=>{try{task();}catch{setMessage("Could not save this setting.");}};
  const choice=<T extends string|number>(options:readonly {value:T;label:string}[],value:T,onChange:(value:T)=>void)=><View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{options.map(option=>{const selected=option.value===value;return <Pressable key={String(option.value)} accessibilityRole="radio" accessibilityState={{selected}} onPress={()=>{if(!selected)onChange(option.value);}} style={{minHeight:44,paddingHorizontal:14,justifyContent:"center",borderRadius:22,backgroundColor:selected?c.primary:c.primarySoft}}><Text style={{color:selected?c.onPrimary:c.primaryDark,fontSize:13}}>{option.label}</Text></Pressable>;})}</View>;
  const toggle=(label:string,value:boolean,onChange:(value:boolean)=>void)=><Pressable accessibilityRole="switch" accessibilityState={{checked:value}} onPress={()=>onChange(!value)} style={{minHeight:48,flexDirection:"row",alignItems:"center",gap:12}}><Text style={{flex:1,color:c.ink,fontSize:15}}>{label}</Text><View style={{width:48,height:28,borderRadius:14,padding:3,backgroundColor:value?c.primary:c.line,alignItems:value?"flex-end":"flex-start"}}><View style={{width:22,height:22,borderRadius:11,backgroundColor:value?c.onPrimary:c.surface}} /></View></Pressable>;
  return <SeasonalScreen><ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{padding:18,paddingBottom:48,gap:16,backgroundColor:c.background}}>
    <Stack.Screen options={{title:"Settings"}} />
    <View style={section}>
      {heading("Regional feel")}
      {toggle("Automatic seasonal colours",preferences.autoSeasonColours,value=>save(()=>setPreference("autoSeasonColours",value)))}
      {note("Season colours follow the month you view. Choose a manual colour under Colours whenever you prefer.")}
      {note("Gentle seasonal effects cover the whole page; the centre stays softer. Reduce motion or high contrast (below) turns them off.")}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Extra date labels</Text>
      {choice(labelLanguages,preferences.labelLanguage,value=>save(()=>setPreference("labelLanguage",value)))}
      {note("English headings stay visible. Optional Kashmiri or Dogri month and full-date labels work offline.")}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Lunar dates under each date</Text>
      {choice(lunarDateOptions,preferences.lunarDates,value=>save(()=>setPreference("lunarDates",value)))}
      {note(`Today: ${hijriLabel(hijriDate(new Date(),preferences.hijriOffset))} · ${panchangLabel(kashmiriPanchang(new Date()))} · ${hindiLabel(kashmiriPanchang(new Date()))}. On the calendar, the Hijri day is on the left and the tithi on the right (Kashmiri Pandit: S7 = Shukla Saptami, K3 = Krishna Tritiya, Pur = Purnima, Ama = Amavasya; Hindi: शु7, कृ3, पू, अमा). Tap a date for full details.`)}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Hijri date adjustment</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{hijriOffsets.map(offset=><Pressable key={offset} accessibilityRole="button" accessibilityLabel={`Hijri adjustment ${offset} days`} accessibilityState={{selected:preferences.hijriOffset===offset}} onPress={()=>{try{setPreference("hijriOffset",offset);}catch{setMessage("Could not save this setting.");}}} style={{minHeight:44,minWidth:52,paddingHorizontal:14,alignItems:"center",justifyContent:"center",borderRadius:22,backgroundColor:preferences.hijriOffset===offset?c.primary:c.primarySoft}}><Text style={{color:preferences.hijriOffset===offset?c.onPrimary:c.primaryDark,fontSize:13}}>{offset>0?`+${offset}`:offset}</Text></Pressable>)}</View>
      {note("Hijri dates are calculated and can differ by a day from local moon sighting; adjust if your mosque's date differs. Kashmiri Pandit and Hindi (Vikram Samvat) tithis are calculated for sunrise in Srinagar and are approximate near tithi changes.")}
    </View>
    {stage>=1?<View style={section}>
      {heading("Accessibility")}
      {note("System text sizes, reduced motion and contrast settings are respected. These controls add your own preferences.")}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Text size</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{(["standard","large","larger"] as const).map(size=><Pressable key={size} accessibilityRole="button" accessibilityState={{selected:preferences.textSize===size}} onPress={()=>{try{setPreference("textSize",size);}catch{setMessage("Could not save this setting. Try again.");}}} style={{minHeight:48,paddingHorizontal:16,justifyContent:"center",borderRadius:24,backgroundColor:preferences.textSize===size?c.primary:c.primarySoft}}><Text style={{color:preferences.textSize===size?c.onPrimary:c.primaryDark,fontSize:13}}>{size[0].toUpperCase()+size.slice(1)}</Text></Pressable>)}</View>
      {toggle("High contrast",preferences.highContrast,value=>save(()=>setPreference("highContrast",value)))}
      {toggle("Reduce motion",preferences.reduceMotion,value=>save(()=>setPreference("reduceMotion",value)))}
      {toggle("Reduce transparency",preferences.reduceTransparency,value=>save(()=>setPreference("reduceTransparency",value)))}
    </View>:null}
    {stage>=2?<View style={section}>
      {heading("Reminders")}
      <Text style={{color:c.ink,fontSize:13,fontWeight:"700"}}>Holiday reminders</Text>
      {choice(holidayReminderScopes,preferences.holidayReminders,value=>void run(async()=>{setPreference("holidayReminders",value);if(value!=="off"&&!await requestReminderPermission())return "Allow notifications in phone settings to get holiday reminders.";await syncReminders(getEvents());}))}
      {preferences.holidayReminders!=="off"?<View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{holidayReminderHours.map(hour=><Pressable key={hour} accessibilityRole="button" accessibilityState={{selected:preferences.holidayReminderHour===hour}} onPress={()=>void run(async()=>{setPreference("holidayReminderHour",hour);await syncReminders(getEvents());})} style={{minHeight:44,paddingHorizontal:14,justifyContent:"center",borderRadius:22,backgroundColor:preferences.holidayReminderHour===hour?c.primary:c.primarySoft}}><Text style={{color:preferences.holidayReminderHour===hour?c.onPrimary:c.primaryDark,fontSize:13}}>{holidayReminderPreview(hour)}</Text></Pressable>)}</View>:null}
      {toggle("Morning note with today's dates",preferences.dailyDates,value=>void run(async()=>{setPreference("dailyDates",value);if(value&&!await requestReminderPermission())return "Allow notifications in phone settings to get the morning note.";await syncReminders(getEvents());}))}
      {note(`At ${holidayReminderPreview(dailyDatesHour)} each day: the date in Hijri, Kashmiri Pandit and Hindi (Vikram Samvat), and any holiday. Filled two weeks ahead each time you open the app.`)}
      {note(preferences.holidayReminders==="off"?"No holiday alerts.":`A notification at ${holidayReminderPreview(preferences.holidayReminderHour)} the evening before each ${preferences.holidayReminders==="general"?"J&K-wide ":""}holiday, e.g. “Tomorrow: Diwali · Government offices closed”. Moon-dependent dates are marked.`)}
      {note(reminders.granted===null?"Checking notification permission…":reminders.granted?`Notifications allowed · ${reminders.queued}/${reminders.expected} future reminders queued`:"Notifications are off. Events are still saved.")}
      {note(reminders.lastSyncAt?`Last queue check: ${new Date(reminders.lastSyncAt).toLocaleString()}`:"No queue check completed yet.")}
      {reminders.error?<Text accessibilityRole="alert" style={{color:c.danger,fontSize:13}}>{reminders.error}</Text>:null}
      {button("Repair reminders",async()=>{await syncReminders(getEvents());return "Reminder queue checked and repaired.";})}
      {button("Send 30-second test",async()=>{await sendTestReminder();return "Test queued. Lock the phone or switch apps, then tap the notification when it arrives.";})}
      {reminders.testReceivedAt?note(`Last test delivery confirmed: ${new Date(reminders.testReceivedAt).toLocaleString()}`):reminders.testAt?note(`Test scheduled: ${new Date(reminders.testAt).toLocaleTimeString()}. Delivery has not been confirmed; tap the notification to confirm it.`):null}
      {button("Open phone notification settings",()=>Linking.openSettings())}
      {note("The next 40 future alerts are queued locally and refreshed when you use the app. Android battery restrictions can delay alerts. Try a test with the app closed and after restarting your phone.")}
    </View>:null}
    {stage>=3?<View style={section}>
      {heading("Back up your events")}
      {note(`${events.length} event${events.length===1?"":"s"} saved on this phone only. Export a backup and keep it in WhatsApp, Drive or email; paste it here on a new phone to restore.`)}
      {button("Export events",async()=>{await Share.share({title:"J&K Calendar backup",message:exportEvents()});})}
      <TextInput accessibilityLabel="Paste a backup to import" value={backupText} onChangeText={setBackupText} placeholder="Paste a backup here to import" placeholderTextColor={c.muted} multiline style={{minHeight:80,maxHeight:160,padding:12,borderRadius:14,borderWidth:1,borderColor:c.line,backgroundColor:c.background,color:c.ink,fontSize:12,textAlignVertical:"top"}} />
      {backupText.trim()?button("Import events",async()=>{const result=await importEvents(backupText);setBackupText("");return `Imported: ${result.added} new, ${result.updated} updated${result.skipped?`, ${result.skipped} skipped (invalid)`:""}. Events already on this phone that were newer were kept.`;}):null}
    </View>:null}
    {stage>=4?<View style={section}>
      {heading("Official holidays")}
      {note("2026 schedule + Mela Pat and Urs Sheikh Noor-ud-Din Sahib amendments are included. Every holiday shows its scope and source. Moon-dependent dates remain labelled tentative.")}
      {toggle("Check official orders daily",preferences.autoCheckOrders,value=>save(()=>setPreference("autoCheckOrders",value)))}
      {note(orders.checking?"Checking recent official orders…":orders.checkedAt?`Last check: ${new Date(orders.checkedAt).toLocaleString()} · ${orders.checkedCount} recent orders read`:"No live check completed. Bundled holidays are available offline.")}
      {orders.error?<Text accessibilityRole="alert" style={{color:c.danger,fontSize:12}}>{orders.error}</Text>:null}
      {button(orders.checking?"Checking…":"Check official orders now",checkOfficialOrders)}
      {orders.checkedAt&&!orders.checking&&!orders.orders.some(o=>!o.included)?note("No additional holiday orders found in the recent records checked. This does not cover the full archive."):null}
      {orders.orders.map(order=><Pressable key={order.id} accessibilityRole="link" onPress={()=>void run(()=>Linking.openURL(order.url))} style={{minHeight:48,gap:4,paddingVertical:10,borderBottomWidth:1,borderColor:c.line}}><Text style={{color:c.primaryDark,fontSize:13,fontWeight:"700"}}>{order.title} ↗</Text>{note(`${newOrders.includes(order.id)?"NEW · ":""}${order.reference} · ${order.included?"Included in calendar":"Review official order — not applied to dates"}`)}</Pressable>)}
      {button("Open full official archive",()=>Linking.openURL(officialOrdersUrl))}
      {note("Checks read the GAD website’s recent order listing. Newly detected orders require review; the app does not guess amended dates from document titles.")}
    </View>:null}
    {snapshot?<View style={section}>
      {heading("Home-screen widget")}
      <View style={{padding:16,gap:5,borderRadius:18,backgroundColor:c.background}}><Text style={{color:c.primaryDark,fontSize:11,fontWeight:"800"}}>J&K CALENDAR</Text><Text style={{color:c.ink,fontSize:24,fontWeight:"800"}}>{snapshot.dateLabel}</Text>{note(`${snapshot.hijri}\n${snapshot.pandit}\n${snapshot.hindi}`)}<Text style={{color:c.ink,fontSize:14,fontWeight:"700"}}>{snapshot.holiday}</Text>{note(snapshot.holidayNote)}<Text style={{color:c.ink,fontSize:15}}>{snapshot.eventTitle}</Text>{note(snapshot.eventWhen)}<Text style={{color:c.primaryDark,fontSize:13}}>＋ Add event</Text></View>
      {button("Refresh home-screen widget",()=>syncWidgets(getEvents(),c))}
      {note("After installing the native app, long-press your home screen and add J&K Calendar from Widgets. Tap its date to open the app, or + to add an event. Widgets show your next event title.")}
      {note("Android refreshes are requested every 30 minutes and when events change. iPhone uses a timeline of up to 14 days; open the app periodically to refill it. System widget refresh timing can vary. Widgets are unavailable in Expo Go.")}
    </View>:null}
    {message?<Text accessibilityLiveRegion="polite" selectable style={{color:c.primaryDark,fontSize:13,lineHeight:20}}>{message}</Text>:null}
  </ScrollView></SeasonalScreen>;
}
