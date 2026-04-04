import { useState, useEffect, useCallback } from 'react';
import { PhaseSubSectionService, type PhaseSubSection } from '@/services/phaseSubSectionService';

export function usePhaseSubSections(companyId?: string) {
  const [subSections, setSubSections] = useState<PhaseSubSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubSections = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      const subSectionsData = await PhaseSubSectionService.getCompanySubSections(companyId);
      setSubSections(subSectionsData);
    } catch (err) {
      console.error('Error loading sub-sections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sub-sections');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadSubSections();
    } else {
      setLoading(false);
      setSubSections([]);
    }
  }, [companyId, loadSubSections]);

  const createSubSection = useCallback(async (categoryId: string, name: string, description?: string) => {
    if (!companyId) return null;

    try {
      const newSubSection = await PhaseSubSectionService.createSubSection(
        categoryId,
        companyId,
        name,
        description
      );
      if (newSubSection) {
        setSubSections(prev => [...prev, newSubSection].sort((a, b) => a.position - b.position));
        return newSubSection;
      }
      return null;
    } catch (err) {
      console.error('Error creating sub-section:', err);
      return null;
    }
  }, [companyId]);

  const updateSubSection = useCallback(async (
    subSectionId: string,
    updates: { name?: string; description?: string; position?: number }
  ) => {
    if (!companyId) return false;

    try {
      const success = await PhaseSubSectionService.updateSubSection(subSectionId, updates, companyId);
      if (success) {
        setSubSections(prev =>
          prev.map(sub =>
            sub.id === subSectionId ? { ...sub, ...updates } : sub
          ).sort((a, b) => a.position - b.position)
        );
      }
      return success;
    } catch (err) {
      console.error('Error updating sub-section:', err);
      return false;
    }
  }, [companyId]);

  const deleteSubSection = useCallback(async (subSectionId: string) => {
    if (!companyId) return false;

    try {
      const success = await PhaseSubSectionService.deleteSubSection(subSectionId, companyId);
      if (success) {
        setSubSections(prev => prev.filter(sub => sub.id !== subSectionId));
      }
      return success;
    } catch (err) {
      console.error('Error deleting sub-section:', err);
      return false;
    }
  }, [companyId]);

  const reorderSubSections = useCallback(async (categoryId: string, subSectionIds: string[]) => {
    if (!companyId) return false;

    try {
      const success = await PhaseSubSectionService.reorderSubSections(categoryId, companyId, subSectionIds);
      if (success) {
        await loadSubSections(); // Reload to get updated positions
      }
      return success;
    } catch (err) {
      console.error('Error reordering sub-sections:', err);
      return false;
    }
  }, [companyId, loadSubSections]);

  // Helper to get sub-sections for a specific category (checks if categoryId is in category_ids array)
  const getSubSectionsForCategory = useCallback((categoryId: string) => {
    return subSections.filter(sub => sub.category_ids?.includes(categoryId));
  }, [subSections]);

  return {
    subSections,
    loading,
    error,
    loadSubSections,
    createSubSection,
    updateSubSection,
    deleteSubSection,
    reorderSubSections,
    getSubSectionsForCategory,
    refreshSubSections: loadSubSections
  };
}
