import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { installGlobalErrorLogging, logActivity } from "../lib/activityLog";

const ActivityLogContext = createContext({ log: () => {}, logErr: () => {} });

export function ActivityLogProvider({ profile, meta, children }) {
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const log = useCallback(
    (action, detail) => {
      if (!profile?.name) return;
      logActivity(action, {
        userName: profile.name,
        userId: profile.id,
        detail: { ...metaRef.current, ...(detail || {}) },
      });
    },
    [profile?.id, profile?.name]
  );

  const logErr = useCallback(
    (action, error, detail) => {
      log(action, {
        ...(detail || {}),
        level: "error",
        message: error?.message || String(error),
        stack: error?.stack?.split("\n").slice(0, 4).join(" | "),
      });
    },
    [log]
  );

  useEffect(() => {
    if (!profile?.name) return undefined;
    return installGlobalErrorLogging(() => ({
      userName: profile.name,
      userId: profile.id,
      detail: metaRef.current,
    }));
  }, [profile?.id, profile?.name]);

  return <ActivityLogContext.Provider value={{ log, logErr }}>{children}</ActivityLogContext.Provider>;
}

export function useActivityLog() {
  return useContext(ActivityLogContext);
}
