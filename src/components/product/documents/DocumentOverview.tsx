import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, User, Clock } from "lucide-react";
import { DocumentActionMenu } from "./DocumentActionMenu";
import { DocumentReviewersList } from "./DocumentReviewersList";
import { EditDocumentDialog } from "./EditDocumentDialog";
// AssignReviewersDialog removed for template instances
import { useState } from "react";
import { useIsolatedDocumentOperations } from "@/hooks/useIsolatedDocumentOperations";
import { toast } from "sonner";

interface DocumentOverviewProps {
  documents: any[];
  phases?: any[];
  currentLifecyclePhase?: string | null;
  onDocumentUpdated?: (document: any) => void;
  companyId?: string;
  productId?: string;
  showPhaseInfo?: boolean;
}

export function DocumentOverview({ 
  documents, 
  phases = [], 
  currentLifecyclePhase,
  onDocumentUpdated = () => {},
  companyId,
  productId,
  showPhaseInfo = true
}: DocumentOverviewProps) {
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [assigningReviewers, setAssigningReviewers] = useState<any>(null);
  
  console.log("DocumentOverview currentLifecyclePhase:", currentLifecyclePhase);
  console.log("DocumentOverview companyId:", companyId, "productId:", productId);
  
  // Use isolated document operations
  const {
    isUpdating,
    updateDocumentStatus,
    updateDocumentDeadline
  } = useIsolatedDocumentOperations(productId || '', companyId);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'closed': return 'bg-green-500 text-white';
      case 'open': return 'bg-blue-500 text-white';
      case 'n/a': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getDocumentTypeInfo = (document: any) => {
    console.log("DocumentTypeUtils: Analyzing document:", {
      id: document.id,
      name: document.name,
      template_source_id: document.template_source_id,
      document_scope: document.document_scope,
      product_id: document.product_id
    });
    
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
        type: 'template-instance' as const, // Default to template-instance for company templates
        label: 'Company Template',
        color: 'bg-green-100 text-green-700 border-green-300'
      };
    } else {
      return {
        type: 'product-specific' as const, // Default fallback
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

  const handleStatusChange = async (document: any, status: string) => {
    console.log("Updating status for document:", document.id, "to:", status);
    const success = await updateDocumentStatus(document.id, status);
    if (success) {
      onDocumentUpdated({ ...document, status });
    }
  };

  const handleDeadlineChange = async (document: any, deadline: Date | undefined) => {
    console.log("Updating deadline for document:", document.id, "to:", deadline);
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

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No Documents Found</p>
        <p className="text-sm">No documents match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const typeInfo = getDocumentTypeInfo(doc);
        const rawPhaseName = showPhaseInfo && doc.phase_id ?
          phases.find(p => p.id === doc.phase_id)?.name : null;
        const phaseName = rawPhaseName?.toLowerCase() === 'no phase' ? 'Core' : rawPhaseName;
        const dueDateInfo = getDueDateInfo(doc);
        
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
                    {showPhaseInfo && phaseName && (
                      <Badge variant="outline" className="text-xs">
                        {phaseName}
                      </Badge>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
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
                    <select
                      value={doc.status || 'Open'}
                      onChange={(e) => handleStatusChange(doc, e.target.value)}
                      disabled={isUpdating}
                      className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                      <option value="N/A">N/A</option>
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
          handleRefreshData={() => {}}
        />
      )}

      {/* Assign Reviewers Dialog removed for template instances */}
    </div>
  );
}
