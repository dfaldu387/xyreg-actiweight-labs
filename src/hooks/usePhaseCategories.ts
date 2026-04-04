import { useState, useEffect, useCallback } from 'react';
import { CategoryService, type PhaseCategory } from '@/services/categoryService';

export function usePhaseCategories(companyId?: string, customOnly: boolean = false) {
  const [categories, setCategories] = useState<PhaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      const categoriesData = await CategoryService.getCompanyCategories(companyId, customOnly);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [companyId, customOnly]);

  useEffect(() => {
    if (companyId) {
      loadCategories();
    } else {
      setLoading(false);
      setCategories([]);
    }
  }, [companyId, loadCategories]);

  const createCategory = useCallback(async (name: string) => {
    if (!companyId) return false;

    try {
      const newCategory = await CategoryService.createCategory(companyId, name);
      if (newCategory) {
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.position - b.position));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating category:', err);
      return false;
    }
  }, [companyId]);

  const updateCategory = useCallback(async (categoryId: string, updates: { name?: string; position?: number }) => {
    try {
      const success = await CategoryService.updateCategory(categoryId, updates);
      if (success) {
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, ...updates } : cat
          ).sort((a, b) => a.position - b.position)
        );
      }
      return success;
    } catch (err) {
      console.error('Error updating category:', err);
      return false;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      const success = await CategoryService.deleteCategory(categoryId);
      if (success) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      }
      return success;
    } catch (err) {
      console.error('Error deleting category:', err);
      return false;
    }
  }, []);

  const reorderCategories = useCallback(async (categoryIds: string[]) => {
    if (!companyId) return false;

    try {
      const success = await CategoryService.reorderCategories(companyId, categoryIds);
      if (success) {
        await loadCategories(); // Reload to get updated positions
      }
      return success;
    } catch (err) {
      console.error('Error reordering categories:', err);
      return false;
    }
  }, [companyId, loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refreshCategories: loadCategories
  };
}
