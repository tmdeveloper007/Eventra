/**
 * @fileoverview useLocalStorage - Cross-tab synchronized localStorage hook
 * @module hooks/useLocalStorage
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { safeJsonParse } from "../utils/safeJsonParse.js";
import { logger } from "../utils/logger";

/**
 * A custom React hook that provides synchronized localStorage state
 * management with cross-tab update support.
 *
 * Automatically syncs state across browser tabs using storage events.
 * Prevents self-triggered updates using an internal write flag.
 *
 * @param {string} key - The localStorage key to read/write.
 * @param {*} initialValue - Default value if key doesn't exist.
 *
 * @returns {[*, Function, Function]} Tuple of:
 *   - storedValue: Current value from localStorage
 *   - setValue: Update the stored value
 *   - removeValue: Remove the key from localStorage
 *
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");
 * setTheme("dark");
 * removeTheme();
 */

const useLocalStorage = (key, initialValue) => {
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue; //sync update — always current during render

  // Track when WE fired the event so we don't react to ourselves
  const isInternalWrite = useRef(false);
  const readValue = useCallback(() => {
    if (typeof window === "undefined") return initialValueRef.current;
    try {
      const item = window.localStorage.getItem(key);
      return safeJsonParse(item, initialValueRef.current);
    } catch (error) {
      logger.warn(`useLocalStorage: error reading key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return safeJsonParse(item, initialValue);
    } catch (error) {
      console.warn(`useLocalStorage: error reading key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      if (typeof window === "undefined") return;
      try {
        setStoredValue((currentVal) => {
          const newValue = value instanceof Function ? value(currentVal) : value;

          queueMicrotask(() => {
            if (typeof window === "undefined") return;
            window.localStorage.setItem(key, JSON.stringify(newValue));
            isInternalWrite.current = true;
            window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
          });

          return newValue;
        });
      } catch (error) {
        logger.warn(`useLocalStorage: error setting key "${key}":`, error);
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValueRef.current);

      isInternalWrite.current = true;
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      logger.warn(`useLocalStorage: error removing key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleStorageChange = (event) => {
      if (isInternalWrite.current) {
        isInternalWrite.current = false;
        return;
      }

      if (event.key === key || (event.type === "local-storage" && event.detail?.key === key)) {
        setStoredValue(readValue());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleStorageChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
export const isLocalStorageAvailable = () => {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};