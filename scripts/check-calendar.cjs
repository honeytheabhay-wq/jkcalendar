const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.env.CALENDAR_TYPESCRIPT || 'typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const mocks = new Map();
function load(file) {
  file = path.resolve(root, file);
  if (!path.extname(file)) file += fs.existsSync(file + '.ts') ? '.ts' : '.tsx';
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }, fileName: file, reportDiagnostics: true });
  const errors = code.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `${file}: ${errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))}`);
  vm.runInThisContext(`(function(require,module,exports){${code.outputText}\n})`, { filename: file })(name => mocks.has(name) ? mocks.get(name) : !name.startsWith('.')&&!name.startsWith('@/') ? require(name) : load(name.startsWith('@/') ? 'src/' + name.slice(2) : path.resolve(path.dirname(file), name)), module, module.exports);
  return module.exports;
}
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : /\.tsx?$/.test(entry.name) ? [path.join(dir, entry.name)] : []); }
async function main() {
  mocks.set('expo-sqlite/localStorage/install', {});
  mocks.set('react', { useSyncExternalStore: (_, get) => get(), useEffect() {} });
  const files = walk(path.join(root, 'src'));
  for (const file of files) {
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX }, fileName: file, reportDiagnostics: true });
    assert.equal(result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file);
  }
  const { validDateKey, normaliseTime, validateEvent, occursOn, buildReminderPlan } = load('src/utils/event-model.ts');
  const { holidays2026 } = load('src/data/holidays-2026.ts');
  const { holidayYearLoaded, holidaySource, nextHoliday } = load('src/utils/holiday-info.ts');
  assert.equal(holidays2026.length, 51);
  const {seasons,seasonOn,seasonDateForMonth,dogriSeasonLabel}=load('src/utils/seasons.ts');
  for(const [id,script] of Object.entries({harud:'ہارُد',wand:'وَنٛدٕ',sonth:'سونٛتھ',grishm:'گرٛیشِم',wahrath:'ؤہراتھ',shishur:'شِشُر'}))assert.equal(seasons[id].script,script);
  assert.equal(dogriSeasonLabel('sonth'),'ब्हार · Bhar');assert.equal(dogriSeasonLabel('grishm'),'सोहा · Soha');
  assert.equal(dogriSeasonLabel('harud'),'पत्तर-झाड़ · Pattar-Jhar');assert.equal(dogriSeasonLabel('wand'),'स्याल · Syal');assert.equal(dogriSeasonLabel('shishur'),'स्याल · Syal');assert.equal(dogriSeasonLabel('wahrath'),'बरसात / बरखा रुत्त · Barsat / Barkha Rutt');
  const {kashmiriPanchang,hijriDate,vikramSamvat,hindiLabel}=load('src/utils/regional-calendars.ts');
  {const d=s=>{const[y,m,x]=s.split('-').map(Number);return new Date(y,m-1,x,12);};
   const p=s=>{const v=kashmiriPanchang(d(s));return `${v.adhik?'Adhik ':''}${v.monthName} ${v.paksha} ${v.tithiName}`;};
   assert.equal(p('2026-02-15'),'Phalguna Krishna Trayodashi'); // Herath
   assert.equal(p('2026-05-01'),'Vaishakha Shukla Purnima'); // Buddha Purnima
   assert.equal(p('2026-05-25'),'Adhik Jyeshtha Shukla Dashami'); // 2026 has an Adhik Jyeshtha
   assert.equal(p('2026-06-22'),'Jyeshtha Shukla Ashtami'); // Zyeth Atham, Mela Khir Bhawani
   assert.equal(p('2026-08-28'),'Shravana Shukla Purnima'); // Raksha Bandhan
   assert.equal(p('2026-09-04'),'Bhadrapada Krishna Ashtami'); // Janmashtami
   const navreh=kashmiriPanchang(d('2026-03-19'));assert(navreh.navreh&&navreh.saptarishiYear===5102&&navreh.tithiName==='Pratipada');
   assert.equal(kashmiriPanchang(d('2026-03-18')).saptarishiYear,5101);assert(kashmiriPanchang(d('2027-04-07')).navreh);
   // Vikram Samvat 2083 starts with the Saptarishi year on Chaitra Shukla Pratipada (19 March 2026).
   assert.equal(vikramSamvat(kashmiriPanchang(d('2026-03-18'))),2082);assert.equal(vikramSamvat(navreh),2083);
   assert.equal(hindiLabel(navreh),'चैत्र शुक्ल प्रतिपदा · विक्रम संवत 2083');
   for(const [s,day,month] of [['2026-05-27',10,12],['2026-06-26',10,1],['2026-08-26',12,3]]){const h=hijriDate(d(s));assert.equal(h.day,day,s);assert.equal(h.month,month,s);}
   assert.equal(hijriDate(d('2026-03-21'),-2).month,10);assert.equal(hijriDate(d('2026-03-21'),-2).day,1);}
  const {searchHolidays,holidayListText,googleCalendarUrl}=load('src/utils/holiday-share.ts');
  assert.deepEqual(searchHolidays(holidays2026,'eid').map(h=>h.date),['2026-03-21','2026-05-27','2026-05-28','2026-08-26','2026-08-28']);
  assert.equal(searchHolidays(holidays2026,'EID ul fitr').length,1);assert.equal(searchHolidays(holidays2026,'kishtwar').length,4);assert.equal(searchHolidays(holidays2026,'  ').length,0);
  assert(holidayListText(holidays2026,2026).split('\n').length===51+5) // title, blank, 51 holidays, blank, moon note, footer;
  assert(googleCalendarUrl(holidays2026.find(h=>h.name==='Diwali')).includes('dates=20261108/20261109'));
  const {buildHolidayReminderPlan}=load('src/utils/holiday-reminders.ts');
  {const now=new Date(2026,9,27,12),plan=buildHolidayReminderPlan(holidays2026,'general',19,now);
   assert(plan.length>0&&plan.length<=20);assert(plan.every(p=>p.at>now.getTime()&&new Date(p.at).getHours()===19));
   const diwali=plan.find(p=>p.date==='2026-11-08');assert(diwali&&diwali.title==='Tomorrow: Diwali'&&/offices closed/.test(diwali.body));
   assert.equal(new Date(diwali.at).getDate(),7);
   assert(!plan.some(p=>p.date==='2026-11-10'),'local Urs excluded from J&K-wide reminders');
   assert(buildHolidayReminderPlan(holidays2026,'all',19,now).some(p=>p.date==='2026-11-10'&&/moon/.test(p.body)));
   assert.equal(buildHolidayReminderPlan(holidays2026,'off',19,now).length,0);}
  const {seasonalScenes,seasonalParticles,seasonMotionEnabled,normaliseSeasonalMotion,seasonFadeStops,seasonStrengthAt,seasonFadeMask}=load('src/utils/season-effects.ts');
  for(const [id,kinds] of Object.entries({sonth:['petal','chinar'],grishm:['mote','sunglow'],wahrath:['mist','rain'],harud:['chinar'],wand:['ember','mist','snow'],shishur:['flake']})){
    const subtle=seasonalParticles(id),lively=seasonalParticles(id,'lively');
    assert.deepEqual([...new Set(subtle.map(p=>p.kind))].sort(),kinds.sort());
    const weather=id==='wahrath'||id==='shishur';
    assert(subtle.length>=6&&subtle.length<=(weather?14:8));assert(lively.length>subtle.length&&lively.length<=(weather?20:12));
    assert(lively[0].opacity>subtle[0].opacity);assert(lively[0].duration<subtle[0].duration);
    // Rain is the one effect allowed to move quickly; everything else keeps a calm cycle of 15 s or more.
    assert(subtle.every(v=>v.phase>0&&v.phase<1&&v.duration>=(v.kind==='rain'?1200:15000)&&v.width>0&&v.height>0));
    assert(lively.every(v=>v.phase>0&&v.phase<1&&v.opacity<=.68));
    assert.equal(seasonalParticles(id,'off').length,0);
  }
  assert.equal(normaliseSeasonalMotion(undefined,false),'off');assert.equal(normaliseSeasonalMotion(undefined,true),'subtle');assert.equal(normaliseSeasonalMotion('lively',false),'lively');assert.equal(normaliseSeasonalMotion('invalid'),'subtle');assert.equal(normaliseSeasonalMotion('subtle'),'subtle');
  assert.equal(seasonFadeStops[0].at,0);assert.equal(seasonFadeStops.at(-1).at,100);
  assert(seasonFadeStops.every((s,i)=>!i||s.strength>seasonFadeStops[i-1].strength));
  assert.equal(seasonStrengthAt(.5,.5),.1);assert.equal(seasonStrengthAt(0,0),1);assert.equal(seasonStrengthAt(1,1),1);assert(seasonStrengthAt(.1,.5)>seasonStrengthAt(.4,.5));assert(Math.abs(seasonStrengthAt(.1,.2)-seasonStrengthAt(.9,.8))<1e-12);
  assert(seasonFadeMask().includes('rgba(0,0,0,0.1) 0%'));assert(seasonFadeMask().includes('rgba(0,0,0,1) 100%'));
  const allowed={enabled:true,reduceMotion:false,highContrast:false,active:true,focused:true};
  assert.equal(seasonMotionEnabled(allowed),true);
  for(const override of [{enabled:false},{reduceMotion:true},{highContrast:true},{active:false},{focused:false},{obscured:true}])assert.equal(seasonMotionEnabled({...allowed,...override}),false);
  const overlayCleanups=[];
  mocks.set('react',{useSyncExternalStore:(_,get)=>get(),useEffect(fn){const cleanup=fn();if(cleanup)overlayCleanups.push(cleanup);}});
  const {useSeasonOverlay,useSeasonOverlayOpen}=load('src/utils/season-motion-state.ts');
  assert.equal(useSeasonOverlayOpen(),false);useSeasonOverlay(false);assert.equal(useSeasonOverlayOpen(),false);useSeasonOverlay(true);useSeasonOverlay(true);assert.equal(useSeasonOverlayOpen(),true);overlayCleanups.shift()();assert.equal(useSeasonOverlayOpen(),true);overlayCleanups.shift()();assert.equal(useSeasonOverlayOpen(),false);
  mocks.set('react',{useSyncExternalStore:(_,get)=>get(),useEffect(){}});
  for(const [key,expected] of [['2026-01-14','wand'],['2026-01-15','shishur'],['2028-02-29','shishur'],['2026-03-14','shishur'],['2026-03-15','sonth'],['2026-05-14','sonth'],['2026-05-15','grishm'],['2026-07-14','grishm'],['2026-07-15','wahrath'],['2026-09-14','wahrath'],['2026-09-15','harud'],['2026-11-14','harud'],['2026-11-15','wand'],['2026-12-31','wand']]){
    assert.equal(seasonOn(new Date(key+'T12:00:00')).id,expected,key);
  }
  assert.throws(()=>seasonOn(new Date('invalid')));
  assert.equal(seasonOn(seasonDateForMonth(new Date(2026,0,1),new Date(2026,0,10))).id,'wand');
  assert.equal(seasonOn(seasonDateForMonth(new Date(2027,0,1),new Date(2026,0,10))).id,'shishur');
  const {regionalDateLabel,regionalMonthLabel}=load('src/utils/regional-labels.ts');
  assert.equal(regionalMonthLabel(new Date(2026,9,26),'english'),'');
  assert.equal(regionalDateLabel(new Date(2026,9,26),'dogri'),'सोमबार · 26 अक्तूबर 2026');
  assert.equal(regionalDateLabel(new Date(2026,9,25),'kashmiri'),'آتھوار · 25 اکتوٗبر 2026');
  assert.equal(validDateKey('2026-02-29'), false); assert.equal(validDateKey('2028-02-29'), true);
  assert.equal(validDateKey('1899-01-01'), false); assert.equal(validDateKey('2101-01-01'), false);
  assert.equal(normaliseTime('12:05 AM'), '00:05'); assert.equal(normaliseTime('1:05 PM'), '13:05'); assert.throws(() => normaliseTime('24:00'));
  assert.throws(() => validateEvent({ title: '  ', date: '2026-10-26' }));
  assert.throws(() => validateEvent({ title: 'Test', date: '2026-10-26', reminderMinutes: 30 }));
  const base = { id: 'a', title: 'Test', date: '2026-01-31', time: '09:00', repeat: 'monthly', reminderMinutes: 30 };
  assert.equal(occursOn(base, '2026-02-28'), false); assert.equal(occursOn(base, '2026-03-31'), true);
  assert.equal(occursOn({ ...base, repeat: 'daily' }, '2026-01-30'), false);
  assert.equal(occursOn({ ...base, repeat: 'weekly' }, '2026-02-07'), true);
  assert.equal(occursOn({ ...base, date: '2024-02-29', repeat: 'yearly' }, '2028-02-29'), true);
  assert.equal(occursOn({ ...base, date: '2024-02-29', repeat: 'yearly' }, '2027-02-28'), false);
  const now = new Date(2026, 0, 1, 0);
  const daily = buildReminderPlan([{ ...base, date: '2026-01-01', repeat: 'daily' }, { ...base, id: 'b', date: '2026-01-01', repeat: 'daily', time: '08:00' }], now);
  assert.equal(daily.length, 40); assert.equal(daily[0].eventId, 'b');
  assert.equal(new Date(daily[0].at).getHours(), 7); assert.equal(new Date(daily[0].at).getMinutes(), 30);
  assert(daily.every((p, i) => !i || daily[i - 1].at <= p.at));
  const monthly = buildReminderPlan([base], now); assert.deepEqual(monthly.slice(0, 3).map(p => p.date), ['2026-01-31', '2026-03-31', '2026-05-31']);
  assert.equal(buildReminderPlan([{ ...base, repeat: 'none', date: '2025-01-01' }], now).length, 0);
  const dayBefore = buildReminderPlan([{ ...base, repeat: 'none', date: '2026-01-02', reminderMinutes: 1440 }], now)[0];
  assert.equal(new Date(dayBefore.at).getDate(), 1);
  assert.equal(nextHoliday(new Date(2026, 9, 26)).remaining, 0);
  assert.equal(nextHoliday(new Date(2026, 9, 27)).holiday.name, 'Diwali');
  assert.equal(nextHoliday(new Date(2027, 0, 1)), null); assert.equal(holidayYearLoaded(2027), false);
  assert.equal(holidaySource(holidays2026.find(h => h.name === 'Mela Pat')).amended, true);
  const {parseQuickEntry}=load('src/utils/quick-entry.ts');
  const reference=new Date(2026,9,26,12);
  const parsed=parseQuickEntry('Meeting tomorrow at 11am',reference);
  assert.equal(parsed.event.title,'Meeting');assert.equal(parsed.event.date,'2026-10-27');assert.equal(parsed.event.time,'11:00');
  assert.equal(parseQuickEntry('Yoga every Monday at 7pm',reference).event.repeat,'weekly');
  assert.equal(parseQuickEntry('Rent 01/11/2026 at 9am',reference).event.date,'2026-11-01');
  assert(parseQuickEntry('Meeting tomorrow at 11',reference).notes.some(n=>n.includes('AM/PM')));
  assert.throws(()=>parseQuickEntry('Tomorrow at 11am',reference));assert.throws(()=>parseQuickEntry('Yoga every 2 weeks',reference));
  const {parseOfficialOrders,largerPageRequest}=load('src/utils/official-orders-model.ts');
  const html='<input type="hidden" name="__VIEWSTATE" value="a&amp;b"/><option value="100">100</option><table><tr><td><a onclick="showOrder.aspx?actCode=O45638"><span class="itemLink">Postponement of provincial holiday</span></a></td><td>1614 Dt 07/10/2026</td></tr><tr><td><a onclick="showOrder.aspx?actCode=O99999"><span class="itemLink">Holiday amendment</span></a></td><td>New order</td></tr><tr><td><a onclick="showOrder.aspx?actCode=O99998"><span class="itemLink">Transfers</span></a></td></tr></table>';
  const official=parseOfficialOrders(html);assert.equal(official.checkedCount,3);assert.equal(official.orders.length,2);assert.equal(official.orders[0].included,true);assert.equal(official.orders[1].included,false);assert.throws(()=>parseOfficialOrders('<html>Error</html>'));
  const post=new URLSearchParams(largerPageRequest(html));assert.equal(post.get('__VIEWSTATE'),'a&b');assert.equal(post.get('ctl00$conPage$ddlPageSize'),'100');
  {const {isHolidayOrderTitle}=load('src/utils/official-orders-model.ts');
   for(const t of ['Postponement of provincial holiday on account of Urs Sheikh Noor-Ud-Din Sahib','Preponement of Local Holiday on account of Mela Pat','Holiday on account of Shab-e-Barat','Eid-ul-Fitr holiday','Closure of Government Offices due to heavy snowfall','Schools to remain closed due to inclement weather'])assert(isHolidayOrderTitle(t),t);
   for(const t of ['Compassionate appointment of Mr Shabir Ahmad S/o Late Abdul Aziz','Transfer of Mr Eidris Khan','Promotion of officers','Closure of tender for supply of furniture'])assert(!isHolidayOrderTitle(t),t);}
  const {widgetData,widgetTimeline}=load('src/utils/widget-data.ts');
  const w=widgetData([{id:'w',title:'Review',date:'2026-10-26',time:'14:00'}],reference);assert.equal(w.holiday,'Accession Day');assert.equal(w.eventTitle,'Review');
  assert.match(w.hijri,/AH$/);assert.match(w.pandit,/ 5102$/);assert.equal(w.hindi,'Vikram Samvat 2083');
  const timeline=widgetTimeline([{id:'w',title:'Review',date:'2026-10-26',time:'14:00'}],reference);assert(timeline.length<=64);assert(timeline.at(-1).props.expired);assert(timeline.some(t=>t.date.getHours()===14&&t.date.getMinutes()===1));
  assert.equal(widgetData([],new Date(2027,0,1)).holiday,'Schedule unavailable beyond 2026');
  assert(holidaySource(holidays2026.find(h => h.name === 'Urs Sheikh Noor-ud-Din Sahib')).url.endsWith('O45638'));
  let granted = true, scheduled = [{ identifier: 'unrelated', content: { data: {} } }], cancellations = [], failures=0, delivery;
  mocks.set('react-native', { Platform: { OS: 'android' } });
  mocks.set('expo-notifications', {
    setNotificationHandler() {}, AndroidImportance: { DEFAULT: 3 }, SchedulableTriggerInputTypes: { DATE: 'date' },
    async getPermissionsAsync() { return { granted, canAskAgain: true }; },
    async requestPermissionsAsync() { return { granted }; }, async setNotificationChannelAsync() {},
    addNotificationReceivedListener(callback) { delivery=callback; return {remove(){}}; },
    addNotificationResponseReceivedListener() { return {remove(){}}; }, async getLastNotificationResponseAsync(){return null;},
    async getAllScheduledNotificationsAsync() { return scheduled; },
    async cancelScheduledNotificationAsync(id) { cancellations.push(id); scheduled = scheduled.filter(item => item.identifier !== id); },
    async scheduleNotificationAsync(item) { if(failures){failures--;throw new Error('Temporary scheduling failure');}scheduled.push(item); return item.identifier; },
  });
  // These assertions count event alerts only, so holiday reminders are switched off in the stored preferences.
  {const memory=new Map([['jk-calendar-preferences-v1',JSON.stringify({holidayReminders:'off'})]]);global.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};}
  const { syncReminders, requestReminderPermission } = load('src/utils/reminders.ts');
  const future = { ...base, date: '2099-01-01', repeat: 'none', updatedAt: 1 };
  await syncReminders([future]); assert.equal(scheduled.length, 2);
  const firstId = scheduled[1].identifier;
  await syncReminders([{ ...future, title: 'Edited', updatedAt: 2 }]);
  assert(cancellations.includes(firstId)); assert.equal(scheduled[1].content.title, 'Edited'); assert.equal(scheduled.length, 2);
  await syncReminders([]); assert.deepEqual(scheduled.map(item => item.identifier), ['unrelated']);
  granted = false; await syncReminders([future]); assert.equal(scheduled.length, 1); assert.equal(await requestReminderPermission(), false);
  mocks.set('expo-sqlite/localStorage/install', {});
  mocks.set('react', { useSyncExternalStore: (_, get) => get(), useEffect() {} });
  let stored = JSON.stringify([{ id: 'old', title: 'Legacy event', date: '2026-10-26', time: '2:00 PM' }]), failSave = false;
  global.localStorage = { getItem: () => stored, setItem: (_, value) => { if (failSave) throw new Error('Storage full'); stored = value; } };
  const { useEvents } = load('src/utils/events.ts');
  assert.equal(useEvents().events[0].title, 'Legacy event');
  await useEvents().saveEvent({ title: 'Edited legacy', date: '2026-10-26', time: '14:00' }, 'old');
  assert.equal(useEvents().events.length, 1); assert.equal(useEvents().events[0].time, '14:00');
  failSave = true;
  await assert.rejects(() => useEvents().saveEvent({ title: 'Unstored', date: '2026-10-26' }));
  assert.equal(useEvents().events.length, 1); failSave = false;
  await useEvents().deleteEvent('old'); assert.equal(useEvents().events.length, 0);
  // Backup: export then import; the newer copy of an event wins and invalid entries are skipped.
  {const {exportEvents,importEvents}=load('src/utils/events.ts');
   await useEvents().saveEvent({ title: 'Backed up', date: '2026-11-08' });const backup=exportEvents();const saved=useEvents().events[0];
   await useEvents().saveEvent({ title: 'Edited after backup', date: '2026-11-08' }, saved.id);
   let result=await importEvents(backup);assert.deepEqual(result,{added:0,updated:0,skipped:0});assert.equal(useEvents().events[0].title,'Edited after backup');
   await useEvents().deleteEvent(saved.id);result=await importEvents(backup);assert.equal(result.added,1);assert.equal(useEvents().events[0].title,'Backed up');
   result=await importEvents(JSON.stringify({app:'jk-calendar',events:[{id:'bad',title:'',date:'2026-13-40'}]}));assert.equal(result.skipped,1);
   await assert.rejects(()=>importEvents('hello'));await useEvents().deleteEvent(saved.id);}
  // Daily date notes: one per morning at 7, with all three calendars, holidays named in the title.
  {const {buildDailyDatePlan}=load('src/utils/daily-dates.ts');const plans=buildDailyDatePlan(holidays2026,-1,3,new Date(2026,10,7,20));
   assert.equal(plans.length,3);assert.equal(plans[0].date,'2026-11-08');assert.equal(new Date(plans[0].at).getHours(),7);
   assert.match(plans[0].title,/Diwali/);assert.match(plans[0].body,/Hijri: .*\nKashmiri Pandit: .*\nHindi: .*विक्रम संवत 2083/);}
  granted=true;failures=1;await syncReminders([future]);assert.equal(failures,0);assert.equal(scheduled.filter(s=>s.content.data?.calendarOwner==='jk-calendar').length,1);
  const {sendTestReminder,startReminderDeliveryListener}=load('src/utils/reminders.ts'),{getReminderStatus}=load('src/utils/reminder-status.ts');
  await sendTestReminder();const test=getReminderStatus();assert(test.testAt>Date.now());assert(!test.testReceivedAt);
  const stop=startReminderDeliveryListener();delivery({request:{identifier:test.testId,content:{data:{calendarOwner:'jk-calendar-test'}}}});assert(getReminderStatus().testReceivedAt);stop();
  granted=false;await assert.rejects(()=>sendTestReminder());
  const memory=new Map();global.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
  memory.set('jk-calendar-preferences-v1',JSON.stringify({reduceMotion:true,labelLanguage:'invalid',autoSeasonColours:false}));
  cache.delete(path.resolve(root,'src/utils/preferences.ts')); // reminders loaded it earlier; read the new storage
  const {getPreferences,setPreference}=load('src/utils/preferences.ts');
  assert.equal(getPreferences().labelLanguage,'english');assert.equal(getPreferences().reduceMotion,true);assert.equal(getPreferences().autoSeasonColours,false);
  assert.equal(getPreferences().seasonalMotion,'subtle');setPreference('seasonalMotion','off');assert.equal(getPreferences().seasonalMotion,'off');assert.equal(JSON.parse(memory.get('jk-calendar-preferences-v1')).seasonalMotion,'off');setPreference('seasonalMotion','lively');assert.equal(JSON.parse(memory.get('jk-calendar-preferences-v1')).seasonalMotion,'lively');
  setPreference('labelLanguage','dogri');setPreference('autoSeasonColours',true);
  assert.equal(getPreferences().labelLanguage,'dogri');assert.equal(JSON.parse(memory.get('jk-calendar-preferences-v1')).reduceMotion,true);
  let offline=false;
  mocks.set('expo/fetch',{fetch:async()=>{if(offline)throw new Error('Offline');return {ok:true,url:'https://jkgad.nic.in/En/OrderCirculer.aspx',text:async()=>html};}});
  const {checkOfficialOrders,getOrderStatus}=load('src/utils/official-orders.ts');
  const firstCheck=checkOfficialOrders(),secondCheck=checkOfficialOrders();assert.equal(firstCheck,secondCheck);await firstCheck;
  assert.equal(getOrderStatus().checkedCount,3);assert.equal(getOrderStatus().orders.length,2);const lastCheck=getOrderStatus().checkedAt;
  assert.deepEqual(getOrderStatus().unseen,[],'first check records existing orders without flagging them');
  offline=true;await checkOfficialOrders();assert.equal(getOrderStatus().checkedAt,lastCheck);assert.equal(getOrderStatus().orders.length,2);assert.equal(getOrderStatus().error,'Offline');
  console.log(`Checked ${files.length} TypeScript files; calendar, quick entry, widget timelines, official-order cache/failure, reminder retry/test confirmation and all 51 holidays passed.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
