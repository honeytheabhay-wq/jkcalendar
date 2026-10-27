export const seasons = {
  sonth: { id: "sonth", name: "Sonth", script: "سونٛتھ", transliteration: "Sōnth / Soanth", english: "Spring", colour: "Almond pink", motif: "flower-2" },
  grishm: { id: "grishm", name: "Grishm", script: "گرٛیشِم", transliteration: "Grīšim / Grishim", english: "Summer", colour: "Lake blue", motif: "waves" },
  wahrath: { id: "wahrath", name: "Wahrath", script: "ؤہراتھ", transliteration: "Wəhrāt / Waharat", english: "Rainy season", colour: "Mist green", motif: "cloud-rain" },
  harud: { id: "harud", name: "Harud", script: "ہارُد", transliteration: "Hārud", english: "Autumn", colour: "Chinar copper", motif: "leaf" },
  wand: { id: "wand", name: "Wand", script: "وَنٛدٕ", transliteration: "Wandë / Wandeh", english: "Winter", colour: "Walnut cream", motif: "tree-pine" },
  shishur: { id: "shishur", name: "Shishur", script: "شِشُر", transliteration: "Šišur / Shishur", english: "Deep winter", colour: "Snow blue", motif: "snowflake" },
} as const;
export type SeasonId = keyof typeof seasons;
export type Season = (typeof seasons)[SeasonId];

// The four Dogri names and spellings supplied by the app's owner.
// Both Kashmiri winter periods share Syal.
const dogriSeasons = {
  sonth: "ब्हार · Bhar",
  grishm: "सोहा · Soha",
  wahrath: "बरसात / बरखा रुत्त · Barsat / Barkha Rutt",
  harud: "पत्तर-झाड़ · Pattar-Jhar",
  wand: "स्याल · Syal",
  shishur: "स्याल · Syal",
} as const;
export function dogriSeasonLabel(id: SeasonId): string { return dogriSeasons[id]; }

// Traditional boundaries are approximate mid-month periods. The app uses the 15th.
export function seasonOn(date: Date): Season {
  if (!Number.isFinite(date.getTime())) throw new Error("Choose a valid date.");
  const stamp=(date.getMonth()+1)*100+date.getDate();
  return stamp<115?seasons.wand:stamp<315?seasons.shishur:stamp<515?seasons.sonth:stamp<715?seasons.grishm:stamp<915?seasons.wahrath:stamp<1115?seasons.harud:seasons.wand;
}

export function seasonDateForMonth(month: Date, today: Date): Date {
  return month.getFullYear()===today.getFullYear() && month.getMonth()===today.getMonth()
    ? today
    : new Date(month.getFullYear(),month.getMonth(),16,12);
}
