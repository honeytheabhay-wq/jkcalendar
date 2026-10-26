import "expo-sqlite/localStorage/install";
import { fetch } from "expo/fetch";
import { useSyncExternalStore } from "react";
import { largerPageRequest, officialOrdersUrl, parseOfficialOrders, type OfficialOrder } from "./official-orders-model";

type Status = { orders: OfficialOrder[]; checkedCount: number; checkedAt: number | null; attemptedAt: number | null; error: string | null; checking: boolean };
const key = "jk-calendar-official-orders-v1", listeners = new Set<() => void>();
function read(): Status { try { const v = JSON.parse(localStorage.getItem(key) ?? "{}"); return { orders: Array.isArray(v.orders) ? v.orders.filter((o: OfficialOrder) => /^O\d+$/.test(o.id) && o.url === `https://jkgad.nic.in/common/showOrder.aspx?actCode=${o.id}`) : [], checkedCount: Number(v.checkedCount) || 0, checkedAt: Number(v.checkedAt) || null, attemptedAt: Number(v.attemptedAt) || null, error: null, checking: false }; } catch { return { orders: [], checkedCount: 0, checkedAt: null, attemptedAt: null, error: null, checking: false }; } }
let status = read(), pending: Promise<void> | null = null;
function update(patch: Partial<Status>) { status = { ...status, ...patch }; try { localStorage.setItem(key, JSON.stringify(status)); } catch {} listeners.forEach(fn => fn()); }
export function getOrderStatus() { return status; }
export function useOrderStatus() { return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => status, () => status); }
async function request(body?: string) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(officialOrdersUrl, { signal: controller.signal, ...(body ? { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body } : {}) });
    if (!response.ok) throw new Error(`Official website returned ${response.status}.`);
    if (new URL(response.url || officialOrdersUrl).hostname !== "jkgad.nic.in") throw new Error("The official website redirected to another domain.");
    const html = await response.text(); if (html.length > 3_000_000) throw new Error("Official response was too large."); return html;
  } finally { clearTimeout(timer); }
}
export function checkOfficialOrders(): Promise<void> {
  if (pending) return pending;
  update({ checking: true, error: null, attemptedAt: Date.now() });
  pending = (async () => {
    try {
      const first = await request(), initial = parseOfficialOrders(first), body = largerPageRequest(first);
      let result = initial, limited = false;
      if (body) { try { result = parseOfficialOrders(await request(body)); } catch { limited = true; } }
      const merged = new Map(status.orders.map(order => [order.id, order])); result.orders.forEach(order => merged.set(order.id, order));
      update({ orders: [...merged.values()].sort((a,b) => Number(b.id.slice(1))-Number(a.id.slice(1))).slice(0,50), checkedCount: result.checkedCount, checkedAt: Date.now(), error: limited ? "Only the first page could be checked. Review the official archive for older orders." : null });
    } catch (e) { update({ error: e instanceof Error && e.name==="AbortError" ? "Official website timed out. Saved holidays remain available offline." : e instanceof Error ? e.message : "Could not reach the official website. Saved holidays remain available offline." }); }
    finally { pending = null; update({ checking: false }); }
  })();
  return pending;
}
