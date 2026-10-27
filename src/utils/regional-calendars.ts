// Offline Hijri and Kashmiri Pandit (Saptarishi) dates.
// Both depend on the moon, so they are calculated, not looked up: Hijri uses the tabular Islamic calendar with an
// adjustable offset (moon sighting in J&K can differ by a day); the panchang uses low-precision sun and moon
// positions (Meeus) at sunrise in Srinagar. Results are labelled approximate in the app.

const rad = Math.PI / 180;
const norm = (deg: number) => ((deg % 360) + 360) % 360;
const sin = (deg: number) => Math.sin(deg * rad);

function julianDayAt0hUT(year: number, month: number, day: number) {
  if (month <= 2) { year -= 1; month += 12; }
  const a = Math.floor(year / 100), b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}

function sunLongitude(jd: number) {
  const t = (jd - 2451545) / 36525;
  const l0 = 280.46646 + 36000.76983 * t, m = 357.52911 + 35999.05029 * t;
  const c = (1.914602 - 0.004817 * t) * sin(m) + (0.019993 - 0.000101 * t) * sin(2 * m) + 0.000289 * sin(3 * m);
  return norm(l0 + c - 0.00569 - 0.00478 * sin(125.04 - 1934.136 * t));
}

// Main periodic terms of the moon's longitude (Meeus, table 47.A), in millionths of a degree: [D, M, M', F, coefficient].
const moonTerms: [number, number, number, number, number][] = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116],
  [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758],
  [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720], [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036], [2, 0, 2, 0, 3994],
  [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
];
function moonLongitude(jd: number) {
  const t = (jd - 2451545) / 36525;
  const lp = 218.3164477 + 481267.88123421 * t, d = 297.8501921 + 445267.1114034 * t;
  const m = 357.5291092 + 35999.0502909 * t, mp = 134.9633964 + 477198.8675055 * t, f = 93.272095 + 483202.0175233 * t;
  const e = 1 - 0.002516 * t;
  let sum = 0;
  for (const [cd, cm, cmp, cf, coefficient] of moonTerms) sum += coefficient * (Math.abs(cm) === 1 ? e : Math.abs(cm) === 2 ? e * e : 1) * sin(cd * d + cm * m + cmp * mp + cf * f);
  return norm(lp + sum / 1e6 - 0.00478 * sin(125.04 - 1934.136 * t));
}
const elongation = (jd: number) => norm(moonLongitude(jd) - sunLongitude(jd));
// Lahiri ayanamsa, close enough for choosing the sun's sidereal sign (rashi).
const siderealSun = (jd: number) => norm(sunLongitude(jd) - (23.85306 + 1.39722 * (jd - 2451545) / 36525));

function newMoonNear(jd: number, direction: -1 | 1) {
  const e = elongation(jd);
  let t = direction < 0 ? jd - e / 12.1907 : jd + (360 - e) / 12.1907;
  for (let i = 0; i < 4; i++) { const offset = ((elongation(t) + 180) % 360) - 180; t -= offset / 12.1907; }
  return t;
}

const srinagar = { lat: 34.08, lon: 74.8 };
function sunriseJd(jd0: number) {
  const n = Math.round(jd0 + 0.5 - 2451545 + 0.0008), j = n - srinagar.lon / 360;
  const m = norm(357.5291 + 0.98560028 * j), c = 1.9148 * sin(m) + 0.02 * sin(2 * m) + 0.0003 * sin(3 * m);
  const lambda = norm(m + c + 180 + 102.9372), transit = 2451545 + j + 0.0053 * sin(m) - 0.0069 * sin(2 * lambda);
  const decl = Math.asin(sin(lambda) * sin(23.44));
  const cosH = (sin(-0.833) - sin(srinagar.lat) * Math.sin(decl)) / (Math.cos(srinagar.lat * rad) * Math.cos(decl));
  return transit - Math.acos(Math.max(-1, Math.min(1, cosH))) / rad / 360;
}

export const hinduMonths = [
  { name: "Chaitra", kashmiri: "Tsithar" }, { name: "Vaishakha", kashmiri: "Vahek" }, { name: "Jyeshtha", kashmiri: "Zyeth" },
  { name: "Ashadha", kashmiri: "Haar" }, { name: "Shravana", kashmiri: "Shravun" }, { name: "Bhadrapada", kashmiri: "Badrapeth" },
  { name: "Ashvin", kashmiri: "Ashid" }, { name: "Kartika", kashmiri: "Kartik" }, { name: "Margashirsha", kashmiri: "Monjhor" },
  { name: "Pausha", kashmiri: "Poh" }, { name: "Magha", kashmiri: "Magh" }, { name: "Phalguna", kashmiri: "Phagun" },
] as const;
const tithiNames = ["Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi"];

export type Panchang = { tithi: number; paksha: "Shukla" | "Krishna"; tithiName: string; month: number; monthName: string; kashmiriMonth: string; adhik: boolean; saptarishiYear: number; navreh: boolean };
const panchangCache = new Map<string, Panchang>();
// Tithi at sunrise in Srinagar; months named the Kashmiri (purnimanta) way, so the dark half takes the next month's name.
export function kashmiriPanchang(date: Date): Panchang {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const cached = panchangCache.get(key); if (cached) return cached;
  const rise = sunriseJd(julianDayAt0hUT(date.getFullYear(), date.getMonth() + 1, date.getDate()));
  const index = Math.floor(elongation(rise) / 12);
  const tithi = index + 1, paksha = index < 15 ? "Shukla" as const : "Krishna" as const;
  const previous = newMoonNear(rise, -1), next = newMoonNear(rise + 1, 1);
  const rashi = Math.floor(siderealSun(previous) / 30);
  const amanta = (rashi + 1) % 12, adhik = Math.floor(siderealSun(next) / 30) === rashi;
  const month = paksha === "Krishna" && !adhik ? (amanta + 1) % 12 : amanta;
  const inPaksha = paksha === "Shukla" ? tithi : tithi - 15;
  const tithiName = tithi === 15 ? "Purnima" : tithi === 30 ? "Amavasya" : tithiNames[inPaksha - 1];
  // The Saptarishi year turns at Navreh (Chaitra Shukla Pratipada, March or April).
  const beforeNavreh = amanta >= 9 && date.getMonth() <= 3;
  // Navreh falls on the day whose morning holds the Chaitra new moon, i.e. the new moon lies between the previous
  // midday and this midday, even when it comes minutes after sunrise (2026: new moon 06:53 IST on 19 March).
  const midday = rise + 0.27, lastNewMoon = newMoonNear(midday, -1);
  const chaitraStarts = midday - lastNewMoon < 1 && Math.floor(siderealSun(lastNewMoon) / 30) === 11 && Math.floor(siderealSun(newMoonNear(lastNewMoon + 2, 1)) / 30) !== 11;
  // On Navreh the new Pratipada begins within minutes of sunrise, so show the day as Chaitra Shukla Pratipada.
  if (chaitraStarts && tithi === 30) { const navreh: Panchang = { tithi: 1, paksha: "Shukla", tithiName: "Pratipada", month: 0, monthName: hinduMonths[0].name, kashmiriMonth: hinduMonths[0].kashmiri, adhik: false, saptarishiYear: date.getFullYear() + 3076, navreh: true }; panchangCache.set(key, navreh); return navreh; }
  const result: Panchang = { tithi, paksha, tithiName, month, monthName: hinduMonths[month].name, kashmiriMonth: hinduMonths[month].kashmiri, adhik, saptarishiYear: date.getFullYear() + (beforeNavreh && !chaitraStarts ? 3075 : 3076), navreh: chaitraStarts };
  panchangCache.set(key, result);
  return result;
}
export function panchangLabel(p: Panchang) {
  return `${p.adhik ? "Adhik " : ""}${p.monthName} (${p.kashmiriMonth}) ${p.paksha} ${p.tithiName} · Saptarishi ${p.saptarishiYear}${p.navreh ? " · Navreh" : ""}`;
}
// Compact form for the month grid: S7 = Shukla Saptami, K3 = Krishna Tritiya, Pur = Purnima, Ama = Amavasya.
export function panchangShort(p: Panchang) {
  return p.navreh ? "Navreh" : p.tithi === 15 ? "Pur" : p.tithi === 30 ? "Ama" : `${p.paksha === "Shukla" ? "S" : "K"}${p.paksha === "Shukla" ? p.tithi : p.tithi - 15}`;
}

// Hindi (Vikram Samvat) panchang: the same purnimanta months and sunrise tithi as above, named in Hindi. The Vikram
// Samvat year turns on the same day as the Saptarishi year (Chaitra Shukla Pratipada) and runs 3019 years behind it.
const hindiMonths = ["चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद", "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन"];
const hindiTithis = ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"];
export const vikramSamvat = (p: Panchang) => p.saptarishiYear - 3019;
export function hindiLabel(p: Panchang) {
  const tithi = p.tithi === 15 ? "पूर्णिमा" : p.tithi === 30 ? "अमावस्या" : hindiTithis[(p.paksha === "Shukla" ? p.tithi : p.tithi - 15) - 1];
  return `${p.adhik ? "अधिक " : ""}${hindiMonths[p.month]} ${p.paksha === "Shukla" ? "शुक्ल" : "कृष्ण"} ${tithi} · विक्रम संवत ${vikramSamvat(p)}`;
}
// Compact form for the month grid: शु7 = Shukla Saptami, कृ3 = Krishna Tritiya, पू = Purnima, अमा = Amavasya.
export function hindiShort(p: Panchang) {
  return p.tithi === 15 ? "पू" : p.tithi === 30 ? "अमा" : `${p.paksha === "Shukla" ? "शु" : "कृ"}${p.paksha === "Shukla" ? p.tithi : p.tithi - 15}`;
}

export const hijriMonths = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"];
export type HijriDate = { day: number; month: number; year: number; monthName: string };
const islamicEpoch = 1948439.5;
const islamicToJd = (year: number, month: number, day: number) => day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + islamicEpoch - 1;
// Default offset matches the moon-sighted dates in the official 2026 J&K holiday list (e.g. Eid-ul-Fitr on 21 March).
export const defaultHijriOffset = -1;
export const hijriOffsets = [-2, -1, 0, 1] as const;
export function hijriDate(date: Date, offset = defaultHijriOffset): HijriDate {
  const jd = julianDayAt0hUT(date.getFullYear(), date.getMonth() + 1, date.getDate()) + 0.5 + offset;
  const day0 = Math.floor(jd) + 0.5;
  const year = Math.floor((30 * (day0 - islamicEpoch) + 10646) / 10631);
  const month = Math.min(12, Math.ceil((day0 - (29 + islamicToJd(year, 1, 1))) / 29.5) + 1);
  const day = day0 - islamicToJd(year, month, 1) + 1;
  return { day, month, year, monthName: hijriMonths[month - 1] };
}
export function hijriLabel(h: HijriDate) { return `${h.day} ${h.monthName} ${h.year} AH`; }
const hijriShort = ["Muh", "Saf", "Rb1", "Rb2", "Jm1", "Jm2", "Raj", "Sha", "Ram", "Shw", "Dhq", "Dhh"];
// Compact form for the month grid: the day, or the month's short name on its first day.
export function hijriShortLabel(h: HijriDate) { return h.day === 1 ? hijriShort[h.month - 1] : String(h.day); }
