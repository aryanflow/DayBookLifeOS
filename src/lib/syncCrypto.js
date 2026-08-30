import { normalizeSyncKey } from "./syncConfig";

function b64(bytes) {
  let s = "";
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function b64dec(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(syncKey, salt) {
  const normalized = normalizeSyncKey(syncKey);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(normalized), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function hashSyncId(syncKey) {
  const normalized = normalizeSyncKey(syncKey);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`daybook-sync:${normalized}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function encryptApp(syncKey, app) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(syncKey, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(app)));
  return {
    salt: b64(salt),
    iv: b64(iv),
    ciphertext: b64(new Uint8Array(ciphertext)),
  };
}

export async function decryptApp(syncKey, encrypted) {
  const key = await deriveKey(syncKey, b64dec(encrypted.salt));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64dec(encrypted.iv) }, key, b64dec(encrypted.ciphertext));
  return JSON.parse(new TextDecoder().decode(plain));
}
