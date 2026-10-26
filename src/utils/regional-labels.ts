export type LabelLanguage = "english" | "kashmiri" | "dogri";
export const labelLanguages = [
  {value:"english",label:"English only"},
  {value:"kashmiri",label:"Kashmiri · کٲشُر"},
  {value:"dogri",label:"Dogri · डोगरी"},
] as const;

// Gregorian names from Unicode CLDR 49, ks and doi. Bundled for offline use.
export const regionalNames = {
  kashmiri: {
    months:["جنوری","فروری","مارچ","اپریل","مئی","جوٗن","جُلایی","اگست","ستمبر","اکتوٗبر","نومبر","دسمبر"],
    days:["آتھوار","ژٔندرٕروار","بۆموار","بودوار","برؠسوار","جُمہ","بٹوار"],
  },
  dogri: {
    months:["जनवरी","फरवरी","मार्च","अप्रैल","मेई","जून","जुलाई","अगस्त","सितंबर","अक्तूबर","नवंबर","दिसंबर"],
    days:["ऐतबार","सोमबार","मंगलबार","बुधबार","बीरबार","शुक्रबार","शनिबार"],
  },
} as const;

export function regionalMonthLabel(date: Date, language: LabelLanguage): string {
  return language==="english"?"":regionalNames[language].months[date.getMonth()];
}

export function regionalDateLabel(date: Date, language: LabelLanguage): string {
  if(language==="english")return "";
  const names=regionalNames[language];
  return `${names.days[date.getDay()]} · ${date.getDate()} ${names.months[date.getMonth()]} ${date.getFullYear()}`;
}
