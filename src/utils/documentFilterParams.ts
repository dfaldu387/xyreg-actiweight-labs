/**
 * Document Filter URL Parameters Utility
 *
 * Centralized configuration and validation for document filter URL parameters.
 * This ensures consistent parameter handling across the application.
 */

// ============================================================================
// Types
// ============================================================================

export type SortByDateOption =
  | 'none'
  | 'updated_newest'
  | 'updated_oldest'
  | 'due_newest'
  | 'due_oldest'
  | 'approval_newest'
  | 'approval_oldest'
  | 'name_asc'
  | 'name_desc'
  | 'number_asc'
  | 'number_desc'
  | 'phase_asc'
  | 'phase_desc'
  | 'section_asc'
  | 'section_desc'
  | 'author_asc'
  | 'author_desc'
  | 'status_asc'
  | 'status_desc'
  | 'category_asc'
  | 'category_desc'
  | 'doctype_asc'
  | 'doctype_desc'
  | 'date_newest'
  | 'date_oldest';

export type ViewMode = 'card' | 'list';

export type DocumentView = 'all-phases' | 'product-specific';

export interface DocumentFilters {
  phases: string[];
  statuses: string[];
  authors: string[];
  sections: string[];
  segmentPhase?: string;
  segmentStatus?: string;
  sortByDate: SortByDateOption;
  viewMode: ViewMode;
  view: DocumentView;
  searchQuery: string;
}

export interface SegmentFilter {
  phase?: string;
  status?: string;
}

// ============================================================================
// Constants - URL Parameter Keys
// ============================================================================

export const URL_PARAM_KEYS = {
  PHASES: 'phases',
  STATUS: 'status',
  AUTHORS: 'authors',
  SECTIONS: 'sections',
  SEGMENT_PHASE: 'segment_phase',
  SEGMENT_STATUS: 'segment_status',
  SORT_BY_DATE: 'sortByDate',
  LAYOUT: 'layout',
  VIEW: 'view',
  SEARCH: 'q',
  // Table sorting params
  TABLE_SORT_COLUMN: 'sortCol',
  TABLE_SORT_DIRECTION: 'sortDir',
  // Pagination params
  PAGE: 'page',
  PAGE_SIZE: 'pageSize',
} as const;

// ============================================================================
// Table Sorting Types
// ============================================================================

export type TableSortDirection = 'asc' | 'desc';

export interface TableSortState {
  column: string | null;
  direction: TableSortDirection;
}

// Valid columns that can be sorted in the document table
export const VALID_SORT_COLUMNS = [
  'name',
  'sub_section',
  'authors_ids',
  'phase_name',
  'document_type',
  'is_record',
  'status',
  'due_date',
  'date',
  'created_at',
  'approval_date',
  'updated_at',
] as const;

export type ValidSortColumn = typeof VALID_SORT_COLUMNS[number];

// ============================================================================
// Constants - Valid Options
// ============================================================================

export const VALID_STATUS_OPTIONS = [
  'Not Started',
  'In Review',
  'Approved',
  'Rejected',
  'N/A',
] as const;

export const VALID_SORT_OPTIONS: SortByDateOption[] = [
  'none',
  'updated_newest',
  'updated_oldest',
  'due_newest',
  'due_oldest',
  'approval_newest',
  'approval_oldest',
  'name_asc',
  'name_desc',
  'number_asc',
  'number_desc',
  'phase_asc',
  'phase_desc',
  'section_asc',
  'section_desc',
  'author_asc',
  'author_desc',
  'status_asc',
  'status_desc',
  'category_asc',
  'category_desc',
  'doctype_asc',
  'doctype_desc',
  'date_newest',
  'date_oldest',
];

export const VALID_VIEW_MODES: ViewMode[] = ['card', 'list'];

export const VALID_DOCUMENT_VIEWS: DocumentView[] = ['all-phases', 'product-specific'];

// ============================================================================
// Sort Option Labels (for UI display)
// ============================================================================

export const SORT_OPTION_LABELS: Record<SortByDateOption, string> = {
  none: 'Default',
  updated_newest: 'Updated (Newest)',
  updated_oldest: 'Updated (Oldest)',
  due_newest: 'Due Date (Newest)',
  due_oldest: 'Due Date (Oldest)',
  approval_newest: 'Approval (Newest)',
  approval_oldest: 'Approval (Oldest)',
  name_asc: 'Name (A-Z)',
  name_desc: 'Name (Z-A)',
  number_asc: 'Number (001 → 999)',
  number_desc: 'Number (999 → 001)',
  phase_asc: 'Phase (A-Z)',
  phase_desc: 'Phase (Z-A)',
  section_asc: 'Section (A-Z)',
  section_desc: 'Section (Z-A)',
  author_asc: 'Author (A-Z)',
  author_desc: 'Author (Z-A)',
  status_asc: 'Status (A-Z)',
  status_desc: 'Status (Z-A)',
  category_asc: 'Category (A-Z)',
  category_desc: 'Category (Z-A)',
  doctype_asc: 'Document Type (A-Z)',
  doctype_desc: 'Document Type (Z-A)',
  date_newest: 'Date (Newest)',
  date_oldest: 'Date (Oldest)',
};

export const SORT_OPTIONS_GROUPED = [
  { value: 'none' as SortByDateOption, label: 'Default', group: undefined },
  { value: 'number_asc' as SortByDateOption, label: '001 → 999', group: 'Number' },
  { value: 'number_desc' as SortByDateOption, label: '999 → 001', group: 'Number' },
  { value: 'name_asc' as SortByDateOption, label: 'A → Z', group: 'Name' },
  { value: 'name_desc' as SortByDateOption, label: 'Z → A', group: 'Name' },
  { value: 'phase_asc' as SortByDateOption, label: 'A → Z', group: 'Phase' },
  { value: 'phase_desc' as SortByDateOption, label: 'Z → A', group: 'Phase' },
  { value: 'section_asc' as SortByDateOption, label: 'A → Z', group: 'Section' },
  { value: 'section_desc' as SortByDateOption, label: 'Z → A', group: 'Section' },
  { value: 'author_asc' as SortByDateOption, label: 'A → Z', group: 'Author' },
  { value: 'author_desc' as SortByDateOption, label: 'Z → A', group: 'Author' },
  { value: 'status_asc' as SortByDateOption, label: 'A → Z', group: 'Status' },
  { value: 'status_desc' as SortByDateOption, label: 'Z → A', group: 'Status' },
  { value: 'category_asc' as SortByDateOption, label: 'A → Z', group: 'Category' },
  { value: 'category_desc' as SortByDateOption, label: 'Z → A', group: 'Category' },
  { value: 'doctype_asc' as SortByDateOption, label: 'A → Z', group: 'Document Type' },
  { value: 'doctype_desc' as SortByDateOption, label: 'Z → A', group: 'Document Type' },
  { value: 'date_newest' as SortByDateOption, label: 'Newest First', group: 'Date' },
  { value: 'date_oldest' as SortByDateOption, label: 'Oldest First', group: 'Date' },
  { value: 'updated_newest' as SortByDateOption, label: 'Newest First', group: 'Last Updated' },
  { value: 'updated_oldest' as SortByDateOption, label: 'Oldest First', group: 'Last Updated' },
  { value: 'due_newest' as SortByDateOption, label: 'Newest First', group: 'Due Date' },
  { value: 'due_oldest' as SortByDateOption, label: 'Oldest First', group: 'Due Date' },
  { value: 'approval_newest' as SortByDateOption, label: 'Newest First', group: 'Approval Date' },
  { value: 'approval_oldest' as SortByDateOption, label: 'Oldest First', group: 'Approval Date' },
];

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_FILTERS: DocumentFilters = {
  phases: [],
  statuses: [],
  authors: [],
  sections: [],
  segmentPhase: undefined,
  segmentStatus: undefined,
  sortByDate: 'none',
  viewMode: 'card',
  view: 'all-phases',
  searchQuery: '',
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a sort option against the list of valid options
 */
export function isValidSortOption(value: string | null): value is SortByDateOption {
  return value !== null && VALID_SORT_OPTIONS.includes(value as SortByDateOption);
}

/**
 * Validates a status against the list of valid statuses
 */
export function isValidStatus(status: string): boolean {
  return VALID_STATUS_OPTIONS.includes(status as typeof VALID_STATUS_OPTIONS[number]);
}

/**
 * Validates a view mode
 */
export function isValidViewMode(value: string | null): value is ViewMode {
  return value !== null && VALID_VIEW_MODES.includes(value as ViewMode);
}

/**
 * Validates a document view
 */
export function isValidDocumentView(value: string | null): value is DocumentView {
  return value !== null && VALID_DOCUMENT_VIEWS.includes(value as DocumentView);
}

/**
 * Validates phases against available phases
 */
export function validatePhases(phases: string[], availablePhases: string[]): string[] {
  if (availablePhases.length === 0) return phases; // Can't validate without available phases
  // Preserve special filter tokens like __CORE__ (No Phase filter)
  return phases.filter(phase => phase === '__CORE__' || availablePhases.includes(phase));
}

/**
 * Validates a table sort column
 */
export function isValidSortColumn(column: string | null): column is ValidSortColumn {
  return column !== null && VALID_SORT_COLUMNS.includes(column as ValidSortColumn);
}

/**
 * Validates a table sort direction
 */
export function isValidSortDirection(direction: string | null): direction is TableSortDirection {
  return direction === 'asc' || direction === 'desc';
}

/**
 * Parses table sort state from URL parameters
 */
export function parseTableSortFromUrl(searchParams: URLSearchParams): TableSortState {
  const column = searchParams.get(URL_PARAM_KEYS.TABLE_SORT_COLUMN);
  const direction = searchParams.get(URL_PARAM_KEYS.TABLE_SORT_DIRECTION);

  return {
    column: isValidSortColumn(column) ? column : null,
    direction: isValidSortDirection(direction) ? direction : 'asc',
  };
}

/**
 * Serializes table sort state to URL parameters
 */
export function serializeTableSortToUrl(sortState: TableSortState): Record<string, string | null> {
  return {
    [URL_PARAM_KEYS.TABLE_SORT_COLUMN]: sortState.column,
    [URL_PARAM_KEYS.TABLE_SORT_DIRECTION]: sortState.column ? sortState.direction : null,
  };
}

/**
 * Converts TableSortState to tanstack/react-table SortingState format
 */
export function tableSortToReactTableFormat(sortState: TableSortState): Array<{ id: string; desc: boolean }> {
  if (!sortState.column) return [];
  return [{ id: sortState.column, desc: sortState.direction === 'desc' }];
}

/**
 * Converts tanstack/react-table SortingState to TableSortState format
 */
export function reactTableFormatToTableSort(sorting: Array<{ id: string; desc: boolean }>): TableSortState {
  if (sorting.length === 0) {
    return { column: null, direction: 'asc' };
  }
  const firstSort = sorting[0];
  return {
    column: isValidSortColumn(firstSort.id) ? firstSort.id : null,
    direction: firstSort.desc ? 'desc' : 'asc',
  };
}

/**
 * Validates statuses against valid status options
 */
export function validateStatuses(statuses: string[]): string[] {
  return statuses.filter(isValidStatus);
}

/**
 * Validates authors against available authors
 */
export function validateAuthors(
  authorIds: string[],
  availableAuthors: Array<{ id: string; name: string }>
): string[] {
  if (availableAuthors.length === 0) return authorIds; // Can't validate without available authors
  return authorIds.filter(id => availableAuthors.some(author => author.id === id));
}

// ============================================================================
// URL Parameter Parsing Functions
// ============================================================================

/**
 * Parses a pipe-separated URL parameter into an array.
 * Uses '||' delimiter to avoid splitting phase names that contain commas
 * (e.g. "Risk Management (ISO 14971, ISO 13485 §7.1)")
 */
export function parseArrayParam(value: string | null): string[] {
  if (!value) return [];
  return value.split('||').filter(Boolean);
}

/**
 * Serializes an array to a pipe-separated string for URL
 */
export function serializeArrayParam(values: string[]): string | null {
  if (values.length === 0) return null;
  return values.join('||');
}

/**
 * Parses all document filter parameters from URLSearchParams
 */
export function parseDocumentFiltersFromUrl(searchParams: URLSearchParams): Partial<DocumentFilters> {
  const phases = parseArrayParam(searchParams.get(URL_PARAM_KEYS.PHASES));
  const rawStatuses = parseArrayParam(searchParams.get(URL_PARAM_KEYS.STATUS));
  const authors = parseArrayParam(searchParams.get(URL_PARAM_KEYS.AUTHORS));
  const sections = parseArrayParam(searchParams.get(URL_PARAM_KEYS.SECTIONS));
  const segmentPhase = searchParams.get(URL_PARAM_KEYS.SEGMENT_PHASE) || undefined;
  const segmentStatus = searchParams.get(URL_PARAM_KEYS.SEGMENT_STATUS) || undefined;
  const sortByDateRaw = searchParams.get(URL_PARAM_KEYS.SORT_BY_DATE);
  const layoutRaw = searchParams.get(URL_PARAM_KEYS.LAYOUT);
  const viewRaw = searchParams.get(URL_PARAM_KEYS.VIEW);
  const searchQuery = searchParams.get(URL_PARAM_KEYS.SEARCH) || '';

  return {
    phases,
    statuses: validateStatuses(rawStatuses),
    authors,
    sections,
    segmentPhase,
    segmentStatus,
    sortByDate: isValidSortOption(sortByDateRaw) ? sortByDateRaw : 'none',
    viewMode: isValidViewMode(layoutRaw) ? layoutRaw : 'card',
    view: isValidDocumentView(viewRaw) ? viewRaw : 'all-phases',
    searchQuery,
  };
}

/**
 * Serializes document filters to URL parameters
 */
export function serializeDocumentFiltersToUrl(
  filters: Partial<DocumentFilters>
): Record<string, string | null> {
  return {
    [URL_PARAM_KEYS.PHASES]: serializeArrayParam(filters.phases || []),
    [URL_PARAM_KEYS.STATUS]: serializeArrayParam(filters.statuses || []),
    [URL_PARAM_KEYS.AUTHORS]: serializeArrayParam(filters.authors || []),
    [URL_PARAM_KEYS.SECTIONS]: serializeArrayParam(filters.sections || []),
    [URL_PARAM_KEYS.SEGMENT_PHASE]: filters.segmentPhase || null,
    [URL_PARAM_KEYS.SEGMENT_STATUS]: filters.segmentStatus || null,
    [URL_PARAM_KEYS.SORT_BY_DATE]: filters.sortByDate && filters.sortByDate !== 'none' ? filters.sortByDate : null,
    [URL_PARAM_KEYS.LAYOUT]: filters.viewMode && filters.viewMode !== 'card' ? filters.viewMode : null,
    [URL_PARAM_KEYS.VIEW]: filters.view || null,
    [URL_PARAM_KEYS.SEARCH]: filters.searchQuery || null,
  };
}

// ============================================================================
// URL Update Helper
// ============================================================================

/**
 * Updates URLSearchParams with new values, removing null/empty values
 */
export function updateSearchParams(
  currentParams: URLSearchParams,
  updates: Record<string, string | null>
): URLSearchParams {
  const newParams = new URLSearchParams(currentParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === '' || value === undefined) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
  });

  return newParams;
}

// ============================================================================
// Filter Comparison Helpers
// ============================================================================

/**
 * Checks if two arrays are equal (shallow comparison)
 */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

/**
 * Checks if filters have changed
 */
export function filtersChanged(
  prev: Partial<DocumentFilters>,
  next: Partial<DocumentFilters>
): boolean {
  return (
    !arraysEqual(prev.phases || [], next.phases || []) ||
    !arraysEqual(prev.statuses || [], next.statuses || []) ||
    !arraysEqual(prev.authors || [], next.authors || []) ||
    !arraysEqual(prev.sections || [], next.sections || []) ||
    prev.segmentPhase !== next.segmentPhase ||
    prev.segmentStatus !== next.segmentStatus ||
    prev.sortByDate !== next.sortByDate ||
    prev.viewMode !== next.viewMode ||
    prev.view !== next.view ||
    prev.searchQuery !== next.searchQuery
  );
}

// ============================================================================
// Active Filter Count
// ============================================================================

/**
 * Counts the number of active filters
 */
export function countActiveFilters(filters: Partial<DocumentFilters>): number {
  let count = 0;
  if (filters.phases && filters.phases.length > 0) count++;
  if (filters.statuses && filters.statuses.length > 0) count++;
  if (filters.authors && filters.authors.length > 0) count++;
  if (filters.sections && filters.sections.length > 0) count++;
  if (filters.segmentPhase || filters.segmentStatus) count++;
  if (filters.sortByDate && filters.sortByDate !== 'none' && filters.sortByDate !== 'updated_newest') count++;
  return count;
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filters: Partial<DocumentFilters>): boolean {
  return countActiveFilters(filters) > 0;
}

// ============================================================================
// Document Number Comparator
// ============================================================================

/**
 * Compare two document_number strings by their **trailing numeric segments**
 * (parent + optional child suffix), ignoring the prefix and sub-prefix so
 * documents that share a number group together. Examples:
 *   SOP-QA-001    vs WI-QA-001-1   →  SOP-QA-001 first  (parent SOP before child WI)
 *   WI-QA-001-1   vs WI-QA-001-2   →  001-1 first
 *   WI-QA-001-2   vs WI-QA-001-10  →  001-2 first       (numeric, not lexical)
 *   SOP-QA-002    vs SOP-QA-001    →  001 first
 *   SOP-QA-001    vs SOP-DE-001    →  QA before DE      (sub-prefix tiebreak)
 *
 * Sort priority:
 *   1. Parent number (the last all-digit segment) — numeric
 *   2. Child suffix (segments after the parent number) — numeric, missing = -1
 *      so the parent doc (e.g. SOP-QA-001) sorts above its derived
 *      children (WI-QA-001-1, -2, ...).
 *   3. Sub-prefix (e.g. QA, DE) — alphabetical
 *   4. Prefix (SOP, WI, ...) — alphabetical
 *   5. Title — alphabetical
 *
 * Falls back to title localeCompare when document_number is missing.
 */
export function compareDocumentNumber(
  aNum: string | null | undefined,
  bNum: string | null | undefined,
  aName?: string | null,
  bName?: string | null,
): number {
  const a = (aNum ?? '').trim();
  const b = (bNum ?? '').trim();

  if (!a && !b) {
    return (aName ?? '').localeCompare(bName ?? '', undefined, { sensitivity: 'base', numeric: true });
  }
  if (a && !b) return -1;
  if (!a && b) return 1;

  const partsA = parseDocNumber(a);
  const partsB = parseDocNumber(b);

  // 1. Parent number
  if (partsA.parent !== partsB.parent) return partsA.parent - partsB.parent;
  // 2. Child suffix (-1 = no child, so parent doc sorts before its children)
  if (partsA.child !== partsB.child) return partsA.child - partsB.child;
  // 3. Sub-prefix
  const sub = partsA.subPrefix.localeCompare(partsB.subPrefix, undefined, { sensitivity: 'base' });
  if (sub !== 0) return sub;
  // 4. Prefix
  const pre = partsA.prefix.localeCompare(partsB.prefix, undefined, { sensitivity: 'base' });
  if (pre !== 0) return pre;
  // 5. Title
  return (aName ?? '').localeCompare(bName ?? '', undefined, { sensitivity: 'base', numeric: true });
}

/**
 * Parse a document number like "WI-QA-002-1" or "SOP-001" into its parts.
 * The parent number is the **last all-digit segment**; anything after it is
 * the child suffix (joined as a single number, or -1 if absent).
 */
function parseDocNumber(num: string): {
  prefix: string;
  subPrefix: string;
  parent: number;
  child: number;
} {
  const segs = num.split('-');
  // Find the last segment that is all digits — that's the parent number.
  let parentIdx = -1;
  for (let i = segs.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(segs[i])) {
      // Walk back over any further trailing digit segments to find the
      // FIRST digit segment of the parent/child block.
      parentIdx = i;
      // But the child is anything *after* the first digit segment, so we
      // actually need the EARLIEST digit segment in the trailing run.
      while (parentIdx > 0 && /^\d+$/.test(segs[parentIdx - 1])) {
        parentIdx--;
      }
      break;
    }
  }
  if (parentIdx === -1) {
    return { prefix: segs[0] ?? '', subPrefix: segs[1] ?? '', parent: Number.MAX_SAFE_INTEGER, child: -1 };
  }
  const prefix = segs[0] ?? '';
  const subPrefix = parentIdx >= 2 ? segs.slice(1, parentIdx).join('-') : '';
  const parent = parseInt(segs[parentIdx], 10);
  const childSegs = segs.slice(parentIdx + 1).filter(s => /^\d+$/.test(s));
  const child = childSegs.length === 0 ? -1 : parseInt(childSegs.join(''), 10);
  return { prefix, subPrefix, parent, child };
}
