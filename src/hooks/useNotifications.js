import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "eventra_notifications";
const FLUSH_INTERVAL_MS = 300;

export function useNotifications() {
  const queueRef = useRef([]);
  const flushTimeoutRef = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const load = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setNotifications(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      load();
    };
    window.addEventListener("eventra-notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("eventra-notifications-updated", handleUpdate);
    };
  }, [load]);

  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: "notif-" + Math.random().toString(36).substring(2) + Date.now().toString(36),
      read: false,
      createdAt: new Date().toISOString(),
      ...notif,
    };
    queueRef.current.push(newNotif);

    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    flushTimeoutRef.current = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [...queueRef.current, ...existing];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      queueRef.current = [];
      flushTimeoutRef.current = null;
      window.dispatchEvent(new CustomEvent("eventra-notifications-updated"));
    }, FLUSH_INTERVAL_MS);
  }, []);

  const markAllAsRead = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const updated = existing.map((n) => ({ ...n, read: true }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setNotifications(updated);
      window.dispatchEvent(new CustomEvent("eventra-notifications-updated"));
    } catch {}
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== "undefined" && window.Notification) {
      const permission = await window.Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAllAsRead,
    requestPermission,
  };
}
