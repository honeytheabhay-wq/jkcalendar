import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { toDateKey } from "./dates";

export function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setToday((current) => toDateKey(current) === toDateKey(new Date()) ? current : new Date());
    const interval = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener("change", state => { if (state === "active") refresh(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  return today;
}
