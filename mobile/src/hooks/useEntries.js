import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { listEntries, putEntry, deleteEntry as apiDeleteEntry } from "../services/dynamodb.js";
import { fromApiTransactionType, fromApiNecessity } from "../utils/enums.js";

const LS_KEY = "budget_cache";

// Transform API response to UI format
function transformFromApi(entry) {
  return {
    ...entry,
    type: fromApiTransactionType(entry.type),
    necessity: entry.necessity ? fromApiNecessity(entry.necessity) : undefined,
    amount: typeof entry.amount === "object" ? entry.amount.value : entry.amount,
    category: entry.categoryId,  // Map categoryId to category for UI
  };
}

async function loadCache() {
  try { return JSON.parse(await AsyncStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
async function saveCache(entries) {
  try { await AsyncStorage.setItem(LS_KEY, JSON.stringify(entries)); } catch {}
}

export function useEntries(yearMonth, isAuthenticated, householdId = null) {
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const pendingRef            = useRef(new Set());

  const filtered = entries.filter(e => !yearMonth || e.date?.startsWith(yearMonth));

  // Fetch entries for specific month
  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const data = await listEntries(yearMonth, householdId);
      const transformed = data.map(transformFromApi);
      setEntries(prev => {
        const pending = prev.filter(e => pendingRef.current.has(e.entryId));
        const seen    = new Set();
        const deduped = [...transformed, ...pending].filter(e => {
          if (seen.has(e.entryId)) return false;
          seen.add(e.entryId); return true;
        });
        saveCache(deduped);
        return deduped;
      });
    } catch (err) {
      if (err.code === "AUTH_EXPIRED") {
        // Session expired - don't cache, let auth system handle it
        setError("Session expired. Please log in again.");
        return;
      }
      setError(err.message);
      loadCache().then(cached => setEntries(cached));
    } finally { setLoading(false); }
  }, [yearMonth, isAuthenticated, householdId]);

  // Fetch ALL entries (no month filter) for dashboard charts
  const fetchAllEntries = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await listEntries(null, householdId);
      const transformed = data.map(transformFromApi);
      setAllEntries(transformed);
    } catch (err) {
      console.error("Failed to fetch all entries:", err);
    }
  }, [isAuthenticated, householdId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchAllEntries(); }, [fetchAllEntries]);

  const addEntry = useCallback(async (entry) => {
    const payload = householdId ? { ...entry, householdId } : entry;
    // Create optimistic temporary entry with client-generated ID for UI
    const tempId = `temp-${Date.now()}`;
    const optimisticEntry = { ...payload, entryId: tempId };

    pendingRef.current.add(tempId);
    setEntries(prev => { const n = [optimisticEntry, ...prev]; saveCache(n); return n; });

    try {
      const savedEntry = await putEntry(payload);
      // Replace temp entry with actual entry from server
      setEntries(prev => {
        const n = prev.map(e => e.entryId === tempId ? transformFromApi(savedEntry) : e);
        saveCache(n);
        return n;
      });
      // Refresh all entries for dashboard
      fetchAllEntries();
    } catch (err) {
      setEntries(prev => { const n = prev.filter(e => e.entryId !== tempId); saveCache(n); return n; });
      throw err;
    } finally {
      pendingRef.current.delete(tempId);
    }
  }, [householdId, fetchAllEntries]);

  const updateEntry = useCallback(async (updated) => {
    const original = entries.find(e => e.entryId === updated.entryId);
    setEntries(prev => { const n = prev.map(e => e.entryId === updated.entryId ? updated : e); saveCache(n); return n; });
    try {
      await putEntry(updated);
    } catch (err) {
      if (original) {
        setEntries(prev => { const n = prev.map(e => e.entryId === updated.entryId ? original : e); saveCache(n); return n; });
      }
      throw err;
    }
  }, [entries]);

  const removeEntry = useCallback(async (entryId) => {
    let backup = null;
    setEntries(prev => {
      backup = prev.find(e => e.entryId === entryId);
      const n = prev.filter(e => e.entryId !== entryId);
      saveCache(n);
      return n;
    });
    try {
      await apiDeleteEntry(entryId);
      // Refresh all entries for dashboard
      fetchAllEntries();
    }
    catch { if (backup) setEntries(prev => { const n = [backup, ...prev]; saveCache(n); return n; }); }
  }, [fetchAllEntries]);

  return { entries: filtered, allEntries, loading, error, addEntry, updateEntry, removeEntry, refresh: fetchEntries };
}
