// src/utils/security/authAudit.js

const AUTH_AUDIT_KEY = "eventra_auth_audit";
const MAX_AUDIT_ENTRIES = 100;

/**
 * Stores an authentication-related audit event.
 *
 * @param {string} event - Event name (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.)
 * @param {object} details - Optional event metadata.
 */
export const logAuthEvent = (event, details = {}) => {
  // SSR guard — localStorage and navigator are not available during server-side rendering
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  try {
    const auditLog = JSON.parse(localStorage.getItem(AUTH_AUDIT_KEY) || "[]");

    const entry = {
      event,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
  // SSR guard
  if (typeof window === "undefined" || typeof localStorage === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem(AUTH_AUDIT_KEY) || "[]");
  } catch {
    return [];
  }
};

/**
 * Clears the stored audit log.
 */
export const clearAuthAuditLog = () => {
  // SSR guard
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  localStorage.removeItem(AUTH_AUDIT_KEY);
};
