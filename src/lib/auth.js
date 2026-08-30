export async function hashPin(s) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("daybook:" + s));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return hashPinSync(s);
}

export function hashPinSync(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return "l:" + String(h);
}

function legacyHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return String(h);
}

export async function verifyPin(pin, stored) {
  if (!stored) return false;
  const sha = await hashPin(pin);
  if (sha === stored) return true;
  if (hashPinSync(pin) === stored) return true;
  if (legacyHash(pin) === stored) return true;
  return false;
}

export function validatePin(pin) {
  return /^\d{4}$/.test(pin);
}
