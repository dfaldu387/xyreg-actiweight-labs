/**
 * useDocumentFilterParams Hook
 *
 * Custom hook for managing document filters with URL parameter synchronization.
 * Provides a clean API for filter management with automatic URL sync and validation.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DocumentFilters,
  SortByDateOption,
  ViewMode,
  DocumentView,
  SegmentFilter,
  TableSortState,
  DEFAULT_FILTERS,
  URL_PARAM_KEYS,
  parseDocumentFiltersFromUrl,
  parseTableSortFromUrl,
  serializeArrayParam,
  serializeTableSortToUrl,
  updateSearchParams,
  validatePhases,
  validateStatuses,
  validateAuthors,
  hasActiveFilters as checkHasActiveFilters,
  countActiveFilters as getActiveFilterCount,
  SORT_OPTION_LABELS,
} from '@/utils/documentFilterParams';

// ============================================================================
// Types
// ============================================================================

export interface UseDocumentFilterParamsOptions {
  /** Available phases for validation */
  availablePhases?: string[];
  /** Available authors for validation */
  availableAuthors?: Array<{ id: string; name: string }>;
  /** Callback when phase filter changes */
  onPhaseFilterChange?: (phases: string[]) => void;
  /** Callback when status filter changes */
  onStatusFilterChange?: (status: string) => void;
  /** Callback when author filter changes */
  onAuthorFilterChange?: (authorId: string) => void;
  /** Callback when segment filter changes */
  onSegmentFilterChange?: (phase?: string, status?: string) => void;
  /** Callback when any filter changes */
  onFiltersChange?: (filters: DocumentFilters) => void;
}

export interface UseDocumentFilterParamsReturn {
  // Filter State
  filters: DocumentFilters;
  hasActiveFilters: boolean;
  activeFilterCount: number;

  // Individual Filter Values (for easier access)
  phaseFilter: string[];
  statusFilter: string[];
  authorFilter: string[];
  sectionFilter: string[];
  segmentFilter: SegmentFilter | null;
  sortByDate: SortByDateOption;
  viewMode: ViewMode;
  view: DocumentView;
  searchQuery: string;

  // Table Sorting (for DataTable)
  tableSort: TableSortState;
  setTableSort: (sortState: TableSortState) => void;
  clearTableSort: () => void;

  // Filter Actions
  setPhaseFilter: (phases: string[]) => void;
  togglePhase: (phase: string) => void;
  setStatusFilter: (statuses: string[]) => void;
  toggleStatus: (status: string) => void;
  setAuthorFilter: (authors: string[]) => void;
  toggleAuthor: (authorId: string) => void;
  setSectionFilter: (sections: string[]) => void;
  toggleSection: (section: string) => void;
  setSegmentFilter: (phase?: string, status?: string) => void;
  setSortByDate: (sort: SortByDateOption) => void;
  setViewMode: (mode: ViewMode) => void;
  setView: (view: DocumentView) => void;
  setSearchQuery: (query: string) => void;

  // Bulk Actions
  clearAllFilters: () => void;
  clearPhaseFilters: () => void;
  clearStatusFilters: () => void;
  clearAuthorFilters: () => void;
  clearSectionFilters: () => void;
  clearSegmentFilter: () => void;
  resetSort: () => void;

  // Utility
  getActiveFilterChips: () => FilterChip[];
}

export interface FilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDocumentFilterParams(
  options: UseDocumentFilterParamsOptions = {}
): UseDocumentFilterParamsReturn {
  const {
    availablePhases = [],
    availableAuthors = [],
    onPhaseFilterChange,
    onStatusFilterChange,
    onAuthorFilterChange,
    onSegmentFilterChange,
    onFiltersChange,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL - only on mount
  const [filters, setFilters] = useState<DocumentFilters>(() => {
    const urlFilters = parseDocumentFiltersFromUrl(searchParams);
    return {
      ...DEFAULT_FILTERS,
      ...urlFilters,
    };
  });

  // Initialize table sort from URL - only on mount
  const [tableSort, setTableSortState] = useState<TableSortState>(() => {
    return parseTableSortFromUrl(searchParams);
  });

  // ============================================================================
  // Refs for stable callbacks - prevents infinite loops
  // ============================================================================

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const onPhaseFilterChangeRef = useRef(onPhaseFilterChange);
  onPhaseFilterChangeRef.current = onPhaseFilterChange;

  const onStatusFilterChangeRef = useRef(onStatusFilterChange);
  onStatusFilterChangeRef.current = onStatusFilterChange;

  const onAuthorFilterChangeRef = useRef(onAuthorFilterChange);
  onAuthorFilterChangeRef.current = onAuthorFilterChange;

  const onSegmentFilterChangeRef = useRef(onSegmentFilterChange);
  onSegmentFilterChangeRef.current = onSegmentFilterChange;

  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;

  // ============================================================================
  // URL Sync Helper - stable callback
  // ============================================================================

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = updateSearchParams(searchParamsRef.current, updates);
      setSearchParams(newParams, { replace: true });
    },
    [setSearchParams]
  );

  // ============================================================================
  // Sync URL changes to state (browser back/forward)
  // ============================================================================

  useEffect(() => {
    const urlFilters = parseDocumentFiltersFromUrl(searchParams);
    setFilters(prev => {
      // Only update if different to avoid infinite loops
      const hasChanged =
        JSON.stringify(prev.phases) !== JSON.stringify(urlFilters.phases) ||
        JSON.stringify(prev.statuses) !== JSON.stringify(urlFilters.statuses) ||
        JSON.stringify(prev.authors) !== JSON.stringify(urlFilters.authors) ||
        JSON.stringify(prev.sections) !== JSON.stringify(urlFilters.sections) ||
        prev.segmentPhase !== urlFilters.segmentPhase ||
        prev.segmentStatus !== urlFilters.segmentStatus ||
        prev.sortByDate !== urlFilters.sortByDate ||
        prev.viewMode !== urlFilters.viewMode ||
        prev.view !== urlFilters.view ||
        prev.searchQuery !== urlFilters.searchQuery;

      if (hasChanged) {
        return { ...prev, ...urlFilters };
      }
      return prev;
    });
  }, [searchParams]);

  // ============================================================================
  // Validation Effects - run only when available options change
  // ============================================================================

  // Use refs for filters to avoid stale closures
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Validate phases when available phases change
  useEffect(() => {
    const currentFilters = filtersRef.current;
    if (availablePhases.length > 0 && currentFilters.phases.length > 0) {
      const validPhases = validatePhases(currentFilters.phases, availablePhases);
      if (validPhases.length !== currentFilters.phases.length) {
        setFilters(prev => ({ ...prev, phases: validPhases }));
        updateUrl({ [URL_PARAM_KEYS.PHASES]: serializeArrayParam(validPhases) });
      }
    }
  }, [availablePhases, updateUrl]);

  // Validate authors when available authors change
  useEffect(() => {
    const currentFilters = filtersRef.current;
    if (availableAuthors.length > 0 && currentFilters.authors.length > 0) {
      const validAuthors = validateAuthors(currentFilters.authors, availableAuthors);
      if (validAuthors.length !== currentFilters.authors.length) {
        setFilters(prev => ({ ...prev, authors: validAuthors }));
        updateUrl({ [URL_PARAM_KEYS.AUTHORS]: serializeArrayParam(validAuthors) });
      }
    }
  }, [availableAuthors, updateUrl]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChangeRef.current?.(filters);
  }, [filters]);

  // ============================================================================
  // Phase Filter Actions - all callbacks are stable (no prop dependencies)
  // ============================================================================

  const setPhaseFilter = useCallback(
    (phases: string[]) => {
      setFilters(prev => ({ ...prev, phases }));
      updateUrl({ [URL_PARAM_KEYS.PHASES]: serializeArrayParam(phases) });
      onPhaseFilterChangeRef.current?.(phases);
    },
    [updateUrl]
  );

  const togglePhase = useCallback(
    (phase: string) => {
      setFilters(prev => {
        const newPhases = prev.phases.includes(phase)
          ? prev.phases.filter(p => p !== phase)
          : [...prev.phases, phase];
        updateUrl({ [URL_PARAM_KEYS.PHASES]: serializeArrayParam(newPhases) });
        onPhaseFilterChangeRef.current?.(newPhases);
        return { ...prev, phases: newPhases };
      });
    },
    [updateUrl]
  );

  const clearPhaseFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, phases: [] }));
    updateUrl({ [URL_PARAM_KEYS.PHASES]: null });
    onPhaseFilterChangeRef.current?.([]);
  }, [updateUrl]);

  // ============================================================================
  // Status Filter Actions
  // ============================================================================

  const setStatusFilter = useCallback(
    (statuses: string[]) => {
      const validStatuses = validateStatuses(statuses);
      setFilters(prev => ({ ...prev, statuses: validStatuses }));
      updateUrl({ [URL_PARAM_KEYS.STATUS]: serializeArrayParam(validStatuses) });
    },
    [updateUrl]
  );

  const toggleStatus = useCallback(
    (status: string) => {
      setFilters(prev => {
        const newStatuses = prev.statuses.includes(status)
          ? prev.statuses.filter(s => s !== status)
          : [...prev.statuses, status];
        updateUrl({ [URL_PARAM_KEYS.STATUS]: serializeArrayParam(newStatuses) });
        onStatusFilterChangeRef.current?.(status);
        return { ...prev, statuses: newStatuses };
      });
    },
    [updateUrl]
  );

  const clearStatusFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, statuses: [] }));
    updateUrl({ [URL_PARAM_KEYS.STATUS]: null });
    onStatusFilterChangeRef.current?.('__SHOW_ALL__');
  }, [updateUrl]);

  // ============================================================================
  // Author Filter Actions
  // ============================================================================

  const setAuthorFilter = useCallback(
    (authors: string[]) => {
      setFilters(prev => ({ ...prev, authors }));
      updateUrl({ [URL_PARAM_KEYS.AUTHORS]: serializeArrayParam(authors) });
    },
    [updateUrl]
  );

  const toggleAuthor = useCallback(
    (authorId: string) => {
      setFilters(prev => {
        const newAuthors = prev.authors.includes(authorId)
          ? prev.authors.filter(a => a !== authorId)
          : [...prev.authors, authorId];
        updateUrl({ [URL_PARAM_KEYS.AUTHORS]: serializeArrayParam(newAuthors) });
        onAuthorFilterChangeRef.current?.(authorId);
        return { ...prev, authors: newAuthors };
      });
    },
    [updateUrl]
  );

  const clearAuthorFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, authors: [] }));
    updateUrl({ [URL_PARAM_KEYS.AUTHORS]: null });
  }, [updateUrl]);

  // ============================================================================
  // Section Filter Actions
  // ============================================================================

  const setSectionFilter = useCallback(
    (sections: string[]) => {
      setFilters(prev => ({ ...prev, sections }));
      updateUrl({ [URL_PARAM_KEYS.SECTIONS]: serializeArrayParam(sections) });
    },
    [updateUrl]
  );

  const toggleSection = useCallback(
    (section: string) => {
      setFilters(prev => {
        const newSections = prev.sections.includes(section)
          ? prev.sections.filter(s => s !== section)
          : [...prev.sections, section];
        updateUrl({ [URL_PARAM_KEYS.SECTIONS]: serializeArrayParam(newSections) });
        return { ...prev, sections: newSections };
      });
    },
    [updateUrl]
  );

  const clearSectionFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, sections: [] }));
    updateUrl({ [URL_PARAM_KEYS.SECTIONS]: null });
  }, [updateUrl]);

  // ============================================================================
  // Segment Filter Actions
  // ============================================================================

  const setSegmentFilter = useCallback(
    (phase?: string, status?: string) => {
      setFilters(prev => ({
        ...prev,
        segmentPhase: phase,
        segmentStatus: status,
      }));
      updateUrl({
        [URL_PARAM_KEYS.SEGMENT_PHASE]: phase || null,
        [URL_PARAM_KEYS.SEGMENT_STATUS]: status || null,
      });
      onSegmentFilterChangeRef.current?.(phase, status);
    },
    [updateUrl]
  );

  const clearSegmentFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      segmentPhase: undefined,
      segmentStatus: undefined,
    }));
    updateUrl({
      [URL_PARAM_KEYS.SEGMENT_PHASE]: null,
      [URL_PARAM_KEYS.SEGMENT_STATUS]: null,
    });
    onSegmentFilterChangeRef.current?.(undefined, undefined);
  }, [updateUrl]);

  // ============================================================================
  // Sort Actions
  // ============================================================================

  const setSortByDate = useCallback(
    (sort: SortByDateOption) => {
      setFilters(prev => ({ ...prev, sortByDate: sort }));
      updateUrl({ [URL_PARAM_KEYS.SORT_BY_DATE]: (sort === 'none' || sort === 'updated_newest') ? null : sort });
    },
    [updateUrl]
  );

  const resetSort = useCallback(() => {
    setSortByDate('updated_newest');
  }, [setSortByDate]);

  // ============================================================================
  // Table Sort Actions (for DataTable)
  // ============================================================================

  const setTableSort = useCallback(
    (sortState: TableSortState) => {
      setTableSortState(sortState);
      const urlParams = serializeTableSortToUrl(sortState);
      updateUrl(urlParams);
    },
    [updateUrl]
  );

  const clearTableSort = useCallback(() => {
    setTableSortState({ column: null, direction: 'asc' });
    updateUrl({
      [URL_PARAM_KEYS.TABLE_SORT_COLUMN]: null,
      [URL_PARAM_KEYS.TABLE_SORT_DIRECTION]: null,
    });
  }, [updateUrl]);

  // Sync table sort from URL on browser navigation
  useEffect(() => {
    const urlTableSort = parseTableSortFromUrl(searchParams);
    setTableSortState(prev => {
      if (prev.column !== urlTableSort.column || prev.direction !== urlTableSort.direction) {
        return urlTableSort;
      }
      return prev;
    });
  }, [searchParams]);

  // ============================================================================
  // View Mode Actions
  // ============================================================================

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setFilters(prev => ({ ...prev, viewMode: mode }));
      updateUrl({ [URL_PARAM_KEYS.LAYOUT]: mode === 'card' ? null : mode });
    },
    [updateUrl]
  );

  const setView = useCallback(
    (view: DocumentView) => {
      setFilters(prev => ({ ...prev, view }));
      updateUrl({ [URL_PARAM_KEYS.VIEW]: view });
    },
    [updateUrl]
  );

  // ============================================================================
  // Search Query Actions
  // ============================================================================

  const setSearchQuery = useCallback(
    (query: string) => {
      setFilters(prev => ({ ...prev, searchQuery: query }));
      updateUrl({ [URL_PARAM_KEYS.SEARCH]: query || null });
    },
    [updateUrl]
  );

  // ============================================================================
  // Clear All Filters
  // ============================================================================

  const clearAllFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      phases: [],
      statuses: [],
      authors: [],
      segmentPhase: undefined,
      segmentStatus: undefined,
      sortByDate: 'updated_newest',
      searchQuery: '',
    }));
    setTableSortState({ column: null, direction: 'asc' });
    updateUrl({
      [URL_PARAM_KEYS.PHASES]: null,
      [URL_PARAM_KEYS.STATUS]: null,
      [URL_PARAM_KEYS.AUTHORS]: null,
      [URL_PARAM_KEYS.SEGMENT_PHASE]: null,
      [URL_PARAM_KEYS.SEGMENT_STATUS]: null,
      [URL_PARAM_KEYS.SORT_BY_DATE]: null,
      [URL_PARAM_KEYS.SEARCH]: null,
      [URL_PARAM_KEYS.TABLE_SORT_COLUMN]: null,
      [URL_PARAM_KEYS.TABLE_SORT_DIRECTION]: null,
      'filter': null, // Also clear the 'filter' param used by Gantt chart navigation
    });
    // Use refs to avoid infinite loops - callbacks are accessed via refs
    onPhaseFilterChangeRef.current?.([]);
    onStatusFilterChangeRef.current?.('__SHOW_ALL__');
    onSegmentFilterChangeRef.current?.(undefined, undefined);
  }, [updateUrl]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const hasActiveFilters = useMemo(() => checkHasActiveFilters(filters), [filters]);
  const activeFilterCount = useMemo(() => getActiveFilterCount(filters), [filters]);

  const segmentFilter = useMemo<SegmentFilter | null>(() => {
    if (filters.segmentPhase || filters.segmentStatus) {
      return {
        phase: filters.segmentPhase,
        status: filters.segmentStatus,
      };
    }
    return null;
  }, [filters.segmentPhase, filters.segmentStatus]);

  // ============================================================================
  // Filter Chips for UI
  // ============================================================================

  const getActiveFilterChips = useCallback((): FilterChip[] => {
    const chips: FilterChip[] = [];

    // Phase chips
    filters.phases.forEach(phase => {
      chips.push({
        key: `phase-${phase}`,
        label: 'Phase',
        value: phase,
        onRemove: () => togglePhase(phase),
      });
    });

    // Status chips
    filters.statuses.forEach(status => {
      chips.push({
        key: `status-${status}`,
        label: 'Status',
        value: status,
        onRemove: () => toggleStatus(status),
      });
    });

    // Author chips
    filters.authors.forEach(authorId => {
      const author = availableAuthors.find(a => a.id === authorId);
      if (author) {
        chips.push({
          key: `author-${authorId}`,
          label: 'Author',
          value: author.name,
          onRemove: () => toggleAuthor(authorId),
        });
      }
    });

    // Segment chip
    if (filters.segmentPhase || filters.segmentStatus) {
      const segmentValue = [
        filters.segmentPhase ? `Phase: ${filters.segmentPhase}` : null,
        filters.segmentStatus ? `Status: ${filters.segmentStatus}` : null,
      ]
        .filter(Boolean)
        .join(', ');

      chips.push({
        key: 'segment',
        label: 'Segment',
        value: segmentValue,
        onRemove: clearSegmentFilter,
      });
    }

    // Sort chip
    if (filters.sortByDate !== 'none' && filters.sortByDate !== 'updated_newest') {
      chips.push({
        key: 'sort',
        label: 'Sort',
        value: SORT_OPTION_LABELS[filters.sortByDate],
        onRemove: resetSort,
      });
    }

    return chips;
  }, [
    filters,
    availableAuthors,
    togglePhase,
    toggleStatus,
    toggleAuthor,
    clearSegmentFilter,
    resetSort,
  ]);

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    // Filter State
    filters,
    hasActiveFilters,
    activeFilterCount,

    // Individual Filter Values
    phaseFilter: filters.phases,
    statusFilter: filters.statuses,
    authorFilter: filters.authors,
    sectionFilter: filters.sections,
    segmentFilter,
    sortByDate: filters.sortByDate,
    viewMode: filters.viewMode,
    view: filters.view,
    searchQuery: filters.searchQuery,

    // Table Sorting (for DataTable)
    tableSort,
    setTableSort,
    clearTableSort,

    // Filter Actions
    setPhaseFilter,
    togglePhase,
    setStatusFilter,
    toggleStatus,
    setAuthorFilter,
    toggleAuthor,
    setSectionFilter,
    toggleSection,
    setSegmentFilter,
    setSortByDate,
    setViewMode,
    setView,
    setSearchQuery,

    // Bulk Actions
    clearAllFilters,
    clearPhaseFilters,
    clearStatusFilters,
    clearAuthorFilters,
    clearSectionFilters,
    clearSegmentFilter,
    resetSort,

    // Utility
    getActiveFilterChips,
  };
}
