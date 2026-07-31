/**
 * secureClientStorage.js
 * Ensures only necessary, non-sensitive data is stored on the client side.
 * Provides a safe wrapper around localStorage/sessionStorage.
 */

// Fields that should NEVER be stored client-side
const BLOCKED_KEYS = [
  "password",
  "creditCard",
  "cardNumber",
  "cvv",
  "ssn",
  "socialSecurity",
  "bankAccount",
  "privateKey",
  "secret",
  "accessToken",
  "refreshToken",
];

// Fields allowed in client storage (whitelist approach)
const ALLOWED_KEYS = [
  "theme",
  "language",
  "viewMode",
  "searchHistory",
  "anonymous_user",
  "cursor",
  "eventra_chatbot_last_active",
  "eventra_events_searchHistory",
];

const isSensitiveKey = (key) => {
  const lowerKey = key.toLowerCase();
  return BLOCKED_KEYS.some((blocked) => lowerKey.includes(blocked.toLowerCase()));
};

const sanitizeValue = (value) => {
  if (typeof value === "object" && value !== null) {
    const sanitized = { ...value };
    BLOCKED_KEYS.forEach((key) => {
      delete sanitized[key];
      delete sanitized[key.toLowerCase()];
      delete sanitized[key.toUpperCase()];
    });
    return JSON.stringify(sanitized);
  }
  return typeof value === "string" ? value : JSON.stringify(value);
};

/**
 * SSR guard — returns true when localStorage/sessionStorage are unavailable
 * (e.g., Node.js, SSR, test environments).
 */
const isStorageAvailable = (useSession) => {
  if (typeof window === "undefined") return false;
  try {
    const storage = useSession ? window.sessionStorage : window.localStorage;
    const testKey = "__eventra_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

export const safeSet = (key, value, useSession = false) => {
  if (!isStorageAvailable(useSession)) return false;
  try {
    if (isSensitiveKey(key)) {
      console.warn(`[SecureStorage] Blocked storing sensitive key: "${key}"`);
      return false;
    }
    const storage = useSession ? window.sessionStorage : window.localStorage;
    storage.setItem(key, sanitizeValue(value));
    return true;
  } catch {
    return false;
  }
};

export const safeGet = (key, useSession = false) => {
  if (!isStorageAvailable(useSession)) return null;
  try {
    const storage = useSession ? window.sessionStorage : window.localStorage;
    const value = storage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch {
    return null;
  }
};

export const safeRemove = (key, useSession = false) => {
  if (!isStorageAvailable(useSession)) return false;
  try {
    const storage = useSession ? window.sessionStorage : window.localStorage;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const auditStorage = () => {
  const issues = [];
  if (!isStorageAvailable(false) && !isStorageAvailable(true)) return issues;
  try {
    // Check localStorage
    Object.keys(window.localStorage).forEach((key) => {
      if (isSensitiveKey(key)) {
        issues.push({ storage: "localStorage", key, risk: "sensitive key name" });
      }
      const value = window.localStorage.getItem(key);
      BLOCKED_KEYS.forEach((blocked) => {
        if (value && value.toLowerCase().includes(`"${blocked.toLowerCase()}":`)) {
          issues.push({ storage: "localStorage", key, risk: `contains sensitive field: ${blocked}` });
        }
      });
    });

    // Check sessionStorage
    Object.keys(window.sessionStorage).forEach((key) => {
      if (isSensitiveKey(key)) {
        issues.push({ storage: "sessionStorage", key, risk: "sensitive key name" });
      }
    });
  } catch {}

  return issues;
};

export const cleanSensitiveData = () => {
  if (!isStorageAvailable(false) && !isStorageAvailable(true)) return false;
  try {
    [...Object.keys(window.localStorage)].forEach((key) => {
      if (isSensitiveKey(key)) {
        window.localStorage.removeItem(key);
      }
    });
    [...Object.keys(window.sessionStorage)].forEach((key) => {
      if (isSensitiveKey(key)) {
        window.sessionStorage.removeItem(key);
      }
    });
    return true;
  } catch {
    return false;
  }
};
