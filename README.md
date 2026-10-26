# J&K Calendar

A small offline calendar app for Android and iPhone, built with Expo and React Native.

## Included

- Larger rounded-square dates with translucent glass-style surfaces, reflections and press feedback
- Holiday tiles use a lighter version of the weekend-header hue, with a radial gradient fading towards the centre, in Monthly and Yearly
- Today has a distinct teal outline in the grid and a brief two-cycle glow in Monthly; reduced motion keeps the outline static
- Minimal Dal Lake blue and saffron calendar app icon
- Automatic Kashmiri seasonal palettes: Sonth almond pink, Grishm lake blue, Wahrath mist green, Harud chinar copper, Wand walnut cream and Shishur snow blue
- A compact Kashmiri/English season caption, user-supplied Kashmiri script, Dogri season name and monochrome motif below the month
- Seasonal backgrounds: spring almond petals/green leaves, summer ripples/sunlight, mist/rain, autumn copper leaves, winter frost/haze and deep-winter snow, with an edge-to-centre fade
- Optional Kashmiri or Dogri Gregorian month/full-date labels, bundled offline; English weekday headings remain visible
- Settings with adjustable text size, high contrast, reduced motion and opaque date tiles; system accessibility preferences are respected
- Offline English quick entry, including relative dates, day/month dates, times and common repeat phrases; review the filled form before saving
- Reminder diagnostics, queue repair, retry after a transient scheduling error and a 30-second test alert with delivery confirmation
- Official GAD order checks with offline cache, source links and clear tentative-date labels
- Android home-screen widget and medium iPhone home-screen widget with date, holiday, next event and quick add
- Hover/focus or tap a date to see its full weekday, date and holiday details
- Monthly and Yearly tabs, with Monthly as the default
- Zoomable all-year view containing all 12 months
- Current month's holidays above the calendar in a compact collapsed dropdown with horizontal scrolling; latest dates first and past entries grey
- One compact holiday card per date; dates with multiple holidays show “2 holidays”, “3 holidays”, etc. Tapping opens all of that date's holiday details
- Calendar visible on opening with the separate Today/selected-day card removed; date pop-ups contain holiday details and event actions
- Compact Monthly / Yearly pills beside Colours and Settings, with the large introductory heading removed
- Upcoming and past holiday summary always available; tapping the entry count opens all 51 holidays in one continuous scrollable list, with a viewport sized for 10 rows
- Past holidays shown in grey without strike-through
- Previous month, next month and Today controls, horizontal month swipes, and a month/year jump selector (1900–2100)
- Tap a month or date in Yearly to open it in Monthly
- Pop-ups stay open while the pointer moves into them, have a close button, and appear above or below the inspected date
- Subtle, Standard and Strong glass intensity choices saved with the five colour themes
- Selected-day event list inside the date pop-up
- Add, edit and delete personal events with native date/time controls
- All-day events and daily, weekly, monthly or yearly repeats; dates missing from a month or year are skipped
- Optional local reminders at the event time, 30 minutes, 1 hour or 1 day before
- Events saved locally on the device
- Responsive layout for phones and tablets
- Compact Colours menu with Kashmir Bloom, Dal Lake, Saffron Dawn, Glacier Mint and Midnight Indigo
- Stronger date-bubble outlines, layered depth, touch feedback and reduced-motion support
- High-contrast weekday header bubbles in a fully separated non-overlapping row
- Official 2026 J&K general, provincial, local and restricted holidays, with source-order and amendment details available by tapping a holiday
- Clear “schedule unavailable” messages for years whose holidays have not been loaded

## Run on your phone

1. Install [Node.js](https://nodejs.org/) and the **Expo Go** app on your phone.
2. Open Terminal in this folder.
3. Run `npm install`.
4. Run `npx expo start`.
5. Scan the displayed QR code with Expo Go.

The project uses Expo SDK 57. Use an Expo Go version compatible with SDK 57 for the main calendar. **Home-screen widgets require a native build and do not run in Expo Go.** This ZIP contains the native app source project; it is not an APK or an installed iPhone app.

To build locally with widgets, run `npx expo run:android` with Android Studio/SDK installed, or `npx expo run:ios` with Xcode installed. These commands generate the native projects from the configured plugins. Install the resulting app, open it once, then add **J&K Calendar** through the phone’s home-screen widget gallery. iOS device distribution needs the usual Apple signing setup.

## Seasonal colours and regional labels

Automatic seasonal colours are enabled by default. The current month uses today's season; browsing a different month uses its midpoint to show a representative season. Traditional mid-month boundaries are approximate; the app consistently switches on 15 January, March, May, July, September and November. This is a decorative seasonal guide, not a weather forecast. Yearly keeps the palette of the month being viewed, with its existing scroll/zoom layout.

The Colours menu and Settings → Regional feel offer **Automatic seasonal colours**. Selecting a manual colour turns automatic mode off and preserves that choice for later. Switching automatic mode back on resumes the seasonal palette.

The month caption also shows the owner's supplied Dogri names: Spring **ब्हार · Bhar**, Summer **सोहा · Soha**, Autumn **पत्तर-झाड़ · Pattar-Jhar**, and Winter **स्याल · Syal**. Both Wand and Shishur show Syal; Wahrath keeps its Kashmiri/English caption because no Dogri rainy-season name was supplied. These four season labels are visible independently of the optional Gregorian date-label preference.

The month caption includes the owner's supplied Kashmiri spellings exactly: Sonth **سونٛتھ**, Grishm **گرٛیشِم**, Wahrath **ؤہراتھ**, Harud **ہارُد**, Wand **وَنٛدٕ**, and Shishur **شِشُر**. The script uses its own right-to-left text run while English navigation stays left-to-right. Supplied transliterations are retained with the season data. These spellings are user-provided; the app does not label them independently verified official translations.

**Seasonal animation** in Settings → Regional feel offers **Off / Subtle / Lively**. Lively is the new default; saved explicit intensity choices and an earlier disabled-animation setting are retained. Both active levels are stronger than before: larger shapes, greater opacity and more elements across the full screen. Spring pairs almond petals with green chinar leaves; summer uses lake ripples and gold reflections; Wahrath combines mist and silver raindrops; Harud has copper/amber leaves; Wand has frost at the corners and walnut-coloured haze; Shishur has blue/white snowflakes at varied speeds. Subtle uses 6–8 elements, and Lively uses 8–12.

A shared `SeasonalScreen` covers the whole viewport on Monthly/Yearly, Settings, New/Edit event, holiday details and the month picker. Its touch-transparent artwork sits above opaque cards, so card backgrounds cannot hide it. The artwork's opacity fades towards the centre (10% of its edge strength); no opaque surface is drawn over the text. Native keyframes calculate this falloff per position; the preview uses the equivalent radial alpha mask. Animation continues on date pop-ups and dialogs. A hidden parent page pauses when its modal is showing; the modal's own animation keeps running. Inactive routes and backgrounded apps pause. System/app reduced motion or high contrast hide effects, and all decorations are excluded from touch and accessibility. These are seasonal motifs, not live weather.

Settings → Regional feel → Extra date labels offers English only, Kashmiri (Arabic script) and Dogri (Devanagari). This adds a local month label below the month and a full date in date pop-ups. English navigation, weekday headings, holidays and event titles remain readable. The setting adds Gregorian date names; it does not convert dates to a lunar or regional calendar. Preferences and existing events are retained across updates.

Season-name reference: M.K. Raina, *A Dictionary of Peculiar & Uncommon Kashmiri Words & Phrases*, fourth edition, p. 178 ([reference PDF](https://kashmirasitis.com/wp-content/uploads/2022/12/A-Dictionary-of-Peculiar-Uncommon-Kashmiri-Words-and-Phrases.pdf)). Palette pairings and motifs are this app's design choices.

Local Gregorian names are from Unicode CLDR 49: [Kashmiri](https://unicode.org/cldr/charts/49/summary/ks.html) and [Dogri](https://unicode.org/cldr/charts/49/summary/doi.html). © Unicode, Inc.; [Unicode licence](https://www.unicode.org/license.txt). The date-name data is included locally for consistent offline labels.

## Quick entry and accessibility

In New event, enter a phrase such as `Meeting tomorrow at 11am`, `Yoga every Monday at 7pm`, or `Rent 01/11/2026 at 9am`, then tap **Fill event details**. Parsing happens offline. Ambiguous AM/PM is called out; unsupported intervals and date ranges are rejected. Dates, title and time remain editable, and nothing is saved until Save is tapped. Keyboard dictation can be used for spoken input.

Settings offers Standard/Large/Larger text, high contrast, reduced motion and reduced transparency. The monthly grid scrolls horizontally when necessary to retain readable dates and at least 44-point date targets. Yearly keeps its scrollable overview and zoom; open a month for the accessible detailed grid. Holiday dates have soft gradient tiles matching the weekend-header hue, while personal events use a dot; date labels also announce today, holidays and personal events to screen readers. Today's two brief glow cycles animate only opacity on the UI thread; reduced motion leaves a static teal outline. The full-year holiday dropdown keeps all entries in one scroll, with a viewport for 10 rows that grows with text size.

## Official order checks

The app checks the GAD website’s recent orders at most daily while it is being used; Settings also has a manual check. Failed checks retain the bundled schedule and cached order results. The parser requests up to 100 recent orders when the site supports it and reports how many were actually read. This is not a complete search of the historical archive. Newly detected holiday-related orders are marked for review and link to the official document; **dates are not automatically changed from document titles**. New annual schedules still need a reviewed data update. Moon-dependent dates remain tentative. Only the public GAD listing is requested; event titles are not sent.

## Home-screen widgets

The Android widget uses the native widget task handler to read locally saved events and requests periodic refresh every 30 minutes, plus refreshes after changes in the app. The phone controls actual refresh timing. The iPhone widget uses a timeline covering up to 14 days (up to 64 entries, depending on event density); it asks the user to reopen the app when the queue expires, instead of presenting an old date as current. Open the app periodically to refill it. Widget previews are available in Settings. Widget content includes the next event title; add it to the home screen only if you want that visible there.

## Events and reminders

Existing locally saved events are retained. Tap an event to edit it. Editing or deleting a repeating event affects its whole series.

Notifications are optional. Permission is requested only when saving a timed event with a reminder. The next 40 future alerts across all events are queued locally; this queue is refreshed after saving/deleting events and when the app opens or returns to the foreground. Already queued alerts work offline. Open the app periodically to refill the queue for recurring events. Times use the phone’s local time zone; reopening refreshes the queue after a time-zone change. Android may delay alerts under system battery/notification restrictions.

If notification permission is denied, the event is still saved. Enable notifications in phone settings and reopen the app to queue its future reminders. If an alert update fails, the app displays a warning; an older queued alert can remain until the next successful refresh.

Settings → Reminders shows permission, expected/queued counts, the last successful queue check and any error. **Repair reminders** rebuilds the queue. **Send 30-second test** queues a real local notification in the phone app. Foreground delivery or tapping the test notification confirms it; an unconfirmed test is not labelled as delivered. Test with the app closed, offline, after a reboot and with the phone locked. The Expo notifications receiver handles rebuilding already queued Android alarms after a reboot. Phone-specific battery restrictions and force-stopping can affect delivery; the app cannot override those OS rules.

## Checks

Run `npm run check` for season transitions/year boundaries, Dogri season labels, seasonal-motion gating, regional date labels and preference migration, recurrence, natural-language parsing, date boundaries, reminder scheduling/cancellation, denied permission, storage failure/recovery, official-page parsing, widget timelines and holiday data. Run `npx tsc --noEmit` for type checking. iOS and Android JavaScript bundles were exported successfully; native widget configurations were generated in an isolated prebuild check. Physical-device appearance, font shaping, native motifs, animation smoothness/battery use, widgets, screen readers and notification delivery still need testing on a phone. Check animation on a release build on the slowest supported phone, including reduced motion, background/foreground and opening Settings.

## Holiday data

The bundled 2026 dates were cross-checked against the official month-by-month J&K calendar pages and Government Order No. 1894-JK(GAD) of 2025 dated 12 December 2025. The app also incorporates Government Order No. 1528-JK(GAD) of 2026, which moved Mela Pat to 17–18 September 2026, and Government Order No. 1614-JK(GAD) of 2026, which moved Urs Sheikh Noor-ud-Din Sahib to 9 October 2026.

Muslim holidays marked in the app remain subject to the appearance of the moon, as stated in the official order.

Source orders: [2026 holiday schedule](https://jkgad.nic.in/common/showOrder.aspx?actCode=O44738), [Mela Pat amendment](https://jkgad.nic.in/common/showOrder.aspx?actCode=O45600), [Urs Sheikh Noor-ud-Din Sahib amendment](https://jkgad.nic.in/common/showOrder.aspx?actCode=O45638).
