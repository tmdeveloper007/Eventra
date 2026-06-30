/**
 * Signature validation using Web Crypto API.
 * Works in both browser (window.crypto.subtle) and Node.js >= 19 (globalThis.crypto.subtle).
 * No Node.js built-in `crypto` module — safe for browser bundles.
 */

import { hmacSha256Hex } from "./requestSigner.js";

const usedNonces = new Map();

const MAX_REQUEST_AGE_MS = 5 * 60 * 1000;

// Re-export hmacSha256Hex so existing callers can generate expected signatures
export { hmacSha256Hex } from "./requestSigner.js";

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

  // Use Web Crypto API (async) instead of Node.js crypto.createHmac (sync)
  const expectedSignature = await hmacSha256Hex(
    secret,
    JSON.stringify(payload) + timestamp + nonce
  );

  if (expectedSignature !== signature) {
    return {
      valid: false,
      error: "Invalid signature",
    };
  }

  usedNonces.set(nonce, now);

  return {
    valid: true,
  };
}
