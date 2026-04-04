import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, Info, Upload, Settings, Download, FileDown, Filter, Search, RefreshCw, X, Tag, ChevronDown, ChevronRight, Users, Edit, Trash, Workflow, ArrowRight, GripVertical, RotateCcw, Layers } from "lucide-react";
import { toast } from "sonner";
import { useConsolidatedPhaseData } from "./phases/useConsolidatedPhaseData";
import { ActivePhasesCard } from "./phases/ActivePhasesCard";
import { AvailablePhasesCard } from "./phases/AvailablePhasesCard";
import { PhaseFormDialog } from "./phases/PhaseFormDialog";
import { PhaseEditFormDialog } from "./phases/PhaseEditFormDialog";
import { CompanyPhaseIndicator } from "./phases/CompanyPhaseIndicator";
import { CompanyPhaseIsolationService } from "@/services/companyPhaseIsolationService";
import { supabase } from "@/integrations/supabase/client";
import { CompanyInitializationService } from "@/services/companyInitializationService";
import { usePhaseCategories } from "@/hooks/usePhaseCategories";
import { useComplianceSections } from "@/hooks/useComplianceSections";
import { complianceSectionService } from "@/services/complianceSectionService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentTemplateImportDialog } from "./DocumentTemplateImportDialog";
import { ensureUserCompanyAccess } from "./document-control/utils/userAccessSetup";
import { Phase } from "./phases/ConsolidatedPhaseDataService";
import { PhaseImportDialog } from "./PhaseImportDailog";
import Papa from "papaparse";
// TanStack Table imports
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { PhaseManagementMain } from "./phases/PhaseManagementMain";
import { ConsolidatedPhaseDataService } from "./phases/ConsolidatedPhaseDataService";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { calculateTotalProjectDuration, calculateDaysFromPercentage } from "@/utils/phaseCalculations";
import { ConsolidatedPhaseManagement } from "./phases/ConsolidatedPhaseManagement";

// AG Grid modules registration removed - TanStack Table will be used instead
// ModuleRegistry.registerModules([AllCommunityModule]);

// Add custom CSS for line-clamp utility
const customStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .ag-theme-alpine {
    --ag-header-background-color: #f8fafc;
    --ag-header-foreground-color: #374151;
    --ag-row-hover-color: #f8fafc;
    --ag-selected-row-background-color: #eff6ff;
    --ag-font-size: 14px;
    --ag-font-family: Inter, system-ui, sans-serif;
    --ag-border-color: #e5e7eb;
    --ag-row-border-color: #f1f5f9;
    --ag-cell-horizontal-border: solid #f1f5f9;
    --ag-header-column-separator-color: #e5e7eb;
    --ag-header-column-separator-height: 60%;
    --ag-header-height: 56px;
    --ag-row-height: 64px;
    --ag-header-column-resize-handle-color: #3b82f6;
    --ag-header-column-resize-handle-height: 30%;
  }
  
  .ag-theme-alpine .ag-header {
    border-bottom: 2px solid #e5e7eb;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  }
  
  .ag-theme-alpine .ag-header-cell {
    font-weight: 600;
    color: #374151;
    border-right: 1px solid #e5e7eb;
  }
  
  .ag-theme-alpine .ag-row {
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.15s ease-in-out;
  }
  
  .ag-theme-alpine .ag-row:hover {
    background-color: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .ag-theme-alpine .ag-row.phase-row:hover {
    background-color: #eff6ff !important;
    border-left: 3px solid #3b82f6;
    cursor: pointer;
  }
  
  .ag-theme-alpine .ag-row.phase-row:hover::after {
    /* content: "Double-click to edit"; */
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(59, 130, 246, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    pointer-events: none;
    z-index: 10;
  }
  
  .ag-theme-alpine .ag-cell {
    border-right: 1px solid #f1f5f9;
    padding: 12px 16px;
  }
  
  .ag-theme-alpine .ag-cell:last-child {
    border-right: none;
  }
`;
interface LifecyclePhasesSettingsProps {
  companyId: string;
}
interface HierarchicalRow {
  id: string;
  type: 'category' | 'subSection' | 'phase' | 'phaseSubInfo';
  categoryName: string;
  subSectionName?: string;
  subSectionNames?: string[];
  subSectionId?: string;
  phaseName?: string;
  phaseDescription?: string;
  position?: number;
  status?: string;
  phaseType?: string;
  phaseCount?: number;
  subSectionCount?: number;
  activeCount?: number;
  availableCount?: number;
  parentId?: string;
  level: number;
  expanded?: boolean;
  phaseId?: string;
  categoryId?: string;
  isSystemCategory?: string;
  typicalStartDay?: number;
  typicalDurationDays?: number;
  isContinuousProcess?: boolean;
  startPercentage?: number;
  endPercentage?: number;
}
export function LifecyclePhasesSettings({
  companyId
}: LifecyclePhasesSettingsProps) {
  const { lang } = useTranslation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplateImportDialog, setShowTemplateImportDialog] = useState(false);
  const [showPhaseImportDialog, setShowPhaseImportDialog] = useState(false);
  const [showAgGridDialog, setShowAgGridDialog] = useState(false);
  const [selectedPhaseForEdit, setSelectedPhaseForEdit] = useState<Phase | null>(null);
  const [companyName, setCompanyName] = useState<string>("Your Company");
  const [isSettingUpAccess, setIsSettingUpAccess] = useState(false);
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [isSyncingPhases, setIsSyncingPhases] = useState(false);
  const [showSyncConfirmDialog, setShowSyncConfirmDialog] = useState(false);
  const [phaseListRefreshKey, setPhaseListRefreshKey] = useState(0);

  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [gridApi, setGridApi] = React.useState<any>(null);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set()); // Empty = all collapsed by default
  const [dialogKey, setDialogKey] = React.useState<number>(0); // Add key to force re-render

  // Category edit/delete dialog state
  const [editCategoryDialog, setEditCategoryDialog] = useState<{ open: boolean; categoryId: string; categoryName: string }>({ open: false, categoryId: '', categoryName: '' });
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<{ open: boolean; categoryId: string; categoryName: string }>({ open: false, categoryId: '', categoryName: '' });
  // Phase delete dialog state
  const [deletePhaseDialog, setDeletePhaseDialog] = useState<{ open: boolean; phaseId: string; phaseName: string }>({ open: false, phaseId: '', phaseName: '' });
  // Removed activeTab state - unified interface

  // 
  const [activePhases, setActivePhases] = useState<Phase[]>([]);
  const {
    phases,
    availablePhases,
    categories,
    loading,
    loadingError,
    addPhase,
    removePhase,
    movePhase,
    reorderPhases,
    editPhase,
    refreshData,
    addPhaseAggrid,
    removePhaseAggrid,
    editPhaseAggrid
  } = useConsolidatedPhaseData(companyId);
  const {
    categories: customCategories,
    refreshCategories,
    createCategory,
    updateCategory,
    deleteCategory
  } = usePhaseCategories(companyId, true);

  const {
    sections: subSections,
    refetch: refreshSubSections,
    createSection: createComplianceSection,
    deleteSection: deleteComplianceSection,
  } = useComplianceSections(companyId);

  // Sub-section dialog state
  const [createSubSectionDialog, setCreateSubSectionDialog] = useState<{ open: boolean; categoryId: string; categoryName: string }>({ open: false, categoryId: '', categoryName: '' });
  const [createSubSectionName, setCreateSubSectionName] = useState('');
  const [editSubSectionDialog, setEditSubSectionDialog] = useState<{ open: boolean; subSectionId: string; subSectionName: string }>({ open: false, subSectionId: '', subSectionName: '' });
  const [editSubSectionName, setEditSubSectionName] = useState('');
  const [deleteSubSectionDialog, setDeleteSubSectionDialog] = useState<{ open: boolean; subSectionId: string; subSectionName: string }>({ open: false, subSectionId: '', subSectionName: '' });

  // Track expanded sub-sections separately
  const [expandedSubSections, setExpandedSubSections] = React.useState<Set<string>>(new Set());
  const [expandedPhaseSubInfo, setExpandedPhaseSubInfo] = React.useState<Set<string>>(new Set());

  const togglePhaseSubInfo = React.useCallback((phaseId: string) => {
    setExpandedPhaseSubInfo(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  // Categories remain collapsed by default - removed auto-expansion

  // Categories remain collapsed by default - removed auto-expansion on load

  // Categories remain collapsed by default - removed forced expansion

  // Categories remain collapsed by default - removed dialog key expansion

  const handleCreateCustomPhase = async (data: {
    name: string;
    description?: string;
    categoryId?: string;
    subSectionId?: string;
    sectionIds?: string[];
    is_continuous_process?: boolean;
  }) => {
    try {
      const result = await CompanyPhaseIsolationService.createCustomPhase(
        companyId,
        data.name,
        data.description,
        data.categoryId === "no-category" ? undefined : data.categoryId,
        data.is_continuous_process,
        data.subSectionId === "no-subsection" ? undefined : data.subSectionId
      );
      if (result.success) {
        // Link sections to the newly created phase via phase_id
        if (result.phaseId && data.sectionIds && data.sectionIds.length > 0) {
          for (const sectionId of data.sectionIds) {
            await (supabase as any).from('compliance_document_sections').update({ phase_id: result.phaseId }).eq('id', sectionId);
          }
        }
        toast.success(lang('lifecyclePhases.toast.phaseCreated').replace('{{name}}', data.name));
        // Trigger child component refresh and parent data refresh in parallel
        setPhaseListRefreshKey(prev => prev + 1);
        Promise.all([refreshData(true), refreshSubSections()]);
        return true;
      } else {
        toast.error(result.error || lang('lifecyclePhases.toast.failedToCreatePhase'));
        return false;
      }
    } catch (error) {
      console.error('[LifecyclePhasesSettings] Error in handleCreateCustomPhase:', error);
      toast.error(lang('lifecyclePhases.toast.failedToCreatePhase'));
      return false;
    }
  };

  // Function to refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([refreshData(), refreshCategories(), refreshSubSections()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Handle dialog open events - no refresh needed, data is already loaded
  const handleCreateDialogOpen = (open: boolean) => {
    setShowCreateDialog(open);
  };
  const handleEditDialogOpen = (open: boolean) => {
    setShowEditDialog(open);
    if (!open) {
      setSelectedPhaseForEdit(null);
    }
  };
  const handleTemplateImportDialogOpen = (open: boolean) => {
    setShowTemplateImportDialog(open);
  };
  const handlePhaseImportDialogOpen = (open: boolean) => {
    setShowPhaseImportDialog(open);
  };
  const handleAgGridDialogOpen = async (open: boolean) => {
    setShowAgGridDialog(open);
    if (open) {
      // Increment dialog key to force re-render
      setDialogKey(prev => prev + 1);
      
      await refreshAllData();
      
      // Categories remain collapsed after refresh
    }
  };
  const handleEditPhase = (phase: Phase) => {
    // Allow editing of all phases including system phases
    setSelectedPhaseForEdit(phase);
    setShowEditDialog(true);
  };
  const handleUpdatePhase = async (phaseId: string, updates: {
    name?: string;
    description?: string;
    categoryId?: string;
    subSectionId?: string;
    sectionIds?: string[];
    typical_start_day?: number | null;
    typical_duration_days?: number | null;
    start_percentage?: number;
    end_percentage?: number;
    is_continuous_process?: boolean;
    start_phase_id?: string | null;
    end_phase_id?: string | null;
    start_position?: string | null;
    end_position?: string | null;
    duration_days?: number;
  }, closeDialog: boolean = true) => {
    setIsEditingPhase(true);
    try {
      const dbUpdates = { ...updates };
      delete (dbUpdates as any).subSectionId;
      // Update sections: clear old phase_id, set new phase_id
      if (updates.sectionIds) {
        // First, clear phase_id from any sections previously linked to this phase
        await (supabase as any).from('compliance_document_sections').update({ phase_id: null }).eq('phase_id', phaseId);
        // Then, set phase_id on the selected sections
        for (const sectionId of updates.sectionIds) {
          await (supabase as any).from('compliance_document_sections').update({ phase_id: phaseId }).eq('id', sectionId);
        }
      }
      delete (dbUpdates as any).sectionIds;

      const success = await editPhaseAggrid(phaseId, dbUpdates);
      if (success) {
        // Close dialog immediately — editPhaseAggrid already did optimistic update + DB save
        if (closeDialog) {
          setShowEditDialog(false);
          setSelectedPhaseForEdit(null);
        }
        // Trigger background refresh for child component and parent data
        setPhaseListRefreshKey(prev => prev + 1);
        Promise.all([refreshData(true), refreshSubSections()]);
      }
      return success;
    } finally {
      setIsEditingPhase(false);
    }
  };

  const handleDeletePhase = (phaseId: string, phaseName: string) => {
    setDeletePhaseDialog({ open: true, phaseId, phaseName });
  };

  const handleDeletePhaseConfirm = async () => {
    const { phaseId, phaseName } = deletePhaseDialog;

    try {
      // Persist delete to database
      await ConsolidatedPhaseDataService.deletePhase(phaseId);
      // Close dialog immediately
      setDeletePhaseDialog({ open: false, phaseId: '', phaseName: '' });

      toast.success(lang('lifecyclePhases.toast.phaseDeleted').replace('{{name}}', phaseName));

      // Trigger refresh in ConsolidatedPhaseManagement component (main page)
      setPhaseListRefreshKey(prev => prev + 1);

      // Silent refresh the dialog data in background
      refreshData(true);
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error(lang('lifecyclePhases.toast.failedToDeletePhase'));
      setDeletePhaseDialog({ open: false, phaseId: '', phaseName: '' });
    }
  };

  const handleEditCategory = (categoryId: string, categoryName: string) => {
    setEditCategoryName(categoryName);
    setEditCategoryDialog({ open: true, categoryId, categoryName });
  };

  const handleEditCategoryConfirm = async () => {
    const { categoryId, categoryName } = editCategoryDialog;
    const newName = editCategoryName.trim();

    if (!newName || newName === categoryName) {
      setEditCategoryDialog({ open: false, categoryId: '', categoryName: '' });
      return;
    }

    try {
      const success = await updateCategory(categoryId, { name: newName });
      // Close dialog immediately
      setEditCategoryDialog({ open: false, categoryId: '', categoryName: '' });

      if (success) {
        toast.success(lang('lifecyclePhases.toast.categoryRenamed').replace('{{name}}', newName));
        // Refresh in background + trigger child component refresh
        setPhaseListRefreshKey(prev => prev + 1);
        Promise.all([refreshCategories(), refreshData(true)]);
      } else {
        toast.error(lang('lifecyclePhases.toast.failedToUpdateCategory'));
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(lang('lifecyclePhases.toast.failedToUpdateCategory'));
      setEditCategoryDialog({ open: false, categoryId: '', categoryName: '' });
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    setDeleteCategoryDialog({ open: true, categoryId, categoryName });
  };

  const handleDeleteCategoryConfirm = async () => {
    const { categoryId, categoryName } = deleteCategoryDialog;

    try {
      const success = await deleteCategory(categoryId);
      // Close dialog immediately
      setDeleteCategoryDialog({ open: false, categoryId: '', categoryName: '' });

      if (success) {
        toast.success(lang('lifecyclePhases.toast.categoryDeleted').replace('{{name}}', categoryName));
        // Refresh in background + trigger child component refresh
        setPhaseListRefreshKey(prev => prev + 1);
        Promise.all([refreshCategories(), refreshData(true)]);
      } else {
        toast.error(lang('lifecyclePhases.toast.failedToDeleteCategory'));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(lang('lifecyclePhases.toast.failedToDeleteCategory'));
      setDeleteCategoryDialog({ open: false, categoryId: '', categoryName: '' });
    }
  };

  // Sub-section handlers
  const handleCreateSubSection = (categoryId: string, categoryName: string) => {
    setCreateSubSectionName('');
    setCreateSubSectionDialog({ open: true, categoryId, categoryName });
  };

  const handleCreateSubSectionConfirm = async () => {
    const name = createSubSectionName.trim();

    if (!name) {
      setCreateSubSectionDialog({ open: false, categoryId: '', categoryName: '' });
      return;
    }

    try {
      const newSection = await createComplianceSection(name);
      // Close dialog immediately
      setCreateSubSectionDialog({ open: false, categoryId: '', categoryName: '' });

      if (newSection) {
        toast.success(`Section "${name}" created successfully`);
        // Refresh in background + trigger child component refresh
        setPhaseListRefreshKey(prev => prev + 1);
        Promise.all([refreshSubSections(), refreshData(true)]);
      } else {
        toast.error('Failed to create section');
      }
    } catch (error) {
      console.error('Error creating sub-section:', error);
      toast.error('Failed to create section');
      setCreateSubSectionDialog({ open: false, categoryId: '', categoryName: '' });
    }
  };

  const handleEditSubSection = (subSectionId: string, subSectionName: string) => {
    setEditSubSectionName(subSectionName);
    setEditSubSectionDialog({ open: true, subSectionId, subSectionName });
  };

  const handleEditSubSectionConfirm = async () => {
    const { subSectionId, subSectionName } = editSubSectionDialog;
    const newName = editSubSectionName.trim();

    if (!newName || newName === subSectionName) {
      setEditSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' });
      return;
    }

    try {
      const success = await complianceSectionService.updateSection(subSectionId, { name: newName });
      // Close dialog immediately
      setEditSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' });

      if (success) {
        toast.success(`Section renamed to "${newName}"`);
        // Refresh in background + trigger child component refresh
        setPhaseListRefreshKey(prev => prev + 1);
        Promise.all([refreshSubSections(), refreshData(true)]);
      } else {
        toast.error('Failed to update section');
      }
    } catch (error) {
      console.error('Error updating sub-section:', error);
      toast.error('Failed to update section');
      setEditSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' });
    }
  };

  const handleDeleteSubSection = (subSectionId: string, subSectionName: string) => {
    setDeleteSubSectionDialog({ open: true, subSectionId, subSectionName });
  };

  const handleDeleteSubSectionConfirm = async () => {
    const { subSectionId, subSectionName } = deleteSubSectionDialog;

    try {
      const success = await deleteComplianceSection(subSectionId);
      // Close dialog immediately
      setDeleteSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' });

      if (success) {
        toast.success(`Section "${subSectionName}" deleted`);
        // Refresh in background + trigger child component refresh
        setPhaseListRefreshKey(prev => prev + 1);
        Promise.all([refreshSubSections(), refreshData(true)]);
      } else {
        toast.error('Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting sub-section:', error);
      toast.error('Failed to delete section');
      setDeleteSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' });
    }
  };

  // Toggle sub-section expansion
  const toggleSubSectionExpansion = (subSectionId: string) => {
    setExpandedSubSections(prevState => {
      const newExpanded = new Set(prevState);
      if (newExpanded.has(subSectionId)) {
        newExpanded.delete(subSectionId);
      } else {
        newExpanded.add(subSectionId);
      }
      return newExpanded;
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    if (fromIndex !== toIndex) {
      reorderPhases(fromIndex, toIndex);
    }
  };
  const handleAddExistingPhase = async (phaseId: string) => {
    // Validate phase ownership before adding
    const validation = await CompanyPhaseIsolationService.validatePhaseOwnership(phaseId, companyId);
    if (!validation.isValid) {
      toast.error('Cannot add phase: ' + validation.errors.join(', '));
      return;
    }
    await addPhase(phaseId);
  };

  const handleAddAllPhases = async (phaseIds: string[]) => {
    if (phaseIds.length === 0) return;

    // Show confirmation dialog
    if (!window.confirm(lang('lifecyclePhases.confirm.addAllPhases').replace('{{count}}', String(phaseIds.length)))) {
      return;
    }

    // Validate all phase ownerships in parallel
    const validationResults = await Promise.all(
      phaseIds.map(phaseId => CompanyPhaseIsolationService.validatePhaseOwnership(phaseId, companyId))
    );
    const validPhaseIds = phaseIds.filter((_, idx) => validationResults[idx].isValid);
    const invalidResults = validationResults.filter(v => !v.isValid);

    if (validPhaseIds.length === 0) {
      toast.error('No valid phases to add.');
      return;
    }

    try {
      // Add all valid phases at once
      await ConsolidatedPhaseDataService.addMultiplePhasesToActive(companyId, validPhaseIds);
      if (invalidResults.length === 0) {
        toast.success(lang('lifecyclePhases.toast.phasesAdded').replace('{{count}}', String(validPhaseIds.length)));
        await refreshData();
      } else {
        toast.success(lang('lifecyclePhases.toast.phasesAddedPartial').replace('{{added}}', String(validPhaseIds.length)).replace('{{failed}}', String(invalidResults.length)));
      }
    } catch (error) {
      console.error('Error adding phases:', error);
      toast.error(lang('lifecyclePhases.toast.failedToAddPhases'));
    }
  };
  const handleAddExistingPhaseAgGrid = async (phaseId: string) => {
    // Validate phase ownership before adding
    const validation = await CompanyPhaseIsolationService.validatePhaseOwnership(phaseId, companyId);
    if (!validation.isValid) {
      toast.error('Cannot add phase: ' + validation.errors.join(', '));
      return;
    }
    await addPhaseAggrid(phaseId);
    // Trigger refresh in ConsolidatedPhaseManagement component
    setPhaseListRefreshKey(prev => prev + 1);
  };

  // Wrapper for removing phase that also triggers parent refresh
  const handleRemovePhaseAgGrid = async (phaseId: string, phaseName: string) => {
    await removePhaseAggrid(phaseId, phaseName);
    // Trigger refresh in ConsolidatedPhaseManagement component
    setPhaseListRefreshKey(prev => prev + 1);
  };
  const handleSetupCompanyAccess = async () => {
    setIsSettingUpAccess(true);
    try {
      const success = await ensureUserCompanyAccess(companyName);
      if (success) {
        toast.success(lang('lifecyclePhases.toast.companyAccessSetup'));
      }
    } catch (error) {
      console.error('Error setting up company access:', error);
      toast.error(lang('lifecyclePhases.toast.failedToSetupAccess'));
    } finally {
      setIsSettingUpAccess(false);
    }
  };

  // Sync default lifecycle phases from the standard template
  const handleSyncDefaultPhases = () => {
    if (!companyId) {
      toast.error(lang('lifecyclePhases.toast.companyIdRequired'));
      return;
    }
    setShowSyncConfirmDialog(true);
  };

  // Confirm and execute the sync operation
  const confirmSyncDefaultPhases = async () => {
    setShowSyncConfirmDialog(false);
    setIsSyncingPhases(true);
    try {
      const result = await CompanyInitializationService.syncStandardPhasesOnly(companyId, companyName);

      if (result.success) {
        // Show appropriate message based on what was done
        if (result.message.includes('Updated category')) {
          toast.success(result.message);
        } else if (result.phasesCreated && result.phasesCreated > 0) {
          toast.success(result.message || lang('lifecyclePhases.toast.phasesSynced').replace('{{count}}', String(result.phasesCreated)));
        } else {
          toast.info(result.message || lang('lifecyclePhases.toast.phasesAlreadyConfigured'));
        }
        // Refresh the data to show updated phases
        await refreshAllData();
        // Trigger refresh in ConsolidatedPhaseManagement component
        setPhaseListRefreshKey(prev => prev + 1);
      } else {
        toast.error(result.error || lang('lifecyclePhases.toast.failedToSyncPhases'));
      }
    } catch (error) {
      console.error('[LifecyclePhasesSettings] Error syncing default phases:', error);
      toast.error(lang('lifecyclePhases.toast.failedToSyncPhases'));
    } finally {
      setIsSyncingPhases(false);
    }
  };

  // Get company name from the first phase
  React.useEffect(() => {
    if (phases.length > 0) {
      // Extract company name from URL or context
      const urlParams = new URLSearchParams(window.location.search);
      const nameFromUrl = decodeURIComponent(window.location.pathname.split('/company/')[1]?.split('/')[0] || '');
      setCompanyName(nameFromUrl || 'Your Company');
    }
  }, [phases]);
  const uniqueCategories = React.useMemo(() => {
    const categorySet = new Set<string>();
    if (categories && Array.isArray(categories)) {
      categories.forEach(cat => {
        if (cat.name) categorySet.add(cat.name);
      });
    }
    return Array.from(categorySet).sort();
  }, [categories]);

  // Create hierarchical data structure with 3 levels: Category → Sub-section → Phase
  const hierarchicalData = React.useMemo(() => {
    const result: HierarchicalRow[] = [];

    // Filter out "No Phase" system entry from both active and available phases
    const filteredPhases = (phases || []).filter(phase => phase.name !== 'No Phase');
    const filteredAvailablePhases = (availablePhases || []).filter(phase => phase.name !== 'No Phase');

    // Combine all phases with their status
    const allPhasesWithStatus = [
      ...filteredPhases.map(phase => ({ ...phase, status: 'Active' as const })),
      ...filteredAvailablePhases.map(phase => ({ ...phase, status: 'Available' as const, is_continuous_process: phase.is_continuous_process || false }))
    ];

    // Process categories
    if (categories && Array.isArray(categories)) {
      categories.forEach(category => {
        // Get all phases for this category
        const categoryPhases = allPhasesWithStatus.filter(p => p.category_id === category.id);

        // Get all sections that belong to phases in this category (via phase_id)
        const categoryPhaseIds = new Set(categoryPhases.map(p => p.id));
        const categorySubSections = subSections.filter(sub => (sub as any).phase_id && categoryPhaseIds.has((sub as any).phase_id));

        // Phases without any section
        const phasesWithSections = new Set(categorySubSections.map(s => (s as any).phase_id));
        const phasesWithoutSubSection = categoryPhases.filter(p => !phasesWithSections.has(p.id));

        // Only include categories that have phases or sub-sections
        if (categoryPhases.length > 0 || categorySubSections.length > 0) {
          const activeCount = categoryPhases.filter(p => p.status === 'Active').length;
          const availableCount = categoryPhases.filter(p => p.status === 'Available').length;

          const categoryRow: HierarchicalRow = {
            id: `category_${category.id}`,
            type: 'category',
            categoryName: category.name || 'Unknown Category',
            categoryId: category.id,
            phaseCount: categoryPhases.length,
            subSectionCount: categorySubSections.length,
            activeCount,
            availableCount,
            level: 0,
            expanded: expandedCategories.has(category.id)
          };
          result.push(categoryRow);

          // If category is expanded, show phases with their sections
          if (expandedCategories.has(category.id)) {
            // Group sections by phase_id so each phase shows all its sections
            const sectionsByPhase = new Map<string, typeof categorySubSections>();
            categorySubSections.forEach(section => {
              const phaseId = (section as any).phase_id;
              if (!phaseId) return;
              if (!sectionsByPhase.has(phaseId)) sectionsByPhase.set(phaseId, []);
              sectionsByPhase.get(phaseId)!.push(section);
            });

            // Phases WITH sections
            const phasesWithSectionsList = categoryPhases.filter(p => sectionsByPhase.has(p.id));
            phasesWithSectionsList.sort((a, b) => (a.position || 0) - (b.position || 0)).forEach(phase => {
              const isSystemPhase = category.is_system_category === true;
              const phaseSections = sectionsByPhase.get(phase.id) || [];
              const sectionNames = phaseSections.map(s => s.name).sort();
              const phaseRow: HierarchicalRow = {
                id: `phase_${phase.id}`,
                type: 'phase',
                categoryName: category.name || 'Unknown Category',
                categoryId: category.id,
                subSectionName: sectionNames.join(', '),
                subSectionNames: sectionNames,
                subSectionId: phaseSections[0]?.id,
                phaseName: phase.name || 'Unknown Phase',
                phaseDescription: phase.description || 'No description',
                status: phase.status,
                phaseType: isSystemPhase ? "System Phase" : "Custom Phase",
                parentId: `category_${category.id}`,
                level: 1,
                phaseId: phase.id,
                typicalStartDay: phase.typical_start_day,
                typicalDurationDays: phase.typical_duration_days,
                isContinuousProcess: phase.is_continuous_process,
                startPercentage: phase.start_percentage,
                endPercentage: phase.end_percentage,
              };
              result.push(phaseRow);

              // If phase sub-info is expanded, add a sub-section info row
              if (expandedPhaseSubInfo.has(phase.id)) {
                const subInfoRow: HierarchicalRow = {
                  id: `phasesubinfo_${phase.id}`,
                  type: 'phaseSubInfo',
                  categoryName: category.name || 'Unknown Category',
                  categoryId: category.id,
                  subSectionName: sectionNames.join(', '),
                  subSectionNames: sectionNames,
                  subSectionId: phaseSections[0]?.id,
                  parentId: `phase_${phase.id}`,
                  level: 2,
                };
                result.push(subInfoRow);
              }
            });

            // Then, add phases without any section directly under category (level 1)
            phasesWithoutSubSection.sort((a, b) => (a.position || 0) - (b.position || 0)).forEach(phase => {
              const isSystemPhase = category.is_system_category === true;
              const phaseRow: HierarchicalRow = {
                id: `phase_${phase.id}`,
                type: 'phase',
                categoryName: category.name || 'Unknown Category',
                categoryId: category.id,
                phaseName: phase.name || 'Unknown Phase',
                phaseDescription: phase.description || 'No description',
                status: phase.status,
                phaseType: isSystemPhase ? "System Phase" : "Custom Phase",
                parentId: `category_${category.id}`,
                level: 1,
                phaseId: phase.id,
                typicalStartDay: phase.typical_start_day,
                typicalDurationDays: phase.typical_duration_days,
                isContinuousProcess: phase.is_continuous_process,
                startPercentage: phase.start_percentage,
                endPercentage: phase.end_percentage,
              };
              result.push(phaseRow);
            });
          }
        }
      });
    }

    // Handle uncategorized phases (phases with category_id = null)
    const uncategorizedPhases = allPhasesWithStatus.filter(p => p.category_id === null);

    // Add "No category" section if there are uncategorized phases
    if (uncategorizedPhases.length > 0) {
      const activeCount = uncategorizedPhases.filter(p => p.status === 'Active').length;
      const availableCount = uncategorizedPhases.filter(p => p.status === 'Available').length;
      const noCategoryRow: HierarchicalRow = {
        id: 'category_no_category',
        type: 'category',
        categoryName: 'No category',
        phaseCount: uncategorizedPhases.length,
        subSectionCount: 0,
        activeCount,
        availableCount,
        level: 0,
        expanded: expandedCategories.has('no_category'),
        isSystemCategory: 'false'
      };
      result.push(noCategoryRow);

      // Add uncategorized phase rows if "No category" is expanded
      if (expandedCategories.has('no_category')) {
        uncategorizedPhases.sort((a, b) => (a.position || 0) - (b.position || 0)).forEach(phase => {
          const phaseRow: HierarchicalRow = {
            id: `phase_${phase.id}`,
            type: 'phase',
            categoryName: 'No category',
            phaseName: phase.name || 'Unknown Phase',
            phaseDescription: phase.description || 'No description',
            status: phase.status,
            phaseType: "Custom Phase",
            parentId: 'category_no_category',
            level: 1,
            phaseId: phase.id,
            typicalStartDay: phase.typical_start_day,
            typicalDurationDays: phase.typical_duration_days,
            isContinuousProcess: phase.is_continuous_process,
            startPercentage: phase.start_percentage,
            endPercentage: phase.end_percentage,
          };
          result.push(phaseRow);
        });
      }
    }

    // Apply search filter if present
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      return result.filter(row => {
        if (row.type === 'category') {
          return row.categoryName.toLowerCase().includes(searchLower);
        } else if (row.type === 'subSection') {
          return row.subSectionName?.toLowerCase().includes(searchLower) || row.categoryName.toLowerCase().includes(searchLower);
        } else {
          return row.phaseName?.toLowerCase().includes(searchLower) || row.phaseDescription?.toLowerCase().includes(searchLower) || row.categoryName.toLowerCase().includes(searchLower) || row.subSectionName?.toLowerCase().includes(searchLower);
        }
      });
    }

    return result;
  }, [phases, availablePhases, categories, subSections, expandedCategories, expandedSubSections, expandedPhaseSubInfo, searchTerm]);

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    // Handle "No category" section
    const actualCategoryId = categoryId === 'category_no_category' ? 'no_category' : categoryId;
    
    // Use callback to ensure immediate state update
    setExpandedCategories(prevState => {
      const newExpanded = new Set(prevState);
      if (newExpanded.has(actualCategoryId)) {
        newExpanded.delete(actualCategoryId);
      } else {
        newExpanded.add(actualCategoryId);
      }
      
      return newExpanded;
    });
  };
  const onDragStarted = (event: any) => {
    const row = (event as any).node?.data as HierarchicalRow;
    if (row?.type === 'phase') {
      // Update cursor during drag
      document.body.style.cursor = 'grabbing';
    } else if (row?.type === 'category') {
      // Prevent the drag from starting
      (event as any).preventDefault();
    }
  };
  const onDragStopped = (event: any) => {
    // Reset cursor
    document.body.style.cursor = 'default';
  };
  const onRowDragEnd = (event: any) => {
    const draggedRow = event.node?.data as HierarchicalRow;
    const overRow = event.overNode?.data as HierarchicalRow;

    // Prevent dragging of category rows
    if (!draggedRow || draggedRow.type !== 'phase') {
      return;
    }

    // Get all phase rows (excluding category rows)
    const phaseRows = hierarchicalData.filter(row => row.type === 'phase');

    // Find current positions
    const currentIndex = phaseRows.findIndex(row => row.id === draggedRow.id);
    let newIndex = currentIndex;
    if (overRow) {
      if (overRow.type === 'phase') {
        // Dropped on another phase
        newIndex = phaseRows.findIndex(row => row.id === overRow.id);
      } else if (overRow.type === 'category') {
        // Dropped on a category - find the last phase in that category
        const categoryPhases = phaseRows.filter(row => row.categoryName === overRow.categoryName);
        if (categoryPhases.length > 0) {
          const lastPhaseInCategory = categoryPhases[categoryPhases.length - 1];
          newIndex = phaseRows.findIndex(row => row.id === lastPhaseInCategory.id);
        }
      }
    } else {
      // Dropped at the end
      newIndex = phaseRows.length - 1;
    }

    // Only reorder if position actually changed
    if (currentIndex !== newIndex && currentIndex !== -1 && newIndex !== -1) {
      // Call your existing reorderPhases function
      reorderPhases(currentIndex, newIndex);
      toast.success(`Moved "${draggedRow.phaseName}" to new position`);
    }
  };

  // Handle double-click on phase rows to edit
  const onRowDoubleClicked = (event: any) => {
    const row = event.data as HierarchicalRow;
    if (row.type === 'phase' && row.phaseId && event.column) {
      // Start editing the double-clicked cell inline
      event.api.startEditingCell({
        rowIndex: event.rowIndex,
        colKey: event.column.getColId()
      });
    }
  };

  // Handle cell editing stopped
  const onCellEditingStopped = async (event: any) => {
    const row = event.data as HierarchicalRow;

    // Check if the value actually changed
    if (event.oldValue === event.newValue) {
      return;
    }

    // Find the phase object from the original data
    const allPhases = [...(phases || []), ...(availablePhases || [])];
    const phaseToEdit = allPhases.find(phase => phase.id === row.phaseId);
    if (!phaseToEdit) {
      return;
    }

    // Prepare updates based on the edited field
    const updates: any = {};

    switch (event.column.getColId()) {
      case 'phaseName':
        // Allow editing system phase names
        if (event.newValue && event.newValue.trim()) {
          updates.name = event.newValue.trim();
        } else {
          toast.error('Phase name cannot be empty');
          return;
        }
        break;
      case 'phaseDescription':
        // Allow editing system phase descriptions
        updates.description = event.newValue || '';
        break;
      case 'position':
        const newPosition = parseInt(event.newValue);
        if (isNaN(newPosition) || newPosition < 1) {
          toast.error('Position must be a positive number');
          return;
        }
        updates.position = newPosition;
        break;
      case 'typicalDurationDays':
        const newDuration = parseInt(event.newValue);
        if (event.newValue === '' || event.newValue === null || event.newValue === undefined) {
          updates.typical_duration_days = null;
        } else if (isNaN(newDuration) || newDuration < 1) {
          toast.error('Duration must be a positive number');
          return;
        } else {
          updates.typical_duration_days = newDuration;
        }
        break;
      case 'processType':
        // Handle continuous process toggle
        updates.is_continuous_process = event.newValue === 'Concurrent';
        break;
      default:
        return;
    }

    try {
      const success = await editPhaseAggrid(row.phaseId, updates);
      if (success) {
        // editPhaseAggrid already shows success toast and updates state optimistically
        // Trigger refresh in ConsolidatedPhaseManagement component (main page)
        setPhaseListRefreshKey(prev => prev + 1);
      } else {
        toast.error('Failed to update phase');
      }
    } catch (error) {
      console.error('Error updating phase with inline edit:', error);
      toast.error('Failed to update phase');
    }
  };
  const enhancedCustomStyles = `
  ${customStyles}
  
  .ag-theme-alpine .ag-row-dragging {
    opacity: 0.7;
    transform: rotate(2deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }
  
  .ag-theme-alpine .ag-row-drag {
    cursor: grab;
  }
  
  .ag-theme-alpine .ag-row-drag:active {
    cursor: grabbing;
  }
  
  .ag-theme-alpine .ag-row-drop-target {
    background-color: #e0f2fe !important;
    border: 2px dashed #0284c7;
  }
  
  .ag-theme-alpine .ag-row-drop-target-above {
    border-top: 3px solid #0284c7;
  }
  
  .ag-theme-alpine .ag-row-drop-target-below {
    border-bottom: 3px solid #0284c7;
  }
`;
  // Custom cell renderers for hierarchical display
  const CategoryNameCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'category') {
      const categoryId = row.id.replace('category_', '');
      const isExpanded = expandedCategories.has(categoryId);
      const isSystemCategory = row.categoryName === "Detailed Design Control Steps";
      const isCustomCategory = row.categoryName === "Custom";
      
      return <div tabIndex={-1} className={`flex items-center w-full h-[40px] group transition-all duration-200 ${isSystemCategory ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' : 'bg-green-50 hover:bg-green-100 border border-green-200'}`} style={{
        margin: 0,
        padding: 0,
        // background: '',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        // borderLeft: '6px solid #2563eb',
        // borderBottom: '2px solid #e5e7eb',
        borderRadius: '8px 8px 0 0',
        boxSizing: 'border-box',
        width: '100%'
      }} onClick={() => toggleCategoryExpansion(categoryId)}>
        <button className="ml-4 mr-6 w-5 h-5 flex items-center justify-center rounded-full bg-[#2563eb] text-white shadow group-hover:scale-105 transition-transform border-2 border-white focus:outline-none focus:ring-0 focus:border-transparent" style={{
          border: 'none',
          outline: 'none',
          boxShadow: 'none'
        }} tabIndex={0} aria-label={isExpanded ? `Collapse ${row.categoryName}` : `Expand ${row.categoryName}`} onClick={e => {
          e.stopPropagation();
          toggleCategoryExpansion(categoryId);
        }}>
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <span className="text-xl font-extrabold" style={{
          color: '#1e293b'
        }}>
          {row.categoryName}
        </span>
        <span className="ml-4 px-4 py-1 rounded-full text-xs font-semibold border" style={{
          background: '#e0e7ef',
          // soft blue
          color: '#2563eb',
          borderColor: '#cbd5e1'
        }}>
          Category
        </span>
        <span className="text-xs text-gray-400 ml-4 mr-2">{row.phaseCount} phases</span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold border mr-2" style={{
          background: '#e6f4ea',
          // soft green
          color: '#15803d',
          borderColor: '#bbf7d0'
        }}>
          {row.activeCount} active
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{
          background: '#f1f5f9',
          // soft gray
          color: '#64748b',
          borderColor: '#cbd5e1'
        }}>
          {row.availableCount} available
        </span>
      </div>;
    } else {
      return <div className="flex items-center gap-3 pl-8 py-2 hover:bg-gray-50 rounded-lg transition-colors duration-150" style={{
        paddingLeft: `${row.level * 24 + 32}px`
      }}>
        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-sm"></div>
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 text-sm">{row.phaseName}</span>
          {/* <span className="text-xs text-gray-500 mt-0.5">  {row.position}</span> */}
        </div>
      </div>;
    }
  };
  const PhaseInfoCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'category') {
      return <div className="flex items-center gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-sm"></div>
          <span className="font-medium">Active: {row.activeCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-gray-400 to-slate-500 rounded-full shadow-sm"></div>
          <span className="font-medium text-gray-600">{row.availableCount} available</span>
        </div>
      </div>;
    } else {
      return <div className="max-w-md">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
          {row.phaseDescription}
        </p>
      </div>;
    }
  };
  const StatusCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'category') {
      return <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-sm">
          Category
        </Badge>
      </div>;
    } else {
      const isActive = row.status === 'Active';
      return <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full shadow-sm ${isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-slate-500'}`}></div>
        <span className={`font-medium text-sm px-3 py-1 rounded-full ${isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
          {row.status}
        </span>
      </div>;
    }
  };
  const TypeCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    if (row.type === 'category') {
      return <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
          <Tag className="h-3 w-3 text-purple-600" />
        </div>
        <span className="text-sm text-gray-600 font-medium">
          Phase Collection
        </span>
      </div>;
    } else {
      const isSystem = row.phaseType === 'System Phase';
      return <div className={`flex items-center gap-2 p-2 rounded-lg ${isSystem ? 'bg-blue-50' : 'bg-green-50'}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSystem ? 'bg-gradient-to-br from-blue-100 to-indigo-100' : 'bg-gradient-to-br from-green-100 to-emerald-100'}`}>
          {isSystem ? <Settings className="h-3 w-3 text-blue-600" /> : <Tag className="h-3 w-3 text-green-600" />}
        </div>
        <span className={`font-medium text-sm ${isSystem ? 'text-blue-700' : 'text-green-700'}`}>
          {row.phaseType}
        </span>
      </div>;
    }
  };
  // Switch to toggle phase activation
  // make when switch is clicked, show switch is on
  // make when switch is clicked, show switch is off
  // make when switch is clicked, show switch is on
  // make when switch is clicked, show switch is off
  const ActionsCellRenderer = (props: any) => {
    const row = props.data as HierarchicalRow;
    // const isActive = row.status === "Active";
    const [isActive, setIsActive] = useState(row.status === "Active");
    const handleToggle = (checked: boolean) => {
      if (checked) {
        handleAddExistingPhaseAgGrid(row.phaseId);
        setIsActive(true);
      } else {
        handleRemovePhaseAgGrid(row.phaseId, row.phaseName);
        setIsActive(false);
      }
    };
    return <div className="flex items-center gap-2">
      <Switch checked={isActive} onCheckedChange={handleToggle} className={`${isActive ? 'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600' : ''}`} aria-label={`Toggle ${row.phaseName} phase activation`} />
    </div>;
  };
  // const PositionCellRenderer = (props: any) => {
  //   const row = props.data as HierarchicalRow;

  //   if (row.type === 'category') {
  //     return (
  //       <div className="flex items-center justify-center">
  //         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
  //           <span className="text-xs font-semibold text-purple-600">-</span>
  //         </div>
  //       </div>
  //     );
  //   }

  //   const isActive = row.status === 'Active';

  //   return (
  //     <div className="flex items-center justify-center">
  //       <div
  //         className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isActive
  //           ? 'bg-gradient-to-br from-green-500 to-emerald-600' // Active phases - green
  //           : 'bg-gradient-to-br from-gray-500 to-slate-600'    // Available phases - gray
  //           }`}
  //         title={`Position ${row.position} (${isActive ? 'Active Order' : 'Database Position'})`}
  //       >
  //         <span className="text-xs font-semibold text-white">{row.position}</span>
  //       </div>
  //     </div>
  //   );
  // };

  // TanStack Table setup
  const columnHelper = createColumnHelper<HierarchicalRow>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // TanStack Table instance
  const table = useReactTable({
    data: hierarchicalData,
    columns: [
      // Category/Sub-section/Phase Name column
      columnHelper.display({
        id: "categoryPhase",
        header: "Category / Section / Phase",
        cell: ({ row }) => {
          const data = row.original;
          if (data.type === 'category') {
            const categoryId = data.id.replace('category_', '');
            const isExpanded = expandedCategories.has(categoryId);

            return (
              <div
                className="flex items-center w-full min-h-[48px] group transition-all duration-200 cursor-pointer"
                onClick={() => toggleCategoryExpansion(categoryId)}
              >
                <button
                  className="mr-3 w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategoryExpansion(categoryId);
                  }}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {data.categoryName}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                    Category
                  </Badge>
                  <span className="text-xs text-gray-500">
                    ({data.subSectionCount || 0} sections, {data.phaseCount} phases)
                  </span>
                </div>
              </div>
            );
          } else if (data.type === 'subSection') {
            const isExpanded = expandedSubSections.has(data.subSectionId!);

            return (
              <div
                className="flex items-center w-full min-h-[44px] group transition-all duration-200 cursor-pointer pl-24 mr-20"
                onClick={() => toggleSubSectionExpansion(data.subSectionId!)}
              >
                <button
                  className="mr-3 w-5 h-5 flex items-center justify-center rounded-full bg-green-800 text-white shadow-sm hover:bg-green-900 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubSectionExpansion(data.subSectionId!);
                  }}
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-800 text-sm">
                    {data.subSectionName}
                  </span>
                  <span className="text-xs text-gray-500">({data.phaseCount} phases)</span>
                </div>
              </div>
            );
          } else if (data.type === 'phaseSubInfo') {
            // Sub-section info row (shown when phase is expanded) - show all sections
            const sectionList = data.subSectionNames || (data.subSectionName ? [data.subSectionName] : []);
            return (
              <div className="flex flex-col gap-1 py-1.5" style={{ paddingLeft: '5rem' }}>
                {sectionList.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800">{name}</span>
                  </div>
                ))}
              </div>
            );
          } else {
            // Phase row
            const phaseId = data.phaseId || data.id;
            const isSubInfoOpen = expandedPhaseSubInfo.has(phaseId);
            return (
              <div className="flex items-center gap-2 pl-8 py-2">
                {data.subSectionName ? (
                  <button
                    className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded hover:bg-purple-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePhaseSubInfo(phaseId);
                    }}
                  >
                    {isSubInfoOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-purple-500" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-purple-500" />
                    )}
                  </button>
                ) : (
                  <div className="w-5 flex-shrink-0" />
                )}
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium text-gray-800 text-sm">{data.phaseName}</span>
              </div>
            );
          }
        },
      }),

      // Phase Description column (editable)
      columnHelper.accessor("phaseDescription", {
        header: "Description",
        cell: ({ row, getValue }) => {
          const data = row.original;
          if (data.type === 'category') {
            return (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700">{data.activeCount} active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="font-medium text-gray-600">{data.availableCount} available</span>
                </div>
              </div>
            );
          } else if (data.type === 'subSection') {
            return (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-700">{data.activeCount} active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="font-medium text-gray-600">{data.availableCount} available</span>
                </div>
              </div>
            );
          } else if (data.type === 'phaseSubInfo') {
            return <span className="text-gray-400">-</span>;
          } else {
            return (
              <div className="max-w-xs">
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                  {getValue()}
                </p>
              </div>
            );
          }
        },
        enableSorting: true,
        enableColumnFilter: true,
      }),



      // Duration column
      columnHelper.display({
        id: "duration",
        header: "Duration",
        cell: ({ row }) => {
          const data = row.original;
          if (data.type === 'category' || data.type === 'subSection' || data.type === 'phaseSubInfo') return <span className="text-gray-400">-</span>;

          const isUnlimitedPhase = data.phaseName === "(08) Launch & Post-Launch" ||
            data.phaseName === "(C4) Post-Market Surveillance (PMS)";

          // Calculate duration for concurrent phases
          let duration = data.typicalDurationDays;
          if (data.isContinuousProcess && data.startPercentage !== undefined && data.endPercentage !== undefined) {
            // For concurrent phases: stored values are percentages of total project
            const totalProjectDays = calculateTotalProjectDuration(phases || []);
            const { startDay, endDay } = calculateDaysFromPercentage(
              data.startPercentage,
              data.endPercentage,
              totalProjectDays
            );
            duration = endDay - startDay;
          }

          return (
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {duration !== undefined && duration !== null
                  ? `${duration} days`
                  : isUnlimitedPhase
                    ? 'Ongoing'
                    : '-'}
              </span>
            </div>
          );
        },
      }),


      // Status column
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const data = row.original;
          if (data.type === 'category') {
            return (
              <div className="flex items-center justify-center">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Category
                </Badge>
              </div>
            );
          } else if (data.type === 'subSection') {
            return <span className="text-gray-400">-</span>;
          } else if (data.type === 'phaseSubInfo') {
            return <span className="text-gray-400">-</span>;
          } else {
            const isActive = data.status === 'Active';
            return (
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <Badge className={`${isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {data.status}
                </Badge>
              </div>
            );
          }
        },
      }),

      // Status Toggle column
      columnHelper.display({
        id: "statusToggle",
        header: "Status Toggle",
        cell: ({ row }) => {
          const data = row.original;
          if (data.type === 'category' || data.type === 'subSection' || data.type === 'phaseSubInfo') return <span className="text-gray-400">-</span>;

          const [isActive, setIsActive] = useState(data.status === "Active");

          const handleToggle = (checked: boolean) => {
            if (checked) {
              handleAddExistingPhaseAgGrid(data.phaseId!);
              setIsActive(true);
            } else {
              handleRemovePhaseAgGrid(data.phaseId!, data.phaseName!);
              setIsActive(false);
            }
          };

          return (
            <div className="flex items-center justify-center">
              <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                className={`${isActive ? 'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600' : ''}`}
                aria-label={`Toggle ${data.phaseName} phase activation`}
              />
            </div>
          );
        },
      }),

      // Process Type column
      // columnHelper.display({
      //   id: "processType",
      //   header: "Process Type",
      //   cell: ({ row }) => {
      //     const data = row.original;
      //     if (data.type === 'category') return <span className="text-gray-400">-</span>;

      //     const isContinuous = data.isContinuousProcess;
      //     const phaseData = phases.find(p => p.id === data.phaseId);
          
      //     return (
      //       <div className="flex items-center justify-center">
      //         <button
      //           onClick={() => {
      //             if (phaseData) {
      //               // Toggle continuous process status
      //               const newValue = !isContinuous;
      //               const updates: any = { is_continuous_process: newValue };
                    
      //               // If making it continuous, add default percentages
      //               if (newValue) {
      //                 updates.start_percentage = 0;
      //                 updates.end_percentage = 100;
      //               }
                    
      //               editPhaseAggrid(data.phaseId, updates);
      //             }
      //           }}
      //           className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-full border transition-all hover:scale-105 cursor-pointer
      //             ${isContinuous
      //               ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
      //               : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      //             }`
      //           }
      //           title="Click to toggle between Concurrent and Linear"
      //         >
      //           {isContinuous ? (
      //             <>
      //               <Workflow className="h-3 w-3" />
      //               Concurrent
      //             </>
      //           ) : (
      //             <>
      //               <ArrowRight className="h-3 w-3" />
      //               Linear
      //             </>
      //           )}
      //         </button>
      //       </div>
      //     );
      //   },
      // }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const data = row.original;

          if (data.type === 'category') {
            const isSystemCategory = data.categoryName === "Detailed Design Control Steps";
            const isNoCategorySection = data.categoryName === "No category";
            if (isNoCategorySection) return <span className="text-gray-400">-</span>;

            const categoryId = data.id.replace('category_', '');

            return (
              <div className="flex items-center justify-center gap-2">
                {!isSystemCategory && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(categoryId, data.categoryName)}
                      className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50"
                      title="Edit Category"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(categoryId, data.categoryName)}
                      className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                      title="Delete Category"
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </>
                )}
              </div>
            );
          } else if (data.type === 'subSection') {
            // Sub-section actions
            return (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSubSection(data.subSectionId!, data.subSectionName!)}
                  className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50"
                  title="Edit Section"
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSubSection(data.subSectionId!, data.subSectionName!)}
                  className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                  title="Delete Section"
                >
                  <Trash className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            );
          } else if (data.type === 'phaseSubInfo') {
            return <span className="text-gray-400">-</span>;
          } else {
            // Phase actions
            const allPhases = [...(phases || []), ...(availablePhases || [])];
            const phase = allPhases.find(p => p.id === data.phaseId);
            return (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (phase) handleEditPhase(phase);
                  }}
                  className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50"
                  title="Edit Phase"
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                {data.phaseType !== 'System Phase' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (phase) handleDeletePhase(phase.id, phase.name);
                    }}
                    className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                    title="Delete Phase"
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            );
          }
        },
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 1000, // Show up to 1000 rows to ensure all phases are visible
      },
    },
  });

  // Filter functions
  const clearFilters = () => {
    setIsFiltering(true);
    setSelectedCategory("all");
    setSearchTerm("");
    setTimeout(() => setIsFiltering(false), 100);
  };
  const handleCategoryClick = (category: string) => {
    setIsFiltering(true);
    setSelectedCategory(category === selectedCategory ? "all" : category);
    setTimeout(() => setIsFiltering(false), 100);
  };
  const handleSearchChange = (value: string) => {
    setIsFiltering(true);
    setSearchTerm(value);
    setTimeout(() => setIsFiltering(false), 100);
  };
  const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
    setGridApi(params.api);
  };

  // Export functions
  const exportToCSV = () => {
    if (gridApi) {
      // Flatten the hierarchical data for export
      const exportData = [];
      hierarchicalData.forEach(row => {
        if (row.type === 'phase') {
          exportData.push({
            'Category': row.categoryName,
            'Phase Name': row.phaseName,
            'Description': row.phaseDescription,
            'Position': row.position,
            'Status': row.status,
            
            'Type': row.phaseType
          });
        }
      });
      const csvString = Papa.unparse(exportData);
      const blob = new Blob([csvString], {
        type: 'text/csv;charset=utf-8;'
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${companyName}-hierarchical-phases.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Hierarchical phases exported to CSV successfully!');
    }
  };
  const exportToExcel = () => {
    exportToCSV(); // For now, use same export logic
  };

  // Expand/Collapse all categories
  const expandAllCategories = () => {
    const allCategoryIds = new Set<string>();
    if (categories && Array.isArray(categories)) {
      categories.forEach(cat => allCategoryIds.add(cat.id));
    }
    // Also add 'no_category' for uncategorized phases
    allCategoryIds.add('no_category');
    
    // Use callback to ensure immediate state update
    setExpandedCategories(prevState => {
      const newState = new Set(allCategoryIds);
      return newState;
    });
  };
  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };
  const totalPhases = (phases?.length || 0) + (availablePhases?.length || 0);
  return (
    <div className="space-y-6">
      {/* Inject custom styles */}
      <style dangerouslySetInnerHTML={{
        __html: customStyles
      }} />

      <div className="flex items-center justify-between" data-tour="lifecycle-phases">
        <div>
          <h2 className="text-2xl font-bold">{lang('lifecyclePhases.title')}</h2>
          <p className="text-muted-foreground">
            {lang('lifecyclePhases.description')}
          </p>
          <div className="mt-2">
            <CompanyPhaseIndicator companyName={companyName} isCustom={true} variant="phase" />
          </div>
        </div>
        <div className="flex gap-2">
        {/* <Button
          onClick={handleDownloadSamplePhaseCSV}
          variant="outline"
          className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          disabled={loading}
          style={{ whiteSpace: 'nowrap' }}
         >
          <Download className="h-4 w-4" />
          Download Sample CSV
         </Button>
         <Button
          onClick={downloadPhasesCSV}
          variant="outline"
          className="flex items-center gap-2"
          disabled={loading || totalPhases === 0}
          style={{
            whiteSpace: "nowrap"
          }}
         >
          <Download className="h-4 w-4" />
          Download Phases
         </Button> */}
        {/* <Button
          onClick={handleSyncDefaultPhases}
          variant="outline"
          className="flex items-center gap-2"
          disabled={loading || isSyncingPhases}
          style={{ whiteSpace: 'nowrap' }}
        >
          {isSyncingPhases ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          {isSyncingPhases ? 'Syncing...' : 'Sync Phases'}
        </Button> */}
        {/* <Button onClick={() => handleAgGridDialogOpen(true)} variant="outline" className="flex items-center gap-2" disabled={loading || totalPhases === 0} style={{
          whiteSpace: 'nowrap'
        }} data-tour="add-phase">
          <Table className="h-4 w-4" />
          {lang('lifecyclePhases.editPhases')}
        </Button> */}
        </div>
      </div>

      <div data-tour="lifecycle-phases">
        <ConsolidatedPhaseManagement companyId={companyId} refreshKey={phaseListRefreshKey} />
      </div>

    <PhaseFormDialog open={showCreateDialog} onOpenChange={handleCreateDialogOpen} onSubmit={handleCreateCustomPhase} title={lang('lifecyclePhases.dialog.createPhase')} categories={categories} companyId={companyId} onCategoriesRefresh={() => { refreshCategories(); refreshSubSections(); refreshData(true); }} />

    <PhaseEditFormDialog open={showEditDialog} onOpenChange={handleEditDialogOpen} phase={selectedPhaseForEdit} categories={categories} activePhases={phases || []} companyId={companyId} onSubmit={handleUpdatePhase} isSubmitting={isEditingPhase} onCategoriesRefresh={() => { refreshCategories(); refreshSubSections(); refreshData(true); }} />

    <DocumentTemplateImportDialog open={showTemplateImportDialog} onOpenChange={handleTemplateImportDialogOpen} companyId={companyId} onImportComplete={refreshData} />
    <PhaseImportDialog open={showPhaseImportDialog} onOpenChange={handlePhaseImportDialogOpen} companyId={companyId} onImportComplete={refreshData} />

    {/* Sync Default Phases Confirmation Dialog */}
    <AlertDialog open={showSyncConfirmDialog} onOpenChange={setShowSyncConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{lang('lifecyclePhases.dialog.syncTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {lang('lifecyclePhases.dialog.syncDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={confirmSyncDefaultPhases}>
            {lang('lifecyclePhases.dialog.syncPhases')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Hierarchical AG Grid Dialog */}
    <Dialog open={showAgGridDialog} onOpenChange={handleAgGridDialogOpen} key={dialogKey}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{lang('lifecyclePhases.dialog.editPhasesTitle')} - {companyName}</DialogTitle>
        </DialogHeader>

        {loading ? <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{lang('lifecyclePhases.loading')}</span>
        </div> : <>
          {/* Enhanced Filtering UI */}
          <div className="mb-6 space-y-4">
            {/* Search and Control Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search categories or phases..." value={searchTerm} onChange={e => handleSearchChange(e.target.value)} className="pl-10 pr-4" />
                  {searchTerm && <Button variant="ghost" size="sm" onClick={() => handleSearchChange("")} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* {canAddPhases && ( */}
                <Button onClick={() => handleCreateDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4" />
                  {lang('lifecyclePhases.addNewPhase')}
                </Button>
                {/* )} */}

                {searchTerm && <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {lang('lifecyclePhases.clearSearch')}
                </Button>}
              </div>
            </div>

            {/* Category Overview Chips */}
            {/* {uniqueCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-7
                  00 flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Categories:
                  </span>
                  {uniqueCategories.map(category => {
                    // Calculate count from all phases, not filtered data
                    const allPhases = [...(phases || []), ...(availablePhases || [])];
                    const count = allPhases.filter(phase => {
                      const cat = categories?.find(c => c.id === phase.category_id);
                      return cat?.name === category;
                    }).length;
                     const categoryId = categories?.find(c => c.name === category)?.id;
                    const isExpanded = categoryId ? expandedCategories.has(categoryId) : false;
                     return (
                      <Badge
                        key={category}
                        variant={isExpanded ? "default" : "outline"}
                        className={`cursor-pointer hover:bg-blue-50 transition-colors ${isExpanded ? "bg-blue-100 text-blue-800" : ""
                          }`}
                        onClick={() => {
                          if (categoryId) {
                            toggleCategoryExpansion(categoryId);
                          }
                        }}
                      >
                        {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                        {category} ({count})
                      </Badge>
                    );
                  })}
                </div>
               )} */}

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              {/* <div className="flex items-center gap-4">
                  <span>Categories: {uniqueCategories.length}</span>
                  <span>Active Phases: {phases?.length || 0}</span>
                  <span>Available Phases: {availablePhases?.length || 0}</span>
                  <span>Total Phases: {totalPhases}</span>
                  {searchTerm && (
                    <span className="text-blue-600 font-medium flex items-center gap-1">
                      {isFiltering && <Loader2 className="h-3 w-3 animate-spin" />}
                      Showing: {hierarchicalData.filter(row => row.type === 'phase').length} phases
                    </span>
                  )}
                 </div> */}

              {/* <div className="flex items-center gap-2">
                  <Button
                    onClick={exportToCSV}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={hierarchicalData.length === 0}
                  >
                    <FileDown className="h-3 w-3" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={hierarchicalData.length === 0}
                  >
                    <Download className="h-3 w-3" />
                    Export Excel
                  </Button>
                 </div> */}
            </div>
          </div>

          {/* Enhanced Hierarchical Data Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white" style={{
            height: '60vh',
            width: '100%'
          }}>

            {/* TanStack Table Implementation */}
            <div className="h-full overflow-auto">
              <UITable className="w-full">
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b border-gray-200">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0">
                          {header.isPlaceholder ? null : (
                            <div className="flex items-center">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {(() => {
                    const rowCount = table.getRowModel().rows?.length || 0;
                    const phaseRowCount = table.getRowModel().rows?.filter(row => row.original.type === 'phase').length || 0;
                    
                    if (!rowCount) {
                      return (
                        <TableRow>
                          <TableCell colSpan={(table.getAllColumns() as any).length} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                                <Filter className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="text-lg font-semibold text-gray-700 mb-2">No phases found</div>
                              <div className="text-sm text-gray-500 text-center max-w-md">
                                {searchTerm
                                  ? "Try adjusting your search terms or clear the search to see all phases"
                                  : `No phases are currently available for this company. HierarchicalData length: ${hierarchicalData.length}`
                                }
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return table.getRowModel().rows.map((row, index) => {
                      return (
                        <TableRow
                          key={row.id}
                          className={`${row.original.type === 'category'
                            ? 'bg-blue-50 hover:bg-blue-100 border-b-2 border-blue-200'
                            : 'hover:bg-gray-50 border-b border-gray-200'
                            } transition-colors duration-150`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="px-4 py-3 border-r border-gray-200 last:border-r-0">
                              {/* DEBUG: {row.original.type === 'category' ? row.original.categoryName : row.original.phaseName} */}
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </UITable>
            </div>
          </div>

          {/* Instructions */}
          {/* <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">How to use the hierarchical view:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Click on category rows (with <ChevronRight className="h-3 w-3 inline mx-1" /> or <ChevronDown className="h-3 w-3 inline mx-1" /> icons) to expand/collapse phases</li>
                    <li>Use "Expand All" / "Collapse All" buttons to show/hide all phases at once</li>
                    <li>Search to filter both categories and phases by name or description</li>
                    <li>Click category badges in the filter section to quickly expand specific categories</li>
                    <li><strong>Double-click on any phase row to edit it</strong> (custom phases only)</li>
                    <li>Drag and drop phases to reorder them within the grid</li>
                    <li>Export functions will include only the currently visible phase data</li>
                  </ul>
                </div>
              </div>
             </div> */}
        </>}

        <div className="flex justify-end items-center pt-4 border-t">
          <Button onClick={() => handleAgGridDialogOpen(false)} variant="outline">
            {lang('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Edit Category Dialog */}
    <Dialog open={editCategoryDialog.open} onOpenChange={(open) => !open && setEditCategoryDialog({ open: false, categoryId: '', categoryName: '' })}>
      <DialogContent className="sm:max-w-[425px] z-[100]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="categoryName" className="text-sm font-medium text-gray-700 mb-2 block">
            Category Name
          </label>
          <Input
            id="categoryName"
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
            placeholder={lang('lifecyclePhases.dialog.categoryNamePlaceholder') || 'Enter category name'}
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEditCategoryConfirm();
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditCategoryDialog({ open: false, categoryId: '', categoryName: '' })}>
            {lang('common.cancel')}
          </Button>
          <Button onClick={handleEditCategoryConfirm} disabled={!editCategoryName.trim()}>
            {lang('common.save') || 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Category Confirmation Dialog */}
    <AlertDialog open={deleteCategoryDialog.open} onOpenChange={(open) => !open && setDeleteCategoryDialog({ open: false, categoryId: '', categoryName: '' })}>
      <AlertDialogContent className="z-[100]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{deleteCategoryDialog.categoryName}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteCategoryConfirm} className="bg-red-600 hover:bg-red-700">
            {lang('common.delete') || 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Phase Confirmation Dialog */}
    <AlertDialog open={deletePhaseDialog.open} onOpenChange={(open) => !open && setDeletePhaseDialog({ open: false, phaseId: '', phaseName: '' })}>
      <AlertDialogContent className="z-[100]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Phase</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the phase "{deletePhaseDialog.phaseName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeletePhaseConfirm} className="bg-red-600 hover:bg-red-700">
            {lang('common.delete') || 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Create Sub-section Dialog */}
    <Dialog open={createSubSectionDialog.open} onOpenChange={(open) => !open && setCreateSubSectionDialog({ open: false, categoryId: '', categoryName: '' })}>
      <DialogContent className="sm:max-w-[425px] z-[100]">
        <DialogHeader>
          <DialogTitle>Create Section</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Creating section in category: <strong>{createSubSectionDialog.categoryName}</strong>
          </p>
          <label htmlFor="subSectionName" className="text-sm font-medium text-gray-700 mb-2 block">
            Section Name
          </label>
          <Input
            id="subSectionName"
            value={createSubSectionName}
            onChange={(e) => setCreateSubSectionName(e.target.value)}
            placeholder="Enter section name"
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateSubSectionConfirm();
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCreateSubSectionDialog({ open: false, categoryId: '', categoryName: '' })}>
            {lang('common.cancel')}
          </Button>
          <Button onClick={handleCreateSubSectionConfirm} disabled={!createSubSectionName.trim()}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Edit Sub-section Dialog */}
    <Dialog open={editSubSectionDialog.open} onOpenChange={(open) => !open && setEditSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' })}>
      <DialogContent className="sm:max-w-[425px] z-[100]">
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="editSubSectionName" className="text-sm font-medium text-gray-700 mb-2 block">
            Section Name
          </label>
          <Input
            id="editSubSectionName"
            value={editSubSectionName}
            onChange={(e) => setEditSubSectionName(e.target.value)}
            placeholder="Enter section name"
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEditSubSectionConfirm();
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' })}>
            {lang('common.cancel')}
          </Button>
          <Button onClick={handleEditSubSectionConfirm} disabled={!editSubSectionName.trim()}>
            {lang('common.save') || 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Sub-section Confirmation Dialog */}
    <AlertDialog open={deleteSubSectionDialog.open} onOpenChange={(open) => !open && setDeleteSubSectionDialog({ open: false, subSectionId: '', subSectionName: '' })}>
      <AlertDialogContent className="z-[100]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Section</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the section "{deleteSubSectionDialog.subSectionName}"? All phases in this section will be moved to uncategorized.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteSubSectionConfirm} className="bg-red-600 hover:bg-red-700">
            {lang('common.delete') || 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}