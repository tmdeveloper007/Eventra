/**
 * Lightweight HMAC-SHA256 signature validation using the Web Crypto API.
 *
 * Compatible with both browsers (window.crypto.subtle) and Node.js ≥ 19
 * (globalThis.crypto.subtle). No `import crypto from "crypto"` because
 * the Node.js built-in module is unavailable in the browser and crashes
 * the bundle on load.
 */

const usedNonces = new Map();
const MAX_REQUEST_AGE_MS = 5 * 60 * 1000;

let _cleanupInterval = null;

const getCrypto = () => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto;
  }
  return null;
};

const hmacSha256Hex = async (secret, data) => {
  const c = getCrypto();
  if (!c) {
    throw new Error("HMAC: Web Crypto API is not available in this environment");
  }
  const enc = new TextEncoder();
  const key = await c.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await c.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export async function validateSignature(
  payload,
  timestamp,
  nonce,
  signature,
  secret
) {
  const now = Date.now();

  if (!timestamp || !nonce || !signature) {
    return {
      valid: false,
      error: "Missing signature fields",
    };
  }

  const age = now - Number(timestamp);

  if (Math.abs(age) > MAX_REQUEST_AGE_MS) {
    return {
      valid: false,
      error: "Expired request",
    };
  }

  if (usedNonces.has(nonce)) {
    return {
      valid: false,
      error: "Replay attack detected",
    };
  }

  // Record nonce BEFORE the async HMAC to close the race window.
  // If HMAC fails (invalid sig), clear it immediately so the nonce can be retried.
  usedNonces.set(nonce, now);

  const expectedSignature = await hmacSha256Hex(
    secret,
    JSON.stringify(payload) + timestamp + nonce
  );

  if (expectedSignature !== signature) {
    usedNonces.delete(nonce); // Allow retry on invalid signature
    return {
      valid: false,
      error: "Invalid signature",
    };
  }

  return {
    valid: true,
  };
}

export const clearNonceCache = () => {
  usedNonces.clear();
};

const _startCleanupInterval = () => {
  if (_cleanupInterval) return;
  _cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [nonce, timestamp] of usedNonces) {
      if (now - timestamp > MAX_REQUEST_AGE_MS) {
        usedNonces.delete(nonce);
      }
    }
  }, 60000);
};

const _stopCleanupInterval = () => {
  if (_cleanupInterval) {
    clearInterval(_cleanupInterval);
    _cleanupInterval = null;
  }
};

export const cleanupSignatureValidator = () => {
  _stopCleanupInterval();
  usedNonces.clear();
};

if (typeof window !== "undefined") {
  window.addEventListener("unload", cleanupSignatureValidator);
}

_startCleanupInterval();
