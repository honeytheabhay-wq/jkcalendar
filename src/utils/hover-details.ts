import { useEffect, useRef } from "react";

export function useHoverDetails(onDismiss: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  function keepOpen() { if (timer.current) clearTimeout(timer.current); timer.current = null; }
  function leave() { keepOpen(); timer.current = setTimeout(() => dismiss.current(), 250); }
  useEffect(() => keepOpen, []);
  return { keepOpen, leave };
}
