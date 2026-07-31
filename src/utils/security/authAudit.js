// src/utils/security/authAudit.js

const AUTH_AUDIT_KEY = "eventra_auth_audit";
const MAX_AUDIT_ENTRIES = 100;

/**
 * Returns true if localStorage is available in the current environment.
 * Guards against SSR (Node.js), test environments, and privacy browsers.
 */
const isLocalStorageAvailable = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    // Attempt a read+write to confirm the storage is actually functional
    const testKey = "__eventra_audit_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Stores an authentication-related audit event.
 *
 * @param {string} event - Event name (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.)
 * @param {object} details - Optional event metadata.
 */
export const logAuthEvent = (event, details = {}) => {
  try {
    if (!isLocalStorageAvailable()) return;

    const auditLog = JSON.parse(localStorage.getItem(AUTH_AUDIT_KEY) || "[]");

    const entry = {
      event,
      timestamp: new Date().toISOString(),
      browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
      platform: typeof navigator !== "undefined" ? navigator.platform : "",
      language: typeof navigator !== "undefined" ? navigator.language : "",
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
      ...details,
    };

    auditLog.unshift(entry);

    if (auditLog.length > MAX_AUDIT_ENTRIES) {
      auditLog.length = MAX_AUDIT_ENTRIES;
    }

    localStorage.setItem(AUTH_AUDIT_KEY, JSON.stringify(auditLog));

    // Helpful during development
    console.info("[Auth Audit]", entry);
  } catch (error) {
    console.error("[Auth Audit] Failed to record event:", error);
  }
};

/**
 * Returns all stored audit events.
 */
export const getAuthAuditLog = () => {
  try {
    if (!isLocalStorageAvailable()) return [];
    return JSON.parse(localStorage.getItem(AUTH_AUDIT_KEY) || "[]");
  } catch {
    return [];
  }
};

/**
 * Clears the stored audit log.
 */
export const clearAuthAuditLog = () => {
  try {
    if (!isLocalStorageAvailable()) return;
    localStorage.removeItem(AUTH_AUDIT_KEY);
  } catch {
    // Non-fatal
  }
};
