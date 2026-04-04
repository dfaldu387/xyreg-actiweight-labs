import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, User, File, Eye, Clock, FolderOpen } from "lucide-react";
import { DocumentActionMenu } from "./DocumentActionMenu";
import { DocumentReviewersList } from "./DocumentReviewersList";
import { EditDocumentDialog } from "./EditDocumentDialog";
// AssignReviewersDialog removed for template instances
import { DocumentViewer } from "../DocumentViewer";
import { useState } from "react";
import { useIsolatedDocumentOperations } from "@/hooks/useIsolatedDocumentOperations";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useComplianceSections } from "@/hooks/useComplianceSections";
import { toast } from "sonner";

interface SelectedPhaseDocumentsProps {
  selectedPhase: any;
  onDocumentUpdated?: (document: any) => void;
  companyId?: string;
  productId?: string;
}

export function SelectedPhaseDocuments({
  selectedPhase,
  onDocumentUpdated = () => { },
  companyId,
  productId
}: SelectedPhaseDocumentsProps) {
  const { activeRole } = useCompanyRole();
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [assigningReviewers, setAssigningReviewers] = useState<any>(null);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  console.log('Selected phase:', selectedPhase);
  // Use improved isolated document operations
  const {
    isUpdating,
    updateDocumentStatus,
    updateDocumentDeadline
  } = useIsolatedDocumentOperations(productId || '', companyId);

  // Fetch sections for displaying section names
  const { sections } = useComplianceSections(companyId);

  // Helper function to get section names from section_ids
  const getSectionNames = (document: any): string[] => {
    if (!document.section_ids || !Array.isArray(document.section_ids) || document.section_ids.length === 0) {
      return [];
    }
    return document.section_ids
      .map((id: string) => sections.find(s => s.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in progress': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'not required': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getDocumentTypeInfo = (document: any) => {
    if (document.template_source_id && document.document_scope === 'product_document') {
      return {
        type: 'template-instance' as const,
        label: 'Template Instance',
        color: 'bg-blue-100 text-blue-700 border-blue-300'
      };
    } else if (!document.template_source_id && document.document_scope === 'product_document') {
      return {
        type: 'product-specific' as const,
        label: 'Product-Specific',
        color: 'bg-purple-100 text-purple-700 border-purple-300'
      };
    } else if (document.document_scope === 'company_template') {
      return {
        type: 'template-instance' as const,
        label: 'Company Template',
        color: 'bg-green-100 text-green-700 border-green-300'
      };
    } else {
      return {
        type: 'product-specific' as const,
        label: 'Unknown Type',
        color: 'bg-gray-100 text-gray-700 border-gray-300'
      };
    }
  };

  // Get due date display info with color coding
  const getDueDateInfo = (document: any) => {
    const dueDate = document.due_date || document.deadline;
    if (!dueDate) {
      return {
        display: 'No due date',
        color: 'bg-gray-100 text-gray-600',
        isOverdue: false,
        isSoon: false
      };
    }

    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let color = 'bg-green-100 text-green-700'; // Future dates
    let isOverdue = false;
    let isSoon = false;

    if (diffDays < 0) {
      color = 'bg-red-100 text-red-700 border-red-300';
      isOverdue = true;
    } else if (diffDays <= 7) {
      color = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      isSoon = true;
    }

    return {
      display: due.toLocaleDateString(),
      color,
      isOverdue,
      isSoon,
      diffDays: Math.abs(diffDays)
    };
  };

  // Utility function to check if document is overdue
  const isDocumentOverdue = (document: any) => {
    const dueDate = document.due_date || document.deadline;
    if (!dueDate) return false;

    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  // Improved file checking with better validation
  const hasUploadedFile = (document: any) => {
    const hasPath = !!(document.file_path && document.file_path.trim());
    const hasName = !!(document.file_name && document.file_name.trim());
    console.log(`[SelectedPhaseDocuments] File check for "${document.name}":`, {
      file_path: document.file_path,
      file_name: document.file_name,
      hasPath,
      hasName,
      result: hasPath && hasName
    });
    return hasPath && hasName;
  };

  const handleStatusChange = async (document: any, status: string) => {
    console.log(`[SelectedPhaseDocuments] Updating status for document ${document.name} to ${status}`);

    const success = await updateDocumentStatus(document.id, status);
    if (success) {
      onDocumentUpdated({ ...document, status });
    }
  };

  const handleDeadlineChange = async (document: any, deadline: Date | undefined) => {
    console.log(`[SelectedPhaseDocuments] Updating deadline for document ${document.name}`);

    const success = await updateDocumentDeadline(document.id, deadline);
    if (success) {
      onDocumentUpdated({ ...document, due_date: deadline?.toISOString() });
    }
  };

  const handleEditDocument = (document: any) => {
    setEditingDocument(document);
  };

  const handleAssignReviewers = (document: any) => {
    setAssigningReviewers(document);
  };

  const handleDocumentUpdated = (updatedDocument: any) => {
    onDocumentUpdated(updatedDocument);
    setEditingDocument(null);
  };

  const handleReviewersUpdated = (updatedDocument: any) => {
    onDocumentUpdated(updatedDocument);
    setAssigningReviewers(null);
  };

  const handleViewDocument = (document: any) => {
    console.log(`[SelectedPhaseDocuments] Attempting to view document:`, {
      name: document.name,
      id: document.id,
      file_path: document.file_path,
      file_name: document.file_name
    });

    if (!hasUploadedFile(document)) {
      console.warn(`[SelectedPhaseDocuments] No file attached to document "${document.name}"`);
      toast.error("No file attached to this document");
      return;
    }

    console.log(`[SelectedPhaseDocuments] Opening document viewer for "${document.name}"`);
    setViewingDocument(document);
  };

  // Get documents from either documents or allDocuments property
  const phaseDocuments = selectedPhase?.documents || selectedPhase?.allDocuments || [];
  
  if (!selectedPhase || phaseDocuments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No Documents Found</p>
        <p className="text-sm">This phase has no documents or no documents match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="border-b pb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          {selectedPhase.name} Documents
          {selectedPhase.isCurrentPhase && (
            <Badge variant="default" className="text-xs bg-primary">Current Phase</Badge>
          )}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {phaseDocuments.length} document{phaseDocuments.length !== 1 ? 's' : ''} in this phase
        </p>
      </div>

      {/* Documents Grid */}
      <div className="space-y-4">
        {phaseDocuments.map((doc: any) => {
          const typeInfo = getDocumentTypeInfo(doc);
          const hasFile = hasUploadedFile(doc);
          const dueDateInfo = getDueDateInfo(doc);
          const isOverdue = isDocumentOverdue(doc);

          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg font-semibold">{doc.name}</CardTitle>
                      <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
                        {typeInfo.label}
                      </Badge>
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
                    </div>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    )}
                    {/* Section Display */}
                    {getSectionNames(doc).length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {getSectionNames(doc).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Prominent Due Date in Top Right Corner */}
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium px-2 py-1 ${dueDateInfo.color}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {dueDateInfo.display}
                      {dueDateInfo.isOverdue && (
                        <span className="ml-1 text-xs">(Overdue)</span>
                      )}
                      {dueDateInfo.isSoon && !dueDateInfo.isOverdue && (
                        <span className="ml-1 text-xs">(Due Soon)</span>
                      )}
                    </Badge>

                    <div className="flex items-center gap-2">
                      {hasFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                          className="flex items-center gap-1"
                          title="View document file"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      )}
                      <select
                        value={doc.status || 'Not Started'}
                        onChange={(e) => handleStatusChange(doc, e.target.value)}
                        disabled={isUpdating}
                        className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Not Required">Not Required</option>
                      </select>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.document_type || 'Standard'}
                      </Badge>
                      <DocumentActionMenu
                        onEdit={() => handleEditDocument(doc)}
                        onAssignReviewers={() => handleAssignReviewers(doc)}
                        disabled={isUpdating}
                        documentType={typeInfo.type}
                        isDefaultDocument={!!doc.template_source_id || (typeof doc.id === 'string' && doc.id.startsWith('template-'))}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <DocumentReviewersList document={doc} companyId={companyId} />
                    </div>
                  </div>
                  {doc.template_source_id && (
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      Template: {doc.template_source_id.slice(0, 8)}...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Document Dialog */}
      {editingDocument && (
        <EditDocumentDialog
          open={!!editingDocument}
          onOpenChange={(open) => !open && setEditingDocument(null)}
          document={editingDocument}
          onDocumentUpdated={handleDocumentUpdated}
          documentType={getDocumentTypeInfo(editingDocument).type}
          productId={productId}
          companyId={companyId}
          handleRefreshData={() => { }}
        />
      )}

      {/* Assign Reviewers Dialog removed for template instances */}

      {/* Document Viewer Dialog */}
      {viewingDocument && (
        <DocumentViewer
          open={!!viewingDocument}
          onOpenChange={(open) => !open && setViewingDocument(null)}
          documentId={viewingDocument.id}
          documentName={viewingDocument.name}
          companyId={companyId}
          documentFile={{
            path: viewingDocument.file_path,
            name: viewingDocument.file_name || 'Unknown file',
            size: viewingDocument.file_size,
            type: viewingDocument.file_type,
            uploadedAt: viewingDocument.uploaded_at
          }}
          companyRole={activeRole}
          reviewerGroupId="default"
          onStatusChanged={(docId, newStatus) => {
            // Notify parent to refresh when status changes
            onDocumentUpdated({ ...viewingDocument, status: newStatus });
          }}
        />
      )}
    </div>
  );
}
