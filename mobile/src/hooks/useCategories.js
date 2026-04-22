import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  listCustomCategories,
  createCustomCategory as apiCreate,
  deleteCustomCategory as apiDelete,
} from "../services/customCategories.js";
import { fromApiTransactionType } from "../utils/enums.js";

const CACHE_KEY = "budget_custom_categories";

// Palette for auto-assigning colors to new custom categories
const COLOR_PALETTE = [
  "#7F77DD", "#1D9E75", "#D85A30", "#378ADD", "#EF9F27",
  "#D4537E", "#5DCAA5", "#534AB7", "#BA7517", "#185FA5",
  "#993556", "#63B3ED", "#888780", "#F0997B", "#AFA9EC",
];

function pickColor(index) {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

async function loadCached() {
  try { return JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || "[]"); } catch { return []; }
}
async function saveCache(cats) {
  try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cats)); } catch {}
}

// Transform API category to UI format
function transformCategory(cat) {
  return {
    categoryId: cat.categoryId,
    id: cat.categoryId,  // Alias for backward compatibility
    label: cat.name,
    emoji: cat.emoji,
    color: cat.color,
    type: fromApiTransactionType(cat.type),
    isDefault: cat.isDefault || false,
  };
}

export function useCategories(isAuthenticated) {
  const [allCats, setAllCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Fetch ALL categories from API (including defaults)
  const fetchCategories = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await listCustomCategories();
      const transformed = data.map(transformCategory);
      setAllCats(transformed);
      await saveCache(transformed);
    } catch (e) {
      setError(e.message);
      setAllCats(await loadCached());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Split by type
  const incomeCategories = allCats.filter(c => c.type === "income");
  const expenseCategories = allCats.filter(c => c.type === "expense");
  const customCats = allCats.filter(c => !c.isDefault);

  // Color map
  const colorMap = Object.fromEntries(
    allCats.map((c, i) => [c.categoryId, c.color || pickColor(i)])
  );

  function getCategoryById(id) {
    return allCats.find(c => c.categoryId === id)
      || { id, categoryId: id, label: id, emoji: "❓" };
  }

  // Create a new custom category
  const createCategory = useCallback(async ({ label, emoji, type }) => {
    const data = await apiCreate({ label, emoji, type });
    const transformed = transformCategory(data);
    setAllCats(prev => {
      const updated = [...prev, transformed];
      saveCache(updated);
      return updated;
    });
    return transformed;
  }, []);

  // Delete a custom category
  const deleteCategory = useCallback(async (categoryId) => {
    await apiDelete(categoryId);
    setAllCats(prev => {
      const updated = prev.filter(c => c.categoryId !== categoryId);
      saveCache(updated);
      return updated;
    });
  }, []);

  return {
    incomeCategories,
    expenseCategories,
    allCategories: allCats,
    customCats,
    colorMap,
    getCategoryById,
    loading,
    error,
    createCategory,
    deleteCategory,
    refresh: fetchCategories,
  };
}
