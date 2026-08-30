import { useState, useRef, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const ping = useCallback((msg, undoFn = null) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(undoFn ? { msg, undo: undoFn } : { msg });
    timer.current = setTimeout(() => setToast(null), undoFn ? 5000 : 1800);
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, ping, dismiss };
}
