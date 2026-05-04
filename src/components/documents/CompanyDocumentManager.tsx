import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, LayoutGrid, List, RefreshCw, Trash2, CalendarDays, Sparkles, Layers, Settings2, ShieldCheck } from "lucide-react";
import { ColumnVisibilitySettings, type ColumnDefinition } from '@/components/shared/ColumnVisibilitySettings';
import { useListColumnPreferences } from '@/hooks/useListColumnPreferences';
import { Badge } from "@/components/ui/badge";
import { BulkDocumentSummarySidebar } from "@/components/product/documents/BulkDocumentSummarySidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CompanyDocumentCreationDialog } from "./CompanyDocumentCreationDialog";
import { CompanyDocumentEditDialog } from "./CompanyDocumentEditDialog";
import { formatSopDisplayId, formatSopDisplayName, getSopTier } from '@/constants/sopAutoSeedTiers';
import { CompanyDocumentViewer } from "./CompanyDocumentViewer";
import { CompanyDocumentCard } from "./CompanyDocumentCard";
import { CompanyDocumentListView } from "./CompanyDocumentListView";
import { StackedClusterView } from "./grouped/StackedClusterView";
import { DocumentDraftDrawer } from "@/components/product/documents/DocumentDraftDrawer";
import { BulkDraftEditDialog } from "@/components/product/documents/BulkDraftEditDialog";
import { DraftTabGroupsMenu } from "@/components/product/documents/DraftTabGroupsMenu";
import { SaveDraftTabGroupDialog } from "@/components/product/documents/SaveDraftTabGroupDialog";
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCompanyDocuments, CompanyDocument } from '@/hooks/useCompanyDocuments';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { EnhancedDocumentFilters, SortByDateOption } from '@/components/product/documents/EnhancedDocumentFilters';
import { compareDocumentNumber } from '@/utils/documentFilterParams';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { useBulkOperationProgress } from '@/hooks/useBulkOperationProgress';
import { CompanyDocumentStatusSummary } from './CompanyDocumentStatusSummary';
import { BulkDocumentValidationDialog, BulkValidationFinding } from './BulkDocumentValidationDialog';
import { CCRCreateDialog, type CCRPrefill } from '@/components/change-control/CCRCreateDialog';
import { BulkCCRChooserDialog } from '@/components/change-control/BulkCCRChooserDialog';
import { DocumentValidationService } from '@/services/documentValidationService';
import { appendLanguageSuffix } from '@/utils/documentNumbering';
import { NoPhaseService } from '@/services/noPhaseService';
import { parseSopNumber } from '@/constants/sopAutoSeedTiers';
import {
  getUserScopedFilters,
  setUserScopedFilters,
  clearUserScopedFilters,
  onUserScopeReady,
} from '@/lib/userScopedFilterStorage';

interface CompanyDocumentManagerProps {
  companyId: string;
  disabled?: boolean;
}

// URL param keys for company documents
const URL_PARAM_KEYS = {
  STATUS: 'status',
  AUTHORS: 'authors',
  SECTIONS: 'sections',
  TAGS: 'tags',
  REF_TAGS: 'refTags',
  DOC_TYPES: 'docTypes',
  TIERS: 'tiers',
  SORT_BY_DATE: 'sortByDate',
  LAYOUT: 'layout',
  SEARCH: 'q',
} as const;

// Helper to parse array params from URL
const parseArrayParam = (value: string | null): string[] => {
  if (!value) return [];
  return value.split(',').filter(Boolean);
};

// Helper to serialize array params to URL
const serializeArrayParam = (arr: string[]): string | null => {
  return arr.length > 0 ? arr.join(',') : null;
};

// Shape persisted per user+company so filters survive leaving and returning to the page.
type PersistedFilters = {
  searchTerm: string;
  statusFilter: string[];
  authorFilter: string[];
  sectionFilter: string[];
  tagFilter: string[];
  refTagFilter: string[];
  docTypeFilter: string[];
  tierFilter: string[];
  sortByDate: SortByDateOption;
  viewMode: 'card' | 'list' | 'grouped';
};

const FILTER_URL_KEYS = [
  URL_PARAM_KEYS.SEARCH,
  URL_PARAM_KEYS.STATUS,
  URL_PARAM_KEYS.AUTHORS,
  URL_PARAM_KEYS.SECTIONS,
  URL_PARAM_KEYS.TAGS,
  URL_PARAM_KEYS.REF_TAGS,
  URL_PARAM_KEYS.DOC_TYPES,
  URL_PARAM_KEYS.TIERS,
  URL_PARAM_KEYS.SORT_BY_DATE,
  URL_PARAM_KEYS.LAYOUT,
];

export function CompanyDocumentManager({ companyId, disabled = false }: CompanyDocumentManagerProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [searchTerm, setSearchTermState] = useState(() => searchParams.get(URL_PARAM_KEYS.SEARCH) || '');
  const [statusFilter, setStatusFilterState] = useState<string[]>(() => parseArrayParam(searchParams.get(URL_PARAM_KEYS.STATUS)));
  const [authorFilter, setAuthorFilterState] = useState<string[]>(() => parseArrayParam(searchParams.get(URL_PARAM_KEYS.AUTHORS)));
  const [sectionFilter, setSectionFilterState] = useState<string[]>(() => parseArrayParam(searchParams.get(URL_PARAM_KEYS.SECTIONS)));
  const [tagFilter, setTagFilterState] = useState<string[]>(() => parseArrayParam(searchParams.get(URL_PARAM_KEYS.TAGS)));
  const [refTagFilter, setRefTagFilterState] = useState<string[]>(() => parseArrayParam(searchParams.get(URL_PARAM_KEYS.REF_TAGS)));
  const [docTypeFilter, setDocTypeFilterState] = useState<string[]>(() => parseArrayParam(searchParams.get(URL_PARAM_KEYS.DOC_TYPES)));
  const [tierFilter, setTierFilterState] = useState<string[]>(() => parseArrayParam(searchParams.get(URL_PARAM_KEYS.TIERS)));
  const [sortByDate, setSortByDateState] = useState<SortByDateOption>(() => (searchParams.get(URL_PARAM_KEYS.SORT_BY_DATE) as SortByDateOption) || 'none');
  const [viewMode, setViewModeState] = useState<'card' | 'list' | 'grouped'>(() => (searchParams.get(URL_PARAM_KEYS.LAYOUT) as 'card' | 'list' | 'grouped') || 'list');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CompanyDocument | null>(null);
  const [companyRole, setCompanyRole] = useState<string | null>("");
  const [availablePhases, setAvailablePhases] = useState<string[]>([]);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draftDrawerDocument, setDraftDrawerDocument] = useState<CompanyDocument | null>(null);
  // Open-stack of drafts to support tabs at the top of the drawer.
  // No cap — open as many drafts as you like. The tab strip scrolls
  // horizontally so it can accommodate any number of tabs.
  const [openDraftStack, setOpenDraftStack] = useState<CompanyDocument[]>([]);
  // Multi-select state for bulk-edit across open draft tabs
  const [selectedDraftTabIds, setSelectedDraftTabIds] = useState<string[]>([]);
  const [bulkDraftEditOpen, setBulkDraftEditOpen] = useState(false);
  const [saveGroupOpen, setSaveGroupOpen] = useState(false);

  const openDraft = useCallback((doc: CompanyDocument) => {
    setOpenDraftStack(prev => {
      if (prev.some(d => d.id === doc.id)) return prev;
      return [...prev, doc];
    });
    setDraftDrawerDocument(doc);
  }, []);


  const closeDraftTab = useCallback((id: string) => {
    setOpenDraftStack(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx < 0) return prev;
      const next = prev.filter(d => d.id !== id);
      if (next.length === 0) {
        setDraftDrawerDocument(null);
      } else {
        setDraftDrawerDocument(prevActive => {
          if (!prevActive || prevActive.id !== id) return prevActive;
          // Activate previous neighbour, fallback to first
          const neighbour = next[Math.max(0, idx - 1)] ?? next[0];
          return neighbour;
        });
      }
      return next;
    });
  }, []);

  const selectDraftTab = useCallback((id: string) => {
    setOpenDraftStack(prev => {
      const target = prev.find(d => d.id === id);
      if (target) setDraftDrawerDocument(target);
      return prev;
    });
  }, []);

  const toggleDraftTabSelection = useCallback((id: string) => {
    setSelectedDraftTabIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const clearDraftTabSelection = useCallback(() => {
    setSelectedDraftTabIds([]);
  }, []);

  // Bulk mode state (always on - checkboxes always visible)

  // Column visibility
  const COMPANY_DOC_COLUMNS: ColumnDefinition[] = [
    { key: 'name', label: 'Name', required: true },
    
    { key: 'document_type', label: 'Type' },
    { key: 'authors_ids', label: 'Author' },
    { key: 'status', label: 'Status' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'date', label: 'Date' },
    { key: 'approval_date', label: 'Approved' },
    { key: 'updated_at', label: 'Updated' },
  ];
  const { data: columnPrefs } = useListColumnPreferences(companyId, null, 'company_documents', 'list');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  useEffect(() => {
    if (columnPrefs?.hidden_columns) {
      setHiddenColumns(columnPrefs.hidden_columns);
    }
  }, [columnPrefs]);
  const [bulkSelectedDocs, setBulkSelectedDocs] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [selectedBulkAction, setSelectedBulkAction] = useState<string>("");
  const [selectedBulkValue, setSelectedBulkValue] = useState<string>("");
  const [bulkDueDateValue, setBulkDueDateValue] = useState<Date | undefined>(undefined);

  // AI Summary sidebar state
  const [bulkSummarySidebarOpen, setBulkSummarySidebarOpen] = useState(false);
  const [selectedDocsForSummary, setSelectedDocsForSummary] = useState<Set<string>>(new Set());

  // Bulk validation state
  const [bulkValidationOpen, setBulkValidationOpen] = useState(false);
  const [bulkValidationLoading, setBulkValidationLoading] = useState(false);
  const [bulkValidationFindings, setBulkValidationFindings] = useState<any[]>([]);
  const [bulkValidationDocCount, setBulkValidationDocCount] = useState(0);

  // Bulk Create CCR state
  const [bulkCcrDialogOpen, setBulkCcrDialogOpen] = useState(false);
  const [bulkCcrPrefill, setBulkCcrPrefill] = useState<CCRPrefill | undefined>(undefined);
  const [bulkCcrChooserOpen, setBulkCcrChooserOpen] = useState(false);
  const [bulkCcrChooserDocIds, setBulkCcrChooserDocIds] = useState<string[]>([]);

  const documentCategories = ['Standard', 'Template', 'Record', 'Form', 'Report', 'Policy', 'Procedure', 'Work Instruction', 'SOP', 'Other'];

  const { progress: bulkProgress, startOperation, updateProgress: updateBulkProgress, completeOperation } = useBulkOperationProgress();

  // Helper to update URL params
  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Filter persistence scope key (per user is handled inside the storage helper).
  const filterScope = `companyDocs.${companyId}`;

  // Hydrate filters from per-user localStorage on first mount when the URL
  // contains no filter params (e.g. user navigated back via the sidebar).
  const hydratedRef = React.useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    const hasAnyUrlFilter = FILTER_URL_KEYS.some(k => searchParams.get(k));
    if (hasAnyUrlFilter) {
      hydratedRef.current = true;
      return;
    }
    onUserScopeReady(() => {
      if (hydratedRef.current) return;
      const saved = getUserScopedFilters<PersistedFilters>(filterScope);
      hydratedRef.current = true;
      if (!saved) return;
      // Push saved filters into URL; the existing URL→state sync effect will pick them up.
      updateUrlParams({
        [URL_PARAM_KEYS.SEARCH]: saved.searchTerm || null,
        [URL_PARAM_KEYS.STATUS]: serializeArrayParam(saved.statusFilter || []),
        [URL_PARAM_KEYS.AUTHORS]: serializeArrayParam(saved.authorFilter || []),
        [URL_PARAM_KEYS.SECTIONS]: serializeArrayParam(saved.sectionFilter || []),
        [URL_PARAM_KEYS.TAGS]: serializeArrayParam(saved.tagFilter || []),
        [URL_PARAM_KEYS.REF_TAGS]: serializeArrayParam(saved.refTagFilter || []),
        [URL_PARAM_KEYS.DOC_TYPES]: serializeArrayParam(saved.docTypeFilter || []),
        [URL_PARAM_KEYS.TIERS]: serializeArrayParam(saved.tierFilter || []),
        [URL_PARAM_KEYS.SORT_BY_DATE]:
          saved.sortByDate && saved.sortByDate !== 'none' ? saved.sortByDate : null,
        [URL_PARAM_KEYS.LAYOUT]:
          saved.viewMode && saved.viewMode !== 'list' ? saved.viewMode : null,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterScope]);

  // Sync URL changes to state (browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get(URL_PARAM_KEYS.SEARCH) || '';
    const urlStatus = parseArrayParam(searchParams.get(URL_PARAM_KEYS.STATUS));
    const urlAuthors = parseArrayParam(searchParams.get(URL_PARAM_KEYS.AUTHORS));
    const urlSections = parseArrayParam(searchParams.get(URL_PARAM_KEYS.SECTIONS));
    const urlTags = parseArrayParam(searchParams.get(URL_PARAM_KEYS.TAGS));
    const urlRefTags = parseArrayParam(searchParams.get(URL_PARAM_KEYS.REF_TAGS));
    const urlDocTypes = parseArrayParam(searchParams.get(URL_PARAM_KEYS.DOC_TYPES));
    const urlTiers = parseArrayParam(searchParams.get(URL_PARAM_KEYS.TIERS));
    const urlSort = (searchParams.get(URL_PARAM_KEYS.SORT_BY_DATE) as SortByDateOption) || 'none';
    const urlLayout = (searchParams.get(URL_PARAM_KEYS.LAYOUT) as 'card' | 'list' | 'grouped') || 'list';

    if (urlSearch !== searchTerm) setSearchTermState(urlSearch);
    if (JSON.stringify(urlStatus) !== JSON.stringify(statusFilter)) setStatusFilterState(urlStatus);
    if (JSON.stringify(urlAuthors) !== JSON.stringify(authorFilter)) setAuthorFilterState(urlAuthors);
    if (JSON.stringify(urlSections) !== JSON.stringify(sectionFilter)) setSectionFilterState(urlSections);
    if (JSON.stringify(urlTags) !== JSON.stringify(tagFilter)) setTagFilterState(urlTags);
    if (JSON.stringify(urlRefTags) !== JSON.stringify(refTagFilter)) setRefTagFilterState(urlRefTags);
    if (JSON.stringify(urlDocTypes) !== JSON.stringify(docTypeFilter)) setDocTypeFilterState(urlDocTypes);
    if (JSON.stringify(urlTiers) !== JSON.stringify(tierFilter)) setTierFilterState(urlTiers);
    if (urlSort !== sortByDate) setSortByDateState(urlSort);
    if (urlLayout !== viewMode) setViewModeState(urlLayout);
  }, [searchParams]);

  // Persist current filter snapshot per user+company so it survives leaving the page.
  useEffect(() => {
    if (!hydratedRef.current) return;
    setUserScopedFilters<PersistedFilters>(filterScope, {
      searchTerm,
      statusFilter,
      authorFilter,
      sectionFilter,
      tagFilter,
      refTagFilter,
      docTypeFilter,
      tierFilter,
      sortByDate,
      viewMode,
    });
  }, [
    filterScope,
    searchTerm,
    statusFilter,
    authorFilter,
    sectionFilter,
    tagFilter,
    refTagFilter,
    docTypeFilter,
    tierFilter,
    sortByDate,
    viewMode,
  ]);


  // Wrapper functions that update both state and URL
  const setSearchTerm = useCallback((value: string) => {
    setSearchTermState(value);
    updateUrlParams({ [URL_PARAM_KEYS.SEARCH]: value || null });
  }, [updateUrlParams]);

  const setStatusFilter = useCallback((value: string[]) => {
    setStatusFilterState(value);
    updateUrlParams({ [URL_PARAM_KEYS.STATUS]: serializeArrayParam(value) });
  }, [updateUrlParams]);

  const setAuthorFilter = useCallback((value: string[]) => {
    setAuthorFilterState(value);
    updateUrlParams({ [URL_PARAM_KEYS.AUTHORS]: serializeArrayParam(value) });
  }, [updateUrlParams]);

  const setSectionFilter = useCallback((value: string[]) => {
    setSectionFilterState(value);
    updateUrlParams({ [URL_PARAM_KEYS.SECTIONS]: serializeArrayParam(value) });
  }, [updateUrlParams]);

  const setTagFilter = useCallback((value: string[]) => {
    setTagFilterState(value);
    updateUrlParams({ [URL_PARAM_KEYS.TAGS]: serializeArrayParam(value) });
  }, [updateUrlParams]);

  const setRefTagFilter = useCallback((value: string[]) => {
    setRefTagFilterState(value);
    updateUrlParams({ [URL_PARAM_KEYS.REF_TAGS]: serializeArrayParam(value) });
  }, [updateUrlParams]);

  const setDocTypeFilter = useCallback((value: string[]) => {
    setDocTypeFilterState(value);
    updateUrlParams({ [URL_PARAM_KEYS.DOC_TYPES]: serializeArrayParam(value) });
  }, [updateUrlParams]);

  const setTierFilter = useCallback((value: string[]) => {
    setTierFilterState(value);
    updateUrlParams({ [URL_PARAM_KEYS.TIERS]: serializeArrayParam(value) });
  }, [updateUrlParams]);

  const setSortByDate = useCallback((value: SortByDateOption) => {
    setSortByDateState(value);
    updateUrlParams({ [URL_PARAM_KEYS.SORT_BY_DATE]: value === 'none' ? null : value });
  }, [updateUrlParams]);

  const setViewMode = useCallback((value: 'card' | 'list' | 'grouped') => {
    setViewModeState(value);
    updateUrlParams({ [URL_PARAM_KEYS.LAYOUT]: value === 'list' ? null : value });
  }, [updateUrlParams]);

  // Use TanStack Query hook
  const { documents, isLoading, error, refetch, deleteDocument, updateDocumentStatus, isDeleting, isUpdatingStatus, updatingStatusId } = useCompanyDocuments(companyId);

  /**
   * Open multiple drafts as tabs from a list of CI ids (used when reopening
   * a saved tab group). Looks each id up in the loaded `documents` array;
   * missing ids are fetched directly from the CI registry.
   */
  const openDraftsByIds = useCallback(async (ciIds: string[]) => {
    if (!ciIds || ciIds.length === 0) return;
    const fromCache: CompanyDocument[] = [];
    const missingIds: string[] = [];
    for (const id of ciIds) {
      const hit = documents.find(d => d.id === id);
      if (hit) fromCache.push(hit);
      else missingIds.push(id);
    }
    let fetched: CompanyDocument[] = [];
    if (missingIds.length > 0) {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, document_type, document_number, status')
        .in('id', missingIds);
      if (error) {
        console.error('[openDraftsByIds] Failed to fetch missing CI rows', error);
      } else if (data) {
        fetched = data.map((r: any) => ({
          id: r.id,
          name: r.name || 'Untitled',
          document_type: r.document_type || '',
          document_number: r.document_number || null,
          status: r.status || 'Not Started',
        }) as unknown as CompanyDocument);
      }
    }
    const combined: CompanyDocument[] = [];
    for (const id of ciIds) {
      const hit = fromCache.find(d => d.id === id) || fetched.find(d => d.id === id);
      if (hit) combined.push(hit);
    }
    if (combined.length === 0) {
      toast.error('None of the documents in this group are available anymore.');
      return;
    }
    setOpenDraftStack(prev => {
      const seen = new Set(prev.map(d => d.id));
      const next = [...prev];
      for (const d of combined) {
        if (!seen.has(d.id)) {
          next.push(d);
          seen.add(d.id);
        }
      }
      return next;
    });
    setDraftDrawerDocument(combined[0]);
    setSelectedDraftTabIds(combined.map(d => d.id));
    if (combined.length < ciIds.length) {
      toast.warning(`${ciIds.length - combined.length} document(s) in the group could not be opened (deleted or moved).`);
    } else {
      toast.success(`Opened ${combined.length} document(s) — bulk edit ready.`);
    }
  }, [documents]);

  // Listen for in-app "open this referenced doc as a tab" events fired by
  // the LiveEditor. This bypasses URL-based deep-linking so opening the 3rd,
  // 4th, … referenced doc inside an already-open drawer reliably produces
  // a new tab instead of silently no-op'ing on a URL update.
  useEffect(() => {
    // Listen for "open just-created derivative draft" events emitted by
    // the Translate / Generate WI sections in the Configure panel.
    const derivativeHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const ciId = (detail as { ciId?: string }).ciId;
      if (ciId) openDraftsByIds([ciId]);
    };
    window.addEventListener('xyreg:open-draft-by-id', derivativeHandler as EventListener);
    return () => {
      window.removeEventListener('xyreg:open-draft-by-id', derivativeHandler as EventListener);
    };
  }, [openDraftsByIds]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const { docId, docName } = detail as { docId?: string; docName?: string };
      let opened = false;
      if (docId) {
        const found = documents.find(d => d.id === docId);
        if (found) { openDraft(found); opened = true; }
      }
      if (!opened && docName) {
        const lc = docName.toLowerCase();
        const found = documents.find(d => {
          const n = (d.name || '').toLowerCase();
          return n === lc || n.startsWith(lc + ' ') || n.includes(lc);
        });
        if (found) { openDraft(found); opened = true; }
      }
      if (opened) {
        e.preventDefault();
        return;
      }
      if (docId) {
        // Last resort: fetch the row directly so a product-scoped doc still
        // opens as a tab even if not present in the company list.
        (async () => {
          try {
            const { data } = await supabase
              .from('phase_assigned_document_template')
              .select('id, name, document_type, status, created_at, updated_at')
              .eq('id', docId)
              .maybeSingle();
            if (data) {
              openDraft({
                id: data.id,
                name: data.name || docName || 'Document',
                document_type: data.document_type || 'Standard',
                status: data.status || 'Draft',
                tech_applicability: '',
                created_at: data.created_at,
                updated_at: data.updated_at,
                source_table: 'phase_assigned_document_template',
              } as CompanyDocument);
            }
          } catch { /* ignore */ }
        })();
        e.preventDefault();
      }
    };
    window.addEventListener('xyreg:openDocumentDraft', handler as EventListener);
    return () => window.removeEventListener('xyreg:openDocumentDraft', handler as EventListener);
  }, [documents, openDraft]);

  // Deep-link: auto-open drawer when `n`/`docId` param is present
  useEffect(() => {
    const docId = searchParams.get('n') || searchParams.get('docId');
    if (!docId) return;
    // If the same doc is already open, nothing to do — just clean the URL.
    if (draftDrawerDocument && draftDrawerDocument.id === docId) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('n');
        newParams.delete('docId');
        return newParams;
      }, { replace: true });
      return;
    }

    // Wait for documents to load
    if (isLoading) return;

    const targetDoc = documents.find(d => d.id === docId);
    if (targetDoc) {
      openDraft(targetDoc);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('n');
        newParams.delete('docId');
        return newParams;
      }, { replace: true });
    } else {
      // Fallback: fetch the document directly from the DB (it may be product-scoped)
      (async () => {
        try {
          const { data, error } = await supabase
            .from('phase_assigned_document_template')
            .select('id, name, document_type, status, created_at, updated_at')
            .eq('id', docId)
            .maybeSingle();
          if (!error && data) {
            openDraft({
              id: data.id,
              name: data.name || 'Document',
              document_type: data.document_type || 'Standard',
              status: data.status || 'Draft',
              tech_applicability: '',
              created_at: data.created_at,
              updated_at: data.updated_at,
              source_table: 'phase_assigned_document_template',
            } as CompanyDocument);
          }
        } catch { /* ignore */ }
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('n');
          newParams.delete('docId');
          return newParams;
        }, { replace: true });
      })();
    }
  }, [searchParams, documents, draftDrawerDocument, setSearchParams, isLoading]);

  // Get dynamic document types
  const { documentTypes, isLoading: isLoadingDocTypes } = useDocumentTypes(companyId);

  // Get authors for filter and bulk operations
  const { allAuthorsMap, authors: allAuthors, isLoading: isLoadingAuthors } = useDocumentAuthors(companyId);

  const availableAuthors = useMemo(() => {
    // Get unique author IDs from documents
    const authorIdsInDocs = new Set<string>();
    documents.forEach(doc => {
      if (doc.authors_ids) {
        doc.authors_ids.forEach(id => authorIdsInDocs.add(id));
      }
    });

    // Map to author objects, filtering out unknown authors
    return Array.from(authorIdsInDocs)
      .map(id => {
        const author = allAuthorsMap[id];
        return author ? { id, name: author.name } : null;
      })
      .filter((a): a is { id: string; name: string } => a !== null);
  }, [documents, allAuthorsMap]);

  // Get available sections from documents
  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    documents.forEach(doc => {
      if (doc.sub_section) {
        sections.add(doc.sub_section);
      }
    });
    return Array.from(sections).sort();
  }, [documents]);

  // Get available tags from documents
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach(doc => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  // Get available document types from documents (drives the "Type" filter category)
  const availableDocTypes = useMemo(() => {
    const typeSet = new Set<string>();
    documents.forEach(doc => {
      if (doc.document_type) typeSet.add(doc.document_type);
    });
    return Array.from(typeSet).sort();
  }, [documents]);

  // Fetch reference document tags for ref tag filter
  const { data: refDocsData = [] } = useQuery({
    queryKey: ['reference-documents-tags', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reference_documents')
        .select('id, tags')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 30000,
  });

  const { availableRefTags, refDocTagMap } = useMemo(() => {
    const tagSet = new Set<string>();
    const tagMap: Record<string, string[]> = {};
    refDocsData.forEach((doc: any) => {
      if (Array.isArray(doc.tags)) {
        tagMap[doc.id] = doc.tags;
        doc.tags.forEach((tag: string) => tagSet.add(tag));
      }
    });
    return { availableRefTags: Array.from(tagSet).sort(), refDocTagMap: tagMap };
  }, [refDocsData]);

  // Fetch phases for this company
  React.useEffect(() => {
    const fetchPhases = async () => {
      try {
        const { data: phasesData, error: phasesError } = await supabase
          .from('company_chosen_phases')
          .select(`
            phase_id,
            company_phases!inner(name)
          `)
          .eq('company_id', companyId)
          .order('position');

        if (!phasesError && phasesData) {
          const phaseNames = phasesData.map((p: any) => p.company_phases?.name).filter(Boolean);
          setAvailablePhases(phaseNames);
        }
      } catch {
        // Error fetching phases
      }
    };

    fetchPhases();
  }, [companyId]);

  // Get company role on component mount
  React.useEffect(() => {
    const getCompanyRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('Could not get current user for admin assignment');
        }
        
        const { data: existingAccess, error: accessCheckError } = await supabase
          .from('user_company_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .single();
        
        if (!accessCheckError && existingAccess) {
          setCompanyRole(existingAccess.access_level);
        }
      } catch {
        // Error getting company role
      }
    };

    getCompanyRole();
  }, [companyId]);

  const handleDocumentCreated = (documentId: string) => {
    refetch(); // Refresh the list using TanStack Query
  };

  const handleDocumentUpdated = () => {
    toast.success('Document updated successfully');
    refetch(); // Refresh the list using TanStack Query
    setEditDialogOpen(false);
    setSelectedDocument(null);
  };

  const { logView } = useAuditLog({
    documentId: selectedDocument?.id || '',
    companyId: companyId || '',
    autoLogView: true
  });

  const handleViewDocument = (document: CompanyDocument) => {
    logView();
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleViewerClose = (open: boolean) => {
    setViewerOpen(open);
    if (!open) {
      // Refetch documents when viewer closes to get updated status
      refetch();
    }
  };

  const handleEditDocument = (document: CompanyDocument) => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
  };

  const handleDeleteDocument = (document: CompanyDocument) => {
    deleteDocument(document.id, document.source_table);
  };

  const handleCopyDocument = async (document: CompanyDocument) => {
    if (!companyId) {
      toast.error('Cannot copy document: missing company context');
      return;
    }

    try {
      if (document.source_table === 'document_studio_templates') {
        // Copy studio document
        const { data: original, error: fetchError } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('id', document.id)
          .maybeSingle();

        if (fetchError || !original) {
          toast.error('Could not find the original document to copy');
          return;
        }

        const {
          id: _id,
          created_at: _created,
          updated_at: _updated,
          ...copyFields
        } = original;

        const { error: insertError } = await supabase
          .from('document_studio_templates')
          .insert({
            ...copyFields,
            name: `${original.name} (copy)`,
            metadata: {
              ...(typeof original.metadata === 'object' && original.metadata !== null ? original.metadata : {}),
              status: 'Not Started',
            },
          });

        if (insertError) throw insertError;
      } else {
        // Copy from phase_assigned_document_template
        const { data: original, error: fetchError } = await supabase
          .from('phase_assigned_document_template')
          .select('*')
          .eq('id', document.id)
          .maybeSingle();

        if (fetchError || !original) {
          toast.error('Could not find the original document to copy');
          return;
        }

        const {
          id: _id,
          created_at: _created,
          updated_at: _updated,
          inserted_at: _inserted,
          approval_date: _approval,
          approved_by: _approvedBy,
          approval_note: _approvalNote,
          current_version_id: _versionId,
          ...copyFields
        } = original;

        const { error: insertError } = await supabase
          .from('phase_assigned_document_template')
          .insert({
            ...copyFields,
            name: `${original.name} (copy)`,
            company_id: companyId,
            status: 'Not Started',
          });

        if (insertError) throw insertError;
      }

      toast.success(`Created copy: ${document.name}`);
      refetch();
    } catch (error) {
      console.error('Error copying document:', error);
      toast.error('Failed to copy document');
    }
  };

  const handleTranslateDocument = async (document: CompanyDocument, langCode: string) => {
    if (!companyId) {
      toast.error('Cannot translate: missing company context');
      return;
    }
    const code = langCode.toUpperCase();
    try {
      // Resolve the source studio draft (sections live there).
      let sourceStudio: any = null;
      if (document.source_table === 'document_studio_templates') {
        const { data, error } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('id', document.id)
          .maybeSingle();
        if (error) throw error;
        sourceStudio = data;
      } else {
        const { data } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('template_id', document.id)
          .maybeSingle();
        sourceStudio = data || null;
      }

      const rawBase = document.document_number
        || (sourceStudio?.document_control as any)?.document_number
        || (sourceStudio?.metadata as any)?.document_number
        || '';
      // For seeded SOPs, upgrade canonical SOP-NNN to the displayed SOP-XX-NNN
      // form so the translated number preserves the functional sub-prefix.
      const sopKey = parseSopNumber(rawBase) || parseSopNumber(document.name);
      const baseNumber = sopKey ? formatSopDisplayId(sopKey) : rawBase;
      const translatedNumber = appendLanguageSuffix(baseNumber, code);

      // Build the translated display name: keep the source title (without its
      // own prefix) and prepend the new translated number so the list shows
      // e.g. "SOP-QA-002-NO Document Control (NO)" — matching the prefix
      // convention used by every other row.
      const rawName = document.name || '';
      const cleanTitle =
        rawName.replace(/^\s*[A-Z]{2,5}(?:-[A-Z0-9]+){1,3}\s+/i, '').trim() || rawName;
      const translatedName = translatedNumber
        ? `${translatedNumber} ${cleanTitle} (${code})`
        : `${cleanTitle} (${code})`;

      // Resolve the CI (phase_assigned_document_template) id of the source so
      // we can store source_document_id on the translated copy. When the user
      // triggered translate from a studio row, the CI id lives on
      // sourceStudio.template_id; otherwise document.id IS the CI id.
      const sourceCiId =
        document.source_table === 'document_studio_templates'
          ? (sourceStudio?.template_id ?? null)
          : document.id;

      // Guard: prevent duplicate translations of the same source into the same language.
      if (sourceCiId) {
        const { data: existing } = await supabase
          .from('phase_assigned_document_template')
          .select('id, name')
          .eq('company_id', companyId)
          .eq('source_document_id', sourceCiId)
          .eq('language_code', code)
          .maybeSingle();
        if (existing?.id) {
          toast.info(`A ${code} translation of this document already exists.`);
          refetch();
          return;
        }
      }

      // Translate sections if any
      let translatedSections: any = sourceStudio?.sections ?? [];
      const sectionsArray = Array.isArray(sourceStudio?.sections) ? sourceStudio.sections : [];
      if (sectionsArray.length > 0) {
        const payloadSections = sectionsArray.map((s: any, idx: number) => ({
          id: String(s.id ?? idx),
          title: s.title ?? s.heading ?? '',
          content: s.content ?? s.html ?? '',
        }));
        const { data: tData, error: tError } = await supabase.functions.invoke('translate-document-sections', {
          body: { sections: payloadSections, targetLanguage: code, sourceLanguage: 'EN' },
        });
        if (tError) {
          const status = (tError as any)?.context?.status;
          if (status === 429) toast.error('Rate limit reached — please try again shortly.');
          else if (status === 402) toast.error('AI credits exhausted — add credits to continue.');
          else toast.error('Translation failed');
          throw tError;
        }
        const returned: any[] = (tData as any)?.sections || [];
        const byId = new Map(returned.map((s: any) => [String(s.id), s.content]));
        translatedSections = sectionsArray.map((s: any, idx: number) => {
          const newContent = byId.get(String(s.id ?? idx));
          if (newContent === undefined) return s;
          if ('content' in s) return { ...s, content: newContent };
          if ('html' in s) return { ...s, html: newContent };
          return { ...s, content: newContent };
        });
      }

      // 1) Create a new CI document so the translated copy is a controlled doc.
      const phaseId = await NoPhaseService.getNoPhaseId(companyId);
      if (!phaseId) {
        toast.error('Could not resolve "No Phase" for this company');
        return;
      }
      const { data: newCI, error: ciError } = await supabase
        .from('phase_assigned_document_template')
        .insert({
          company_id: companyId,
          phase_id: phaseId,
          name: translatedName,
          document_type: document.document_type || 'Document',
          document_number: translatedNumber,
          document_reference: translatedNumber,
          document_scope: 'company_document' as const,
          status: 'Draft',
          version: '1.0',
          is_excluded: false,
          is_record: false,
          product_id: null,
          language_code: code,
          source_document_id: sourceCiId,
          translation_synced_at: new Date().toISOString(),
          description: `Translation (${code}) of ${document.name}. The English master is the authoritative version.`,
        })
        .select('id')
        .single();
      if (ciError || !newCI) throw ciError || new Error('Failed to create translated document record');

      // 2) Build & insert the studio draft anchored to the new CI UUID.
      const baseStudio = sourceStudio || {
        company_id: companyId,
        type: document.document_type || 'Document',
        sections: [],
        product_context: {},
        document_control: {},
        revision_history: [],
        associated_documents: [],
        metadata: {},
        smart_data: {},
        role_mappings: {},
        notes: {},
      };
      const {
        id: _id,
        created_at: _c,
        updated_at: _u,
        template_id: _t,
        product_id: _p,
        company_id: _co,
        ...studioRest
      } = baseStudio;

      const newMetadata = {
        ...(typeof baseStudio.metadata === 'object' && baseStudio.metadata !== null ? baseStudio.metadata : {}),
        status: 'Draft',
        document_number: translatedNumber,
        is_translation: true,
        translation_of_document_id: document.id,
        translation_of_number: baseNumber || null,
        translation_language: code,
      };
      const newDocControl = {
        ...(typeof baseStudio.document_control === 'object' && baseStudio.document_control !== null ? baseStudio.document_control : {}),
        document_number: translatedNumber,
      };

      const { data: newStudio, error: insertError } = await supabase
        .from('document_studio_templates')
        .insert({
          ...studioRest,
          company_id: companyId,
          product_id: null,
          template_id: newCI.id,
          name: translatedName,
          type: document.document_type || baseStudio.type || 'Document',
          sections: translatedSections,
          metadata: newMetadata,
          document_control: newDocControl,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      // 3) Link CI document_reference -> studio draft for drawer/open-draft flows.
      if (newStudio?.id) {
        await supabase
          .from('phase_assigned_document_template')
          .update({ document_reference: `DS-${newStudio.id}` })
          .eq('id', newCI.id);
      }

      toast.success(`Created translated copy: ${translatedName}`);
      refetch();
    } catch (error) {
      console.error('Error translating document:', error);
      if (!(error as any)?.context) toast.error('Failed to create translated copy');
    }
  };

  const handleCreateInStudio = useCallback((doc: CompanyDocument) => {
    openDraft(doc);
  }, [openDraft]);

  const handleStatusChange = (documentId: string, status: string) => {
    updateDocumentStatus(documentId, status);
  };

  // AI Summary doc selection handler
  const handleToggleDocForSummary = useCallback((docId: string) => {
    setSelectedDocsForSummary(prev => {
      const next = new Set(prev);
      if (next.has(docId)) { next.delete(docId); } else { next.add(docId); }
      return next;
    });
  }, []);

  // Bulk update helper — routes to correct table based on source_table
  const bulkUpdateField = useCallback(async (field: string, value: any) => {
    if (bulkSelectedDocs.size === 0) return;
    const ids = Array.from(bulkSelectedDocs);
    let successCount = 0;
    let failCount = 0;

    startOperation(ids.length);

    for (let i = 0; i < ids.length; i++) {
      const docId = ids[i];
      const doc = documents.find(d => d.id === docId);
      const table = doc?.source_table || 'phase_assigned_document_template';

      updateBulkProgress({ completed: i, currentItem: docId });

      const { error } = await supabase
        .from(table)
        .update({ [field]: value } as any)
        .eq("id", docId);
      if (error) {
        console.error('Bulk update error for', docId, '(table:', table, '):', error);
        failCount++;
      } else {
        successCount++;
      }
      updateBulkProgress({ completed: i + 1, succeeded: successCount, failed: failCount });
    }

    completeOperation();
    refetch();

    if (failCount === 0) {
      toast.success(`Updated ${successCount} documents`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} updated, ${failCount} failed`);
    } else {
      toast.error(`All ${failCount} updates failed`);
    }
  }, [bulkSelectedDocs, documents, refetch, startOperation, updateBulkProgress, completeOperation]);

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(bulkSelectedDocs);
    let successCount = 0;
    let failCount = 0;

    startOperation(ids.length);

    for (let i = 0; i < ids.length; i++) {
      const docId = ids[i];
      const doc = documents.find(d => d.id === docId);
      const table = doc?.source_table || 'phase_assigned_document_template';

      updateBulkProgress({ completed: i, currentItem: docId });

      // Use .select() to verify rows were actually deleted (RLS can silently block)
      const { data: deleted, error } = await supabase.from(table).delete().eq("id", docId).select('id');
      if (error) {
        console.error('Bulk delete error for', docId, error);
        failCount++;
      } else if (!deleted || deleted.length === 0) {
        console.warn('Bulk delete: no rows deleted for', docId, 'in table', table);
        // Try the other table as fallback
        const altTable = table === 'phase_assigned_document_template' ? 'document_studio_templates' : 'phase_assigned_document_template';
        const { data: altDeleted, error: altError } = await supabase.from(altTable).delete().eq("id", docId).select('id');
        if (altError || !altDeleted || altDeleted.length === 0) {
          console.error('Bulk delete failed in both tables for', docId);
          failCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
      updateBulkProgress({ completed: i + 1, succeeded: successCount, failed: failCount });
    }

    completeOperation();
    setBulkSelectedDocs(new Set());
    refetch();

    if (failCount === 0) {
      toast.success(`Deleted ${successCount} document(s)`);
    } else {
      toast.warning(`${successCount} deleted, ${failCount} failed`);
    }
  }, [bulkSelectedDocs, documents, refetch, startOperation, updateBulkProgress, completeOperation]);


  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let result = documents.filter(doc => {
      // Search filter
      const term = searchTerm.toLowerCase();
      const displayNumber = doc.document_number ? formatSopDisplayId(doc.document_number).toLowerCase() : '';
      const displayName = formatSopDisplayName(doc.name).toLowerCase();
      const matchesSearch = !searchTerm ||
        doc.name.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.document_number?.toLowerCase().includes(term) ||
        displayNumber.includes(term) ||
        displayName.includes(term);

      // Status filter
      const matchesStatus = statusFilter.length === 0 ||
        statusFilter.includes(doc.status);

      // Author filter
      const matchesAuthor = authorFilter.length === 0 ||
        (doc.authors_ids && doc.authors_ids.some(id => authorFilter.includes(id)));

      // Section filter (sub_section)
      const matchesSection = sectionFilter.length === 0 ||
        (doc.sub_section && sectionFilter.includes(doc.sub_section));

      // Tag filter
      const matchesTag = tagFilter.length === 0 ||
        (doc.tags && doc.tags.some(tag => tagFilter.includes(tag)));

      // Ref tag filter
      const matchesRefTag = refTagFilter.length === 0 ||
        (doc.reference_document_ids && doc.reference_document_ids.some(refId => {
          const refTags = refDocTagMap[refId] || [];
          return refTagFilter.some(tag => refTags.includes(tag));
        }));

      // Document type filter (Type column: SOP / POL / WI / FORM / …)
      const matchesDocType = docTypeFilter.length === 0 ||
        (doc.document_type && docTypeFilter.includes(doc.document_type));

      // Tier filter (derived from SOP id: A=Foundation, B=Pathway, C=Device-specific)
      const matchesTier = (() => {
        if (tierFilter.length === 0) return true;
        const t = getSopTier(doc.name, doc.document_number);
        return t ? tierFilter.includes(t) : false;
      })();

      return matchesSearch && matchesStatus && matchesAuthor && matchesSection && matchesTag && matchesRefTag && matchesDocType && matchesTier;
    });

    // Apply sorting
    if (sortByDate !== 'none') {
      result = [...result].sort((a, b) => {
        switch (sortByDate) {
          case 'name_asc':
            return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
          case 'name_desc':
            return (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' });
          case 'number_asc':
            return compareDocumentNumber(a.document_number, b.document_number, a.name, b.name);
          case 'number_desc':
            return compareDocumentNumber(b.document_number, a.document_number, b.name, a.name);
          case 'phase_asc':
            return (a.phase_name || '').localeCompare(b.phase_name || '', undefined, { sensitivity: 'base' });
          case 'phase_desc':
            return (b.phase_name || '').localeCompare(a.phase_name || '', undefined, { sensitivity: 'base' });
          case 'section_asc':
            return (a.sub_section || '').localeCompare(b.sub_section || '', undefined, { sensitivity: 'base' });
          case 'section_desc':
            return (b.sub_section || '').localeCompare(a.sub_section || '', undefined, { sensitivity: 'base' });
          case 'doctype_asc':
            return (a.document_type || '').localeCompare(b.document_type || '', undefined, { sensitivity: 'base' });
          case 'doctype_desc':
            return (b.document_type || '').localeCompare(a.document_type || '', undefined, { sensitivity: 'base' });
          case 'author_asc': {
            const aAuthor = a.authors_ids?.[0] ? (allAuthorsMap?.[a.authors_ids[0]]?.name || '') : '';
            const bAuthor = b.authors_ids?.[0] ? (allAuthorsMap?.[b.authors_ids[0]]?.name || '') : '';
            return aAuthor.localeCompare(bAuthor, undefined, { sensitivity: 'base' });
          }
          case 'author_desc': {
            const aAuthor = a.authors_ids?.[0] ? (allAuthorsMap?.[a.authors_ids[0]]?.name || '') : '';
            const bAuthor = b.authors_ids?.[0] ? (allAuthorsMap?.[b.authors_ids[0]]?.name || '') : '';
            return bAuthor.localeCompare(aAuthor, undefined, { sensitivity: 'base' });
          }
          case 'status_asc':
            return (a.status || '').localeCompare(b.status || '', undefined, { sensitivity: 'base' });
          case 'status_desc':
            return (b.status || '').localeCompare(a.status || '', undefined, { sensitivity: 'base' });
          case 'category_asc': {
            const aCat = a.is_record ? 'Record' : 'Document';
            const bCat = b.is_record ? 'Record' : 'Document';
            return aCat.localeCompare(bCat);
          }
          case 'category_desc': {
            const aCat = a.is_record ? 'Record' : 'Document';
            const bCat = b.is_record ? 'Record' : 'Document';
            return bCat.localeCompare(aCat);
          }
          default:
            break;
        }

        // Date-based sorting
        let dateA: Date | null = null;
        let dateB: Date | null = null;

        switch (sortByDate) {
          case 'updated_newest':
          case 'updated_oldest':
            dateA = a.updated_at ? new Date(a.updated_at) : null;
            dateB = b.updated_at ? new Date(b.updated_at) : null;
            break;
          case 'due_newest':
          case 'due_oldest':
            dateA = a.due_date ? new Date(a.due_date) : null;
            dateB = b.due_date ? new Date(b.due_date) : null;
            break;
          case 'approval_newest':
          case 'approval_oldest':
            dateA = a.approval_date ? new Date(a.approval_date) : null;
            dateB = b.approval_date ? new Date(b.approval_date) : null;
            break;
          default:
            return 0;
        }

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        const isNewest = sortByDate.includes('newest');
        return isNewest
          ? dateB.getTime() - dateA.getTime()
          : dateA.getTime() - dateB.getTime();
      });
    }

    return result;
  }, [documents, searchTerm, statusFilter, authorFilter, sectionFilter, tagFilter, refTagFilter, docTypeFilter, tierFilter, sortByDate, refDocTagMap, allAuthorsMap]);

  // === Grouped (SOP -> WI) view: derive parent->child map by document_number ===
  // Parent SOP "SOP-{SUB}-{NNN}" matches WI "WI-{SUB}-{NNN}-*".
  const groupedView = useMemo(() => {
    if (viewMode !== 'grouped') return { docs: filteredDocuments, parentChildMap: undefined as Map<string, string[]> | undefined };
    const sopByKey = new Map<string, CompanyDocument>(); // key like "QA-001" -> SOP doc
    const wisByKey = new Map<string, CompanyDocument[]>();
    const orphans: CompanyDocument[] = [];
    for (const d of filteredDocuments) {
      const num = (d.document_number || '').toUpperCase();
      const sopMatch = num.match(/^SOP-([A-Z]+)-(\d{3})$/);
      const wiMatch = num.match(/^WI-([A-Z]+)-(\d{3})-\d+$/);
      if (sopMatch) {
        sopByKey.set(`${sopMatch[1]}-${sopMatch[2]}`, d);
      } else if (wiMatch) {
        const k = `${wiMatch[1]}-${wiMatch[2]}`;
        if (!wisByKey.has(k)) wisByKey.set(k, []);
        wisByKey.get(k)!.push(d);
      } else {
        orphans.push(d);
      }
    }
    const parentChildMap = new Map<string, string[]>();
    const ordered: CompanyDocument[] = [];
    // Walk filteredDocuments order, but emit each parent immediately followed by its children
    const emittedParentKeys = new Set<string>();
    for (const d of filteredDocuments) {
      const num = (d.document_number || '').toUpperCase();
      const wiMatch = num.match(/^WI-([A-Z]+)-(\d{3})-\d+$/);
      if (wiMatch) {
        const k = `${wiMatch[1]}-${wiMatch[2]}`;
        if (sopByKey.has(k)) continue; // emitted under parent
        ordered.push(d); // orphan WI (no parent in current filter)
        continue;
      }
      const sopMatch = num.match(/^SOP-([A-Z]+)-(\d{3})$/);
      if (sopMatch) {
        const k = `${sopMatch[1]}-${sopMatch[2]}`;
        if (emittedParentKeys.has(k)) continue;
        emittedParentKeys.add(k);
        ordered.push(d);
        const kids = wisByKey.get(k) ?? [];
        if (kids.length) {
          parentChildMap.set(d.id, kids.map(k2 => k2.id));
          // append children sorted by their document_number suffix
          kids.sort((a,b) => (a.document_number || '').localeCompare(b.document_number || '', undefined, { numeric: true }));
          ordered.push(...kids);
        }
        continue;
      }
      ordered.push(d);
    }
    return { docs: ordered, parentChildMap };
  }, [viewMode, filteredDocuments]);

  // Handler for status filter toggle
  const handleStatusFilterChange = useCallback((status: string) => {
    if (status === '__SHOW_ALL__') {
      setStatusFilter([]);
    } else {
      const newStatuses = statusFilter.includes(status)
        ? statusFilter.filter(s => s !== status)
        : [...statusFilter, status];
      setStatusFilter(newStatuses);
    }
  }, [statusFilter, setStatusFilter]);

  // Handler for author filter toggle
  const handleAuthorFilterChange = useCallback((authorId: string) => {
    const newAuthors = authorFilter.includes(authorId)
      ? authorFilter.filter(id => id !== authorId)
      : [...authorFilter, authorId];
    setAuthorFilter(newAuthors);
  }, [authorFilter, setAuthorFilter]);

  // Handler for section filter toggle
  const handleSectionFilterChange = useCallback((section: string) => {
    if (section === '__CLEAR_ALL__') {
      setSectionFilter([]);
    } else {
      const newSections = sectionFilter.includes(section)
        ? sectionFilter.filter(s => s !== section)
        : [...sectionFilter, section];
      setSectionFilter(newSections);
    }
  }, [sectionFilter, setSectionFilter]);

  // Handler for tag filter toggle
  const handleTagFilterChange = useCallback((tag: string) => {
    const newTags = tagFilter.includes(tag)
      ? tagFilter.filter(t => t !== tag)
      : [...tagFilter, tag];
    setTagFilter(newTags);
  }, [tagFilter, setTagFilter]);

  // Handler for ref tag filter toggle
  const handleRefTagFilterChange = useCallback((tag: string) => {
    const newTags = refTagFilter.includes(tag)
      ? refTagFilter.filter(t => t !== tag)
      : [...refTagFilter, tag];
    setRefTagFilter(newTags);
  }, [refTagFilter, setRefTagFilter]);

  // Handler for document type filter toggle
  const handleDocTypeFilterChange = useCallback((docType: string) => {
    const newTypes = docTypeFilter.includes(docType)
      ? docTypeFilter.filter(t => t !== docType)
      : [...docTypeFilter, docType];
    setDocTypeFilter(newTypes);
  }, [docTypeFilter, setDocTypeFilter]);

  // Handler for tier filter toggle
  const handleTierFilterChange = useCallback((tier: string) => {
    const newTiers = tierFilter.includes(tier)
      ? tierFilter.filter(t => t !== tier)
      : [...tierFilter, tier];
    setTierFilter(newTiers);
  }, [tierFilter, setTierFilter]);

  // Clear all filters (also clears URL params)
  const clearAllFilters = useCallback(() => {
    setSearchTermState('');
    setStatusFilterState([]);
    setAuthorFilterState([]);
    setSectionFilterState([]);
    setTagFilterState([]);
    setRefTagFilterState([]);
    setDocTypeFilterState([]);
    setTierFilterState([]);
    setSortByDateState('none');
    updateUrlParams({
      [URL_PARAM_KEYS.SEARCH]: null,
      [URL_PARAM_KEYS.STATUS]: null,
      [URL_PARAM_KEYS.AUTHORS]: null,
      [URL_PARAM_KEYS.SECTIONS]: null,
      [URL_PARAM_KEYS.TAGS]: null,
      [URL_PARAM_KEYS.REF_TAGS]: null,
      [URL_PARAM_KEYS.DOC_TYPES]: null,
      [URL_PARAM_KEYS.TIERS]: null,
      [URL_PARAM_KEYS.SORT_BY_DATE]: null,
    });
    clearUserScopedFilters(filterScope);
  }, [updateUrlParams, filterScope]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">{lang('companyDocumentManager.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            {lang('companyDocumentManager.loadError')}: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <CompanyDocumentStatusSummary documents={documents} />

        {/* Row 1: Filters + Sort | Card/List toggle + Refresh (outside Card) */}
        <div className="flex items-center justify-between gap-4">
          <EnhancedDocumentFilters
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            searchQuery={searchTerm}
            onSearchChange={setSearchTerm}
            authorFilter={authorFilter}
            onAuthorFilterChange={handleAuthorFilterChange}
            sectionFilter={sectionFilter}
            onSectionFilterChange={handleSectionFilterChange}
            availableSections={availableSections}
            tagFilter={tagFilter}
            onTagFilterChange={handleTagFilterChange}
            availableTags={availableTags}
            refTagFilter={refTagFilter}
            onRefTagFilterChange={handleRefTagFilterChange}
            availableRefTags={availableRefTags}
            docTypeFilter={docTypeFilter}
            onDocTypeFilterChange={handleDocTypeFilterChange}
            availableDocTypes={availableDocTypes}
            tierFilter={tierFilter as Array<'A' | 'B' | 'C'>}
            onTierFilterChange={handleTierFilterChange as (t: 'A' | 'B' | 'C') => void}
            sortByDate={sortByDate}
            onSortByDateChange={setSortByDate}
            clearAllFilters={clearAllFilters}
            availableAuthors={availableAuthors}
          />
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              className="border rounded-md bg-background"
              value={viewMode}
              onValueChange={(value) => value && setViewMode(value as 'card' | 'list' | 'grouped')}
            >
              <ToggleGroupItem value="card" aria-label="Card view" className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grouped" aria-label="Grouped view (SOP → WI)" title="Grouped (SOP → WI)" className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Layers className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" size="sm" onClick={() => setShowRefreshConfirm(true)} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">

            {/* Row 2: Title + count | Columns + AI Summary + Bulk + Add Document */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {lang('companyDocumentManager.title')}
                </CardTitle>
                <Badge variant="secondary">
                  {filteredDocuments.length} of {documents.length} documents
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {(viewMode === 'list' || viewMode === 'grouped') && (
                  <ColumnVisibilitySettings
                    companyId={companyId}
                    module="company_documents"
                    columns={COMPANY_DOC_COLUMNS}
                    hiddenColumns={hiddenColumns}
                    onHiddenColumnsChange={setHiddenColumns}
                  />
                )}
                <Button size="sm" onClick={() => !disabled && setCreateDialogOpen(true)} disabled={disabled}>
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('companyDocumentManager.addDocument')}
                </Button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {bulkSelectedDocs.size > 0 && (
              <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg sticky top-0 z-10 mb-4">
                {bulkProgress.isRunning && (
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-xs text-amber-700 whitespace-nowrap">
                      Updating {bulkProgress.completed}/{bulkProgress.total}
                      {bulkProgress.failed > 0 && <span className="text-destructive ml-1">({bulkProgress.failed} failed)</span>}
                    </span>
                    <Progress value={bulkProgress.total > 0 ? (bulkProgress.completed / bulkProgress.total) * 100 : 0} className="h-2 flex-1" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={bulkSelectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onCheckedChange={() => {
                      if (bulkSelectedDocs.size === filteredDocuments.length) {
                        setBulkSelectedDocs(new Set());
                      } else {
                        setBulkSelectedDocs(new Set(filteredDocuments.map(d => d.id)));
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-amber-800">
                    {bulkSelectedDocs.size} document(s) selected
                  </span>
                  <div className="h-4 w-px bg-amber-300" />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 bg-white"
                    disabled={bulkSelectedDocs.size === 0}
                    onClick={async () => {
                      const ids = Array.from(bulkSelectedDocs);
                      const HARD_CAP = 25;
                      const targets = ids.length > HARD_CAP ? ids.slice(0, HARD_CAP) : ids;
                      if (ids.length > HARD_CAP) {
                        toast.warning(`Opening first ${HARD_CAP} of ${ids.length} documents to keep the tab strip usable.`);
                      }
                      await openDraftsByIds(targets);
                      setBulkSelectedDocs(new Set());
                      setSelectedBulkAction("");
                    }}
                  >
                    <Layers className="h-3 w-3" />
                    Open in tabs
                  </Button>
                  <div className="h-4 w-px bg-amber-300" />
                  <Select
                    value={selectedBulkAction}
                    onValueChange={(val) => { setSelectedBulkAction(val); setSelectedBulkValue(""); setBulkDueDateValue(undefined); }}
                  >
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="validate">Validate</SelectItem>
                      <SelectItem value="status">Set Status</SelectItem>
                      <SelectItem value="category">Set Category</SelectItem>
                      <SelectItem value="authors">Set Authors</SelectItem>
                      <SelectItem value="due_date">Set Due Date</SelectItem>
                      <SelectItem value="ai_summary">AI Summary</SelectItem>
                      <SelectItem value="create_ccr">Create CCR</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedBulkAction === 'status' && (
                    <Select value={selectedBulkValue} onValueChange={setSelectedBulkValue}>
                      <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Select status..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Not Required">Not Required</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {selectedBulkAction === 'category' && (
                    <Select value={selectedBulkValue} onValueChange={setSelectedBulkValue}>
                      <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Select category..." /></SelectTrigger>
                      <SelectContent>
                        {documentCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedBulkAction === 'authors' && (
                    <Select value={selectedBulkValue} onValueChange={setSelectedBulkValue}>
                      <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Select author..." /></SelectTrigger>
                      <SelectContent>
                        {allAuthors.map(author => (<SelectItem key={author.id} value={author.id}>{author.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedBulkAction === 'due_date' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs w-[160px] justify-start">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {bulkDueDateValue ? format(bulkDueDateValue, 'PPP') : 'Pick date...'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={bulkDueDateValue}
                          onSelect={(date) => setBulkDueDateValue(date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {selectedBulkAction === 'delete' ? (
                    <Button size="sm" variant="destructive" disabled={bulkSelectedDocs.size === 0} onClick={() => setBulkDeleteConfirmOpen(true)} className="h-8 text-xs">
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  ) : selectedBulkAction === 'validate' ? (
                    <Button
                      size="sm"
                      disabled={bulkSelectedDocs.size === 0 || bulkValidationLoading}
                      onClick={async () => {
                        const selectedIds = Array.from(bulkSelectedDocs);
                        setBulkValidationLoading(true);
                        setBulkValidationFindings([]);
                        setBulkValidationDocCount(selectedIds.length);
                        setBulkValidationOpen(true);
                        try {
                          // Fetch document studio drafts for selected documents
                          const selectedDocs = documents.filter(d => selectedIds.includes(d.id));
                          const { data: drafts } = await supabase
                            .from('document_studio_drafts' as any)
                            .select('key, content')
                            .in('key', selectedIds.map(id => `company-doc-${id}`));

                          const docsForValidation = selectedDocs.map(doc => {
                            const draft = (drafts as any[])?.find((d: any) => d.key === `company-doc-${doc.id}`);
                            let sections: any[] = [];
                            if (draft?.content) {
                              try {
                                const parsed = typeof draft.content === 'string' ? JSON.parse(draft.content) : draft.content;
                                sections = (parsed.sections || []).map((s: any) => ({
                                  id: s.id,
                                  title: s.title,
                                  content: (s.content || []).map((c: any) => ({ type: c.type, content: c.content })),
                                }));
                              } catch { /* ignore parse errors */ }
                            }
                            return {
                              documentName: doc.name,
                              documentNumber: doc.document_number || '',
                              documentType: doc.document_type || '',
                              sections,
                            };
                          });

                          const result = await DocumentValidationService.validateMultipleDocuments(
                            companyId,
                            docsForValidation
                          );
                          setBulkValidationFindings(result.findings);
                        } catch (error: any) {
                          toast.error('Bulk validation failed', { description: error.message });
                        } finally {
                          setBulkValidationLoading(false);
                        }
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <ShieldCheck className="h-3 w-3" /> Validate
                    </Button>
                  ) : selectedBulkAction === 'ai_summary' ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedDocsForSummary(new Set(bulkSelectedDocs));
                        setBulkSummarySidebarOpen(true);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Summarize
                    </Button>
                  ) : selectedBulkAction === 'create_ccr' ? (
                    <Button
                      size="sm"
                      disabled={bulkSelectedDocs.size === 0}
                      onClick={() => {
                        const ids = Array.from(bulkSelectedDocs);
                        const names = documents
                          .filter(d => bulkSelectedDocs.has(d.id))
                          .map(d => d.name);
                        setBulkCcrPrefill({
                          affectedDocumentIds: ids,
                          affectedDocumentNames: names,
                          changeType: 'document',
                          sourceType: 'other',
                        });
                        setBulkCcrChooserDocIds(ids);
                        setBulkCcrChooserOpen(true);
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      Add to CCR…
                    </Button>
                  ) : selectedBulkAction && (
                    <Button
                      size="sm"
                      disabled={bulkSelectedDocs.size === 0 || (selectedBulkAction === 'due_date' ? !bulkDueDateValue : !selectedBulkValue)}
                      onClick={async () => {
                        if (selectedBulkAction === 'status') await bulkUpdateField('status', selectedBulkValue);
                        else if (selectedBulkAction === 'category') await bulkUpdateField('document_type', selectedBulkValue);
                        else if (selectedBulkAction === 'authors') await bulkUpdateField('authors_ids', [selectedBulkValue]);
                        else if (selectedBulkAction === 'due_date' && bulkDueDateValue) await bulkUpdateField('due_date', bulkDueDateValue.toISOString());
                        setSelectedBulkAction(""); setSelectedBulkValue(""); setBulkDueDateValue(undefined);
                      }}
                      className="h-8 text-xs"
                    >
                      Update
                    </Button>
                  )}
                </div>
              </div>
            )}


            {/* Document Cards/List */}
            {filteredDocuments.length > 0 ? (
              viewMode === 'grouped' ? (
                <StackedClusterView
                  documents={groupedView.docs}
                  parentChildMap={groupedView.parentChildMap}
                  bulkSelectedDocs={bulkSelectedDocs}
                  onToggleBulk={(docId: string) => {
                    setBulkSelectedDocs(prev => {
                      const next = new Set(prev);
                      if (next.has(docId)) next.delete(docId); else next.add(docId);
                      return next;
                    });
                  }}
                  onOpen={handleCreateInStudio}
                  onEdit={handleCreateInStudio}
                />
              ) : viewMode === 'list' ? (
                <CompanyDocumentListView
                  documents={groupedView.docs}
                  onView={handleViewDocument}
                  onEdit={handleEditDocument}
                  onDelete={handleDeleteDocument}
                  onCopy={handleCopyDocument}
                  onTranslate={handleTranslateDocument}
                  onCreateInStudio={handleCreateInStudio}
                  isDeleting={isDeleting}
                  disabled={disabled}
                  companyId={companyId}
                  hiddenColumns={hiddenColumns}
                  externalSortActive={sortByDate !== 'none'}
                  groupedMode={false}
                  bulkMode={true}
                  bulkSelectedDocs={bulkSelectedDocs}
                  onToggleBulkDoc={(docId: string) => {
                    setBulkSelectedDocs(prev => {
                      const next = new Set(prev);
                      if (next.has(docId)) next.delete(docId); else next.add(docId);
                      return next;
                    });
                  }}
                  onSelectAll={(ids: string[]) => {
                    setBulkSelectedDocs(new Set(ids));
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((document) => (
                    <div key={document.id} className="flex items-start gap-3">
                      <div className="pt-5">
                          <Checkbox
                            checked={bulkSelectedDocs.has(document.id)}
                            onCheckedChange={() => {
                              setBulkSelectedDocs(prev => {
                                const next = new Set(prev);
                                if (next.has(document.id)) next.delete(document.id); else next.add(document.id);
                                return next;
                              });
                            }}
                          />
                        </div>
                      <div className="flex-1">
                        <CompanyDocumentCard
                          document={document}
                          onView={handleViewDocument}
                          onEdit={handleEditDocument}
                          onDelete={handleDeleteDocument}
                          onCopy={handleCopyDocument}
                          onCreateInStudio={handleCreateInStudio}
                          isDeleting={isDeleting}
                          disabled={disabled}
                          companyId={companyId}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{lang('companyDocumentManager.noDocumentsFound')}</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || statusFilter.length > 0 || authorFilter.length > 0
                    ? lang('companyDocumentManager.tryAdjustingFilters')
                    : lang('companyDocumentManager.createFirstPrompt')}
                </p>
                {!searchTerm && statusFilter.length === 0 && authorFilter.length === 0 && (
                  <Button
                    onClick={() => !disabled && setCreateDialogOpen(true)}
                    className="mt-4"
                    disabled={disabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {lang('companyDocumentManager.createFirstDocument')}
                  </Button>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      <CompanyDocumentCreationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        companyId={companyId}
        onDocumentCreated={handleDocumentCreated}
      />

      {selectedDocument && (
        <>
          <CompanyDocumentEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            document={selectedDocument}
            onDocumentUpdated={handleDocumentUpdated}
            companyId={companyId}
          />

          <CompanyDocumentViewer
            open={viewerOpen}
            onOpenChange={handleViewerClose}
            document={selectedDocument}
            companyId={companyId}
            companyRole={companyRole}
          />
        </>
      )}

      <DocumentDraftDrawer
        open={!!draftDrawerDocument}
        onOpenChange={(open) => {
          if (!open) {
            setDraftDrawerDocument(null);
            setOpenDraftStack([]);
            refetch();
          }
        }}
        documentId={draftDrawerDocument?.id || ''}
        documentName={draftDrawerDocument?.name || ''}
        documentType={draftDrawerDocument?.document_type || ''}
        companyId={companyId}
        onDocumentSaved={() => {
          // Keep tabs open after save so user can keep navigating
          refetch();
        }}
        disableSopMentions
        tabs={openDraftStack.map(d => {
          // Mirror CompanyDocumentListView so the regulatory ID prefix
          // (e.g. SOP-RA-038) shows on every drawer tab regardless of
          // whether it lives in `name` or only in `document_number`.
          const docNumber = d.document_number;
          let cleanName = d.name;
          if (docNumber && cleanName.startsWith(docNumber)) {
            cleanName = cleanName.slice(docNumber.length).replace(/^\s+/, '');
          }
          const displayDocNumber = docNumber ? formatSopDisplayId(docNumber) : null;
          const displayCleanName = docNumber ? cleanName : formatSopDisplayName(cleanName);
          const tabName = displayDocNumber
            ? `${displayDocNumber} ${displayCleanName}`
            : displayCleanName;
          return { id: d.id, name: tabName };
        })}
        activeTabId={draftDrawerDocument?.id}
        onSelectTab={selectDraftTab}
        onCloseTab={closeDraftTab}
        selectedTabIds={selectedDraftTabIds}
        onToggleTabSelection={toggleDraftTabSelection}
        onClearTabSelection={clearDraftTabSelection}
        onBulkEditSelectedTabs={() => setBulkDraftEditOpen(true)}
        groupsMenuSlot={
          <DraftTabGroupsMenu
            companyId={companyId}
            onOpenGroup={(ids) => { openDraftsByIds(ids); }}
          />
        }
        onSaveSelectedAsGroup={() => setSaveGroupOpen(true)}
      />

      <BulkDraftEditDialog
        open={bulkDraftEditOpen}
        onOpenChange={setBulkDraftEditOpen}
        targets={openDraftStack
          .filter(d => selectedDraftTabIds.includes(d.id))
          .map(d => ({ id: d.id, name: d.name }))}
        companyId={companyId}
        onApplied={() => {
          clearDraftTabSelection();
          refetch();
        }}
      />

      <SaveDraftTabGroupDialog
        open={saveGroupOpen}
        onOpenChange={setSaveGroupOpen}
        companyId={companyId}
        selectedTabIds={selectedDraftTabIds}
        allOpenTabIds={openDraftStack.map(d => d.id)}
      />

      <AlertDialog open={showRefreshConfirm} onOpenChange={setShowRefreshConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to refresh?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reload all company documents from the database. Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setIsRefreshing(true);
              try {
                await refetch();
                toast.success('Documents refreshed successfully');
              } catch (error) {
                toast.error('Failed to refresh documents');
              } finally {
                setIsRefreshing(false);
              }
            }}>
              Yes, Refresh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkSelectedDocs.size} document(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { setBulkDeleteConfirmOpen(false); handleBulkDelete(); }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Summary Sidebar */}
      {companyId && (
        <BulkDocumentSummarySidebar
          open={bulkSummarySidebarOpen}
          onOpenChange={setBulkSummarySidebarOpen}
          documents={documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            file_path: doc.file_path,
            file_name: doc.file_name,
            document_type: doc.document_type,
            status: doc.status
          }))}
          companyId={companyId}
          selectedDocIds={selectedDocsForSummary}
          onToggleDocSelection={handleToggleDocForSummary}
        />
      )}

      {/* Bulk Validation Dialog */}
      <BulkDocumentValidationDialog
        open={bulkValidationOpen}
        onOpenChange={setBulkValidationOpen}
        isValidating={bulkValidationLoading}
        findings={bulkValidationFindings}
        documentCount={bulkValidationDocCount}
      />

      {/* Bulk Create CCR Dialog */}
      {companyId && (
        <CCRCreateDialog
          open={bulkCcrDialogOpen}
          onOpenChange={(o) => {
            setBulkCcrDialogOpen(o);
            if (!o) {
              setBulkCcrPrefill(undefined);
              setBulkSelectedDocs(new Set());
              setSelectedBulkAction("");
            }
          }}
          companyId={companyId}
          prefill={bulkCcrPrefill}
        />
      )}

      {/* Bulk CCR Chooser Dialog (create new vs attach to existing) */}
      {companyId && (
        <BulkCCRChooserDialog
          open={bulkCcrChooserOpen}
          onOpenChange={setBulkCcrChooserOpen}
          companyId={companyId}
          documentIds={bulkCcrChooserDocIds}
          documentCount={bulkCcrChooserDocIds.length}
          onCreateNew={() => {
            setBulkCcrDialogOpen(true);
          }}
          onAttached={() => {
            setBulkSelectedDocs(new Set());
            setSelectedBulkAction("");
            setBulkCcrPrefill(undefined);
            setBulkCcrChooserDocIds([]);
          }}
        />
      )}
    </>
  );
}