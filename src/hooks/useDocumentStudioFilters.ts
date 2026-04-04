import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SortByDateOption,
  parseArrayParam,
  serializeArrayParam,
  updateSearchParams,
} from '@/utils/documentFilterParams';

const PARAM_KEYS = {
  DOC_TYPE: 'docType',
  SCOPE: 'scope',
  SORT_BY_DATE: 'sortByDate',
  SEARCH: 'q',
} as const;

export interface UseDocumentStudioFiltersReturn {
  docTypeFilter: string[];
  scopeFilter: string[];
  sortByDate: SortByDateOption;
  searchQuery: string;
  hasActiveFilters: boolean;
  toggleDocType: (docType: string) => void;
  toggleScope: (scope: string) => void;
  setSortByDate: (sort: SortByDateOption) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
}

export function useDocumentStudioFilters(): UseDocumentStudioFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const docTypeFilter = useMemo(
    () => parseArrayParam(searchParams.get(PARAM_KEYS.DOC_TYPE)),
    [searchParams]
  );

  const scopeFilter = useMemo(
    () => parseArrayParam(searchParams.get(PARAM_KEYS.SCOPE)),
    [searchParams]
  );

  const sortByDate = useMemo((): SortByDateOption => {
    const raw = searchParams.get(PARAM_KEYS.SORT_BY_DATE);
    if (raw === 'updated_newest' || raw === 'updated_oldest') return raw;
    return 'none';
  }, [searchParams]);

  const searchQuery = useMemo(
    () => searchParams.get(PARAM_KEYS.SEARCH) || '',
    [searchParams]
  );

  const hasActiveFilters =
    docTypeFilter.length > 0 ||
    scopeFilter.length > 0 ||
    sortByDate !== 'none' ||
    searchQuery.length > 0;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(updateSearchParams(searchParams, updates), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const toggleDocType = useCallback(
    (docType: string) => {
      if (docType === '__CLEAR_ALL__') {
        updateParams({ [PARAM_KEYS.DOC_TYPE]: null });
        return;
      }
      const next = docTypeFilter.includes(docType)
        ? docTypeFilter.filter((d) => d !== docType)
        : [...docTypeFilter, docType];
      updateParams({ [PARAM_KEYS.DOC_TYPE]: serializeArrayParam(next) });
    },
    [docTypeFilter, updateParams]
  );

  const toggleScope = useCallback(
    (scope: string) => {
      if (scope === '__CLEAR_ALL__') {
        updateParams({ [PARAM_KEYS.SCOPE]: null });
        return;
      }
      const next = scopeFilter.includes(scope)
        ? scopeFilter.filter((s) => s !== scope)
        : [...scopeFilter, scope];
      updateParams({ [PARAM_KEYS.SCOPE]: serializeArrayParam(next) });
    },
    [scopeFilter, updateParams]
  );

  const setSortByDate = useCallback(
    (sort: SortByDateOption) => {
      updateParams({
        [PARAM_KEYS.SORT_BY_DATE]: sort !== 'none' ? sort : null,
      });
    },
    [updateParams]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      updateParams({ [PARAM_KEYS.SEARCH]: query || null });
    },
    [updateParams]
  );

  const clearAllFilters = useCallback(() => {
    updateParams({
      [PARAM_KEYS.DOC_TYPE]: null,
      [PARAM_KEYS.SCOPE]: null,
      [PARAM_KEYS.SORT_BY_DATE]: null,
      [PARAM_KEYS.SEARCH]: null,
    });
  }, [updateParams]);

  return {
    docTypeFilter,
    scopeFilter,
    sortByDate,
    searchQuery,
    hasActiveFilters,
    toggleDocType,
    toggleScope,
    setSortByDate,
    setSearchQuery,
    clearAllFilters,
  };
}
