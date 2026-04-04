"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { ArrowUpDown, Trash2 } from "lucide-react";
import { documentTypeService, DocumentType } from "@/services/documentTypeService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface AddDocumentTypeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onDocumentTypeAdded: (documentTypeName: string) => void;
  onDocumentTypeDeleted?: () => void;
}

export function AddDocumentTypeSheet({
  open,
  onOpenChange,
  companyId,
  onDocumentTypeAdded,
  onDocumentTypeDeleted
}: AddDocumentTypeSheetProps) {
  const { lang } = useTranslation();
  const [typeName, setTypeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { user } = useAuth();

  const loadDocumentTypes = useCallback(async () => {
    setIsLoadingTypes(true);
    try {
      const types = await documentTypeService.getCompanyDocumentTypes(companyId);
      setDocumentTypes(types);
    } catch (error) {
      console.error('Error loading document types:', error);
    } finally {
      setIsLoadingTypes(false);
    }
  }, [companyId]);

  // Fetch existing document types when sheet opens
  useEffect(() => {
    if (open && companyId) {
      loadDocumentTypes();
    }
  }, [open, companyId, loadDocumentTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!typeName.trim()) {
      toast.error('Document type name is required');
      return;
    }

    if (!user?.id) {
      toast.error('User authentication required');
      return;
    }

    setIsSubmitting(true);

    try {
      const newDocumentType = await documentTypeService.createDocumentType(
        companyId,
        typeName.trim(),
        user.id,
        user.id,
        true // showToast
      );

      if (newDocumentType) {
        // Refresh the document types list
        await loadDocumentTypes();
        onDocumentTypeAdded(newDocumentType.name);
        resetForm();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error adding document type:', error);
      // Error toast is already handled by documentTypeService
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTypeName('');
  };

  const handleDelete = useCallback(async (typeId: string, typeName: string) => {
    const success = await documentTypeService.deleteDocumentType(typeId);
    if (success) {
      await loadDocumentTypes();
      toast.success(`Document type "${typeName}" deleted`);
      // Notify parent to refetch document types dropdown
      onDocumentTypeDeleted?.();
    }
  }, [loadDocumentTypes, onDocumentTypeDeleted]);

  // Define columns for the DataTable
  const columns: ColumnDef<DocumentType>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const createdDate = row.getValue("created_at") as string | undefined;
        return (
          <div className="text-muted-foreground text-sm">
            {createdDate
              ? new Date(createdDate).toLocaleDateString()
              : '-'}
          </div>
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
            className="h-8 px-2"
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const updatedDate = row.getValue("updated_at") as string | undefined;
        const createdDate = row.original.created_at;
        return (
          <div className="text-muted-foreground text-sm">
            {updatedDate
              ? new Date(updatedDate).toLocaleDateString()
              : createdDate
              ? new Date(createdDate).toLocaleDateString()
              : '-'}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const documentType = row.original;

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <span className="sr-only">Delete</span>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="z-[1501]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document Type</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{documentType.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(documentType.id, documentType.name)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ], [handleDelete]);

  // Initialize TanStack Table
  const table = useReactTable({
    data: documentTypes,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:min-w-[550px] z-[1500]">
        <SheetHeader>
          <SheetTitle>{lang('addDocumentType.title')}</SheetTitle>
          <SheetDescription>
            {lang('addDocumentType.description')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="typeName">{lang('addDocumentType.typeNameLabel')}</Label>
            <Input
              id="typeName"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder={lang('addDocumentType.typeNamePlaceholder')}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !typeName.trim()}>
              {isSubmitting ? lang('addDocumentType.adding') : lang('addDocumentType.addButton')}
            </Button>
          </div>
        </form>

        {/* Existing Document Types DataTable */}
        <div className="mt-8 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">{lang('addDocumentType.existingTypes')}</h3>
            {isLoadingTypes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">{lang('addDocumentType.loading')}</span>
              </div>
            ) : documentTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-md">
                <p className="text-sm">{lang('addDocumentType.noTypes')}</p>
              </div>
            ) : (
              <div className="w-full space-y-4">
                {/* Search Filter */}
                {/* <div className="flex items-center">
                  <Input
                    placeholder="Filter by name..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                  />
                </div> */}

                {/* Table */}
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                  <div className="relative">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="sticky top-0 [&_tr]:border-b">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id} className="border-b transition-colors">
                            {headerGroup.headers.map((header) => {
                              return (
                                <th
                                  key={header.id}
                                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background"
                                >
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                </th>
                              );
                            })}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <tr
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className="p-4 align-middle"
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b transition-colors">
                            <td
                              colSpan={columns.length}
                              className="h-24 text-center p-4 align-middle"
                            >
                              No results.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {table.getPageCount() > 1 && (
                  <div className="flex items-center justify-end space-x-2">
                    <div className="text-muted-foreground text-sm">
                      {table.getFilteredRowModel().rows.length} document type{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

