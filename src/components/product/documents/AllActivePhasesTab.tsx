import React, { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBulkOperationProgress } from "@/hooks/useBulkOperationProgress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Layers, File, Eye, Trash2, Plus, Copy, RefreshCw, CircleCheckBig, Sparkles, BookOpen, CheckSquare, FileEdit, Link, Send, Pencil, MoreHorizontal, Calendar, Users, FolderOpen, UserPlus, CalendarDays, FileDown, Loader2, Settings2 } from "lucide-react";
import { ColumnVisibilitySettings, type ColumnDefinition } from '@/components/shared/ColumnVisibilitySettings';
import { useListColumnPreferences } from '@/hooks/useListColumnPreferences';
import { DocumentPdfPreviewService } from '@/services/documentPdfPreviewService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SendToReviewGroupDialog } from '@/components/documents/SendToReviewGroupDialog';
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { DocumentListView } from "./DocumentListView";
import { RefDocsBadge } from "@/components/common/RefDocsBadge";
import { PhaseFilter } from "./PhaseFilter";
import { SelectedPhaseDocuments } from "./SelectedPhaseDocuments";
import { usePhaseDocuments } from "@/hooks/usePhaseDocuments";
import { useCompanyPhasePositions } from "@/hooks/useCompanyPhasePositions";
import { DocumentActionMenu } from './DocumentActionMenu';
import { DocumentReviewersList } from './DocumentReviewersList';
import { EditDocumentDialog } from './EditDocumentDialog';
import { DocumentViewer } from '../DocumentViewer';
import { DueDateBadge } from './DueDateBadge';
import { OnlyOfficeEditorDialog } from './OnlyOfficeEditorDialog';
// BulkCopyDocumentsDialog removed — scope popup handles cross-device copying
import { BulkStatusUpdateDialog } from './BulkStatusUpdateDialog';
import { BulkDocumentSummarySidebar } from './BulkDocumentSummarySidebar';
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
import { useIsolatedDocumentOperations } from '@/hooks/useIsolatedDocumentOperations';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from "sonner";
import { mapDBStatusToUI, mapUIStatusToDocument, DocumentUIStatus } from "@/utils/statusUtils";
import { CompanyDataUpdateService } from "@/services/companyDataUpdateService";
import { supabase } from "@/integrations/supabase/client";
import { AuditTrailService } from "@/services/auditTrailService";
import { useDocumentAuthors } from "@/hooks/useDocumentAuthors";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import { SortByDateOption, TableSortState } from "@/utils/documentFilterParams";
import { useVariantDocumentContext } from "@/components/product/variant/VariantDocumentContext";
import { useUserDocumentAccess } from "@/hooks/useUserDocumentAccess";
import { useInheritanceExclusion } from "@/hooks/useInheritanceExclusion";
import { mirrorScopeToFamilyProducts } from "@/hooks/useAutoSyncScope";

import { InheritanceExclusionPopover } from "@/components/shared/InheritanceExclusionPopover";
import { DocumentDraftDrawer } from './DocumentDraftDrawer';
import { CopyDocumentDialog } from './CopyDocumentDialog';
import { Switch } from "@/components/ui/switch";

interface AllActivePhasesTabProps {
  phases: any[];
  currentPhase?: string | null;
  onPhaseClick: (phaseName: string) => void;
  statusFilter?: string[];
  companyId?: string;
  productId?: string;
  onDocumentUpdated?: (document: any) => void;
  onDocumentStatusChange?: (documentId: string, status: string) => void;
  onDocumentDeadlineChange?: (documentId: string, date: Date | undefined) => void;
  handleRefreshData?: () => void;
  phaseFilter?: string[];
  searchQuery?: string;
  disabled?: boolean;
  // New filter props
  authorFilter?: string[];
  sectionFilter?: string[];
  tagFilter?: string[];
  refTagFilter?: string[];
  refDocTagMap?: Record<string, string[]>;
  sortByDate?: SortByDateOption;
  onAddDocumentClick?: () => void;
  viewMode?: 'card' | 'list';
  // Table sorting props
  tableSort?: TableSortState;
  onTableSortChange?: (sortState: TableSortState) => void;
  // AI Summary Sidebar props (lifted from parent)
  isSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  selectedDocsForSummary?: Set<string>;
  onToggleDocForSummary?: (docId: string) => void;
  hideExcluded?: boolean;
  refreshTrigger?: number;
  newlyCreatedDoc?: any;
  familyProductIds?: string[];
}
interface DocumentCICard {
  id: string;
  name: string;
  status: string;
  document_type: string;
  tech_applicability?: string;
  created_at?: string;
  updated_at?: string;
  file_path?: string;
  file_name?: string;
  phase_name?: string;
  due_date?: string;
  approval_date?: string;
  template_source_id?: string;
  description?: string;
  reviewer_group_ids?: string[];
  reviewer_group_id?: string;
  authors_ids?: string[];
  document_reference?: string;
  date?: string;
  start_date?: string;
  is_record?: boolean;
  section_ids?: string[];
  reference_document_ids?: string[];
  tags?: string[];
  isInheritedFromMaster?: boolean;
  masterProductName?: string;
}
const TARGET_DATE_FOR_EXTENSION = {
  day: 27,
  month: 10, // zero-indexed (0 = January)
  year: 2025
};

const getAdjustedDueDate = (dueDate?: string) => {
  if (!dueDate) return undefined;

  const today = new Date();
  const isTargetDate =
    today.getDate() === TARGET_DATE_FOR_EXTENSION.day &&
    today.getMonth() === TARGET_DATE_FOR_EXTENSION.month &&
    today.getFullYear() === TARGET_DATE_FOR_EXTENSION.year;

  if (!isTargetDate) {
    return dueDate;
  }

  const originalDue = new Date(dueDate);
  if (isNaN(originalDue.getTime())) {
    return dueDate;
  }

  originalDue.setDate(originalDue.getDate() + 7);
  return originalDue.toISOString();
};

// Simple component to display document authors
const DocumentAuthorsList = ({
  document,
  companyId
}: {
  document: DocumentCICard;
  companyId?: string;
}) => {
  const { getAuthorById, isLoading } = useDocumentAuthors(companyId || '');
  const authorsIds = document.authors_ids || [];

  if (!authorsIds || authorsIds.length === 0) {
    return <span className="text-xs text-muted-foreground">No authors</span>;
  }

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Loading...</span>;
  }

  // Deduplicate authors_ids array to fix duplicate adhoc author issue
  const uniqueAuthorIds = Array.from(new Set(authorsIds));

  // Map authors with their IDs
  const authorData = uniqueAuthorIds
    .map(id => {
      const author = getAuthorById(id);
      return { id, name: author ? author.name : 'Unknown Author' };
    })
    .filter(author => author.name !== 'Unknown Author' || uniqueAuthorIds.includes(author.id));

  if (authorData.length === 0) {
    return <span className="text-xs text-muted-foreground">No authors</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {authorData.map((author) => (
        <Badge
          key={author.id}
          variant="outline"
          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
        >
          {author.name}
        </Badge>
      ))}
    </div>
  );
};

const DocumentCICardComponent = ({
  document,
  companyId,
  productId,
  phaseStartDate,
  phaseEndDate,
  onStatusChange,
  onEdit,
  onAssignReviewers,
  onView,
  onEditTemplate,
  onRefreshData,
  onDelete,
  onCopy,
  isProcessing = false,
  disabled = false,
  isSidebarOpen = false,
  isSelected = false,
  onToggleSelect,
  onCreateDraft,
  isExcludedFromVariant = false,
  onToggleExclusion,
  exclusionScope,
  onSetExclusionScope,
  familyProductIds,
}: {
  document: DocumentCICard;
  companyId?: string;
  productId?: string;
  phaseStartDate?: string;
  phaseEndDate?: string;
  onStatusChange?: (document: DocumentCICard, status: string) => void;
  onEdit?: (document: DocumentCICard) => void;
  onAssignReviewers?: (document: DocumentCICard) => void;
  onView?: (document: DocumentCICard) => void;
  onEditTemplate?: (document: DocumentCICard) => void;
  onRefreshData?: () => void;
  onDelete?: (documentId: string) => void;
  onCopy?: (document: DocumentCICard) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  isSidebarOpen?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (docId: string) => void;
  onCreateDraft?: (document: DocumentCICard) => void;
  isExcludedFromVariant?: boolean;
  onToggleExclusion?: (docId: string) => void;
  exclusionScope?: import("@/hooks/useInheritanceExclusion").ItemExclusionScope;
  onSetExclusionScope?: (itemId: string, scope: import("@/hooks/useInheritanceExclusion").ItemExclusionScope) => void;
  familyProductIds?: string[];
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showSendReviewDialog, setShowSendReviewDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { formatDate } = useCompanyDateFormat(companyId);
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  const variantCtx = useVariantDocumentContext();
  const variantStatus = variantCtx.isVariant
    ? variantCtx.getDocumentInheritanceStatus(document.id)
    : null;

  // Documents that are excluded or shared from another device are read-only
  const isSharedFromOtherDevice = !!(document as any)._isSharedFromDevice;
  const isNotInteractable = isExcludedFromVariant || isSharedFromOtherDevice;

  const handleCreateDocument = () => {
    if (onCreateDraft) {
      onCreateDraft(document);
      return;
    }
    const companyName = activeCompanyRole?.companyName || '';
    const params = new URLSearchParams();
    params.set('createNew', 'true');
    params.set('docName', document.name || '');
    params.set('docType', document.document_type || 'Standard');
    if (productId) params.set('productId', productId);
    params.set('returnTo', 'documents');
    navigate(`/app/company/${encodeURIComponent(companyName)}/document-studio?${params.toString()}`);
  };
  const hasUploadedFile = (doc: DocumentCICard) => {
    return !!(doc.file_path || doc.file_name);
  };

  const getFileIcon = (doc: DocumentCICard) => {
    if (!hasUploadedFile(doc)) return null;
    const fileType = doc.file_name?.split('.').pop()?.toLowerCase();
    if (fileType?.includes('pdf')) return <File className="h-4 w-4 text-red-500" />;
    if (fileType?.includes('doc')) return <File className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'report': // Add Report status with green color like Approved
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in review':
      case 'under review':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'changes_requested':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'n/a':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'not started':
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Get action button styles based on document status
  const getActionButtonStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'report':
        return { bg: '!bg-green-50 border-green-300 hover:!bg-green-100', icon: 'text-green-700' };
      case 'in review':
      case 'under review':
        return { bg: '!bg-amber-50 border-amber-300 hover:!bg-amber-100', icon: 'text-amber-700' };
      case 'changes requested':
      case 'changes_requested':
        return { bg: '!bg-orange-50 border-orange-300 hover:!bg-orange-100', icon: 'text-orange-700' };
      case 'rejected':
        return { bg: '!bg-red-50 border-red-300 hover:!bg-red-100', icon: 'text-red-700' };
      default:
        return { bg: '!bg-white', icon: 'text-primary' };
    }
  };

  const isNotStarted = !document.status || document.status.toLowerCase() === 'not started';
  const actionStyles = getActionButtonStyles(document.status || 'Not Started');

  const isDocumentOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };
  const adjustedDueDate = getAdjustedDueDate(document.due_date);
  const documentForDueDate = adjustedDueDate ? { ...document, due_date: adjustedDueDate } : document;
  const hasFile = hasUploadedFile(document);
  const isOverdue = isDocumentOverdue(adjustedDueDate || document.due_date);

  // Format dates for display using company date format
  const formattedLastUpdated = document.updated_at
    ? formatDate(document.updated_at)
    : null;

    
  // Format due date
  const formattedDueDate = (adjustedDueDate || document.due_date)
    ? formatDate(adjustedDueDate || document.due_date)
    : null;

  // Format approval date
  const formattedApprovalDate = document.approval_date
    ? formatDate(document.approval_date)
    : null;

  // Format document date - show date if available, otherwise fallback to created_at
  const formattedDocumentDate = (document.date || document.created_at)
    ? formatDate(document.date || document.created_at)
    : null;

  // Determine card background based on status - green for Approved and Report, blue for others
  const isApproved = document.status?.toLowerCase() === 'approved' || document.status?.toLowerCase() === 'completed' || document.status?.toLowerCase() === 'report';
  const cardBgClass = isExcludedFromVariant
    ? "flex items-center justify-between p-4 border rounded-lg bg-gray-100 border-gray-300"
    : isApproved
      ? "flex items-center justify-between p-4 border rounded-lg bg-emerald-100 border-emerald-300"
      : "flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200";

  // Check if document has a file (can be selected for AI Summary)
  const hasSelectableFile = !!document.file_path && isSidebarOpen;

  return (<>
  <div
    className={`${cardBgClass} ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : 'justify-between'} ${isExcludedFromVariant ? 'opacity-50' : ''}`}
  >
    {/* Checkbox for AI Summary selection - only show when sidebar is open and document has file */}
    <div className="flex items-center">
      {hasSelectableFile && onToggleSelect && (
        <div className="flex items-center mr-6">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(document.id)}
            className={`h-5 w-5 ${isSelected ? 'border-blue-500 data-[state=checked]:bg-blue-500' : 'border-gray-400'}`}
          />
        </div>
      )}
      <div className={`flex items-center gap-6 ${isExcludedFromVariant ? 'line-through decoration-foreground/40 decoration-2' : ''}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {document.phase_name && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {document.phase_name.toLowerCase() === 'no phase' ? 'Core' : document.phase_name}
              </Badge>
            )}
            {document.document_type && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {document.document_type}
              </Badge>
            )}
            {
              (document as any as { sub_section?: string }).sub_section && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                  {(document as any as { sub_section?: string }).sub_section}
                </Badge>
              )
            }
            <Badge
              variant="outline"
              className={`text-xs ${document.is_record
                ? 'bg-purple-50 text-purple-700 border-purple-300'
                : 'bg-blue-50 text-blue-700 border-blue-300'}`}
            >
              Category: {document.is_record ? 'Report' : 'Document'}
            </Badge>
            {/* {hasFile && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
          <File className="h-3 w-3 mr-1" />
          File Attached
        </Badge>} */}
            {isOverdue && <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
              Overdue
            </Badge>}
            {isProcessing && <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
              Updating...
            </Badge>}
            {document.tags && document.tags.length > 0 && document.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                {tag}
              </Badge>
            ))}
          </div>
          <h5 className={`font-medium mb-2 ${isExcludedFromVariant ? 'text-muted-foreground' : ''}`}>
            {document.name}
            {document.document_reference && (
              <span className="text-muted-foreground font-normal"> ({document.document_reference.startsWith('DS-') ? 'Document Studio' : document.document_reference})</span>
            )}
          </h5>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {formattedDocumentDate && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Date:</span>
                <span className="text-xs font-semibold">{formattedDocumentDate}</span>
              </div>
            )}
            {formattedLastUpdated && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Last Updated:</span>
                <span className="text-xs font-semibold">{formattedLastUpdated}</span>
              </div>
            )}
            {formattedApprovalDate && document.status?.toLowerCase() === 'approved' && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Approved:</span>
                <span className="text-xs text-green-600 font-semibold">{formattedApprovalDate}</span>
              </div>
            )}
            {formattedDueDate && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Due:</span>
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>{formattedDueDate}</span>
              </div>
            )}
            {document.tech_applicability && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Applies to:</span>
                <span className="text-xs">{document.tech_applicability}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Reviewers:</span>
            {companyId && <DocumentReviewersList document={document} companyId={companyId} />}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Authors:</span>
            {companyId && (
              <DocumentAuthorsList
                document={document}
                companyId={companyId}
              />
            )}
          </div>
          {companyId && document.reference_document_ids && document.reference_document_ids.length > 0 && (
            <div className="mt-2">
              <RefDocsBadge referenceDocumentIds={document.reference_document_ids} companyId={companyId} />
            </div>
          )}
        </div>
        {document.description && (
          <div className="text-sm mb-2 text-foreground/80 max-w-sm word-wrap">
            <span className="font-medium">Description:</span> {document.description}
          </div>
        )}
      </div>
    </div>
    <div className="flex flex-col items-end gap-3 shrink-0">
      {/* Device applicability scope — for all docs */}
      {onSetExclusionScope && companyId && productId && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Scope</span>
          <InheritanceExclusionPopover
            companyId={companyId}
            currentProductId={productId}
            itemId={document.id.replace(/^template-/, '')}
            exclusionScope={exclusionScope || {}}
            onScopeChange={onSetExclusionScope}
            defaultCurrentDeviceOnly
            familyProductIds={familyProductIds}
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        {/* Status and Due Date in one row */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-xs ${getStatusBadgeStyles(document.status || 'Not Started')}`}
          >
            {/* Normalize "Under Review" to "In Review" for display */}
            {document.status?.toLowerCase() === 'under review' ? 'In Review' : (document.status || 'Not Started')}
          </Badge>
        </div>
      </div>
      {!isNotInteractable && (
      <div className="flex items-center gap-3">
        {/* Studio editor button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCreateDocument()}
          disabled={isProcessing || disabled}
          className="h-8 px-3 !bg-white"
          title={document.document_reference?.startsWith('DS-') ? "Edit Document" : "Create Document"}
        >
          <FileEdit className="h-4 w-4" />
        </Button>
        {/* View button */}
        {document.file_path && onView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(document)}
            disabled={isProcessing || disabled}
            className="h-8 px-3 !bg-white"
            title="View Document"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {/* Send for Review */}
        {companyId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSendReviewDialog(true)}
            disabled={isProcessing || disabled}
            className={`h-8 px-3 ${actionStyles.bg}`}
            title="Send for Review"
          >
            <Send className={`h-4 w-4 ${actionStyles.icon}`} />
          </Button>
        )}
        {/* 3-dot menu: Preview PDF, Edit, Delete & Copy */}
        {(onEdit || onDelete || onCopy || companyId) && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isProcessing || disabled} className="h-8 px-3 !bg-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {companyId && document.status === 'Approved' && (
                <DropdownMenuItem
                  disabled={pdfLoading}
                  onSelect={(e) => {
                    e.preventDefault();
                    (async () => {
                      setPdfLoading(true);
                      try {
                        await DocumentPdfPreviewService.generatePreviewPdf(document.id, companyId, productId);
                      } catch (error) {
                        console.error('PDF preview error:', error);
                        toast.error('Failed to generate PDF preview');
                      } finally {
                        setPdfLoading(false);
                      }
                    })();
                  }}
                >
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Preview PDF
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(document)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onSelect={() => { setTimeout(() => setShowDeleteDialog(true), 0); }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              {onCopy && (
                <DropdownMenuItem onSelect={() => { setTimeout(() => setShowCopyDialog(true), 0); }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      )}
    </div>
  </div>
  {/* Delete Confirmation Dialog */ }
  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Document</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete <strong>"{document.name}"</strong>? This action cannot be undone and the document will be permanently removed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            if (onDelete) {
              onDelete(document.id);
            }
            setShowDeleteDialog(false);
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  {/* Copy Document Confirmation Dialog */}
  <CopyDocumentDialog
    open={showCopyDialog}
    onOpenChange={setShowCopyDialog}
    documentName={document.name}
    onConfirm={() => {
      if (onCopy) onCopy(document);
      setShowCopyDialog(false);
    }}
  />
  {/* Create Draft Confirmation Dialog */}
  <AlertDialog open={showCreateConfirm} onOpenChange={setShowCreateConfirm}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Create Draft Document?</AlertDialogTitle>
        <AlertDialogDescription>
          This will create a draft of <strong>"{document.name}"</strong> in Document Studio. You can edit it there and save when ready.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => { setShowCreateConfirm(false); handleCreateDocument(); }}>
          Create Draft
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  {/* Send for Review Dialog */}
  {companyId && showSendReviewDialog && (
    <SendToReviewGroupDialog
      open={showSendReviewDialog}
      onOpenChange={setShowSendReviewDialog}
      documentId={document.id}
      documentName={document.name}
      companyId={companyId}
      productId={productId}
      existingGroupIds={(document as any).reviewer_group_ids || []}
    />
  )}
  </>);
};
export function AllActivePhasesTab({
  phases,
  currentPhase,
  onPhaseClick,
  statusFilter = [],
  companyId,
  productId,
  onDocumentUpdated = () => { },
  onDocumentStatusChange,
  onDocumentDeadlineChange,
  handleRefreshData,
  phaseFilter = [],
  searchQuery = "",
  disabled = false,
  authorFilter = [],
  sortByDate = 'none',
  sectionFilter = [],
  tagFilter = [],
  refTagFilter = [],
  refDocTagMap = {},
  onAddDocumentClick,
  viewMode = 'card',
  tableSort,
  onTableSortChange,
  // AI Summary Sidebar props (can be controlled from parent or use internal state)
  isSidebarOpen: externalSidebarOpen,
  onSidebarOpenChange: externalOnSidebarOpenChange,
  selectedDocsForSummary: externalSelectedDocs,
  onToggleDocForSummary: externalToggleDoc,
  hideExcluded = false,
  refreshTrigger,
  newlyCreatedDoc,
  familyProductIds,
}: AllActivePhasesTabProps) {
  const { lang } = useTranslation();
  const { isAdmin } = useUserDocumentAccess();

  // Detect if this product is a variant (has parent_product_id with variant relationship)
  // and fetch family product IDs for the popover filtering
  const [isVariantDevice, setIsVariantDevice] = useState(false);
  const [detectedParentProductId, setDetectedParentProductId] = useState<string | null>(null);
  const [computedFamilyProductIds, setComputedFamilyProductIds] = useState<string[] | undefined>(undefined);
  useEffect(() => {
    if (!productId) return;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('parent_product_id, parent_relationship_type')
        .eq('id', productId)
        .maybeSingle();
      const isVariant = !!data?.parent_product_id && data?.parent_relationship_type === 'variant';
      setIsVariantDevice(isVariant);
      const parentId = isVariant ? data!.parent_product_id : null;
      setDetectedParentProductId(parentId);

      // Fetch family member IDs (root + variants)
      const rootId = parentId || productId;
      const { data: familyData } = await supabase
        .from('products')
        .select('id')
        .eq('is_archived', false)
        .or(`id.eq.${rootId},and(parent_product_id.eq.${rootId},parent_relationship_type.eq.variant)`);
      if (familyData && familyData.length > 1) {
        setComputedFamilyProductIds(familyData.map(p => p.id));
      }
    })();
  }, [productId]);

  // Use prop if provided, otherwise use internally computed IDs
  const effectiveFamilyProductIds = familyProductIds || computedFamilyProductIds;

  const {
    scopes: docExclusionScopes,
    isFullyExcluded: isDocExcluded,
    toggleFullExclusion: toggleDocExclusionRaw,
    getExclusionScope: getDocExclusionScopeRaw,
    setExclusionScope: setDocExclusionScopeRaw,
    loaded: exclusionsLoaded
  } = useInheritanceExclusion(productId, true, 'document_ci_exclusion_scopes');
  const toggleDocExclusion = (docId: string) => toggleDocExclusionRaw(docId, []);

  // Shared documents from other devices that have scope including the current device
  const [sharedDocuments, setSharedDocuments] = useState<any[]>([]);

  // Optimistic update queues — applied on top of allDocuments for instant UI feedback
  const [optimisticDeletes, setOptimisticDeletes] = useState<Set<string>>(new Set());
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, any>>(new Map());
  const [optimisticAdds, setOptimisticAdds] = useState<any[]>([]);

  const [editingDocument, setEditingDocument] = useState<any>(null);
  // Removed assigningReviewers state - template instance reviewer assignment now in Edit dialog
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [bulkCopyDialogOpen, setBulkCopyDialogOpen] = useState(false); // kept for BulkStatusUpdate
  const [bulkMode, setBulkMode] = useState(false);

  // Column visibility
  const DOCUMENT_COLUMNS: ColumnDefinition[] = [
    { key: 'name', label: 'Name', required: true },
    { key: 'phase_name', label: 'Phase' },
    { key: 'sub_section', label: 'Section' },
    { key: 'authors_ids', label: 'Author' },
    { key: 'document_type', label: 'Document Type' },
    { key: 'is_record', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'date', label: 'Date' },
    { key: 'approval_date', label: 'Approved' },
    { key: 'scope', label: 'Scope' },
  ];
  const { data: columnPrefs } = useListColumnPreferences(companyId, productId, 'device_documents', 'list');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  // Hydrate from DB
  useEffect(() => {
    if (columnPrefs?.hidden_columns) {
      setHiddenColumns(columnPrefs.hidden_columns);
    }
  }, [columnPrefs]);
  const [bulkSelectedDocs, setBulkSelectedDocs] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [selectedBulkAction, setSelectedBulkAction] = useState<string>("");
  const [selectedBulkValue, setSelectedBulkValue] = useState<string>("");
  const [bulkDueDateValue, setBulkDueDateValue] = useState<Date | undefined>(undefined);
  const [draftDrawerDocument, setDraftDrawerDocument] = useState<DocumentCICard | null>(null);
  const [editingTemplateWithOnlyOffice, setEditingTemplateWithOnlyOffice] = useState<any>(null);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());
  const [documentDueDateConfig, setDocumentDueDateConfig] = useState<{
    days: number;
    timing: 'before' | 'after';
    phaseDateType: 'phase_end_date' | 'phase_start_date';
  } | null>(null);
  const [fetchedPhaseDates, setFetchedPhaseDates] = useState<Map<string, { start_date?: string; end_date?: string }>>(new Map());

  // Internal state for sidebar (used when not controlled from parent)
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const [internalSelectedDocs, setInternalSelectedDocs] = useState<Set<string>>(new Set());

  // Use external props if provided, otherwise use internal state
  const bulkSummarySidebarOpen = externalSidebarOpen ?? internalSidebarOpen;
  const setBulkSummaryDialogOpen = externalOnSidebarOpenChange ?? setInternalSidebarOpen;
  const selectedDocsForSummary = externalSelectedDocs ?? internalSelectedDocs;

  // Handler for toggling document selection for AI Summary
  const handleToggleDocForSummary = useCallback((docId: string) => {
    if (externalToggleDoc) {
      externalToggleDoc(docId);
    } else {
      setInternalSelectedDocs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(docId)) {
          newSet.delete(docId);
        } else {
          newSet.add(docId);
        }
        return newSet;
      });
    }
  }, [externalToggleDoc]);

  // Clear selected docs when sidebar closes (only for internal state)
  useEffect(() => {
    if (!bulkSummarySidebarOpen && !externalSelectedDocs) {
      setInternalSelectedDocs(new Set());
    }
  }, [bulkSummarySidebarOpen, externalSelectedDocs]);

  // Fetch Document CI lifecycle phases
  const {
    phaseDocuments: lifecyclePhaseDocuments,
    loading: lifecycleLoading,
    refetch: refetchPhaseDocuments
  } = usePhaseDocuments(companyId || '', productId);

  // Clear optimistic state when lifecyclePhaseDocuments updates (real data arrived)
  const lifecyclePhaseDocsRef = React.useRef(lifecyclePhaseDocuments);
  React.useEffect(() => {
    if (lifecyclePhaseDocsRef.current !== lifecyclePhaseDocuments) {
      lifecyclePhaseDocsRef.current = lifecyclePhaseDocuments;
      setOptimisticDeletes(new Set());
      setOptimisticUpdates(new Map());
      setOptimisticAdds([]);
    }
  }, [lifecyclePhaseDocuments]);

  // Optimistically add newly created document to list instantly
  React.useEffect(() => {
    if (newlyCreatedDoc?.id) {
      setOptimisticAdds(prev => {
        // Avoid duplicates
        if (prev.some(d => d.id === newlyCreatedDoc.id)) return prev;
        return [newlyCreatedDoc, ...prev];
      });
    }
  }, [newlyCreatedDoc]);

  // Background refetch when parent signals a refresh
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && refetchPhaseDocuments) {
      refetchPhaseDocuments();
    }
  }, [refreshTrigger]);

  // Fetch company phase positions for sorting
  const {
    getPhasePosition,
    loading: positionsLoading
  } = useCompanyPhasePositions(companyId || '');

  // Use improved isolated document operations
  const {
    isUpdating: isServiceUpdating,
    updateDocumentStatus,
    updateDocumentDeadline
  } = useIsolatedDocumentOperations(productId || '', companyId || '');
  const {
    activeRole,
    activeCompanyRole
  } = useCompanyRole();

  // Authors data for bulk operations
  const { authors: allAuthors } = useDocumentAuthors(companyId || '');

  // Document type categories for bulk category change
  const documentCategories = ['Standard', 'Template', 'Record', 'Form', 'Report', 'Policy', 'Procedure', 'Work Instruction', 'SOP', 'Other'];

  // Bulk operation progress tracking
  const { progress: bulkProgress, startOperation, updateProgress: updateBulkProgress, completeOperation } = useBulkOperationProgress();

  // Bulk update helper — routes template- prefixed IDs to phase_assigned_document_template table
  const bulkUpdateField = useCallback(async (field: string, value: any) => {
    if (bulkSelectedDocs.size === 0) return;
    const ids = Array.from(bulkSelectedDocs);
    let successCount = 0;
    let failCount = 0;

    startOperation(ids.length);

    for (let i = 0; i < ids.length; i++) {
      const docId = ids[i];
      const isTemplate = docId.startsWith('template-');
      const cleanId = isTemplate ? docId.replace(/^template-/, '') : docId;
      const table = isTemplate ? 'phase_assigned_document_template' : 'documents';

      updateBulkProgress({ completed: i, currentItem: cleanId });

      const { error } = await supabase
        .from(table)
        .update({ [field]: value })
        .eq("id", cleanId);
      if (error) {
        console.error('Bulk update error for', docId, '(table:', table, '):', error);
        failCount++;
      } else {
        successCount++;
      }
      updateBulkProgress({ completed: i + 1, succeeded: successCount, failed: failCount });
    }

    completeOperation();

    // Force refresh regardless
    refetchPhaseDocuments?.();
    handleRefreshData?.();

    if (failCount === 0) {
      toast.success(`Updated ${successCount} documents`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} updated, ${failCount} failed`);
    } else {
      toast.error(`All ${failCount} updates failed`);
    }
  }, [bulkSelectedDocs, refetchPhaseDocuments, handleRefreshData, startOperation, updateBulkProgress, completeOperation]);

  useEffect(() => {
    const loadDocumentDueDateConfig = async () => {
      if (!companyId) return;

      try {
        const orgData = await CompanyDataUpdateService.getCompanyOrganizationalData(companyId);
        if (orgData.documentDueDate) {
          setDocumentDueDateConfig(orgData.documentDueDate);
        }
      } catch (error) {
        console.error('Error loading document due date configuration:', error);
      }
    };

    loadDocumentDueDateConfig();
  }, [companyId]);

  // Fetch phase dates from database
  useEffect(() => {
    const fetchPhaseDates = async () => {
      if (!productId) return;

      try {
        const { data: lifecyclePhases, error } = await supabase
          .from('lifecycle_phases')
          .select('name, start_date, end_date')
          .eq('product_id', productId);

        if (error) {
          console.error('Error fetching phase dates:', error);
          return;
        }

        if (lifecyclePhases) {
          const phaseDatesMap = new Map<string, { start_date?: string; end_date?: string }>();
          lifecyclePhases.forEach(phase => {
            if (phase.name) {
              phaseDatesMap.set(phase.name, {
                start_date: phase.start_date,
                end_date: phase.end_date
              });
            }
          });
          setFetchedPhaseDates(phaseDatesMap);
        }
      } catch (error) {
        console.error('Error fetching phase dates:', error);
      }
    };

    fetchPhaseDates();
  }, [productId]);

  // Create a map of phase names to their dates
  // Prioritize fetched dates from database, fallback to dates from phases prop
  const phaseDatesMap = useMemo(() => {
    const map = new Map<string, { start_date?: string; end_date?: string }>();

    // First, add dates from phases prop
    phases.forEach(phase => {
      if (phase.name) {
        map.set(phase.name, {
          start_date: phase.start_date,
          end_date: phase.end_date
        });
      }
    });

    // Then, override with fetched dates from database (more reliable)
    fetchedPhaseDates.forEach((dates, phaseName) => {
      map.set(phaseName, dates);
    });

    return map;
  }, [phases, fetchedPhaseDates]);

  // Calculate due date based on company configuration
  const calculateDocumentDueDate = useCallback((phaseName?: string): string | undefined => {
    // If no configuration or no phase name, return undefined
    if (!documentDueDateConfig || !phaseName) {
      return undefined;
    }

    // Try exact match first
    let phaseDates = phaseDatesMap.get(phaseName);

    // If not found, try case-insensitive and trimmed match
    if (!phaseDates) {
      const normalizedPhaseName = phaseName.trim();
      for (const [mapPhaseName, dates] of phaseDatesMap.entries()) {
        if (mapPhaseName.trim().toLowerCase() === normalizedPhaseName.toLowerCase()) {
          phaseDates = dates;
          break;
        }
      }
    }

    if (!phaseDates) {
      return undefined;
    }

    // Determine which date to use based on configuration
    const referenceDateStr = documentDueDateConfig.phaseDateType === 'phase_end_date'
      ? phaseDates.end_date
      : phaseDates.start_date;

    if (!referenceDateStr) {
      return undefined;
    }

    // Parse the date string - handle both YYYY-MM-DD and other formats
    let year: number, month: number, day: number;

    if (referenceDateStr.includes('-')) {
      // YYYY-MM-DD format
      [year, month, day] = referenceDateStr.split('-').map(Number);
    } else if (referenceDateStr.includes('/')) {
      // MM/DD/YYYY or DD/MM/YYYY format
      const parts = referenceDateStr.split('/');
      // Try to detect format - if first part > 12, it's likely DD/MM/YYYY
      if (Number(parts[0]) > 12) {
        [day, month, year] = parts.map(Number);
      } else {
        [month, day, year] = parts.map(Number);
      }
    } else {
      // Try to parse as ISO date
      const date = new Date(referenceDateStr);
      if (isNaN(date.getTime())) {
        console.error('[calculateDocumentDueDate] Invalid date format:', referenceDateStr);
        return undefined;
      }
      year = date.getFullYear();
      month = date.getMonth() + 1;
      day = date.getDate();
    }

    // Create date in local timezone to avoid UTC conversion issues
    const referenceDate = new Date(year, month - 1, day);

    // Calculate the due date
    const days = documentDueDateConfig.days || 0;

    if (documentDueDateConfig.timing === 'before') {
      referenceDate.setDate(referenceDate.getDate() - days);
    } else {
      referenceDate.setDate(referenceDate.getDate() + days);
    }

    // Format back to YYYY-MM-DD without timezone conversion
    const calculatedYear = referenceDate.getFullYear();
    const calculatedMonth = String(referenceDate.getMonth() + 1).padStart(2, '0');
    const calculatedDay = String(referenceDate.getDate()).padStart(2, '0');

    const result = `${calculatedYear}-${calculatedMonth}-${calculatedDay}`;

    return result;
  }, [documentDueDateConfig, phaseDatesMap]);

  // Track whether shared docs have been loaded at least once
  const sharedDocsLoadedRef = React.useRef(false);

  // Fetch shared documents from other devices that have scope including this device
  // Wait for both exclusions AND own documents to finish loading to avoid flash
  useEffect(() => {
    if (!productId || !companyId || !exclusionsLoaded || lifecycleLoading) {
      // Only clear on initial load, not on refetches
      if (!sharedDocsLoadedRef.current && !lifecycleLoading && !exclusionsLoaded) setSharedDocuments([]);
      return;
    }

    const loadSharedDocs = async () => {
      // Find document IDs where current product is NOT excluded and scope was manually set
      const eligibleDocIds: string[] = [];
      for (const [docId, scope] of Object.entries(docExclusionScopes)) {
        if (!scope.isManualGroup) continue;
        const excluded = scope.excludedProductIds || [];
        if (!excluded.includes(productId)) {
          eligibleDocIds.push(docId);
        }
      }

      if (eligibleDocIds.length === 0) {
        setSharedDocuments([]);
        return;
      }

      // Get IDs of documents already owned by this product
      const ownDocIds = new Set<string>();
      Object.values(lifecyclePhaseDocuments).flat().forEach((doc: any) => {
        ownDocIds.add(doc.id);
      });

      // Filter out docs already in the current product's list (by ID)
      const missingDocIds = eligibleDocIds.filter(id => !ownDocIds.has(id));

      if (missingDocIds.length === 0) {
        setSharedDocuments([]);
        return;
      }

      // Fetch phase name map
      const { data: phasesData } = await supabase
        .from("company_phases")
        .select("id, name")
        .eq("company_id", companyId);
      const phaseNameMap = new Map<string, string>();
      (phasesData || []).forEach((p: any) => phaseNameMap.set(p.id, p.name));

      // Fetch from phase_assigned_document_template (not from current product)
      const { data: templateDocs } = await (supabase as any)
        .from('phase_assigned_document_template')
        .select('id, name, status, document_type, tech_applicability, created_at, updated_at, file_path, file_name, due_date, approval_date, phase_id, description, reviewer_group_ids, reviewers, sub_section, section_ids, document_reference, version, date, is_current_effective_version, brief_summary, authors_ids, need_template_update, is_record, reference_document_ids, tags, product_id')
        .in('id', missingDocIds)
        .neq('product_id', productId);

      // Also try documents table
      const { data: regularDocs } = await (supabase as any)
        .from('documents')
        .select('id, name, status, document_type, tech_applicability, created_at, updated_at, file_path, file_name, due_date, approval_date, phase_id, description, reviewer_group_ids, reviewers, sub_section, section_ids, document_reference, version, date, is_current_effective_version, brief_summary, authors_ids, need_template_update, is_record, reference_document_ids, template_source_id, document_scope, product_id')
        .in('id', missingDocIds)
        .neq('product_id', productId);

      const allFetched = [...(templateDocs || []), ...(regularDocs || [])];

      // Deduplicate by ID only — same-name docs on different devices are valid
      const seenIds = new Set<string>();
      const uniqueDocs = allFetched.filter((d: any) => {
        if (seenIds.has(d.id)) return false;
        seenIds.add(d.id);
        return true;
      });

      // Fetch source product names
      const sourceProductIds = [...new Set(uniqueDocs.map((d: any) => d.product_id).filter(Boolean))];
      const productNameMap = new Map<string, string>();
      if (sourceProductIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', sourceProductIds);
        (products || []).forEach((p: any) => productNameMap.set(p.id, p.name));
      }

      // Format shared docs
      const formatted = uniqueDocs.map((doc: any) => ({
        ...doc,
        _isSharedFromDevice: true,
        _sourceProductId: doc.product_id,
        _sourceProductName: productNameMap.get(doc.product_id) || 'Unknown Device',
        company_phases: {
          id: doc.phase_id,
          name: phaseNameMap.get(doc.phase_id) || 'No Phase',
          company_id: companyId,
        },
      }));

      setSharedDocuments(formatted);
      sharedDocsLoadedRef.current = true;
    };

    loadSharedDocs();
  }, [productId, companyId, exclusionsLoaded, lifecycleLoading, docExclusionScopes]);

  // Get all documents in a flat list
  const allDocuments = useMemo(() => {
    const docs: any[] = [];
    Object.entries(lifecyclePhaseDocuments).forEach(([phaseName, documents]) => {
      documents.forEach((doc: any) => {
        // Calculate due date based on company configuration
        // Document's own due_date takes priority over calculated date
        const existingDueDate = doc.due_date || doc.dueDate;
        const calculatedDueDate = calculateDocumentDueDate(phaseName);

        // Priority: 1) Document's own due_date, 2) Calculated date from config, 3) null
        const finalDueDate = existingDueDate
          ? existingDueDate
          : (documentDueDateConfig && calculatedDueDate ? calculatedDueDate : null);

        docs.push({
          id: `template-${doc.id}`,
          name: doc.name,
          status: doc.status || 'Not Started',
          document_type: doc.document_type || doc.documentType || 'Standard',
          tech_applicability: doc.tech_applicability,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          file_path: doc.file_path || doc.filePath,
          file_name: doc.file_name || doc.fileName,
          phase_name: phaseName,
          due_date: finalDueDate,
          approval_date: doc.approval_date,
          phase_id: doc.phase_id || doc.phaseId,
          description: doc.description || doc.description,
          template_source_id: doc.template_source_id,
          reviewers: doc.reviewers,
          reviewer_group_ids: doc.reviewer_group_ids, // Add reviewer group data
          reviewer_group_id: doc.reviewer_group_id, // Add single reviewer group for backward compatibility
          // Compliance fields
          sub_section: doc.sub_section,
          document_reference: doc.document_reference,
          version: doc.version,
          date: doc.date,
          start_date: doc.start_date,
          is_current_effective_version: doc.is_current_effective_version,
          brief_summary: doc.brief_summary,
          authors_ids: doc.authors_ids,
          need_template_update: doc.need_template_update,
          is_record: doc.is_record,
          reference_document_ids: doc.reference_document_ids,
          tags: doc.tags || [],
          isTemplate: true,
          isInheritedFromMaster: doc._isInheritedFromMaster || doc.isInheritedFromMaster || false,
          masterProductName: doc._masterProductName || doc.masterProductName,
          masterProductId: doc._masterProductId || doc.masterProductId,
        });
      });
    });
    // Add shared documents from other devices that have scope including this device
    sharedDocuments.forEach((doc: any) => {
      const phaseName = doc.company_phases?.name || 'No Phase';
      const existingDueDate = doc.due_date;
      const calculatedDueDate = calculateDocumentDueDate(phaseName);
      const finalDueDate = existingDueDate
        ? existingDueDate
        : (documentDueDateConfig && calculatedDueDate ? calculatedDueDate : null);

      docs.push({
        id: `template-${doc.id}`,
        name: doc.name,
        status: doc.status || 'Not Started',
        document_type: doc.document_type || 'Standard',
        tech_applicability: doc.tech_applicability,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        file_path: doc.file_path,
        file_name: doc.file_name,
        phase_name: phaseName,
        due_date: finalDueDate,
        approval_date: doc.approval_date,
        phase_id: doc.phase_id,
        description: doc.description,
        template_source_id: doc.template_source_id,
        reviewers: doc.reviewers,
        reviewer_group_ids: doc.reviewer_group_ids,
        sub_section: doc.sub_section,
        document_reference: doc.document_reference,
        version: doc.version,
        date: doc.date,
        start_date: doc.start_date,
        is_current_effective_version: doc.is_current_effective_version,
        brief_summary: doc.brief_summary,
        authors_ids: doc.authors_ids,
        need_template_update: doc.need_template_update,
        is_record: doc.is_record,
        reference_document_ids: doc.reference_document_ids,
        tags: doc.tags || [],
        isTemplate: true,
        isInheritedFromMaster: false,
        isSharedFromDevice: true,
        sourceProductId: doc._sourceProductId,
        sourceProductName: doc._sourceProductName,
      });
    });

    const inherited = docs.filter(d => d.isInheritedFromMaster);
    if (inherited.length > 0 || docs.length > 0) {
      console.log(`[VariantToggle] isVariant=${isVariantDevice}, total=${docs.length}, inherited=${inherited.length}, shared=${sharedDocuments.length}, excluded=${inherited.filter(d => isDocExcluded(d.id.replace(/^template-/, ''), productId)).length}`);
    }

    // Apply optimistic updates for instant UI feedback
    let result = docs;

    // Remove optimistically deleted docs
    if (optimisticDeletes.size > 0) {
      result = result.filter(d => !optimisticDeletes.has(d.id));
    }

    // Apply optimistic field updates
    if (optimisticUpdates.size > 0) {
      result = result.map(d => {
        const update = optimisticUpdates.get(d.id);
        return update ? { ...d, ...update } : d;
      });
    }

    // Add optimistically created docs
    if (optimisticAdds.length > 0) {
      result = [...optimisticAdds, ...result];
    }

    return result;
  }, [lifecyclePhaseDocuments, calculateDocumentDueDate, documentDueDateConfig, isVariantDevice, isDocExcluded, sharedDocuments, optimisticDeletes, optimisticUpdates, optimisticAdds]);

  // Unified scope getter/setter — always uses product-level overrides
  const getDocExclusionScope = useCallback((docId: string) => {
    const normalized = docId.replace(/^template-/, '');
    return getDocExclusionScopeRaw(normalized);
  }, [getDocExclusionScopeRaw]);

  const setDocExclusionScope = useCallback((docId: string, scope: import("@/hooks/useInheritanceExclusion").ItemExclusionScope) => {
    const normalized = docId.replace(/^template-/, '');
    setDocExclusionScopeRaw(normalized, scope);
  }, [setDocExclusionScopeRaw]);

  // Handle document scope change: save scope on current product, mirror to family
  const handleDocScopeChange = useCallback(async (docId: string, newScope: import("@/hooks/useInheritanceExclusion").ItemExclusionScope) => {
    const normalized = docId.replace(/^template-/, '');
    const scopeWithFlag = { ...newScope, isManualGroup: true };

    // 1. Save scope on current product
    await setDocExclusionScopeRaw(normalized, scopeWithFlag);

    if (!companyId || !productId) return;

    // 2. Mirror scope to family products (shared access, no document copying)
    await mirrorScopeToFamilyProducts(normalized, scopeWithFlag, 'document_ci_exclusion_scopes', productId, companyId, detectedParentProductId);
  }, [productId, companyId, setDocExclusionScopeRaw, detectedParentProductId]);

  const availablePhases = useMemo(() => {
    return Object.keys(lifecyclePhaseDocuments).sort((a, b) => {
      // "No Phase" always last
      if (a === 'No Phase') return 1;
      if (b === 'No Phase') return -1;

      const phasePositions = new Map();
      phases.forEach(phase => {
        phasePositions.set(phase.name, phase.position || 0);
      });

      // Get positions, defaulting to a high number if not found
      const positionA = phasePositions.get(a);
      const positionB = phasePositions.get(b);

      // If both have positions, sort by position
      if (positionA !== undefined && positionB !== undefined) {
        return positionA - positionB;
      }

      // If only one has a position, put it first
      if (positionA !== undefined) return -1;
      if (positionB !== undefined) return 1;

      // If neither has a position, sort alphabetically but put Concept first
      if (a.toLowerCase().includes('concept')) return -1;
      if (b.toLowerCase().includes('concept')) return 1;

      return a.localeCompare(b);
    });
  }, [lifecyclePhaseDocuments, phases]);

  // Filter documents based on status, phase filters, search query, author, date, and segment
  const filteredDocuments = useMemo(() => {
    let filtered = allDocuments;

    // Hide excluded documents (variant only)
    if (hideExcluded && isVariantDevice) {
      filtered = filtered.filter(doc => {
        if (!doc.isInheritedFromMaster) return true;
        return !isDocExcluded(doc.id.replace(/^template-/, ''));
      });
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(doc => {
        const uiStatus = mapDBStatusToUI(doc.status);
        return statusFilter.includes(uiStatus);
      });
    }

    // Apply phase filter
    if (phaseFilter.length > 0) {
      const hasCore = phaseFilter.includes('__CORE__');
      const regularPhases = phaseFilter.filter(p => p !== '__CORE__');
      filtered = filtered.filter(doc => {
        if (hasCore && (doc.phase_name === 'No Phase' || !doc.phase_name)) return true;
        if (regularPhases.length > 0 && regularPhases.includes(doc.phase_name)) return true;
        return false;
      });
    }

    // Apply author filter
    if (authorFilter.length > 0) {
      filtered = filtered.filter(doc => {
        const docAuthorIds = doc.authors_ids || [];
        return authorFilter.some(authorId => docAuthorIds.includes(authorId));
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.phase_name?.toLowerCase().includes(query)
      );
    }

    // Apply section filter
    if (sectionFilter.length > 0) {
      filtered = filtered.filter(doc => {
        const docSection = doc.sub_section || '';
        return sectionFilter.includes(docSection);
      });
    }

    // Apply tag filter
    if (tagFilter.length > 0) {
      filtered = filtered.filter(doc => {
        const docTags = doc.tags || [];
        return tagFilter.some((tag: string) => docTags.includes(tag));
      });
    }

    // Apply ref doc tag filter
    if (refTagFilter.length > 0) {
      filtered = filtered.filter(doc => {
        const refIds = doc.reference_document_ids || [];
        if (refIds.length === 0) return false;
        return refIds.some((refId: string) => {
          const refTags = refDocTagMap[refId] || [];
          return refTagFilter.some((tag: string) => refTags.includes(tag));
        });
      });
    }

    // Sort documents
    filtered.sort((a, b) => {
      if (sortByDate !== 'none') {
        // Alphabetical field sorts
        const alphaSort = (fieldA: string, fieldB: string, isAsc: boolean) => {
          if (!fieldA && !fieldB) return 0;
          if (!fieldA) return 1;
          if (!fieldB) return -1;
          return isAsc ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        };

        if (sortByDate === 'name_asc' || sortByDate === 'name_desc') {
          return alphaSort(a.name || '', b.name || '', sortByDate === 'name_asc');
        }
        if (sortByDate === 'phase_asc' || sortByDate === 'phase_desc') {
          return alphaSort(a.phase_name || '', b.phase_name || '', sortByDate === 'phase_asc');
        }
        if (sortByDate === 'section_asc' || sortByDate === 'section_desc') {
          return alphaSort(a.sub_section || '', b.sub_section || '', sortByDate === 'section_asc');
        }
        if (sortByDate === 'author_asc' || sortByDate === 'author_desc') {
          const authorA = Array.isArray(a.authors_ids) ? a.authors_ids.join(', ') : '';
          const authorB = Array.isArray(b.authors_ids) ? b.authors_ids.join(', ') : '';
          return alphaSort(authorA, authorB, sortByDate === 'author_asc');
        }
        if (sortByDate === 'status_asc' || sortByDate === 'status_desc') {
          return alphaSort(a.status || '', b.status || '', sortByDate === 'status_asc');
        }
        if (sortByDate === 'category_asc' || sortByDate === 'category_desc') {
          return alphaSort(a.document_type || '', b.document_type || '', sortByDate === 'category_asc');
        }
        if (sortByDate === 'doctype_asc' || sortByDate === 'doctype_desc') {
          const dtA = a.is_record ? 'Record' : 'Document';
          const dtB = b.is_record ? 'Record' : 'Document';
          return alphaSort(dtA, dtB, sortByDate === 'doctype_asc');
        }

        // Date-based sorts
        let dateA = '';
        let dateB = '';
        let isNewest = false;

        if (sortByDate === 'updated_newest' || sortByDate === 'updated_oldest') {
          dateA = a.updated_at || a.created_at || '';
          dateB = b.updated_at || b.created_at || '';
          isNewest = sortByDate === 'updated_newest';
        } else if (sortByDate === 'due_newest' || sortByDate === 'due_oldest') {
          dateA = a.due_date || a.deadline || '';
          dateB = b.due_date || b.deadline || '';
          isNewest = sortByDate === 'due_newest';
        } else if (sortByDate === 'approval_newest' || sortByDate === 'approval_oldest') {
          dateA = a.approval_date || '';
          dateB = b.approval_date || '';
          isNewest = sortByDate === 'approval_newest';
        } else if (sortByDate === 'date_newest' || sortByDate === 'date_oldest') {
          dateA = a.date || a.created_at || '';
          dateB = b.date || b.created_at || '';
          isNewest = sortByDate === 'date_newest';
        }

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();

        return isNewest ? timeB - timeA : timeA - timeB;
      }

      // Default sort: by phase position, then by name
      const positionA = getPhasePosition(a.phase_name || '');
      const positionB = getPhasePosition(b.phase_name || '');

      if (positionA !== positionB) {
        return positionA - positionB;
      }

      return a.name.localeCompare(b.name);
    });


    return filtered;
  }, [allDocuments, statusFilter, phaseFilter, searchQuery, authorFilter, sectionFilter, tagFilter, refTagFilter, refDocTagMap, sortByDate, getPhasePosition, hideExcluded, isVariantDevice, isDocExcluded]);

  // Get documents that can be selected for AI Summary (have file_path)
  const selectableDocIds = useMemo(() => {
    return filteredDocuments
      .filter(doc => !!doc.file_path)
      .map(doc => doc.id);
  }, [filteredDocuments]);

  // Check if all selectable documents are selected
  const allSelectableSelected = useMemo(() => {
    if (selectableDocIds.length === 0) return false;
    return selectableDocIds.every(id => selectedDocsForSummary.has(id));
  }, [selectableDocIds, selectedDocsForSummary]);

  // Handler for Select All / Deselect All
  const handleSelectAllDocs = useCallback(() => {
    if (allSelectableSelected) {
      // Deselect all
      if (externalToggleDoc) {
        // For external state, toggle each selected doc
        selectableDocIds.forEach(id => {
          if (selectedDocsForSummary.has(id)) {
            externalToggleDoc(id);
          }
        });
      } else {
        setInternalSelectedDocs(new Set());
      }
    } else {
      // Select all
      if (externalToggleDoc) {
        // For external state, toggle each unselected doc
        selectableDocIds.forEach(id => {
          if (!selectedDocsForSummary.has(id)) {
            externalToggleDoc(id);
          }
        });
      } else {
        setInternalSelectedDocs(new Set(selectableDocIds));
      }
    }
  }, [allSelectableSelected, selectableDocIds, selectedDocsForSummary, externalToggleDoc]);

  const addProcessingDocument = (docId: string) => {
    setProcessingDocuments(prev => new Set(prev).add(docId));
  };
  const removeProcessingDocument = (docId: string) => {
    setProcessingDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(docId);
      return newSet;
    });
  };
  const handleStatusChange = async (document: DocumentCICard, status: DocumentUIStatus) => {
    const docId = document.id;
    const dbStatus = mapUIStatusToDocument(status);
    addProcessingDocument(docId);
    try {
      const success = await updateDocumentStatus(docId, dbStatus);
      if (success) {
        // Update local document state immediately for instant UI response
        document.status = dbStatus;

        // Trigger callbacks to update parent component state
        if (onDocumentStatusChange) {
          onDocumentStatusChange(docId, dbStatus);
        }
        if (handleRefreshData) {
          handleRefreshData();
        }
        toast.success(`Document status updated to ${status}`);
      }
    } catch (error) {
      console.error(`[AllActivePhasesTab] Failed to update status:`, error);
      toast.error("Failed to update document status");
    } finally {
      removeProcessingDocument(docId);
    }
  };
  const handleEditDocument = (document: DocumentCICard) => {
    setEditingDocument(document);
  };

  const handleEditTemplateWithOnlyOffice = (document: DocumentCICard) => {
    setEditingTemplateWithOnlyOffice(document);
  };

  // Removed handleAssignReviewers for template instances - now handled in Edit Instance dialog
  // Removed handleViewDocument - viewing now handled in Edit Instance dialog
  const handleDocumentUpdated = (updatedDocument: any) => {
    onDocumentUpdated(updatedDocument);
    setEditingDocument(null);

    // Optimistic instant UI update — patch document in allDocuments immediately
    const docId = updatedDocument.id?.startsWith('template-') ? updatedDocument.id : `template-${updatedDocument.id}`;
    setOptimisticUpdates(prev => {
      const next = new Map(prev);
      next.set(docId, {
        name: updatedDocument.name,
        status: updatedDocument.status,
        due_date: updatedDocument.due_date,
        description: updatedDocument.description,
        reviewer_group_ids: updatedDocument.reviewer_group_ids,
        authors_ids: updatedDocument.authors_ids,
        tags: updatedDocument.tags,
        updated_at: new Date().toISOString(),
        file_path: updatedDocument.file_path,
        file_name: updatedDocument.file_name,
        filePath: updatedDocument.file_path,
        fileName: updatedDocument.file_name,
      });
      return next;
    });

    // Background refresh for consistency (non-blocking)
    if (refetchPhaseDocuments) refetchPhaseDocuments();
    if (handleRefreshData) handleRefreshData();
  };

  const handleCreateInStudio = useCallback((doc: any) => {
    setDraftDrawerDocument(doc);
  }, []);

  const handleDeleteDocument = async (documentId: string) => {
    if (!productId || !companyId) {
      toast.error('Cannot delete document: missing context');
      return;
    }

    // Find the document to delete
    const documentToDelete = allDocuments.find(doc => doc.id === documentId);

    if (!documentToDelete) {
      toast.error('Document not found');
      return;
    }

    // Normalize document ID (remove 'template-' prefix if present)
    const normalizedDocId = documentToDelete.id.replace(/^template-/, '');

    addProcessingDocument(documentToDelete.id);

    try {
      // Try to delete from phase_assigned_document_template first
      let deleteError = null;

      const { error: phaseError } = await supabase
        .from('phase_assigned_document_template')
        .delete()
        .eq('id', normalizedDocId);

      if (phaseError) {
        // If not found in phase_assigned_document_template, try documents table
        const { error: docError } = await supabase
          .from('documents')
          .delete()
          .eq('id', normalizedDocId)
          .eq('product_id', productId)
          .eq('company_id', companyId);

        if (docError) {
          deleteError = docError;
        }
      }

      if (deleteError) {
        console.error('[AllActivePhasesTab] Error deleting document:', deleteError);
        toast.error('Failed to delete document');
        return;
      }

      // Log document deletion to audit trail
      const { data: { user } } = await supabase.auth.getUser();
      if (user && companyId) {
        await AuditTrailService.logDocumentRecordEvent({
          userId: user.id,
          companyId,
          action: 'document_deleted',
          entityType: 'document',
          entityId: normalizedDocId,
          entityName: documentToDelete.name,
          actionDetails: { product_id: productId },
        });
      }

      toast.success(`Document "${documentToDelete.name}" deleted successfully`);

      // Optimistic instant UI update — remove from allDocuments immediately
      setOptimisticDeletes(prev => new Set([...prev, documentToDelete.id]));

      // Background refresh for consistency (non-blocking)
      if (refetchPhaseDocuments) refetchPhaseDocuments();
      if (handleRefreshData) handleRefreshData();
    } catch (error) {
      console.error('[AllActivePhasesTab] Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      removeProcessingDocument(documentToDelete.id);
    }
  };

  const handleCopyDocument = async (doc: DocumentCICard) => {
    if (!productId || !companyId) {
      toast.error('Cannot copy document: missing context');
      return;
    }

    const normalizedDocId = doc.id.replace(/^template-/, '');
    addProcessingDocument(doc.id);

    try {
      // Fetch the full document record from phase_assigned_document_template
      const { data: original, error: fetchError } = await supabase
        .from('phase_assigned_document_template')
        .select('*')
        .eq('id', normalizedDocId)
        .maybeSingle();

      if (fetchError || !original) {
        toast.error('Could not find the original document to copy');
        return;
      }

      // Build the copy — use current device's productId, reset status, append (copy) to name
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

      const { data: insertedData, error: insertError } = await supabase
        .from('phase_assigned_document_template')
        .insert({
          ...copyFields,
          name: `${original.name} (copy)`,
          product_id: productId,
          company_id: companyId,
          status: 'Not Started',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(`Created copy: ${original.name}`);

      // Optimistic instant UI update — add copy to allDocuments immediately
      if (insertedData) {
        const copiedDoc = {
          ...doc,
          id: `template-${insertedData.id}`,
          name: `${original.name} (copy)`,
          status: 'Not Started',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setOptimisticAdds(prev => [copiedDoc, ...prev]);
      }

      // Background refresh for consistency (non-blocking)
      if (refetchPhaseDocuments) refetchPhaseDocuments();
      if (handleRefreshData) handleRefreshData();
    } catch (error) {
      console.error('[AllActivePhasesTab] Error copying document:', error);
      toast.error('Failed to copy document');
    } finally {
      removeProcessingDocument(doc.id);
    }
  };

  // Removed handleReviewersUpdated - template instance reviewer assignment now in Edit dialog
  // Check if we have any documents from lifecyclePhaseDocuments OR phases prop
  const hasNoData = Object.keys(lifecyclePhaseDocuments).length === 0 && phases.length === 0;

  if (hasNoData && !lifecycleLoading) {
    return <Card>
      <CardContent className="p-6 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="font-medium text-lg mb-2">{lang('document.noActivePhases')}</h3>
        <p className="text-sm text-muted-foreground">
          {lang('document.noActivePhasesDescription')}
        </p>
      </CardContent>
    </Card>;
  }
  return <div className="space-y-6">
    {/* Bulk Delete Confirmation */}
    <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {bulkSelectedDocs.size} Document{bulkSelectedDocs.size !== 1 ? 's' : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the selected documents. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => {
              setBulkDeleteConfirmOpen(false);
              const ids = Array.from(bulkSelectedDocs);
              for (const docId of ids) {
                await handleDeleteDocument(docId);
              }
              setBulkSelectedDocs(new Set());
              setBulkMode(false);
              toast.success(`Deleted ${ids.length} document(s)`);
            }}
          >
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {/* Document List */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {(() => {
                const activeFilters = [];
                if (statusFilter.length > 0) activeFilters.push(`${lang('document.status')}: ${statusFilter.join(', ')}`);
                if (phaseFilter.length > 0) activeFilters.push(`${lang('document.phase')}: ${phaseFilter.join(', ')}`);
                return activeFilters.length > 0 ? lang('document.filteredDocuments') : lang('document.allDocuments');
              })()}
            </CardTitle>
            <Badge variant="secondary">
              {lang('document.documentsCount', { filtered: filteredDocuments.length, total: allDocuments.length })}
            </Badge>
          </div>
          {(onAddDocumentClick || allDocuments.length > 0) && (
            <div className="flex items-center gap-2">
              {allDocuments.length > 0 && (
                <>
                  {viewMode === 'list' && (
                    <ColumnVisibilitySettings
                      companyId={companyId}
                      productId={productId}
                      module="device_documents"
                      columns={DOCUMENT_COLUMNS}
                      hiddenColumns={hiddenColumns}
                      onHiddenColumnsChange={setHiddenColumns}
                    />
                  )}
                  <Button
                    onClick={() => setBulkSummaryDialogOpen(true)}
                    size="sm"
                    variant="outline"
                    disabled={disabled}
                    className="hover:bg-purple-50 hover:border-purple-300"
                  >
                    <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                    AI Summary
                  </Button>
                  <Button
                    onClick={() => {
                      setBulkMode(!bulkMode);
                      if (bulkMode) setBulkSelectedDocs(new Set());
                    }}
                    size="sm"
                    variant={bulkMode ? "default" : "outline"}
                    disabled={disabled}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {bulkMode ? 'Cancel Bulk' : 'Bulk'}
                  </Button>
                </>
              )}
              {onAddDocumentClick && (
                <Button onClick={onAddDocumentClick} size="sm" disabled={disabled}>
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('document.addDocument')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Action Bar */}
        {bulkMode && (
          <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg sticky top-0 z-10">
            {/* Progress indicator */}
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
              onValueChange={(val) => {
                setSelectedBulkAction(val);
                setSelectedBulkValue("");
                setBulkDueDateValue(undefined);
              }}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value="delete">Delete</SelectItem>}
                <SelectItem value="status">Set Status</SelectItem>
                <SelectItem value="category">Set Category</SelectItem>
                <SelectItem value="authors">Set Authors</SelectItem>
                <SelectItem value="due_date">Set Due Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Secondary input based on selected action */}
            {selectedBulkAction === 'status' && (
              <Select value={selectedBulkValue} onValueChange={setSelectedBulkValue}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
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
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {documentCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedBulkAction === 'authors' && (
              <Select value={selectedBulkValue} onValueChange={setSelectedBulkValue}>
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <SelectValue placeholder="Select author..." />
                </SelectTrigger>
                <SelectContent>
                  {allAuthors.map(author => (
                    <SelectItem key={author.id} value={author.id}>{author.name}</SelectItem>
                  ))}
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

            {/* Action button */}
            {selectedBulkAction === 'delete' ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={bulkSelectedDocs.size === 0}
                onClick={() => setBulkDeleteConfirmOpen(true)}
                className="h-8 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            ) : selectedBulkAction && (
              <Button
                size="sm"
                disabled={
                  bulkSelectedDocs.size === 0 ||
                  (selectedBulkAction === 'due_date' ? !bulkDueDateValue : !selectedBulkValue)
                }
                onClick={async () => {
                  if (selectedBulkAction === 'status') {
                    await bulkUpdateField('status', selectedBulkValue);
                  } else if (selectedBulkAction === 'category') {
                    await bulkUpdateField('document_type', selectedBulkValue);
                  } else if (selectedBulkAction === 'authors') {
                    await bulkUpdateField('authors_ids', [selectedBulkValue]);
                  } else if (selectedBulkAction === 'due_date' && bulkDueDateValue) {
                    await bulkUpdateField('due_date', bulkDueDateValue.toISOString());
                  }
                  setSelectedBulkAction("");
                  setSelectedBulkValue("");
                  setBulkDueDateValue(undefined);
                }}
                className="h-8 text-xs"
              >
                Update
              </Button>
            )}
            </div>
          </div>
        )}
        {/* Select All button - only visible when AI Summary sidebar is open */}
        {bulkSummarySidebarOpen && selectableDocIds.length > 0 && (
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <Button
              onClick={handleSelectAllDocs}
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              {allSelectableSelected ? 'Deselect All' : `Select All (${selectableDocIds.length})`}
            </Button>
          </div>
        )}
        {(lifecycleLoading || positionsLoading) && filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {lang('document.loadingDocuments')}
          </div>
        ) : filteredDocuments.length === 0 && !lifecycleLoading && !positionsLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{lang('document.noDocumentsMatchingFilters')}</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View - DataTable */
          <DocumentListView
            documents={filteredDocuments}
            onEdit={handleEditDocument}
            onView={setViewingDocument}
            onDelete={isAdmin ? handleDeleteDocument : () => {}}
            onCopy={handleCopyDocument}
            onCreateInStudio={handleCreateInStudio}
            hideDelete={!isAdmin}
            processingDocuments={processingDocuments}
            disabled={disabled}
            companyId={companyId}
            tableSort={tableSort}
            onTableSortChange={onTableSortChange}
            selectedDocIds={selectedDocsForSummary}
            onToggleDocSelection={handleToggleDocForSummary}
            isSidebarOpen={bulkSummarySidebarOpen}
            isVariant={isVariantDevice}
            isDocExcluded={(docId: string) => isDocExcluded(docId.replace(/^template-/, ''), productId)}
            onToggleDocExclusion={(docId: string) => toggleDocExclusion(docId.replace(/^template-/, ''))}
            productId={productId}
            hiddenColumns={hiddenColumns}
            getDocExclusionScope={(docId: string) => getDocExclusionScope(docId.replace(/^template-/, ''))}
            onSetDocExclusionScope={handleDocScopeChange}
            familyProductIds={effectiveFamilyProductIds}
            bulkMode={bulkMode}
            bulkSelectedDocs={bulkSelectedDocs}
            onToggleBulkDoc={(docId: string) => {
              setBulkSelectedDocs(prev => {
                const next = new Set(prev);
                if (next.has(docId)) next.delete(docId); else next.add(docId);
                return next;
              });
            }}
          />
        ) : (
          /* Card View */
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3">
                {bulkMode && (
                  <div className="pt-5">
                    <Checkbox
                      checked={bulkSelectedDocs.has(doc.id)}
                      onCheckedChange={() => {
                        setBulkSelectedDocs(prev => {
                          const next = new Set(prev);
                          if (next.has(doc.id)) next.delete(doc.id); else next.add(doc.id);
                          return next;
                        });
                      }}
                      className="h-5 w-5"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <DocumentCICardComponent
                    document={doc}
                    companyId={companyId}
                    productId={productId}
                    phaseStartDate={doc.phase_name ? phaseDatesMap.get(doc.phase_name)?.start_date : undefined}
                    phaseEndDate={doc.phase_name ? phaseDatesMap.get(doc.phase_name)?.end_date : undefined}
                    onEdit={handleEditDocument}
                    onAssignReviewers={() => { }}
                    onView={setViewingDocument}
                    onEditTemplate={handleEditTemplateWithOnlyOffice}
                    onRefreshData={handleRefreshData}
                    onDelete={isAdmin ? handleDeleteDocument : undefined}
                    onCopy={handleCopyDocument}
                    isProcessing={processingDocuments.has(doc.id)}
                    disabled={disabled}
                    isSidebarOpen={bulkSummarySidebarOpen}
                    isSelected={selectedDocsForSummary.has(doc.id)}
                    onToggleSelect={handleToggleDocForSummary}
                    onCreateDraft={handleCreateInStudio}
                    isExcludedFromVariant={isDocExcluded(doc.id.replace(/^template-/, ''), productId)}
                    onToggleExclusion={(docId: string) => toggleDocExclusion(docId.replace(/^template-/, ''))}
                    exclusionScope={getDocExclusionScope(doc.id.replace(/^template-/, ''))}
                    onSetExclusionScope={handleDocScopeChange}
                    familyProductIds={effectiveFamilyProductIds}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Edit Document Dialog */}
    {editingDocument && companyId && productId && <EditDocumentDialog open={!!editingDocument} onOpenChange={open => !open && setEditingDocument(null)} document={editingDocument} onDocumentUpdated={handleDocumentUpdated} documentType="template-instance" productId={productId} companyId={companyId} handleRefreshData={handleRefreshData} />}

    {/* Assign Reviewers Dialog removed for template instances - now handled in Edit Instance dialog */}

    {/* Document Viewer */}
    {viewingDocument && companyId && <DocumentViewer open={!!viewingDocument} onOpenChange={open => !open && setViewingDocument(null)} documentId={viewingDocument.id} documentName={viewingDocument.name} companyId={companyId} companyRole={activeRole || 'viewer'} reviewerGroupId="" documentFile={viewingDocument.file_path ? {
      path: viewingDocument.file_path,
      name: viewingDocument.file_name || viewingDocument.name,
      type: 'pdf'
    } : undefined} onStatusChanged={(docId, newStatus) => {
      // Refresh document list when status is changed in DocumentViewer
      if (handleRefreshData) {
        handleRefreshData();
      }
      // Also notify parent component if callback exists
      if (onDocumentStatusChange) {
        onDocumentStatusChange(docId, newStatus);
      }
    }} />}

    {/* OnlyOffice Editor Dialog for Template Editing */}
    <OnlyOfficeEditorDialog
      open={!!editingTemplateWithOnlyOffice}
      onOpenChange={(open) => !open && setEditingTemplateWithOnlyOffice(null)}
      document={editingTemplateWithOnlyOffice}
      documentServerUrl={import.meta.env.VITE_ONLYOFFICE_SERVER_URL || "/api/onlyoffice/"}
      onDocumentSaved={(doc) => {
        handleRefreshData?.();
        setEditingTemplateWithOnlyOffice(null);
      }}
    />

    {/* Bulk Copy Documents Dialog removed — scope popup handles cross-device copying */}

    {/* Bulk Status Update Dialog */}
    {companyId && productId && (
      <BulkStatusUpdateDialog
        open={bulkStatusDialogOpen}
        onOpenChange={(open) => {
          setBulkStatusDialogOpen(open);
          if (!open) {
            if (refetchPhaseDocuments) refetchPhaseDocuments();
            handleRefreshData?.();
          }
        }}
        documents={allDocuments.map(doc => ({
          id: doc.id.replace(/^template-/, ''),
          name: doc.name,
          status: doc.status,
          document_type: doc.document_type,
          phase_name: doc.phase_name
        }))}
        companyId={companyId}
        productId={productId}
        onUpdateComplete={() => {
          handleRefreshData?.();
          refetchPhaseDocuments?.();
        }}
      />
    )}

    {/* Bulk Document Summary Sidebar */}
    {companyId && (
      <BulkDocumentSummarySidebar
        open={bulkSummarySidebarOpen}
        onOpenChange={setBulkSummaryDialogOpen}
        documents={allDocuments.map(doc => ({
          id: doc.id,
          name: doc.name,
          file_path: doc.file_path,
          file_name: doc.file_name,
          document_type: doc.document_type,
          phase_name: doc.phase_name,
          status: doc.status
        }))}
        companyId={companyId}
        selectedDocIds={selectedDocsForSummary}
        onToggleDocSelection={handleToggleDocForSummary}
      />
    )}

    {/* Document Draft Drawer */}
    <DocumentDraftDrawer
      open={!!draftDrawerDocument}
      onOpenChange={async (open) => {
        if (!open && draftDrawerDocument) {
          const rawId = draftDrawerDocument.id.replace(/^template-/, '');
          const docId = draftDrawerDocument.id.startsWith('template-') ? draftDrawerDocument.id : `template-${draftDrawerDocument.id}`;
          // Fetch only the edited document to update its card
          const { data } = await supabase
            .from('phase_assigned_document_template')
            .select('name, status, due_date, document_type, sub_section, authors_ids, reference_document_ids, tags, updated_at, description, reviewer_group_ids')
            .eq('id', rawId)
            .single();
          if (data) {
            setOptimisticUpdates(prev => {
              const next = new Map(prev);
              next.set(docId, { ...data });
              return next;
            });
          }
          setDraftDrawerDocument(null);
        }
      }}
      documentId={draftDrawerDocument?.id || ''}
      documentName={draftDrawerDocument?.name || ''}
      documentType={draftDrawerDocument?.document_type || 'Standard'}
      productId={productId}
      companyId={companyId}
      onDocumentSaved={() => {
        setDraftDrawerDocument(null);
        refetchPhaseDocuments?.();
        handleRefreshData?.();
      }}
      filePath={draftDrawerDocument?.file_path}
      fileName={draftDrawerDocument?.file_name}
    />
  </div>;
}