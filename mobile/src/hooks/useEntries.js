import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { listEntries } from "../services/entries.js";
import { fromApiTransactionType, fromApiNecessity } from "../utils/enums.js";
import { logger } from "../utils/logger.js";
import syncService from "../services/syncService.js";

const LS_KEY     = "budget_cache";
const LS_KEY_ALL = "budget_cache_all";

export async function clearEntriesCache() {
  try { await AsyncStorage.multiRemove([LS_KEY, LS_KEY_ALL]); } catch {}
}

function transformFromApi(entry) {
  return {
    ...entry,
    type:      fromApiTransactionType(entry.type),
    necessity: entry.necessity ? fromApiNecessity(entry.necessity) : undefined,
    amount:    typeof entry.amount === "object" ? entry.amount.value : entry.amount,
    currency:  typeof entry.amount === "object" ? entry.amount.currency : (entry.currency ?? null),
    category:  entry.categoryId,
  };
}

async function loadCache()           { try { return JSON.parse(await AsyncStorage.getItem(LS_KEY)     || "[]"); } catch { return []; } }
async function saveCache(e)          { try { await AsyncStorage.setItem(LS_KEY,     JSON.stringify(e)); } catch {} }
async function loadAllCache()        { try { return JSON.parse(await AsyncStorage.getItem(LS_KEY_ALL) || "[]"); } catch { return []; } }
async function saveAllCache(e)       { try { await AsyncStorage.setItem(LS_KEY_ALL, JSON.stringify(e)); } catch {} }

export function useEntries(yearMonth, isAuthenticated, householdId = null) {
  const [entries,    setEntries]    = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pendingSync, setPendingSync] = useState(new Set());

  const filtered = entries.filter(e => !yearMonth || e.date?.startsWith(yearMonth));

  // ── Reads ──────────────────────────────────────────────────────────────────
  // Fire cache read and backend fetch in parallel.
  // Cache shows immediately; backend response updates state when it arrives.
  // Loading is true only until the cache read finishes (first paint).

  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated) {
      setEntries([]);
      setAllEntries([]);
      setLoading(false);
      return;
    }

    // Start both in parallel — don't await either yet
    const cachePromise   = loadCache();
    const networkPromise = listEntries(yearMonth, householdId).catch(err => {
      logger.info('entries', 'fetchEntries network error (will use cache):', err.message);
      return null; // null signals failure — keep cache
    });

    // Show cache immediately
    const cached = await cachePromise;
    if (cached.length > 0) setEntries(cached);
    setLoading(false);

    // Apply network result when ready
    const data = await networkPromise;
    if (data) {
      const transformed = data.map(transformFromApi);
      // Preserve locally-pending entries (temp IDs not yet synced to server).
      // Drop any temp entry whose real counterpart has already landed on the server
      // to avoid showing it twice alongside the server-assigned ID.
      setEntries(prev => {
        const pendingEntries = prev.filter(e => e.pendingSync && String(e.entryId).startsWith('temp-'));
        const seen = new Set(transformed.map(e => e.entryId));
        const merged = [...transformed, ...pendingEntries.filter(e => !seen.has(e.entryId))];
        saveCache(merged);
        return merged;
      });
    }
  }, [yearMonth, isAuthenticated, householdId]);

  const fetchAllEntries = useCallback(async () => {
    if (!isAuthenticated) {
      setAllEntries([]);
      return;
    }

    const cachePromise   = loadAllCache();
    const networkPromise = listEntries(null, householdId).catch(err => {
      logger.info('entries', 'fetchAllEntries network error (will use cache):', err.message);
      return null;
    });

    const cached = await cachePromise;
    if (cached.length > 0) setAllEntries(cached);

    const data = await networkPromise;
    if (data) {
      const transformed = data.map(transformFromApi);
      setAllEntries(prev => {
        const pendingEntries = prev.filter(e => e.pendingSync && String(e.entryId).startsWith('temp-'));
        const seen = new Set(transformed.map(e => e.entryId));
        const merged = [...transformed, ...pendingEntries.filter(e => !seen.has(e.entryId))];
        saveAllCache(merged);
        return merged;
      });
    }
  }, [isAuthenticated, householdId]);

  useEffect(() => { fetchEntries();    }, [fetchEntries]);
  useEffect(() => { fetchAllEntries(); }, [fetchAllEntries]);

  // Refresh after sync completes
  useEffect(() => {
    const handleSyncComplete = ({ syncedOperations = [] }) => {
      const entryOps = syncedOperations.filter(op => op.type?.startsWith('entry.'));
      if (entryOps.length === 0) return;

      // Remove synced temp IDs from the pending set
      setPendingSync(prev => {
        const next = new Set(prev);
        entryOps.forEach(op => {
          if (op.type === 'entry.batchCreate') {
            (op.payload?.tempIds || []).forEach(id => next.delete(id));
          } else if (op.payload?.entryId) {
            next.delete(op.payload.entryId);
          }
        });
        return next;
      });

      // Clear caches so stale temp entries don't get merged with server results
      clearEntriesCache().then(() => {
        fetchEntries();
        fetchAllEntries();
      });
    };
    syncService.addEventListener('syncComplete', handleSyncComplete);
    return () => syncService.removeEventListener('syncComplete', handleSyncComplete);
  }, [fetchEntries, fetchAllEntries]);

  // ── Writes ─────────────────────────────────────────────────────────────────
  // Flow: show optimistic entry immediately → enqueue → sync → on syncComplete
  // fetch fresh data from backend and replace state (no manual merging needed).

  const addEntry = useCallback(async (entry) => {
    const payload = householdId ? { ...entry, householdId } : entry;
    const tempId  = `temp-${Date.now()}`;
    const optimistic = transformFromApi({ ...payload, entryId: tempId, pendingSync: true });

    // 1. Show immediately with pending badge
    setEntries(prev    => { const n = [optimistic, ...prev];    saveCache(n);    return n; });
    setAllEntries(prev => { const n = [optimistic, ...prev];    saveAllCache(n); return n; });
    setPendingSync(prev => new Set([...prev, tempId]));

    // 2. Enqueue as a single-item batch so the syncComplete handler can do a
    //    clean fetch-and-replace without needing to track temp IDs.
    try {
      const { default: svc } = await import("../services/syncService.js");
      const { getStoredUser } = await import("../services/auth.js");
      const user = await getStoredUser();
      await svc.enqueue("entry.batchCreate", { entries: [payload], tempIds: [tempId] }, user?.userId);
      svc.syncAll().catch(() => {});
    } catch (err) {
      logger.error('entries', 'Failed to enqueue addEntry', err.message);
    }
  }, [householdId]);

  const updateEntry = useCallback(async (updated) => {
    // Show updated values immediately with pending badge
    setEntries(prev => {
      const n = prev.map(e => e.entryId === updated.entryId ? { ...updated, pendingSync: true } : e);
      saveCache(n);
      return n;
    });
    setPendingSync(prev => new Set([...prev, updated.entryId]));

    try {
      const { default: svc } = await import("../services/syncService.js");
      const { getStoredUser } = await import("../services/auth.js");
      const user = await getStoredUser();
      await svc.enqueue("entry.update", updated, user?.userId);
      svc.syncAll().catch(() => {});
    } catch (err) {
      logger.error('entries', 'Failed to enqueue updateEntry', err.message);
    }
  }, []);

  const removeEntry = useCallback(async (entryId) => {
    // Remove immediately
    setEntries(prev    => { const n = prev.filter(e => e.entryId !== entryId); saveCache(n);    return n; });
    setAllEntries(prev => { const n = prev.filter(e => e.entryId !== entryId); saveAllCache(n); return n; });
    setPendingSync(prev => { const next = new Set(prev); next.delete(entryId); return next; });

    try {
      const { default: svc } = await import("../services/syncService.js");
      const { getStoredUser } = await import("../services/auth.js");
      const user = await getStoredUser();
      await svc.enqueue("entry.delete", { entryId }, user?.userId);
      svc.syncAll().catch(() => {});
    } catch (err) {
      logger.error('entries', 'Failed to enqueue removeEntry', err.message);
    }
  }, []);

  return {
    entries: filtered,
    allEntries,
    loading,
    error: null,
    addEntry,
    updateEntry,
    removeEntry,
    refresh: fetchEntries,
    pendingSync,
  };
}
