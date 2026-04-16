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
import { CompanyDocumentViewer } from "./CompanyDocumentViewer";
import { CompanyDocumentCard } from "./CompanyDocumentCard";
import { CompanyDocumentListView } from "./CompanyDocumentListView";
import { DocumentDraftDrawer } from "@/components/product/documents/DocumentDraftDrawer";
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCompanyDocuments, CompanyDocument } from '@/hooks/useCompanyDocuments';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { EnhancedDocumentFilters, SortByDateOption } from '@/components/product/documents/EnhancedDocumentFilters';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';
import { useTranslation } from '@/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { useBulkOperationProgress } from '@/hooks/useBulkOperationProgress';
import { CompanyDocumentStatusSummary } from './CompanyDocumentStatusSummary';
import { BulkDocumentValidationDialog, BulkValidationFinding } from './BulkDocumentValidationDialog';
import { DocumentValidationService } from '@/services/documentValidationService';

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
  const [sortByDate, setSortByDateState] = useState<SortByDateOption>(() => (searchParams.get(URL_PARAM_KEYS.SORT_BY_DATE) as SortByDateOption) || 'none');
  const [viewMode, setViewModeState] = useState<'card' | 'list'>(() => (searchParams.get(URL_PARAM_KEYS.LAYOUT) as 'card' | 'list') || 'list');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CompanyDocument | null>(null);
  const [companyRole, setCompanyRole] = useState<string | null>("");
  const [availablePhases, setAvailablePhases] = useState<string[]>([]);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draftDrawerDocument, setDraftDrawerDocument] = useState<CompanyDocument | null>(null);

  // Bulk mode state (always on - checkboxes always visible)

  // Column visibility
  const COMPANY_DOC_COLUMNS: ColumnDefinition[] = [
    { key: 'name', label: 'Name', required: true },
    
    { key: 'sub_section', label: 'Section' },
    { key: 'authors_ids', label: 'Author' },
    { key: 'document_type', label: 'Document Type' },
    { key: 'is_record', label: 'Category' },
    { key: 'status', label: 'Status' },
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

  // Sync URL changes to state (browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get(URL_PARAM_KEYS.SEARCH) || '';
    const urlStatus = parseArrayParam(searchParams.get(URL_PARAM_KEYS.STATUS));
    const urlAuthors = parseArrayParam(searchParams.get(URL_PARAM_KEYS.AUTHORS));
    const urlSections = parseArrayParam(searchParams.get(URL_PARAM_KEYS.SECTIONS));
    const urlTags = parseArrayParam(searchParams.get(URL_PARAM_KEYS.TAGS));
    const urlRefTags = parseArrayParam(searchParams.get(URL_PARAM_KEYS.REF_TAGS));
    const urlSort = (searchParams.get(URL_PARAM_KEYS.SORT_BY_DATE) as SortByDateOption) || 'none';
    const urlLayout = (searchParams.get(URL_PARAM_KEYS.LAYOUT) as 'card' | 'list') || 'list';

    if (urlSearch !== searchTerm) setSearchTermState(urlSearch);
    if (JSON.stringify(urlStatus) !== JSON.stringify(statusFilter)) setStatusFilterState(urlStatus);
    if (JSON.stringify(urlAuthors) !== JSON.stringify(authorFilter)) setAuthorFilterState(urlAuthors);
    if (JSON.stringify(urlSections) !== JSON.stringify(sectionFilter)) setSectionFilterState(urlSections);
    if (JSON.stringify(urlTags) !== JSON.stringify(tagFilter)) setTagFilterState(urlTags);
    if (JSON.stringify(urlRefTags) !== JSON.stringify(refTagFilter)) setRefTagFilterState(urlRefTags);
    if (urlSort !== sortByDate) setSortByDateState(urlSort);
    if (urlLayout !== viewMode) setViewModeState(urlLayout);
  }, [searchParams]);


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

  const setSortByDate = useCallback((value: SortByDateOption) => {
    setSortByDateState(value);
    updateUrlParams({ [URL_PARAM_KEYS.SORT_BY_DATE]: value === 'none' ? null : value });
  }, [updateUrlParams]);

  const setViewMode = useCallback((value: 'card' | 'list') => {
    setViewModeState(value);
    updateUrlParams({ [URL_PARAM_KEYS.LAYOUT]: value === 'list' ? null : value });
  }, [updateUrlParams]);

  // Use TanStack Query hook
  const { documents, isLoading, error, refetch, deleteDocument, updateDocumentStatus, isDeleting, isUpdatingStatus, updatingStatusId } = useCompanyDocuments(companyId);
  
  // Deep-link: auto-open drawer when docId param is present
  useEffect(() => {
    const docId = searchParams.get('docId');
    if (!docId || draftDrawerDocument) return;

    // Wait for documents to load
    if (isLoading) return;

    const targetDoc = documents.find(d => d.id === docId);
    if (targetDoc) {
      setDraftDrawerDocument(targetDoc);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
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
            setDraftDrawerDocument({
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

  const handleCreateInStudio = useCallback((doc: CompanyDocument) => {
    setDraftDrawerDocument(doc);
  }, []);

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

      const { error } = await supabase.from(table).delete().eq("id", docId);
      if (error) {
        console.error('Bulk delete error for', docId, error);
        failCount++;
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
      const matchesSearch = !searchTerm ||
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_number?.toLowerCase().includes(searchTerm.toLowerCase());

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

      return matchesSearch && matchesStatus && matchesAuthor && matchesSection && matchesTag && matchesRefTag;
    });

    // Apply sorting
    if (sortByDate !== 'none') {
      result = [...result].sort((a, b) => {
        switch (sortByDate) {
          case 'name_asc':
            return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
          case 'name_desc':
            return (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' });
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
            const aCat = a.is_record ? 'Report' : 'Document';
            const bCat = b.is_record ? 'Report' : 'Document';
            return aCat.localeCompare(bCat);
          }
          case 'category_desc': {
            const aCat = a.is_record ? 'Report' : 'Document';
            const bCat = b.is_record ? 'Report' : 'Document';
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
  }, [documents, searchTerm, statusFilter, authorFilter, sectionFilter, tagFilter, refTagFilter, sortByDate, refDocTagMap, allAuthorsMap]);

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

  // Clear all filters (also clears URL params)
  const clearAllFilters = useCallback(() => {
    setSearchTermState('');
    setStatusFilterState([]);
    setAuthorFilterState([]);
    setSectionFilterState([]);
    setTagFilterState([]);
    setRefTagFilterState([]);
    setSortByDateState('none');
    updateUrlParams({
      [URL_PARAM_KEYS.SEARCH]: null,
      [URL_PARAM_KEYS.STATUS]: null,
      [URL_PARAM_KEYS.AUTHORS]: null,
      [URL_PARAM_KEYS.SECTIONS]: null,
      [URL_PARAM_KEYS.TAGS]: null,
      [URL_PARAM_KEYS.REF_TAGS]: null,
      [URL_PARAM_KEYS.SORT_BY_DATE]: null,
    });
  }, [updateUrlParams]);

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
              onValueChange={(value) => value && setViewMode(value as 'card' | 'list')}
            >
              <ToggleGroupItem value="card" aria-label="Card view" className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <List className="h-4 w-4" />
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
                {viewMode === 'list' && (
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
              viewMode === 'list' ? (
                <CompanyDocumentListView
                  documents={filteredDocuments}
                  onView={handleViewDocument}
                  onEdit={handleEditDocument}
                  onDelete={handleDeleteDocument}
                  onCopy={handleCopyDocument}
                  onCreateInStudio={handleCreateInStudio}
                  isDeleting={isDeleting}
                  disabled={disabled}
                  companyId={companyId}
                  hiddenColumns={hiddenColumns}
                  externalSortActive={sortByDate !== 'none'}
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
            refetch();
          }
        }}
        documentId={draftDrawerDocument?.id || ''}
        documentName={draftDrawerDocument?.name || ''}
        documentType={draftDrawerDocument?.document_type || ''}
        companyId={companyId}
        onDocumentSaved={() => {
          setDraftDrawerDocument(null);
          refetch();
        }}
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
    </>
  );
}