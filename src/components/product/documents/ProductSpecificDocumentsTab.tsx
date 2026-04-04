
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { FileText, Plus, User, File, Eye, Trash2, FolderOpen, Pencil } from "lucide-react";
import { DocumentActionMenu } from "./DocumentActionMenu";
import { DocumentReviewersList } from "./DocumentReviewersList";
// import { DocumentAuthorsList } from "./DocumentAuthorsList";
import { EditDocumentDialog } from "./EditDocumentDialog";
// AssignReviewersDialog removed for template instances
import { DocumentViewer } from "../DocumentViewer";
import { DueDateBadge } from "./DueDateBadge";
import { ProductSpecificDocumentService } from "@/services/productSpecificDocumentService";
import { useUserDocumentAccess } from "@/hooks/useUserDocumentAccess";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useComplianceSections } from "@/hooks/useComplianceSections";
import { toast } from "sonner";
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
import { useDocumentAuthors } from "@/hooks/useDocumentAuthors";

interface ProductSpecificDocumentsTabProps {
  productDocuments: any[];
  onAddDocumentClick: () => void;
  onDocumentStatusChange: (documentId: string, status: string) => void;
  onDocumentDeadlineChange?: (documentId: string, date: Date | undefined) => void;
  onDocumentUpdated: (document: any) => void;
  isUpdating?: boolean;
  productId: string;
  companyId: string;
  handleRefreshData: () => void,
  disabled?: boolean;
  phases?: any[]; // Add phases prop to get phase names from phase_id
}

export function ProductSpecificDocumentsTab({
  productDocuments,
  onAddDocumentClick,
  onDocumentStatusChange,
  onDocumentDeadlineChange,
  onDocumentUpdated,
  isUpdating = false,
  productId,
  companyId,
  handleRefreshData,
  disabled = false,
  phases = []
}: ProductSpecificDocumentsTabProps) {
  const { activeRole } = useCompanyRole();
  const { isAdmin } = useUserDocumentAccess();
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [assigningReviewers, setAssigningReviewers] = useState<any>(null);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [serviceUpdating, setServiceUpdating] = useState(false);
  const [documentService, setDocumentService] = useState<ProductSpecificDocumentService | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  // Create phase name map from phase_id
  const phaseNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    phases.forEach(phase => {
      if (phase.id && phase.name) {
        map.set(phase.id, phase.name);
      }
    });
    return map;
  }, [phases]);

  // Helper function to get phase name from phase_id
  const getPhaseName = (phaseId: string | null | undefined): string | null => {
    if (!phaseId) return null;
    return phaseNameMap.get(phaseId) || null;
  };
  // console.log('[ProductSpecificDocumentsTab] productDocuments received:', productDocuments);
  // Initialize the service
  useEffect(() => {
    if (productId && companyId) {
      setDocumentService(new ProductSpecificDocumentService(productId, companyId));
    }
  }, [productId, companyId]);

  // Validate and filter product-specific documents
  const validateProductSpecificDocument = (document: any): boolean => {
    // console.log('[ProductSpecificDocumentsTab] Validating document 2:', document);
    // console.log("[ProductSpecificDocumentsTab] Validating document:", {
    //   id: document.id,
    //   name: document.name,
    //   template_source_id: document.template_source_id,
    //   document_scope: document.document_scope,
    //   product_id: document.productId,
    //   expected_product_id: productId
    // });

    // Must NOT have template_source_id (product-specific = created from scratch)
    if (document.template_source_id !== null && document.template_source_id !== undefined) {
      console.warn("[ProductSpecificDocumentsTab] Document has template_source_id - not product-specific:", document.template_source_id);
      return false;
    }

    // Must be a product document
    if (document.document_scope !== 'product_document') {
      console.warn("[ProductSpecificDocumentsTab] Invalid document_scope:", document.document_scope);
      return false;
    }

    // Must belong to this product
    if (document.productId !== productId) {
      console.warn("[ProductSpecificDocumentsTab] Product ID mismatch:", document.product_id, "vs", productId);
      return false;
    }

    // console.log("[ProductSpecificDocumentsTab] Document validation passed");
    return true;
  };

  // Filter and categorize documents
  const validProductSpecificDocuments = productDocuments.filter(doc =>
    !doc.template_source_id && doc.document_scope === 'product_document'
  );
  // console.log('[ProductSpecificDocumentsTab] validProductSpecificDocuments:', validProductSpecificDocuments);
  // Get company-level core documents that have been inherited
  const inheritedCoreDocuments = productDocuments.filter(doc => {
    if (!doc || typeof doc !== 'object') {
      return false;
    }

    if (doc.id && typeof doc.id === 'string' && doc.id.startsWith('company-core-')) {
      return true;
    }

    if (doc.document_type === 'Core') {
      return true;
    }

    if (doc.name && typeof doc.name === 'string' && doc.name.startsWith('Core:')) {
      return true;
    }

    return false;
  });

  // Show ALL product-specific documents, not just Core ones
  // The tab is called "Core Documents" but should display all product-specific documents
  const productSpecificCoreDocuments = validProductSpecificDocuments.filter(doc => {
    if (!doc || typeof doc !== 'object') {
      return false;
    }
    // Include all product-specific documents, regardless of document_type
    return true;
  });

  // Combine both types for the "Core Documents" display (avoid duplicates)
  const allCoreDocuments = [
    ...inheritedCoreDocuments,
    ...productSpecificCoreDocuments.filter(doc =>
      !inheritedCoreDocuments.some(inherited =>
        inherited.id === doc.id || inherited.name === doc.name
      )
    )
  ];
  console.log('[ProductSpecificDocumentsTab] allCoreDocuments:', allCoreDocuments);
  // console.log('[ProductSpecificDocumentsTab] validProductSpecificDocuments:', validProductSpecificDocuments);
  // console.log('[ProductSpecificDocumentsTab] validProductSpecificDocuments length:', validProductSpecificDocuments.length);
  // console.log('[ProductSpecificDocumentsTab] productSpecificCoreDocuments:', productSpecificCoreDocuments);
  // console.log('[ProductSpecificDocumentsTab] productSpecificCoreDocuments length:', productSpecificCoreDocuments.length);
  // console.log('[ProductSpecificDocumentsTab] inheritedCoreDocuments:', inheritedCoreDocuments);
  // console.log('[ProductSpecificDocumentsTab] inheritedCoreDocuments length:', inheritedCoreDocuments.length);
  // console.log('[ProductSpecificDocumentsTab] allCoreDocuments:', allCoreDocuments);
  // console.log('[ProductSpecificDocumentsTab] allCoreDocuments length:', allCoreDocuments.length);
  // Log any filtered out documents
  useEffect(() => {
    const filteredCount = productDocuments.length - validProductSpecificDocuments.length;
    if (filteredCount > 0) {
      console.warn(`[ProductSpecificDocumentsTab] Filtered out ${filteredCount} non-product-specific documents`);
    }
  }, [productDocuments.length, validProductSpecificDocuments.length]);

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

  // Utility function to check if document is overdue
  const isDocumentOverdue = (document: any) => {
    const dueDate = document.due_date || document.deadline;
    if (!dueDate) return false;

    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const hasUploadedFile = (document: any) => {
    const hasPath = !!(document.file_path && document.file_path.trim());
    const hasName = !!(document.file_name && document.file_name.trim());
    return hasPath && hasName;
  };
  const DocumentAuthorsList = ({
    document,
    companyId
  }: {
    document: any;
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
        const author = getAuthorById(id as string);
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
            key={author.id as string}
            variant="outline"
            className="text-xs bg-purple-50 text-purple-700 border-purple-200"
          >
            {author.name}
          </Badge>
        ))}
      </div>
    );
  };
  const handleStatusChange = async (document: any, status: string) => {
    if (!documentService) {
      toast.error("Document service not available");
      return;
    }

    // Additional validation before status change
    if (!validateProductSpecificDocument(document)) {
      toast.error("Cannot update status: Document is not product-specific for this product");
      return;
    }

    // console.log(`[ProductSpecificDocumentsTab] Updating status for document ${document.name} to ${status}`);

    setServiceUpdating(true);
    try {
      const success = await documentService.updateStatus(document.id, status);
      if (success) {
        onDocumentUpdated({ ...document, status });
      }
    } catch (error) {
      console.error("[ProductSpecificDocumentsTab] Error updating status:", error);
      toast.error("Failed to update document status");
    } finally {
      setServiceUpdating(false);
    }
  };

  const handleEditDocument = (document: any) => {
    // Validate before editing
    if (!validateProductSpecificDocument(document)) {
      toast.error("Cannot edit: Document is not product-specific for this product");
      return;
    }
    setEditingDocument(document);
  };

  const handleAssignReviewers = (document: any) => {
    // Validate before assigning reviewers
    if (!validateProductSpecificDocument(document)) {
      toast.error("Cannot assign reviewers: Document is not product-specific for this product");
      return;
    }
    setAssigningReviewers(document);
  };

  const handleDocumentUpdated = (updatedDocument: any) => {
    // Validate the updated document
    if (!validateProductSpecificDocument(updatedDocument)) {
      toast.error("Updated document is not valid for this tab");
      return;
    }
    onDocumentUpdated(updatedDocument);
    setEditingDocument(null);
  };

  const handleReviewersUpdated = (updatedDocument: any) => {
    // Validate before updating reviewers
    if (!validateProductSpecificDocument(updatedDocument)) {
      toast.error("Cannot update reviewers: Document is not product-specific for this product");
      return;
    }
    onDocumentUpdated(updatedDocument);
    setAssigningReviewers(null);
  };

  const handleViewDocument = (document: any) => {
    if (!hasUploadedFile(document)) {
      toast.error("No file attached to this document");
      return;
    }
    setViewingDocument(document);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!documentService) {
      toast.error("Document service not available");
      return;
    }

    try {
      const success = await documentService.deleteDocument(documentId);
      if (success) {
        toast.success("Document deleted successfully");
        handleRefreshData();
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      console.error("[ProductSpecificDocumentsTab] Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  if (!allCoreDocuments || allCoreDocuments.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Core Documents
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                0 Documents
              </Badge>
            </CardTitle>
            <Button onClick={onAddDocumentClick} size="sm" disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Product-Specific Documents</p>
              <p className="text-sm mb-4">Create custom documents specific to this product.</p>
              <Button onClick={onAddDocumentClick} variant="outline" disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Core Documents
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              {allCoreDocuments.length} Documents
            </Badge>
          </CardTitle>
          <Button onClick={onAddDocumentClick} size="sm" disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allCoreDocuments.map((doc) => {
              const hasFile = hasUploadedFile(doc);
              const isOverdue = isDocumentOverdue(doc);
              const phaseName = getPhaseName(doc.phase_id || doc.phaseId);
              // Determine if document is approved (green background)
              const isApproved = doc.status?.toLowerCase() === 'approved' ||
                doc.status?.toLowerCase() === 'completed' ||
                doc.status?.toLowerCase() === 'report';
              const cardBgClass = isApproved
                ? "flex items-center justify-between p-4 border rounded-lg bg-emerald-100 border-emerald-300"
                : "flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200";

              // Format dates for display
              const formattedLastUpdated = doc.updated_at || doc.updatedAt || doc.updated || doc.created_at || doc.createdAt || doc.created
                ? (() => {
                  const date = new Date(doc.updated_at || doc.updatedAt || doc.updated || doc.created_at || doc.createdAt || doc.created);
                  return isNaN(date.getTime()) ? null : date.toLocaleDateString();
                })()
                : null;

              // Format due date
              const formattedDueDate = doc.due_date || doc.deadline
                ? (() => {
                  const date = new Date(doc.due_date || doc.deadline);
                  return isNaN(date.getTime()) ? null : date.toLocaleDateString();
                })()
                : null;

              // Format approval date
              const formattedApprovalDate = doc.approval_date
                ? (() => {
                  const date = new Date(doc.approval_date);
                  return isNaN(date.getTime()) ? null : date.toLocaleDateString();
                })()
                : null;

              return (
                <div key={doc.id} className={cardBgClass}>
                  <div className="flex items-center gap-20">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {phaseName && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {phaseName}
                          </Badge>
                        )}
                        {doc.document_type && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            {doc.document_type}
                          </Badge>
                        )}
                        {hasFile && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                            <File className="h-3 w-3 mr-1" />
                            File Attached
                          </Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                            Overdue
                          </Badge>
                        )}
                        {serviceUpdating && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                            Updating...
                          </Badge>
                        )}
                      </div>
                      <h5 className="font-medium mb-2">
                        {doc.name}
                        {doc.document_reference && (
                          <span className="text-muted-foreground font-normal"> ({doc.document_reference.startsWith('DS-') ? 'Document Studio' : doc.document_reference})</span>
                        )}
                      </h5>

                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {formattedLastUpdated && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Last Updated:</span>
                            <span className="text-xs font-semibold">{formattedLastUpdated}</span>
                          </div>
                        )}
                        {formattedApprovalDate && doc.status?.toLowerCase() === 'approved' && (
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
                        {doc.tech_applicability && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Applies to:</span>
                            <span className="text-xs">{doc.tech_applicability}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Reviewers:</span>
                        {companyId && <DocumentReviewersList document={doc} companyId={companyId} />}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Authors:</span>
                        {companyId && (
                          <DocumentAuthorsList
                            document={doc}
                            companyId={companyId}
                          />
                        )}
                      </div>
                    </div>
                    {doc.description && (
                      <div className="text-sm mb-2 text-foreground/80 max-w-sm word-wrap">
                        <span className="font-medium">Description:</span> {doc.description}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-8">
                    {/* Status badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusBadgeStyles(doc.status || 'Not Started')}`}
                      >
                        {doc.status?.toLowerCase() === 'under review' ? 'In Review' : (doc.status || 'Not Started')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* View button */}
                      {doc.file_path && hasFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                          disabled={disabled || isUpdating || serviceUpdating}
                          className="h-8 px-3 !bg-white"
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Delete button - admin only */}
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteDialogOpen(doc.id)}
                          disabled={disabled || isUpdating || serviceUpdating}
                          className="h-8 px-3 !bg-white hover:bg-red-50 hover:border-red-300"
                          title="Delete Document"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      {/* Edit button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDocument(doc)}
                        disabled={disabled || isUpdating || serviceUpdating}
                        className="h-8 px-3 !bg-white"
                        title="Edit Document"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (() => {
        const docToDelete = allCoreDocuments.find(d => d.id === deleteDialogOpen);
        return docToDelete ? (
          <AlertDialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>"{docToDelete.name}"</strong>? This action cannot be undone and the document will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleDeleteDocument(docToDelete.id);
                    setDeleteDialogOpen(null);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null;
      })()}

      {/* Edit Document Dialog */}
      {editingDocument && (
        <EditDocumentDialog
          open={!!editingDocument}
          onOpenChange={(open) => !open && setEditingDocument(null)}
          document={editingDocument}
          onDocumentUpdated={handleDocumentUpdated}
          productId={productId}
          companyId={companyId}
          documentType="product-specific"
          handleRefreshData={handleRefreshData}
        />
      )}

      {/* Assign Reviewers Dialog removed for template instances */}

      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          documentId={viewingDocument.id}
          documentName={viewingDocument.name}
          companyId={companyId}
          documentFile={viewingDocument.file_path ? {
            path: viewingDocument.file_path,
            name: viewingDocument.file_name || 'Document',
            size: viewingDocument.file_size,
            type: viewingDocument.file_type,
            uploadedAt: viewingDocument.uploaded_at
          } : null}
          open={!!viewingDocument}
          onOpenChange={(open) => !open && setViewingDocument(null)}
          companyRole={activeRole}
          reviewerGroupId="default"
          onStatusChanged={(docId, newStatus) => {
            // Refresh document list when status changes
            handleRefreshData();
            onDocumentStatusChange(docId, newStatus);
          }}
        />
      )}
    </div>
  );
}
