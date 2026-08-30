import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadSyncConfig,
  saveSyncConfig,
  generateSyncKey,
  createDeviceId,
  isValidSyncKey,
  formatSyncKey,
} from "../lib/syncConfig";
import { hashSyncId } from "../lib/syncCrypto";
import { encryptAndPush, fetchRemote, isSyncAvailable, pullAndDecrypt } from "../lib/sync";
import { registerUserProfile } from "../lib/userRegistry";

const PUSH_DELAY_MS = 2500;

export function useSync({ app, importApp, logEvent, logError }) {
  const [config, setConfigState] = useState(() => loadSyncConfig());
  const [status, setStatus] = useState("idle");
  const [lastError, setLastError] = useState("");
  const localUpdatedAt = useRef(config?.localUpdatedAt || Date.now());
  const pushTimer = useRef(null);
  const syncing = useRef(false);

  const setConfig = useCallback((next) => {
    setConfigState(next);
    saveSyncConfig(next);
  }, []);

  useEffect(() => {
    localUpdatedAt.current = Date.now();
  }, [app]);

  useEffect(() => {
    if (!config?.enabled) return undefined;
    const t = setTimeout(() => {
      const ts = Date.now();
      localUpdatedAt.current = ts;
      setConfigState((prev) => {
        if (!prev?.enabled) return prev;
        const next = { ...prev, localUpdatedAt: ts };
        saveSyncConfig(next);
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [app, config?.enabled]);

  const applyRemote = useCallback(
    async (remote, syncKey) => {
      const decrypted = await pullAndDecrypt(syncKey, remote);
      if (!decrypted) throw new Error("Could not decrypt cloud copy - check your sync code");
      importApp(decrypted);
      localUpdatedAt.current = remote.updatedAt;
      return remote.updatedAt;
    },
    [importApp]
  );

  const pushNow = useCallback(
    async (cfg = config) => {
      if (!cfg?.enabled || !isSyncAvailable()) return { ok: false, reason: "disabled" };
      if (syncing.current) return { ok: false, reason: "busy" };

      syncing.current = true;
      setStatus("syncing");
      setLastError("");

      const updatedAt = Date.now();
      localUpdatedAt.current = updatedAt;

      try {
        const result = await encryptAndPush(cfg.syncKey, cfg.syncId, app, {
          updatedAt,
          deviceId: cfg.deviceId,
        });

        if (result.conflict && result.remote) {
          if (result.remote.updatedAt > updatedAt) {
            await applyRemote(result.remote, cfg.syncKey);
            const next = {
              ...cfg,
              localUpdatedAt: result.remote.updatedAt,
              lastSyncedAt: new Date().toISOString(),
            };
            setConfig(next);
            setStatus("synced");
            logEvent?.("sync.pulled", { conflict: true });
            return { ok: true, pulled: true };
          }
        }

        const next = {
          ...cfg,
          localUpdatedAt: updatedAt,
          lastSyncedAt: new Date().toISOString(),
        };
        setConfig(next);
        setStatus("synced");
        logEvent?.("sync.pushed", { pulled: false });
        return { ok: true, pulled: false };
      } catch (e) {
        setStatus(navigator.onLine ? "error" : "offline");
        setLastError(e.message || "Sync failed");
        logError?.("sync.failed", e, { phase: "push" });
        return { ok: false, reason: e.message };
      } finally {
        syncing.current = false;
      }
    },
    [app, applyRemote, config, setConfig, logEvent, logError]
  );

  const pullNow = useCallback(
    async (cfg = config) => {
      if (!cfg?.enabled || !isSyncAvailable()) return { ok: false, reason: "disabled" };
      if (syncing.current) return { ok: false, reason: "busy" };

      syncing.current = true;
      setStatus("syncing");
      setLastError("");

      try {
        const remote = await fetchRemote(cfg.syncId);
        if (!remote) {
          setStatus("synced");
          return { ok: true, pulled: false, empty: true };
        }

        if (remote.updatedAt <= (cfg.localUpdatedAt || localUpdatedAt.current || 0)) {
          setStatus("synced");
          return { ok: true, pulled: false };
        }

        await applyRemote(remote, cfg.syncKey);
        const next = {
          ...cfg,
          localUpdatedAt: remote.updatedAt,
          lastSyncedAt: new Date().toISOString(),
        };
        setConfig(next);
        setStatus("synced");
        logEvent?.("sync.pulled", { empty: false });
        return { ok: true, pulled: true };
      } catch (e) {
        setStatus(navigator.onLine ? "error" : "offline");
        setLastError(e.message || "Sync failed");
        logError?.("sync.failed", e, { phase: "pull" });
        return { ok: false, reason: e.message };
      } finally {
        syncing.current = false;
      }
    },
    [applyRemote, config, setConfig, logEvent, logError]
  );

  const syncNow = useCallback(async () => {
    const pull = await pullNow();
    if (!pull.ok) return pull;
    if (pull.pulled) return pull;
    return pushNow();
  }, [pullNow, pushNow]);

  useEffect(() => {
    if (!config?.enabled || !isSyncAvailable()) return undefined;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      pushNow();
    }, PUSH_DELAY_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [app, config?.enabled, config?.syncId, pushNow]);

  useEffect(() => {
    if (!config?.enabled || !isSyncAvailable()) return undefined;

    pullNow();

    const onOnline = () => syncNow();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [config?.enabled, config?.syncId]);

  const enableSync = useCallback(async () => {
    if (!isSyncAvailable()) {
      return { ok: false, reason: "Sync is not configured for this site" };
    }

    const syncKey = generateSyncKey();
    const syncId = await hashSyncId(syncKey);
    const deviceId = createDeviceId();
    const updatedAt = Date.now();
    localUpdatedAt.current = updatedAt;

    const next = {
      enabled: true,
      syncKey,
      syncId,
      deviceId,
      localUpdatedAt: updatedAt,
      lastSyncedAt: null,
    };

    setConfig(next);
    await encryptAndPush(syncKey, syncId, app, { updatedAt, deviceId });
    next.lastSyncedAt = new Date().toISOString();
    setConfig(next);
    setStatus("synced");
    logEvent?.("sync.enabled");
    const active = app.users.find((u) => u.id === app.activeUserId);
    if (active) {
      registerUserProfile({
        userId: active.id,
        userName: active.name,
        createdAt: active.createdAt,
        syncId,
      });
    }
    return { ok: true, syncKey };
  }, [app, setConfig, logEvent]);

  const linkDevice = useCallback(
    async (rawKey) => {
      if (!isSyncAvailable()) {
        return { ok: false, reason: "Sync is not configured for this site" };
      }
      if (!isValidSyncKey(rawKey)) {
        return { ok: false, reason: "Sync code must be 24 characters" };
      }

      const syncKey = formatSyncKey(rawKey);
      const syncId = await hashSyncId(syncKey);
      const deviceId = createDeviceId();

      setStatus("syncing");
      try {
        const remote = await fetchRemote(syncId);
        if (!remote) {
          return { ok: false, reason: "No cloud copy found for that code yet - turn on sync on your other device first" };
        }

        await applyRemote(remote, syncKey);
        const next = {
          enabled: true,
          syncKey,
          syncId,
          deviceId,
          localUpdatedAt: remote.updatedAt,
          lastSyncedAt: new Date().toISOString(),
        };
        setConfig(next);
        setStatus("synced");
        logEvent?.("sync.linked");
        return { ok: true };
      } catch (e) {
        setStatus("error");
        logError?.("sync.failed", e, { phase: "link" });
        return { ok: false, reason: e.message || "Could not link - check your sync code" };
      }
    },
    [applyRemote, setConfig, logEvent, logError]
  );

  const disableSync = useCallback(() => {
    setConfig(null);
    setStatus("idle");
    setLastError("");
    logEvent?.("sync.disabled");
  }, [setConfig, logEvent]);

  return {
    available: isSyncAvailable(),
    enabled: !!config?.enabled,
    config,
    status,
    lastError,
    syncKeyFormatted: config?.syncKey ? formatSyncKey(config.syncKey) : "",
    enableSync,
    linkDevice,
    disableSync,
    syncNow,
    pullNow,
    pushNow,
  };
}
