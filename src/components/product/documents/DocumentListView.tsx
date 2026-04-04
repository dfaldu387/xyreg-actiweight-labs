import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, FileEdit, Send, MoreHorizontal, Link, Copy } from "lucide-react";
import { InheritanceExclusionPopover } from "@/components/shared/InheritanceExclusionPopover";
import { ItemExclusionScope } from "@/hooks/useInheritanceExclusion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SendToReviewGroupDialog } from '@/components/documents/SendToReviewGroupDialog';
import { CopyDocumentDialog } from '@/components/product/documents/CopyDocumentDialog';
import { Checkbox } from "@/components/ui/checkbox";
import { useDocumentAuthors } from "@/hooks/useDocumentAuthors";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import {
  TableSortState,
  tableSortToReactTableFormat,
  reactTableFormatToTableSort,
} from "@/utils/documentFilterParams";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RefDocsBadge } from "@/components/common/RefDocsBadge";
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

export interface DocumentListItem {
  id: string;
  name: string;
  status: string;
  document_type: string;
  phase_name?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  approval_date?: string;
  document_reference?: string;
  is_record?: boolean;
  file_path?: string;
  sub_section?: string;
  authors_ids?: string[];
  date?: string;
  reference_document_ids?: string[];
}

interface DocumentListViewProps {
  documents: DocumentListItem[];
  onEdit: (document: DocumentListItem) => void;
  onView: (document: DocumentListItem) => void;
  onDelete: (documentId: string) => void;
  onCopy?: (document: DocumentListItem) => void;
  onCreateInStudio?: (document: DocumentListItem) => void;
  processingDocuments: Set<string>;
  disabled?: boolean;
  companyId?: string;
  hideDelete?: boolean;
  // External sorting control (for URL sync)
  tableSort?: TableSortState;
  onTableSortChange?: (sortState: TableSortState) => void;
  // Selection for AI Summary
  selectedDocIds?: Set<string>;
  onToggleDocSelection?: (docId: string) => void;
  // Show checkboxes only when sidebar is open
  isSidebarOpen?: boolean;
  // Variant exclusion
  isVariant?: boolean;
  isDocExcluded?: (docId: string) => boolean;
  onToggleDocExclusion?: (docId: string) => void;
  productId?: string;
  getDocExclusionScope?: (itemId: string) => ItemExclusionScope;
  onSetDocExclusionScope?: (itemId: string, scope: ItemExclusionScope) => void;
  familyProductIds?: string[];
  // Bulk mode props
  bulkMode?: boolean;
  bulkSelectedDocs?: Set<string>;
  onToggleBulkDoc?: (docId: string) => void;
}

const getStatusBadgeStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'report':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'in review':
    case 'under review':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'n/a':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    case 'not started':
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const isDocumentOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
};

export function DocumentListView({
  documents,
  onEdit,
  onView,
  onDelete,
  onCopy,
  onCreateInStudio,
  processingDocuments,
  disabled = false,
  companyId,
  hideDelete = false,
  tableSort,
  onTableSortChange,
  selectedDocIds,
  onToggleDocSelection,
  isSidebarOpen = false,
  isVariant = false,
  isDocExcluded,
  onToggleDocExclusion,
  productId,
  getDocExclusionScope,
  onSetDocExclusionScope,
  familyProductIds,
  bulkMode = false,
  bulkSelectedDocs,
  onToggleBulkDoc,
}: DocumentListViewProps) {
  // Use external sorting if provided, otherwise use local state
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    updated_at: false,
  });
  const [sendReviewDoc, setSendReviewDoc] = React.useState<DocumentListItem | null>(null);
  const [deleteDoc, setDeleteDoc] = React.useState<DocumentListItem | null>(null);
  const [copyDoc, setCopyDoc] = React.useState<DocumentListItem | null>(null);
  const { getAuthorById, isLoading: authorsLoading } = useDocumentAuthors(companyId || '');
  const { formatDate } = useCompanyDateFormat(companyId);

  // Convert external tableSort to react-table format
  const sorting = React.useMemo(
    () => (tableSort ? tableSortToReactTableFormat(tableSort) : localSorting),
    [tableSort, localSorting]
  );

  // Use ref for callback to avoid re-creating handleSortingChange
  const onTableSortChangeRef = React.useRef(onTableSortChange);
  onTableSortChangeRef.current = onTableSortChange;

  // Handle sorting changes - stable callback
  const handleSortingChange = React.useCallback((updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    const currentSorting = tableSort ? tableSortToReactTableFormat(tableSort) : localSorting;
    const newSorting = typeof updaterOrValue === 'function'
      ? updaterOrValue(currentSorting)
      : updaterOrValue;

    if (onTableSortChangeRef.current) {
      // Convert to TableSortState and notify parent
      const newTableSort = reactTableFormatToTableSort(newSorting);
      onTableSortChangeRef.current(newTableSort);
    } else {
      // Use local state
      setLocalSorting(newSorting);
    }
  }, [tableSort, localSorting]);

  const columns: ColumnDef<DocumentListItem>[] = React.useMemo(() => [
    // Bulk mode checkbox column
    ...(bulkMode && onToggleBulkDoc ? [{
      id: "bulkSelect",
      header: () => null,
      cell: ({ row }: { row: any }) => {
        const doc = row.original;
        const isChecked = bulkSelectedDocs?.has(doc.id) || false;
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => onToggleBulkDoc(doc.id)}
            className="h-5 w-5"
            aria-label="Select document for bulk action"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    }] : []),
    // Checkbox column for AI Summary selection (only show when sidebar is open)
    ...(onToggleDocSelection && isSidebarOpen ? [{
      id: "select",
      header: () => null,
      cell: ({ row }: { row: any }) => {
        const doc = row.original;
        const isSelected = selectedDocIds?.has(doc.id) || false;
        const hasFile = !!doc.file_path;

        return hasFile ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleDocSelection(doc.id)}
            className={`h-5 w-5 ${isSelected ? 'border-blue-500 data-[state=checked]:bg-blue-500' : 'border-gray-400'}`}
            aria-label="Select document for AI Summary"
          />
        ) : null;
      },
      enableSorting: false,
      enableHiding: false,
    }] : []),
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const doc = row.original;
        const isExcludedDoc = isVariant && (doc as any).isInheritedFromMaster && isDocExcluded?.(doc.id);
        return (
          <div className="flex flex-col max-w-[200px] gap-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`font-medium truncate block ${isExcludedDoc ? 'text-muted-foreground' : ''}`}>{doc.name}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[300px] break-words">{doc.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isVariant && (doc as any).isInheritedFromMaster && isDocExcluded?.(doc.id) && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 w-fit">
                Excluded
              </Badge>
            )}
            {doc.document_reference && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground truncate block">({doc.document_reference.startsWith('DS-') ? 'Document Studio' : doc.document_reference})</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] break-words">
                    <p>{doc.document_reference.startsWith('DS-') ? 'Document Studio' : doc.document_reference}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {companyId && doc.reference_document_ids && doc.reference_document_ids.length > 0 && (
              <RefDocsBadge referenceDocumentIds={doc.reference_document_ids} companyId={companyId} />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "phase_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Phase
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const rawPhaseName = row.getValue("phase_name") as string;
        const phaseName = rawPhaseName?.toLowerCase() === 'no phase' ? 'Core' : rawPhaseName;
        return phaseName ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[120px] truncate rounded-full border text-center text-xs font-semibold w-fit px-3 py-1 bg-primary/10 text-primary border-primary/30">
                  {phaseName}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] break-words">
                <p>{phaseName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "sub_section",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Section
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const section = row.getValue("sub_section") as string;
        return section ? (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
            {section}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "authors_ids",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Author
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      sortingFn: (rowA, rowB) => {
        const authorsA = rowA.original.authors_ids || [];
        const authorsB = rowB.original.authors_ids || [];

        if (authorsA.length === 0 && authorsB.length === 0) return 0;
        if (authorsA.length === 0) return 1;
        if (authorsB.length === 0) return -1;

        const authorA = getAuthorById(authorsA[0]);
        const authorB = getAuthorById(authorsB[0]);

        const nameA = authorA?.name || '';
        const nameB = authorB?.name || '';

        return nameA.localeCompare(nameB);
      },
      cell: ({ row }) => {
        const authorsIds = row.original.authors_ids || [];
        if (authorsIds.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }

        if (authorsLoading) {
          return <span className="text-xs text-muted-foreground">Loading...</span>;
        }

        const authorNames = authorsIds.map(id => {
          const author = getAuthorById(id);
          return author?.name;
        }).filter(Boolean) as string[];

        if (authorNames.length === 0) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <div className="flex items-center gap-1 flex-wrap min-w-[120px] max-w-[120px]">
            <div
              className="max-w-[80px] truncate rounded-full border text-center text-xs font-semibold w-fit px-3 py-1 bg-blue-50 text-blue-700 border-blue-500"
            >
              {authorNames[0]}
            </div>
            {authorNames.length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs">
                      +{authorNames.length - 1}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="flex flex-col gap-1">
                      {authorNames.slice(0).map((name, idx) => (
                        <span key={idx} className="text-sm">{idx + 1}. {name}</span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "document_type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent min-w-[150px]"
          >
            Document Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const docType = row.getValue("document_type") as string;
        return docType && docType !== 'Standard' ? (
          <div className="max-w-[120px] truncate rounded-full border text-center text-xs font-semibold w-fit px-3 py-1 bg-amber-50 text-amber-700 border-amber-300">
            {docType}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "is_record",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      sortingFn: (rowA, rowB) => {
        const docA = rowA.original;
        const docB = rowB.original;

        // Sort by is_record (Reports before Documents)
        if (docA.is_record !== docB.is_record) {
          return docA.is_record ? 1 : -1;
        }
        return 0;
      },
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <Badge
            variant="outline"
            className={`text-xs ${doc.is_record
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : 'bg-blue-50 text-blue-700 border-blue-300'}`}
          >
            {doc.is_record ? 'Report' : 'Document'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={cn(getStatusBadgeStyles(status || 'Not Started'), 'text-xs max-w-[120px] truncate')}
          >
            {status?.toLowerCase() === 'under review' ? 'In Review' : (status || 'Not Started')}
          </Badge>
        );
      },
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent min-w-[100px]"
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dueDate = row.getValue("due_date") as string;
        const isOverdue = isDocumentOverdue(dueDate);
        const formattedDueDate = dueDate ? formatDate(dueDate) : '-';

        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
              {formattedDueDate}
            </span>
            {isOverdue && dueDate && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                Overdue
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent min-w-[100px]"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      sortingFn: (rowA, rowB) => {
        // Sort by date field first, fallback to created_at
        const dateA = rowA.original.date || rowA.original.created_at || '';
        const dateB = rowB.original.date || rowB.original.created_at || '';

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
      cell: ({ row }) => {
        // Show date if available, otherwise fallback to created_at
        const displayDate = row.original.date || row.original.created_at;
        return displayDate ? (
          <span className="text-sm">{formatDate(displayDate)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "approval_date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent min-w-[100px]"
          >
            Approved
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const approvalDate = row.original.approval_date;
        const status = row.original.status?.toLowerCase();
        const isApproved = status === 'approved' || status === 'completed';

        return approvalDate ? (
          <span className={`text-sm font-medium ${isApproved ? 'text-green-700' : ''}`}>
            {formatDate(approvalDate)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent min-w-[100px]"
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const updatedAt = row.getValue("updated_at") as string;
        return updatedAt ? (
          <span className="text-sm text-muted-foreground">{formatDate(updatedAt)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    // Device scope column — shown for all docs when scope handlers are available
    ...(onSetDocExclusionScope && companyId && productId ? [{
      id: "variantToggle",
      header: () => <span className="text-xs text-muted-foreground">Scope</span>,
      cell: ({ row }: { row: any }) => {
        const doc = row.original;
        const docId = doc.id.replace(/^template-/, '');
        return (
          <InheritanceExclusionPopover
            companyId={companyId!}
            currentProductId={productId!}
            itemId={docId}
            exclusionScope={getDocExclusionScope ? getDocExclusionScope(docId) : {}}
            onScopeChange={onSetDocExclusionScope}
            defaultCurrentDeviceOnly
            familyProductIds={familyProductIds}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    }] : []),
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const doc = row.original;
        const isProcessing = processingDocuments.has(doc.id);
        const docExcluded = isDocExcluded?.(doc.id) ?? false;
        const isShared = !!(doc as any)._isSharedFromDevice;
        const isNotInteractable = docExcluded || isShared;

        if (isNotInteractable) return null;

        return (
          <div className="flex items-center justify-end gap-1 max-w-[180px]">
            {/* Studio */}
            {onCreateInStudio && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateInStudio(doc)}
                disabled={isProcessing || disabled}
                title={doc.document_reference?.startsWith('DS-') ? "Edit Document" : "Create Document"}
              >
                <FileEdit className="h-4 w-4 text-primary" />
              </Button>
            )}
            {/* View */}
            {doc.file_path && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(doc)}
                disabled={isProcessing || disabled}
                title="View File"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {/* Send for Review */}
            {companyId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSendReviewDoc(doc)}
                disabled={isProcessing || disabled}
                title="Send for Review"
              >
                <Send className="h-4 w-4 text-primary" />
              </Button>
            )}
            {/* 3-dot menu: Edit & Delete */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isProcessing || disabled}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(doc)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {!hideDelete && (
                  <DropdownMenuItem onClick={() => onDelete(doc.id)} onSelect={() => { setTimeout(() => setDeleteDoc(doc), 0); }}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {onCopy && (
                  <DropdownMenuItem onSelect={() => { setTimeout(() => setCopyDoc(doc), 0); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onEdit, onView, onDelete, onCopy, onCreateInStudio, processingDocuments, disabled, hideDelete, getAuthorById, authorsLoading, formatDate, selectedDocIds, onToggleDocSelection, isSidebarOpen, companyId, isVariant, isDocExcluded, onToggleDocExclusion, productId, getDocExclusionScope, onSetDocExclusionScope, bulkMode, bulkSelectedDocs, onToggleBulkDoc]);

  const table = useReactTable({
    data: documents,
    columns,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <div className="w-full">
        {/* <div className="flex items-center justify-end pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === 'phase_name' ? 'Phase' :
                     column.id === 'document_type' ? 'Type' :
                     column.id === 'due_date' ? 'Due Date' :
                     column.id === 'updated_at' ? 'Last Updated' :
                     column.id === 'sub_section' ? 'Section' :
                     column.id === 'authors_ids' ? 'Author' :
                     column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const doc = row.original;
                  const status = doc.status?.toLowerCase();
                  const isApprovedOrReport = status === 'approved' || status === 'completed' || status === 'report';
                  const isProcessing = processingDocuments.has(doc.id);
                  const isSelected = selectedDocIds?.has(doc.id) || false;
                  const isExcludedRow = isVariant && (doc as any).isInheritedFromMaster && isDocExcluded?.(doc.id);

                  // Match card view styling: green for approved/report, blue ring for selected
                  let rowBgClass = '';
                  if (isExcludedRow) {
                    rowBgClass = 'opacity-60 [&_td]:line-through [&_td]:decoration-foreground/40 [&_td]:decoration-2 [&_td_*]:line-through [&_td_*]:decoration-foreground/40 [&_td_*]:decoration-2';
                  } else if (isSelected) {
                    rowBgClass = 'bg-blue-50 hover:bg-blue-100';
                  } else if (isApprovedOrReport) {
                    rowBgClass = 'bg-emerald-100 hover:bg-emerald-200';
                  }

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`${rowBgClass} ${isProcessing ? 'opacity-50' : ''}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-muted-foreground text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

    {/* Send for Review Dialog */}
    {sendReviewDoc && companyId && (
      <SendToReviewGroupDialog
        open={!!sendReviewDoc}
        onOpenChange={(open) => !open && setSendReviewDoc(null)}
        documentId={sendReviewDoc.id}
        documentName={sendReviewDoc.name}
        companyId={companyId}
        productId={productId}
        existingGroupIds={[]}
      />
    )}

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{deleteDoc?.name}"</strong>? This action cannot be undone and the document will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (deleteDoc) {
                onDelete(deleteDoc.id);
                setDeleteDoc(null);
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {/* Copy Document Confirmation Dialog */}
    <CopyDocumentDialog
      open={!!copyDoc}
      onOpenChange={(open) => !open && setCopyDoc(null)}
      documentName={copyDoc?.name}
      onConfirm={() => {
        if (copyDoc && onCopy) {
          onCopy(copyDoc);
          setCopyDoc(null);
        }
      }}
    />
    </>
  );
}
