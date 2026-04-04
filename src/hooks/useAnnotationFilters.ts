import { useState, useCallback } from 'react';
import { AnnotationService, ANNOTATION_TYPES } from '@/services/annotationService';

export function useAnnotationFilters() {
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  const [visibleTypes, setVisibleTypes] = useState<string[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(true);

  const updateFilteredTypes = useCallback((types: string[]) => {
    setFilteredTypes(types);
  }, []);

  const updateVisibleTypes = useCallback((types: string[]) => {
    setVisibleTypes(types);
  }, []);

  const toggleTypeFilter = useCallback((type: string) => {
    setFilteredTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const toggleTypeVisibility = useCallback((type: string) => {
    setVisibleTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  const selectAllTypes = useCallback(() => {
    const allTypes = AnnotationService.getSupportedAnnotationTypes();
    setFilteredTypes(allTypes);
    setVisibleTypes(allTypes);
    setShowAllTypes(true);
  }, []);

  const clearAllTypes = useCallback(() => {
    setFilteredTypes([]);
    setVisibleTypes([]);
    setShowAllTypes(false);
  }, []);

  const resetToDefaults = useCallback(() => {
    const allTypes = AnnotationService.getSupportedAnnotationTypes();
    setFilteredTypes(allTypes);
    setVisibleTypes(allTypes);
    setShowAllTypes(true);
  }, []);

  const isTypeFiltered = useCallback((type: string) => {
    return showAllTypes || filteredTypes.includes(type);
  }, [filteredTypes, showAllTypes]);

  const isTypeVisible = useCallback((type: string) => {
    return visibleTypes.includes(type);
  }, [visibleTypes]);

  return {
    filteredTypes,
    visibleTypes,
    showAllTypes,
    updateFilteredTypes,
    updateVisibleTypes,
    toggleTypeFilter,
    toggleTypeVisibility,
    selectAllTypes,
    clearAllTypes,
    resetToDefaults,
    isTypeFiltered,
    isTypeVisible
  };
} 