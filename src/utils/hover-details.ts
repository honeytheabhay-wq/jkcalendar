import { useEffect, useMemo, useRef } from "react";

export function useHoverDetails(onDismiss: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  // Stable identities, so memoised date bubbles that receive these do not re-render.
  const handlers = useMemo(() => {
    function keepOpen() { if (timer.current) clearTimeout(timer.current); timer.current = null; }
    function leave() { keepOpen(); timer.current = setTimeout(() => dismiss.current(), 250); }
    return { keepOpen, leave };
  }, []);
  useEffect(() => handlers.keepOpen, []);
  return handlers;
}
