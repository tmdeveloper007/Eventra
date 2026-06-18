/** Uses Web Crypto API for browser/SSR-compatible HMAC-SHA256. */
const _importHmacKey = async (secret) =>
  crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

/** Converts an ArrayBuffer to a hex string (matches Node.js crypto.digest("hex")). */
const _toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const usedNonces = new Map();

const MAX_REQUEST_AGE_MS = 5 * 60 * 1000;

/**
 * Validates an HMAC-SHA256 request signature.
 * Compatible with both browser and Node.js environments via Web Crypto API.
 *
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateSignature(
  payload,
  timestamp,
  nonce,
  signature,
  secret,
) {
  const now = Date.now();

  if (!timestamp || !nonce || !signature) {
    return { valid: false, error: "Missing signature fields" };
  }

  const age = now - Number(timestamp);

  if (Math.abs(age) > MAX_REQUEST_AGE_MS) {
    return { valid: false, error: "Expired request" };
  }

  if (usedNonces.has(nonce)) {
    return { valid: false, error: "Replay attack detected" };
  }

  const key = await _importHmacKey(secret);
  const message = JSON.stringify(payload) + timestamp + nonce;
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const expectedSignature = _toHex(signatureBuffer);

  if (expectedSignature !== signature) {
    return { valid: false, error: "Invalid signature" };
  }

  usedNonces.set(nonce, now);

  return { valid: true };
}

/** Cleans up stale nonces. Starts only in browser environments. */
let _nonceCleanupInterval = null;

const _startNonceCleanup = () => {
  if (_nonceCleanupInterval !== null) return;
  _nonceCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [nonce, ts] of usedNonces) {
      if (now - ts > MAX_REQUEST_AGE_MS) {
        usedNonces.delete(nonce);
      }
    }
  }, 60000);
};

/** Stops the nonce cleanup interval. Exported for test cleanup. */
export const stopNonceCleanup = () => {
  if (_nonceCleanupInterval !== null) {
    clearInterval(_nonceCleanupInterval);
    _nonceCleanupInterval = null;
  }
};

// Auto-start cleanup in browser environments only
if (typeof window !== "undefined") {
  _startNonceCleanup();
}