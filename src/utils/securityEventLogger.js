const STORAGE_KEY = "eventra-security-events";
const MAX_EVENTS = 100;

export const logSecurityEvent = (
  type,
  message,
  metadata = {}
) => {
  if (typeof window === "undefined") return null;

  try {
    const event = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random()}`,
      type,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };

    const existing = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    existing.unshift(event);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(existing.slice(0, MAX_EVENTS))
    );

    return event;
  } catch {
    return null;
  }
};

export const getSecurityEvents = () => {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
  } catch {
    return [];
  }
};

export const clearSecurityEvents = () => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
