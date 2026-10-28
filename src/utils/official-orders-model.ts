export const officialOrdersUrl = "https://jkgad.nic.in/En/OrderCirculer.aspx";
export const knownHolidayOrders = ["O44738", "O45600", "O45638"];
export type OfficialOrder = { id: string; title: string; reference: string; url: string; included: boolean };
// Holiday orders only. Whole words, so a name like "Shabir" in an appointment order does not match "Shab".
export function isHolidayOrderTitle(title: string) {
  return /\b(holidays?|shab[- ]?e[- ]?\w+|shab-i-\w+|urs|eids?|eid-ul-\w+|mela|navratri|diwali|dussehra|raksha\s+bandhan|nauroz|navroz|janmashtami|janam\s+ashtami|yatra)\b/i.test(title);
}
function decode(text: string) { return text.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " "); }
function plain(html: string) { return decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(); }
export function parseOfficialOrders(html: string) {
  const rows: OfficialOrder[] = [], allIds = new Set<string>();
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = match[1], id = /showOrder\.aspx\?actCode=(O\d+)/i.exec(row)?.[1];
    if (!id || allIds.has(id)) continue;
    allIds.add(id);
    const title = plain(/<span[^>]*class=["']itemLink["'][^>]*>([\s\S]*?)<\/span>/i.exec(row)?.[1] ?? /<a\b[^>]*>([\s\S]*?)<\/a>/i.exec(row)?.[1] ?? "");
    if (!isHolidayOrderTitle(title)) continue;
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
    rows.push({ id, title, reference: plain(cells[1]?.[1] ?? ""), url: `https://jkgad.nic.in/common/showOrder.aspx?actCode=${id}`, included: knownHolidayOrders.includes(id) });
  }
  if (!allIds.size) throw new Error("The official orders page could not be read. Your saved holiday schedule is unchanged.");
  return { orders: rows, checkedCount: allIds.size };
}
export function largerPageRequest(html: string): string | null {
  if (!html.includes('value="100"')) return null;
  const fields = new URLSearchParams();
  for (const match of html.matchAll(/<input\b[^>]*type=["']hidden["'][^>]*>/gi)) {
    const name = /\bname=["']([^"']*)/.exec(match[0])?.[1], value = /\bvalue=["']([^"']*)/.exec(match[0])?.[1];
    if (name) fields.set(decode(name), decode(value ?? ""));
  }
  if (!fields.has("__VIEWSTATE")) return null;
  fields.set("__EVENTTARGET", "ctl00$conPage$ddlPageSize"); fields.set("__EVENTARGUMENT", "");
  fields.set("ctl00$conPage$ddlPageSize", "100"); fields.set("ctl00$conPage$ddlPageNumb", "0");
  return fields.toString();
}
