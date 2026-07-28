import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cleanupExpiredRecoverySessions,
  createRecoverySession,
  deleteRecoverySessionEntry,
  filterRecoverySessions,
  groupRecoverySessionsByType,
  normalizeMultiSessions,
  readMultiSessions,
  renameRecoverySessionEntry,
  upsertRecoverySession,
  updateRecoverySessionEntry,
  writeMultiSessions,
  MULTI_SESSION_RECOVERY_KEY,
} from "../utils/multiSessionRecovery.js";

const EMPTY_SESSIONS = [];

export const useMultiSessionRecovery = ({
  initialSessions = EMPTY_SESSIONS,
  storage = globalThis.localStorage,
  storageKey = MULTI_SESSION_RECOVERY_KEY,
  cloudSessions = EMPTY_SESSIONS,
} = {}) => {
  const [localSessions, setLocalSessions] = useState(() =>
    normalizeMultiSessions([...readMultiSessions(storage, storageKey), ...initialSessions]),
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Keep a ref so callbacks always read the latest state without stale closures
  const localSessionsRef = useRef(localSessions);
  useEffect(() => { localSessionsRef.current = localSessions; }, [localSessions]);

  useEffect(() => {
    setLocalSessions((current) =>
      normalizeMultiSessions([...current, ...readMultiSessions(storage, storageKey), ...initialSessions]),
    );
  }, [initialSessions, storage, storageKey]);

  const persist = useCallback(
    (nextSessions) => {
      const normalized = writeMultiSessions(nextSessions, storage, storageKey);
      setLocalSessions(normalized);
      return normalized;
    },
    [storage, storageKey],
  );

  const createSession = useCallback(
    (input) => {
      const session = createRecoverySession(input);
      persist(upsertRecoverySession(localSessionsRef.current, session));
      return session;
    },
    [persist],
  );

  const upsertSession = useCallback(
    (session) => persist(upsertRecoverySession(localSessionsRef.current, session)),
    [persist],
  );

  const updateSession = useCallback(
    (sessionId, patch) =>
      persist(updateRecoverySessionEntry(localSessionsRef.current, sessionId, patch)),
    [persist],
  );

  const renameSession = useCallback(
    (sessionId, name) => persist(renameRecoverySessionEntry(localSessionsRef.current, sessionId, name)),
    [persist],
  );

  const deleteSession = useCallback(
    (sessionId) => persist(deleteRecoverySessionEntry(localSessionsRef.current, sessionId)),
    [persist],
  );

  const cleanupExpired = useCallback(
    () => persist(cleanupExpiredRecoverySessions(localSessionsRef.current)),
    [persist],
  );

  const replaceSessions = useCallback(
    (sessions) => persist(sessions),
    [persist],
  );

  const allSessions = useMemo(
    () =>
      normalizeMultiSessions([
        ...localSessions,
        ...normalizeMultiSessions(cloudSessions, { source: "cloud" }),
      ]),
    [cloudSessions, localSessions],
  );

  const visibleSessions = useMemo(
    () => filterRecoverySessions(allSessions, searchQuery),
    [allSessions, searchQuery],
  );

  const groupedSessions = useMemo(
    () => groupRecoverySessionsByType(visibleSessions),
    [visibleSessions],
  );

  return {
    sessions: allSessions,
    visibleSessions,
    groupedSessions,
    searchQuery,
    setSearchQuery,
    createSession,
    upsertSession,
    updateSession,
    renameSession,
    deleteSession,
    cleanupExpired,
    replaceSessions,
    hasSessions: allSessions.length > 0,
  };
};

export default useMultiSessionRecovery;
