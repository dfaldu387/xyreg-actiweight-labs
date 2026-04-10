import * as React from "react";
import { useSearchParams } from "react-router-dom";
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
import { ArrowUpDown, ChevronLeft, ChevronRight, FileEdit, Trash2, Eye, Send, Pencil, MoreHorizontal, Copy, FileDown, Loader2 } from "lucide-react";
import { DocumentStarButton } from './DocumentStarButton';
import { DocumentPdfPreviewService } from '@/services/documentPdfPreviewService';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SendToReviewGroupDialog } from './SendToReviewGroupDialog';
import { CopyDocumentDialog } from '@/components/product/documents/CopyDocumentDialog';
import { CompanyDocument } from '@/hooks/useCompanyDocuments';
import { useDocumentAuthors } from "@/hooks/useDocumentAuthors";
import { useCompanyDateFormat } from "@/hooks/useCompanyDateFormat";
import { useNavigate } from "react-router-dom";
import { useCompanyRole } from "@/context/CompanyRoleContext";

// URL param keys for table state
const TABLE_URL_PARAMS = {
  SORT_COLUMN: 'sortCol',
  SORT_DIRECTION: 'sortDir',
  PAGE: 'page',
  PAGE_SIZE: 'pageSize',
} as const;

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

interface CompanyDocumentListViewProps {
  documents: CompanyDocument[];
  onView?: (document: CompanyDocument) => void;
  onEdit?: (document: CompanyDocument) => void;
  onDelete?: (document: CompanyDocument) => void;
  onCopy?: (document: CompanyDocument) => void;
  onCreateInStudio?: (document: CompanyDocument) => void;
  isDeleting?: boolean;
  disabled?: boolean;
  companyId?: string;
  hiddenColumns?: string[];
  externalSortActive?: boolean;
  bulkMode?: boolean;
  bulkSelectedDocs?: Set<string>;
  onToggleBulkDoc?: (docId: string) => void;
  onSelectAll?: (allIds: string[]) => void;
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
    case 'not applicable':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    case 'not started':
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const isDocumentOverdue = (dueDate?: string | null) => {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
};

export function CompanyDocumentListView({
  documents,
  onView,
  onEdit,
  onDelete,
  onCopy,
  onCreateInStudio,
  isDeleting = false,
  disabled = false,
  companyId,
  hiddenColumns = [],
  externalSortActive = false,
  bulkMode = false,
  bulkSelectedDocs,
  onToggleBulkDoc,
  onSelectAll,
}: CompanyDocumentListViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDeleteDoc, setPendingDeleteDoc] = React.useState<CompanyDocument | null>(null);
  const [pendingCopyDoc, setPendingCopyDoc] = React.useState<CompanyDocument | null>(null);
  const [sendReviewDoc, setSendReviewDoc] = React.useState<CompanyDocument | null>(null);
  const [pdfLoadingDocId, setPdfLoadingDocId] = React.useState<string | null>(null);
  // Initialize sorting from URL params
  const [sorting, setSortingState] = React.useState<SortingState>(() => {
    const sortCol = searchParams.get(TABLE_URL_PARAMS.SORT_COLUMN);
    const sortDir = searchParams.get(TABLE_URL_PARAMS.SORT_DIRECTION);
    if (sortCol) {
      return [{ id: sortCol, desc: sortDir === 'desc' }];
    }
    return [{ id: 'updated_at', desc: true }];
  });

  // Initialize pagination from URL params
  const [pagination, setPaginationState] = React.useState(() => {
    const page = parseInt(searchParams.get(TABLE_URL_PARAMS.PAGE) || '1', 10) - 1; // URL is 1-indexed
    const pageSize = parseInt(searchParams.get(TABLE_URL_PARAMS.PAGE_SIZE) || '10', 10);
    return { pageIndex: Math.max(0, page), pageSize };
  });

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Sync hiddenColumns prop to columnVisibility state
  React.useEffect(() => {
    const visibility: VisibilityState = {};
    hiddenColumns.forEach(col => { visibility[col] = false; });
    setColumnVisibility(visibility);
  }, [hiddenColumns]);

  // Clear table sorting when external filter sort is active
  React.useEffect(() => {
    if (externalSortActive) {
      setSortingState([]);
    }
  }, [externalSortActive]);

  const { getAuthorById, isLoading: authorsLoading } = useDocumentAuthors(companyId || '');
  const { formatDate } = useCompanyDateFormat(companyId);
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();

  // Helper to update URL params
  const updateUrlParams = React.useCallback((updates: Record<string, string | null>) => {
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
  React.useEffect(() => {
    const urlSortCol = searchParams.get(TABLE_URL_PARAMS.SORT_COLUMN);
    const urlSortDir = searchParams.get(TABLE_URL_PARAMS.SORT_DIRECTION);
    const urlPage = parseInt(searchParams.get(TABLE_URL_PARAMS.PAGE) || '1', 10) - 1;
    const urlPageSize = parseInt(searchParams.get(TABLE_URL_PARAMS.PAGE_SIZE) || '10', 10);

    // Update sorting if changed
    const newSorting: SortingState = urlSortCol
      ? [{ id: urlSortCol, desc: urlSortDir === 'desc' }]
      : [{ id: 'updated_at', desc: true }];
    if (JSON.stringify(newSorting) !== JSON.stringify(sorting)) {
      setSortingState(newSorting);
    }

    // Update pagination if changed
    if (urlPage !== pagination.pageIndex || urlPageSize !== pagination.pageSize) {
      setPaginationState({ pageIndex: Math.max(0, urlPage), pageSize: urlPageSize });
    }
  }, [searchParams]);

  // Set default sort URL params on mount if not present
  React.useEffect(() => {
    if (!searchParams.get(TABLE_URL_PARAMS.SORT_COLUMN)) {
      updateUrlParams({
        [TABLE_URL_PARAMS.SORT_COLUMN]: 'date',
        [TABLE_URL_PARAMS.SORT_DIRECTION]: 'desc',
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapper for sorting that also updates URL
  const setSorting = React.useCallback((updaterOrValue: SortingState | ((prev: SortingState) => SortingState)) => {
    setSortingState(prev => {
      const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;

      // Update URL params
      if (newSorting.length > 0) {
        updateUrlParams({
          [TABLE_URL_PARAMS.SORT_COLUMN]: newSorting[0].id,
          [TABLE_URL_PARAMS.SORT_DIRECTION]: newSorting[0].desc ? 'desc' : 'asc',
        });
      } else {
        updateUrlParams({
          [TABLE_URL_PARAMS.SORT_COLUMN]: null,
          [TABLE_URL_PARAMS.SORT_DIRECTION]: null,
        });
      }

      return newSorting;
    });
  }, [updateUrlParams]);

  // Wrapper for pagination that also updates URL
  const setPagination = React.useCallback((updaterOrValue: typeof pagination | ((prev: typeof pagination) => typeof pagination)) => {
    setPaginationState(prev => {
      const newPagination = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;

      // Update URL params (URL is 1-indexed for page)
      updateUrlParams({
        [TABLE_URL_PARAMS.PAGE]: newPagination.pageIndex > 0 ? String(newPagination.pageIndex + 1) : null,
        [TABLE_URL_PARAMS.PAGE_SIZE]: newPagination.pageSize !== 10 ? String(newPagination.pageSize) : null,
      });

      return newPagination;
    });
  }, [updateUrlParams]);

  const columns: ColumnDef<CompanyDocument>[] = React.useMemo(() => [
    ...(bulkMode ? [{
      id: "bulk_select",
      header: () => {
        const allIds = documents.map(d => d.id);
        const allSelected = allIds.length > 0 && allIds.every(id => bulkSelectedDocs?.has(id));
        const someSelected = allIds.some(id => bulkSelectedDocs?.has(id));
        return (
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(checked) => {
              onSelectAll?.(checked ? allIds : []);
            }}
          />
        );
      },
      cell: ({ row }: { row: any }) => (
        <Checkbox
          checked={bulkSelectedDocs?.has(row.original.id) ?? false}
          onCheckedChange={() => onToggleBulkDoc?.(row.original.id)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    } as ColumnDef<CompanyDocument>] : []),
    {
      accessorFn: (row) => {
        const docNumber = row.document_number;
        const name = row.name;
        return docNumber ? `${docNumber} ${name}` : name;
      },
      id: "name",
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
        const docNumber = doc.document_number;
        // Strip the document number prefix from the name if it already starts with it
        let cleanName = doc.name;
        if (docNumber && cleanName.startsWith(docNumber)) {
          cleanName = cleanName.slice(docNumber.length).replace(/^\s+/, '');
        }
        const displayName = docNumber ? `${docNumber} ${cleanName}` : cleanName;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`font-medium max-w-[240px] truncate block ${onCreateInStudio ? 'cursor-pointer hover:underline text-primary' : 'cursor-default'}`}
                  onClick={onCreateInStudio ? (e) => { e.stopPropagation(); onCreateInStudio(doc); } : undefined}
                >
                  {docNumber && (
                    <span className="text-muted-foreground font-mono text-xs mr-1.5">{docNumber}</span>
                  )}
                  {cleanName}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-sm">{displayName}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 max-w-[120px] truncate w-fit">
                  {section}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top">
                <span className="text-sm">{section}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <div className="flex items-center gap-1 flex-wrap max-w-[150px]">
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              {authorNames[0]}
            </Badge>
            {authorNames.length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs bg-background border-blue-200">
                      +{authorNames.length - 1}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="flex flex-col gap-1">
                      {authorNames.map((name, idx) => (
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
        if (!docType) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
            {docType}
          </Badge>
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
            className={`text-xs ${getStatusBadgeStyles(status || 'Not Started')}`}
          >
            {status || 'Not Started'}
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
        const dateA = (rowA.original as any).date || rowA.original.created_at || '';
        const dateB = (rowB.original as any).date || rowB.original.created_at || '';

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
      cell: ({ row }) => {
        // Show date if available, otherwise fallback to created_at
        const displayDate = (row.original as any).date || row.original.created_at;
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
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const doc = row.original;
        const hasFile = !!(doc.file_path || doc.file_name);

        return (
          <div className="flex items-center justify-end gap-1 max-w-[240px]">
            {/* Star */}
            <DocumentStarButton documentId={doc.id} />
            {/* Studio */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateInStudio?.(doc)}
              disabled={isDeleting || disabled}
              title={doc.document_reference ? "Edit Document" : "Create Document"}
            >
              <FileEdit className={`h-4 w-4 ${doc.document_reference?.startsWith('DS-') && doc.status?.toLowerCase() !== 'approved' ? 'text-amber-500' : 'text-primary'}`} />
            </Button>
            {/* View */}
            {hasFile && onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(doc)}
                disabled={isDeleting || disabled}
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
                disabled={isDeleting || disabled}
                title="Send for Review"
              >
                <Send className="h-4 w-4 text-primary" />
              </Button>
            )}
            {/* 3-dot menu: Edit, Copy, Delete, Preview PDF */}
            {(onEdit || onCopy || onDelete || companyId) && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isDeleting || disabled}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {companyId && doc.status === 'Approved' && (
                    <DropdownMenuItem
                      disabled={pdfLoadingDocId === doc.id}
                      onSelect={(e) => {
                        e.preventDefault();
                        (async () => {
                          setPdfLoadingDocId(doc.id);
                          try {
                            await DocumentPdfPreviewService.generatePreviewPdf(doc.id, companyId);
                          } catch (error) {
                            console.error('PDF preview error:', error);
                            toast.error('Failed to generate PDF preview');
                          } finally {
                            setPdfLoadingDocId(null);
                          }
                        })();
                      }}
                    >
                      {pdfLoadingDocId === doc.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      Preview PDF
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onSelect={() => { setTimeout(() => onEdit(doc), 0); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onSelect={() => { setTimeout(() => setPendingDeleteDoc(doc), 0); }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                  {onCopy && (
                    <DropdownMenuItem onSelect={() => { setTimeout(() => setPendingCopyDoc(doc), 0); }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
    },
  ], [onView, onEdit, onDelete, onCopy, isDeleting, disabled, getAuthorById, authorsLoading, formatDate, navigate, activeCompanyRole, bulkMode, bulkSelectedDocs, onToggleBulkDoc, companyId, pdfLoadingDocId]);

  const table = useReactTable({
    data: documents,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(externalSortActive ? { manualSorting: true } : { getSortedRowModel: getSortedRowModel() }),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  });

  return (
    <>
    <div className="w-full">
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
                const status = row.original.status?.toLowerCase();
                const isApprovedOrReport = status === 'approved' || status === 'completed' || status === 'report';

                // Match card view styling: green for approved/report, blue for others
                const rowBgClass = isApprovedOrReport
                  ? 'bg-emerald-100 hover:bg-emerald-200'
                  : '';

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={rowBgClass}
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
          {table.getFilteredRowModel().rows.length} document(s)
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

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!pendingDeleteDoc} onOpenChange={(open) => { if (!open) setPendingDeleteDoc(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{pendingDeleteDoc?.name}"</strong>? This action cannot be undone and the document will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (onDelete && pendingDeleteDoc) onDelete(pendingDeleteDoc);
              setPendingDeleteDoc(null);
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Copy Confirmation Dialog */}
    <CopyDocumentDialog
      open={!!pendingCopyDoc}
      onOpenChange={(open) => { if (!open) setPendingCopyDoc(null); }}
      documentName={pendingCopyDoc?.name}
      onConfirm={() => {
        if (onCopy && pendingCopyDoc) onCopy(pendingCopyDoc);
        setPendingCopyDoc(null);
      }}
    />

    {sendReviewDoc && companyId && (
      <SendToReviewGroupDialog
        open={!!sendReviewDoc}
        onOpenChange={(open) => { if (!open) setSendReviewDoc(null); }}
        documentId={sendReviewDoc.id}
        documentName={sendReviewDoc.name}
        companyId={companyId}
        existingGroupIds={sendReviewDoc.reviewer_group_ids || []}
      />
    )}
    </>
  );
}
