
import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, LayoutGrid, List, RefreshCw, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrentPhaseDocumentsTab } from "./CurrentPhaseDocumentsTab";
import { AllActivePhasesTab } from "./AllActivePhasesTab";


import { DocumentFilters } from "./DocumentFilters";
import { EnhancedDocumentFilters } from "./EnhancedDocumentFilters";
import { DocumentGraphModal } from "./DocumentGraphModal";
import { useIsolatedDocumentOperations } from "@/hooks/useIsolatedDocumentOperations";
import { usePhaseDocuments } from "@/hooks/usePhaseDocuments";
import { useUserDocumentAccess } from "@/hooks/useUserDocumentAccess";
import { useDocumentFilterParams } from "@/hooks/useDocumentFilterParams";
import { SortByDateOption } from "@/utils/documentFilterParams";
import { safeDocumentSync } from "@/services/safeDocumentSyncService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface DocumentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentPhaseInstances: any[];
  allPhaseInstances: any[];
  productSpecificDocuments: any[];
  phases: any[];
  currentLifecyclePhase?: string | null;
  productId?: string;
  companyId?: string;
  onDocumentUpdated: (document: any) => void;
  onDocumentsRefresh: () => Promise<any>;
  onSyncRefresh?: () => Promise<any>;
  onAddDocumentClick: () => void;
  onBulkUploadClick?: () => void;
  onPhaseDeadlineChange: (phaseId: string, date: Date | undefined) => void;
  onDocumentStatusChange: (phaseId: string, documentId: string, status: string) => void;
  onDocumentDeadlineChange: (phaseId: string, documentId: string, date: Date | undefined) => void;
  statusFilter?: string[];
  onStatusFilterChange: (status: string) => void;
  phaseFilter?: string | null;
  onPhaseFilterChange?: (phaseFilter: string[]) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  disabled?: boolean;
  // New filter props
  authorFilter?: string[];
  onAuthorFilterChange?: (authorId: string) => void;
  dateFilter?: { start?: Date; end?: Date } | null;
  onDateFilterChange?: (start?: Date, end?: Date) => void;
  clearAllFilters?: () => void;
  availableAuthors?: Array<{ id: string; name: string }>;
  availablePhases?: string[];
  availableStatuses?: string[];
  // AI Summary Sidebar props
  isSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  selectedDocsForSummary?: Set<string>;
  onToggleDocForSummary?: (docId: string) => void;
  // Refresh trigger from parent — incremented when documents change externally
  refreshTrigger?: number;
  newlyCreatedDoc?: any;
}

export function DocumentTabs({
  onTabChange,
  currentPhaseInstances,
  allPhaseInstances,
  productSpecificDocuments,
  phases,
  currentLifecyclePhase,
  productId,
  companyId,
  onDocumentUpdated,
  onDocumentsRefresh,
  onSyncRefresh,
  onAddDocumentClick,
  onBulkUploadClick,
  statusFilter = [],
  onStatusFilterChange,
  phaseFilter,
  onPhaseFilterChange,
  searchQuery = "",
  onSearchChange,
  disabled = false,
  // New filter props
  authorFilter = [],
  onAuthorFilterChange,
  dateFilter,
  onDateFilterChange,
  clearAllFilters,
  availableAuthors = [],
  availablePhases = [],
  availableStatuses = [],
  // AI Summary Sidebar props
  isSidebarOpen,
  onSidebarOpenChange,
  selectedDocsForSummary,
  onToggleDocForSummary,
  refreshTrigger,
  newlyCreatedDoc,
}: DocumentTabsProps) {
  const { lang } = useTranslation();
  const { isAdmin } = useUserDocumentAccess();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isSyncPreviewOpen, setIsSyncPreviewOpen] = useState(false);
  const [selectedSyncDocs, setSelectedSyncDocs] = useState<Set<number>>(new Set());
  const [syncSearchQuery, setSyncSearchQuery] = useState('');
  const [hideExcluded, setHideExcluded] = useState(false);

  // Detect if this product is a variant
  const [isVariantDevice, setIsVariantDevice] = useState(false);
  const [variantChecked, setVariantChecked] = useState(false);
  useEffect(() => {
    if (!productId) { setVariantChecked(true); return; }
    setVariantChecked(false);
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('parent_product_id, parent_relationship_type')
        .eq('id', productId)
        .maybeSingle();
      setIsVariantDevice(!!data?.parent_product_id && data?.parent_relationship_type === 'variant');
      setVariantChecked(true);
    })();
  }, [productId]);

  const queryClient = useQueryClient();

  // Get pending sync document details (company template docs not yet present at device level)
  const { data: pendingSyncDocs = [], refetch: refetchPendingCount } = useQuery({
    queryKey: ['pending-sync-count', productId, companyId],
    enabled: !!productId && !!companyId && variantChecked && !isVariantDevice,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    queryFn: async () => {
      // Build a comprehensive phase ID → name map (mirrors safeDocumentSyncService logic)
      const phaseIdToName = new Map<string, string>();

      // 1. company_chosen_phases → company_phases (primary source for template docs)
      const { data: chosenPhases } = await supabase
        .from('company_chosen_phases')
        .select('phase_id, company_phases!inner(id, name)')
        .eq('company_id', companyId!);
      (chosenPhases || []).forEach((cp: any) => {
        if (cp.company_phases?.id && cp.company_phases?.name) {
          phaseIdToName.set(cp.company_phases.id, cp.company_phases.name);
        }
      });

      // 2. phases table (legacy IDs some template docs may reference)
      const { data: phasesTable } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId!);
      (phasesTable || []).forEach((p: any) => phaseIdToName.set(p.id, p.name));

      // 3. lifecycle_phases for this product (adds both lp.id and lp.phase_id)
      const { data: lifecyclePhases } = await supabase
        .from('lifecycle_phases')
        .select('id, name, phase_id')
        .eq('product_id', productId!);
      (lifecyclePhases || []).forEach((lp: any) => {
        phaseIdToName.set(lp.id, lp.name);
        phaseIdToName.set(lp.phase_id, lp.name);
      });

      // Active phase names (only phases that exist on this device)
      const activePhaseNames = new Set(
        (lifecyclePhases || []).map((lp: any) => lp.name)
      );
      if (activePhaseNames.size === 0) return [];

      // Device doc keys
      const { data: deviceDocs } = await supabase
        .from('phase_assigned_document_template')
        .select('name, phase_id')
        .eq('product_id', productId!);

      const deviceKeys = new Set(
        (deviceDocs || []).map((d: any) => {
          const pName = phaseIdToName.get(d.phase_id) || d.phase_id;
          return `${d.name.toLowerCase()}::${pName}`;
        })
      );

      // Mirror safeDocumentSyncService: two queries, same as the sync service uses
      // Query 1: docs with company_id (most template docs)
      const { data: docsByCompany } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, phase_id, document_type, status, sub_section, section_ids')
        .eq('company_id', companyId!)
        .eq('document_scope', 'company_template')
        .is('product_id', null);

      // Query 2: docs without company_id but with a known phase_id
      const allPhaseIds = Array.from(phaseIdToName.keys());
      const { data: docsByPhase } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, phase_id, document_type, status, sub_section, section_ids')
        .in('phase_id', allPhaseIds)
        .eq('document_scope', 'company_template')
        .is('product_id', null)
        .is('company_id', null);

      // Step 1: merge by row ID (prevents same row appearing twice across two queries)
      const rawMap = new Map<string, any>();
      (docsByCompany || []).forEach((d: any) => rawMap.set(d.id, d));
      (docsByPhase || []).forEach((d: any) => rawMap.set(d.id, d));

      // Step 2: dedup by name+phaseName, collect missing docs
      const seen = new Set<string>();
      const pendingDocs: Array<{ name: string; phaseName: string; documentType: string; subSection: string; updateType: 'new' | 'section' }> = [];

      // Build template lookup for section comparison
      const templateByKey = new Map<string, any>();
      for (const d of rawMap.values()) {
        const pName = phaseIdToName.get(d.phase_id) || 'unknown';
        if (!activePhaseNames.has(pName)) continue;
        const key = `${d.name.toLowerCase()}::${pName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        templateByKey.set(key, { ...d, _phaseName: pName });
        if (!deviceKeys.has(key)) {
          pendingDocs.push({ name: d.name, phaseName: pName, documentType: d.document_type || '', subSection: d.sub_section || '', updateType: 'new' });
        }
      }

      // Step 3: detect section updates on existing device docs
      // Fetch device docs with section data for comparison
      const { data: deviceDocsWithSections } = await supabase
        .from('phase_assigned_document_template')
        .select('name, phase_id, sub_section, section_ids')
        .eq('product_id', productId!);

      if (deviceDocsWithSections) {
        for (const dd of deviceDocsWithSections) {
          const pName = phaseIdToName.get(dd.phase_id) || dd.phase_id;
          if (!activePhaseNames.has(pName)) continue;
          if (pName.toLowerCase() === 'no phase') continue;
          const key = `${dd.name.toLowerCase()}::${pName}`;
          const template = templateByKey.get(key);
          if (!template) continue;

          const templateSubSection = template.sub_section || null;
          const deviceSubSection = dd.sub_section || null;
          const templateSectionIds = (template.section_ids && template.section_ids.length > 0) ? JSON.stringify(template.section_ids) : null;
          const deviceSectionIds = (dd.section_ids && dd.section_ids.length > 0) ? JSON.stringify(dd.section_ids) : null;

          if (templateSubSection !== deviceSubSection || templateSectionIds !== deviceSectionIds) {
            pendingDocs.push({
              name: dd.name,
              phaseName: pName,
              documentType: '',
              subSection: templateSubSection || '(none)',
              updateType: 'section'
            });
          }
        }
      }

      return pendingDocs;
    },
  });

  const pendingSyncCount = pendingSyncDocs.length;

  const handleSyncDocuments = async (selected?: Array<{ name: string; phaseName: string }>) => {
    if (!productId || !companyId) return;
    setIsSyncing(true);
    try {
      const result = await safeDocumentSync(productId, companyId, selected);
      if (result.created > 0 || (result.sectionUpdated && result.sectionUpdated > 0)) {
        const messages: string[] = [];
        if (result.created > 0) messages.push(`${result.created} doc${result.created === 1 ? '' : 's'} synced from company CI Documents`);
        if (result.sectionUpdated && result.sectionUpdated > 0) messages.push(`${result.sectionUpdated} sections updated`);
        toast.success(messages.join(', '));
        // Safe refresh: only invalidate caches, never trigger cleanup/instance creation
        await queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
        await queryClient.invalidateQueries({ queryKey: ['phases', productId] });
        await queryClient.invalidateQueries({ queryKey: ['documents', productId] });
        await queryClient.invalidateQueries({ queryKey: ['phase-documents'] });
        await queryClient.invalidateQueries({ queryKey: ['optimized-documents'] });
        await queryClient.invalidateQueries({ queryKey: ['pending-sync-count', productId, companyId] });
        if (onSyncRefresh) {
          await onSyncRefresh();
        }
      } else {
        toast.info('All documents are already synced');
        refetchPendingCount();
      }
      if (result.errors.length > 0) {
        toast.warning(`Completed with ${result.errors.length} errors`);
      }
    } catch (error) {
      toast.error('Failed to sync documents');
    } finally {
      setIsSyncing(false);
    }
  };

  // Use the new structured filter params hook
  const {
    // Filter State
    phaseFilter: phaseFilter2,
    statusFilter: internalStatusFilter,
    authorFilter: internalAuthorFilter,
    sectionFilter: internalSectionFilter,
    
    sortByDate,
    viewMode,
    view: activeTab,
    hasActiveFilters,

    // Table Sorting
    tableSort,
    setTableSort,

    // Actions
    setPhaseFilter,
    togglePhase,
    setStatusFilter,
    toggleStatus,
    toggleAuthor,
    toggleSection,
    setSortByDate,
    setViewMode,
    setView: setActiveTab,
    clearAllFilters: handleClearAllFilters,

    // Utility
    getActiveFilterChips,
  } = useDocumentFilterParams({
    availablePhases: availablePhases,
    availableAuthors: availableAuthors,
    onPhaseFilterChange,
    onStatusFilterChange,
    onAuthorFilterChange,
  });

  // Handlers using the hook
  const handleSortByDateChange = (newSort: SortByDateOption) => {
    setSortByDate(newSort);
  };

  const handleViewModeChange = (newMode: 'card' | 'list') => {
    if (!newMode) return;
    setViewMode(newMode);
  };

  // Use isolated document operations - removed getOrCreateDocumentInstance since it doesn't exist
  const {
    isUpdating,
    updateDocumentStatus,
    updateDocumentDeadline
  } = useIsolatedDocumentOperations(productId || '', companyId);

  // Fetch phase documents directly for accurate count (same source as AllActivePhasesTab)
  const {
    phaseDocuments: lifecyclePhaseDocuments,
    loading: phaseDocsLoading,
    activePhaseCount,
    activePhaseNames,
    productPhaseNames,
    productPhaseCount
  } = usePhaseDocuments(companyId || '', productId);

  // Calculate total phase documents count from usePhaseDocuments (same as AllActivePhasesTab)
  const phaseDocumentsCount = useMemo(() => {
    let count = 0;
    Object.values(lifecyclePhaseDocuments).forEach((documents: any[]) => {
      count += documents.length;
    });
    return count;
  }, [lifecyclePhaseDocuments]);

  // Extract available sections scoped to active phase filter
  const availableSectionsFromDocs = useMemo(() => {
    const sections = new Set<string>();
    Object.entries(lifecyclePhaseDocuments).forEach(([phaseName, documents]: [string, any[]]) => {
      if (phaseFilter2.length > 0 && !phaseFilter2.includes(phaseName)) return;
      documents.forEach((doc: any) => {
        if (doc.sub_section) {
          sections.add(doc.sub_section);
        }
      });
    });
    return Array.from(sections).sort();
  }, [lifecyclePhaseDocuments, phaseFilter2]);

  // Extract available tags from documents
  const availableTagsFromDocs = useMemo(() => {
    const tags = new Set<string>();
    Object.values(lifecyclePhaseDocuments).forEach((documents: any[]) => {
      documents.forEach((doc: any) => {
        if (doc.tags && Array.isArray(doc.tags)) {
          doc.tags.forEach((tag: string) => tags.add(tag));
        }
      });
    });
    return Array.from(tags).sort();
  }, [lifecyclePhaseDocuments]);

  // Tag filter state
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  // Ref doc tag filter state
  const [refTagFilter, setRefTagFilter] = useState<string[]>([]);

  // Fetch reference document tags
  const { data: refDocTagData } = useQuery({
    queryKey: ['ref-doc-tags', companyId],
    queryFn: async () => {
      if (!companyId) return { tagMap: {} as Record<string, string[]>, allTags: [] as string[] };
      const { data, error } = await supabase
        .from('reference_documents')
        .select('id, tags')
        .eq('company_id', companyId)
        .not('tags', 'is', null);
      if (error) return { tagMap: {} as Record<string, string[]>, allTags: [] as string[] };
      const tagMap: Record<string, string[]> = {};
      const allTagsSet = new Set<string>();
      data?.forEach((row: any) => {
        if (Array.isArray(row.tags)) {
          tagMap[row.id] = row.tags;
          row.tags.forEach((t: string) => allTagsSet.add(t));
        }
      });
      return { tagMap, allTags: Array.from(allTagsSet).sort() };
    },
    enabled: !!companyId,
    staleTime: 60000,
  });

  const availableRefTags = refDocTagData?.allTags || [];
  const refDocTagMap = refDocTagData?.tagMap || {};

  // Get available phases from actual filtered documents (only active phases)
  const filteredAvailablePhases = useMemo(() => {
    return Object.keys(lifecyclePhaseDocuments).sort((a, b) => {
      const phasePositions = new Map();
      phases.forEach(phase => {
        phasePositions.set(phase.name, phase.position || 0);
      });

      const positionA = phasePositions.get(a);
      const positionB = phasePositions.get(b);

      if (positionA !== undefined && positionB !== undefined) {
        return positionA - positionB;
      }
      if (positionA !== undefined) return -1;
      if (positionB !== undefined) return 1;

      return a.localeCompare(b);
    });
  }, [lifecyclePhaseDocuments, phases]);

  // Only show phases that actually have documents for this product
  // This prevents users from filtering by phases with 0 documents
  const combinedAvailablePhases = useMemo(() => {
    // Primary: phases from actual document data (only phases with documents)
    if (filteredAvailablePhases && filteredAvailablePhases.length > 0) {
      return filteredAvailablePhases;
    }

    // Fallback to product lifecycle phases
    if (productPhaseNames && productPhaseNames.length > 0) {
      return productPhaseNames;
    }

    // Final fallback to active company phases
    return activePhaseNames || [];
  }, [productPhaseNames, filteredAvailablePhases, activePhaseNames]);

  if (!productId || !companyId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {lang('document.productOrCompanyNotAvailable')}
      </div>
    );
  }

  // Apply status filter for phases tab
  const filteredByStatus = (documents: any[]) => {
    if (!internalStatusFilter || internalStatusFilter.length === 0) {
      return documents; // Show all when no filter or "All" is selected
    }
    return documents.filter(doc => {
      const docStatus = doc.status || 'Not Started';
      return internalStatusFilter.includes(docStatus);
    });
  };

  // Transform phases data for the phases tab using allPhaseInstances
  const enhancedPhases = Array.isArray(phases) ? phases.map(phase => {
    // Get all template-based instances for this specific phase
    const phaseDocuments = Array.isArray(allPhaseInstances) ? allPhaseInstances.filter(doc => {
      const matchesPhaseId = doc.phaseId === phase.id;
      const matchesPhase_id = doc.phase_id === phase.id;
      return matchesPhaseId || matchesPhase_id;
    }) : [];
    
    const filteredPhaseDocuments = filteredByStatus(phaseDocuments);

    return {
      ...phase,
      documents: filteredPhaseDocuments,
      allDocuments: phaseDocuments, // Keep unfiltered for progress calculation
      isCurrentPhase: phase.name === currentLifecyclePhase
    };
  }) : [];

  // If phaseFilter is provided, filter to show only that specific phase
  const displayPhases = phaseFilter 
    ? enhancedPhases.filter(phase => phase.name === phaseFilter)
    : enhancedPhases;

  const handleTabChange = (newTab: string) => {
    if (newTab === 'all-phases' || newTab === 'product-specific') {
      setActiveTab(newTab as 'all-phases' | 'product-specific');
    }
    onTabChange(newTab);
  };

  const handleSyncInstances = async () => {
    setIsSyncing(true);
    try {
      await onDocumentsRefresh();
    } finally {
      setIsSyncing(false);
    }
  };

  // Document status update
  const handleDocumentStatusUpdate = async (documentId: string, status: string) => {
    const success = await updateDocumentStatus(documentId, status);
    if (success) {
      await onDocumentsRefresh();
    }
  };

  // Deadline update
  const handleDocumentDeadlineUpdate = async (documentId: string, deadline: Date | undefined) => {
    const success = await updateDocumentDeadline(documentId, deadline);
    if (success) {
      await onDocumentsRefresh();
    }
  };

  // Use filtered available phases from actual documents (only active phases)

  const handlePhaseFilterChange = (phase: string) => {
    if (phase === '__SHOW_ALL__' || phase === '__CLEAR_ALL__') {
      setPhaseFilter([]);
    } else if (phase === '__CORE__') {
      // Toggle "Core" (No Phase) filter
      if (phaseFilter2.includes('__CORE__')) {
        setPhaseFilter(phaseFilter2.filter(p => p !== '__CORE__'));
      } else {
        setPhaseFilter([...phaseFilter2, '__CORE__']);
      }
    } else {
      togglePhase(phase);
    }
  };

  // Handle status filter change for EnhancedDocumentFilters
  const handleInternalStatusFilterChange = (status: string) => {
    if (status === '__SHOW_ALL__' || status === '__CLEAR_ALL__') {
      setStatusFilter([]);
    } else {
      toggleStatus(status);
    }
  };

  // Handle author filter change for EnhancedDocumentFilters
  const handleInternalAuthorFilterChange = (authorId: string) => {
    toggleAuthor(authorId);
  };


  // Handle section filter change for EnhancedDocumentFilters
  const handleInternalSectionFilterChange = (section: string) => {
    if (section === '__CLEAR_ALL__') {
      // handled by hook
    } else {
      toggleSection(section);
    }
  };

  // Handle tag filter change
  const handleTagFilterChange = (tag: string) => {
    if (tag === '__CLEAR_ALL__') {
      setTagFilter([]);
    } else {
      setTagFilter(prev =>
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    }
  };

  // Handle ref doc tag filter change
  const handleRefTagFilterChange = (tag: string) => {
    if (tag === '__CLEAR_ALL__') {
      setRefTagFilter([]);
    } else {
      setRefTagFilter(prev =>
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    }
  };

  const handleFilterByPhaseAndStatus = (phase: string, status: string) => {
    // Set phase filter to only the clicked phase
    setPhaseFilter([phase]);
    // Set status filter to only the clicked status
    setStatusFilter([status]);
    // Switch to all-phases tab if not already there
    if (activeTab !== "all-phases") {
      handleTabChange("all-phases");
    }
  };

  const handlePhaseNavigation = (phaseName: string) => {
    handleTabChange("all-phases");
  };

  // Calculate accurate counts for the dropdown
  const templateBasedInstancesCount = currentPhaseInstances.filter(doc =>
    doc.template_source_id && doc.document_scope === 'product_document'
  ).length;


  return (
    <div className="space-y-6">
      {/* Document view selector and filters in one clean row */}
      <div className="flex items-center gap-3">
        <EnhancedDocumentFilters
          statusFilter={internalStatusFilter}
          onStatusFilterChange={handleInternalStatusFilterChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          phaseFilter={phaseFilter2}
          onPhaseFilterChange={handlePhaseFilterChange}
          filterAvailablePhases={combinedAvailablePhases}
          authorFilter={internalAuthorFilter}
          onAuthorFilterChange={handleInternalAuthorFilterChange}
          sectionFilter={internalSectionFilter}
          onSectionFilterChange={handleInternalSectionFilterChange}
          availableAuthors={availableAuthors}
          availableSections={availableSectionsFromDocs}
          tagFilter={tagFilter}
          onTagFilterChange={handleTagFilterChange}
          availableTags={availableTagsFromDocs}
          refTagFilter={refTagFilter}
          onRefTagFilterChange={handleRefTagFilterChange}
          availableRefTags={availableRefTags}
          sortByDate={sortByDate}
          onSortByDateChange={handleSortByDateChange}
          clearAllFilters={() => {
            handleClearAllFilters();
            setTagFilter([]);
            setRefTagFilter([]);
            setHideExcluded(false);
          }}
          isVariant={isVariantDevice}
          hideExcluded={hideExcluded}
          onHideExcludedChange={setHideExcluded}
        />

        {/* View Mode Toggle and Graph Button */}
        <div className="flex items-center gap-2 ml-auto">
          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => handleViewModeChange(value as 'card' | 'list')}
            className="border rounded-md bg-background"
          >
            <ToggleGroupItem
              value="card"
              aria-label={lang('document.cardView')}
              className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label={lang('document.listView')}
              className="h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Sync from Settings Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSyncPreviewOpen(true)}
            disabled={disabled || isSyncing || !isAdmin}
            title="Sync with documents from settings"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Sync Preview Dialog */}
          <Dialog open={isSyncPreviewOpen} onOpenChange={(open) => {
            setIsSyncPreviewOpen(open);
            if (open) {
              setSelectedSyncDocs(new Set(pendingSyncDocs.map((_, i) => i)));
              setSyncSearchQuery('');
            }
          }}>
            <DialogContent className="sm:max-w-lg">
              {isVariantDevice ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Suggested Updates</DialogTitle>
                    <DialogDescription>
                      Select which updates to sync to this device.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">All documents are already synced with master</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSyncPreviewOpen(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
              <DialogHeader>
                <DialogTitle>Sync with Settings{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ''}</DialogTitle>
                <DialogDescription>
                  Do you want to sync with documents from settings? Select which documents to include.
                </DialogDescription>
              </DialogHeader>
              {/* Search bar */}
              {pendingSyncCount > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={syncSearchQuery}
                    onChange={(e) => setSyncSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
              {/* Select All / Deselect All */}
              {pendingSyncCount > 0 && <div className="flex items-center gap-2 pb-1 border-b">
                <Checkbox
                  checked={selectedSyncDocs.size === pendingSyncDocs.length && pendingSyncDocs.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedSyncDocs(new Set(pendingSyncDocs.map((_, i) => i)));
                    } else {
                      setSelectedSyncDocs(new Set());
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedSyncDocs.size === pendingSyncDocs.length ? 'Deselect All' : 'Select All'}
                </span>
                {selectedSyncDocs.size > 0 && selectedSyncDocs.size < pendingSyncDocs.length && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {selectedSyncDocs.size} of {pendingSyncDocs.length} selected
                  </span>
                )}
              </div>}
              <div className="max-h-[300px] overflow-y-auto pr-4">
                {pendingSyncCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">All documents are already synced</p>
                  </div>
                ) : (
                <div className="space-y-2">
                  {pendingSyncDocs.map((doc, idx) => ({ doc, idx })).filter(({ doc }) =>
                    !syncSearchQuery || doc.name?.toLowerCase().includes(syncSearchQuery.toLowerCase()) || doc.phaseName?.toLowerCase().includes(syncSearchQuery.toLowerCase())
                  ).map(({ doc, idx }) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                        selectedSyncDocs.has(idx) ? 'border-primary bg-primary/5' : 'opacity-60'
                      }`}
                      onClick={() => {
                        setSelectedSyncDocs(prev => {
                          const next = new Set(prev);
                          if (next.has(idx)) {
                            next.delete(idx);
                          } else {
                            next.add(idx);
                          }
                          return next;
                        });
                      }}
                    >
                      <Checkbox
                        checked={selectedSyncDocs.has(idx)}
                        onCheckedChange={(checked) => {
                          setSelectedSyncDocs(prev => {
                            const next = new Set(prev);
                            if (checked) {
                              next.add(idx);
                            } else {
                              next.delete(idx);
                            }
                            return next;
                          });
                        }}
                        className="mt-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight truncate">{doc.name}</p>
                        {doc.phaseName && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.phaseName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSyncPreviewOpen(false)}>
                  Cancel
                </Button>
                {pendingSyncCount > 0 && (
                <Button
                  onClick={() => {
                    const selected = Array.from(selectedSyncDocs).map(i => pendingSyncDocs[i]);
                    setIsSyncPreviewOpen(false);
                    handleSyncDocuments(selected);
                  }}
                  disabled={isSyncing || selectedSyncDocs.size === 0}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {selectedSyncDocs.size === pendingSyncDocs.length
                    ? `Sync All (${pendingSyncCount})`
                    : `Sync Selected (${selectedSyncDocs.size})`}
                </Button>
                )}
              </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Graph Button */}
          <Button
            variant="outline"
            onClick={() => setIsGraphModalOpen(true)}
            className="flex items-center gap-2 bg-background"
            disabled={disabled}
          >
            <BarChart3 className="h-4 w-4" />
            {lang('document.graph')}
          </Button>
        </div>
      </div>

      {/* All Documents - Phase CIs and Core CIs shown together */}
      <AllActivePhasesTab
        phases={displayPhases}
        currentPhase={currentLifecyclePhase}
        onPhaseClick={handlePhaseNavigation}
        statusFilter={internalStatusFilter}
        companyId={companyId}
        productId={productId}
        onDocumentUpdated={onDocumentUpdated}
        phaseFilter={phaseFilter2}
        searchQuery={searchQuery}
        handleRefreshData={onDocumentsRefresh}
        disabled={disabled}
        authorFilter={internalAuthorFilter}
        sectionFilter={internalSectionFilter}
        tagFilter={tagFilter}
        refTagFilter={refTagFilter}
        refDocTagMap={refDocTagMap}
        sortByDate={sortByDate}
        onAddDocumentClick={onAddDocumentClick}
        onBulkUploadClick={onBulkUploadClick}
        viewMode={viewMode}
        tableSort={tableSort}
        onTableSortChange={setTableSort}
        isSidebarOpen={isSidebarOpen}
        onSidebarOpenChange={onSidebarOpenChange}
        selectedDocsForSummary={selectedDocsForSummary}
        onToggleDocForSummary={onToggleDocForSummary}
        hideExcluded={hideExcluded}
        refreshTrigger={refreshTrigger}
        newlyCreatedDoc={newlyCreatedDoc}
      />

      
      {/* Document Graph Modal */}
      <DocumentGraphModal
        open={isGraphModalOpen}
        onOpenChange={setIsGraphModalOpen}
        companyId={companyId}
        productId={productId}
        onFilterByPhaseAndStatus={handleFilterByPhaseAndStatus}
      />
    </div>
  );
}
