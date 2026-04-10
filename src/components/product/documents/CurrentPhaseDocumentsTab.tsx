import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, AlertCircle, File, Eye } from "lucide-react";
import { DocumentActionMenu } from './DocumentActionMenu';
import { DocumentReviewersList } from './DocumentReviewersList';
import { DocumentDraftDrawer } from './DocumentDraftDrawer';
import { DocumentViewer } from '../DocumentViewer';
import { DueDateBadge } from './DueDateBadge';
import { useIsolatedDocumentOperations } from '@/hooks/useIsolatedDocumentOperations';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from "sonner";

interface CurrentPhaseDocumentsTabProps {
  currentPhase?: string | null;
  phaseDocuments: any[];
  onSyncCompanyDocs: () => void;
  onDocumentStatusChange: (documentId: string, status: string) => void;
  onDocumentDeadlineChange?: (documentId: string, date: Date | undefined) => void;
  onDocumentUpdated: (document: any) => void;
  isSyncing?: boolean;
  isUpdating?: boolean;
  productId: string;
  companyId: string;
  handleRefreshData: () => void,
}

export function CurrentPhaseDocumentsTab({
  currentPhase,
  phaseDocuments,
  onSyncCompanyDocs,
  onDocumentStatusChange,
  onDocumentDeadlineChange,
  onDocumentUpdated,
  isSyncing = false,
  isUpdating = false,
  productId,
  companyId,
  handleRefreshData
}: CurrentPhaseDocumentsTabProps) {
  const { activeRole } = useCompanyRole();
  const [draftDrawerDocument, setDraftDrawerDocument] = useState<any>(null);
  // Removed assigningReviewers state - template instance reviewer assignment now in Edit dialog
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set());
  const [currentPhaseInstances, setCurrentPhaseInstances] = useState<any[]>([]);
  const [isLoadingPhaseInstances, setIsLoadingPhaseInstances] = useState(false);
  // console.log('phaseDocuments CurrentPhaseDocumentsTab', phaseDocuments);
  // // console.log('productId CurrentPhaseDocumentsTab', productId);
  // Use improved isolated document operations
  const {
    isUpdating: isServiceUpdating,
    updateDocumentStatus,
    updateDocumentDeadline
  } = useIsolatedDocumentOperations(productId, companyId);

  // Load current phase instances on mount and when current phase changes
  useEffect(() => {
    if (currentPhase && productId && companyId) {
      loadCurrentPhaseInstances();
    }
  }, [currentPhase, productId, companyId]);

  const loadCurrentPhaseInstances = async () => {
    if (!currentPhase || !productId || !companyId) return;

    setIsLoadingPhaseInstances(true);
    try {
      // Simple document loading without the AutomaticInstanceService
      setCurrentPhaseInstances(phaseDocuments);
      // console.log("Loaded current phase instances:", phaseDocuments.length);
    } catch (error) {
      console.error("Error loading current phase instances:", error);
      setCurrentPhaseInstances([]);
    } finally {
      setIsLoadingPhaseInstances(false);
    }
  };

  /**
   * Improved document filtering with better validation
   */
  const getValidDocuments = (documents: any[]): any[] => {
    if (!Array.isArray(documents)) {
      console.warn('[CurrentPhaseDocumentsTab] Invalid documents array provided');
      return [];
    }

    const filtered = documents.filter(doc => {
      // Accept documents that look like they could be template instances
      // We'll let the service handle the detailed validation
      const hasDocumentScope = doc.document_scope === 'product_document' || !doc.document_scope;
      // const belongsToProduct = doc.productId === productId;
      // console.log('doc', doc);
      // // console.log('belongsToProduct', belongsToProduct);
      // console.log('hasDocumentScope', hasDocumentScope);
      // console.log('productId', productId);
      // console.log('doc.product_id', doc.product_id);
      // if (!belongsToProduct) {
      //   // console.log(`[CurrentPhaseDocumentsTab] Filtering out document not belonging to this product: ${doc.name}`);
      //   return false;
      // }

      return hasDocumentScope;
    });

    // console.log(`[CurrentPhaseDocumentsTab] Filtered ${filtered.length} documents from ${documents.length} total`);
    return filtered;
  };

  // Apply improved filtering
  // console.log('[CurrentPhaseDocumentsTab] phaseDocuments:', phaseDocuments);
  // console.log('[CurrentPhaseDocumentsTab] First document reviewer_group_ids:', phaseDocuments[0]?.reviewer_group_ids);
  const validDocuments = getValidDocuments(phaseDocuments);
  // console.log('[CurrentPhaseDocumentsTab] validDocuments:', validDocuments);
  // console.log('[CurrentPhaseDocumentsTab] First valid document reviewer_group_ids:', validDocuments[0]?.reviewer_group_ids);
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'closed': return 'bg-green-500 text-white';
      case 'open': return 'bg-blue-500 text-white';
      case 'n/a': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
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

  const handleStatusChange = async (document: any, status: string) => {
    const docId = document.id;
    // console.log(`[CurrentPhaseDocumentsTab] Updating status for document ${document.name} (${docId}) to ${status}`);

    addProcessingDocument(docId);

    try {
      const success = await updateDocumentStatus(docId, status);
      if (success) {
        onDocumentStatusChange(docId, status);
      }
    } catch (error) {
      console.error(`[CurrentPhaseDocumentsTab] Failed to update status:`, error);
      toast.error("Failed to update document status");
    } finally {
      removeProcessingDocument(docId);
    }
  };

  const handleEditDocument = (document: any) => {
    setDraftDrawerDocument(document);
  };

  // Removed handleAssignReviewers for template instances - now handled in Edit Instance dialog

  const handleDocumentUpdated = (updatedDocument: any) => {
    onDocumentUpdated(updatedDocument);
    setDraftDrawerDocument(null);
  };

  // Removed handleReviewersUpdated - template instance reviewer assignment now in Edit dialog

  const getDocumentTypeInfo = (document: any) => {
    if (document.template_source_id || document.document_scope === 'company_template' || document.is_template) {
      return {
        label: 'Template CI',
        color: 'bg-green-100 text-green-700 border-green-300'
      };
    } else {
      return {
        label: 'Product Document',
        color: 'bg-purple-100 text-purple-700 border-purple-300'
      };
    }
  };

  const hasUploadedFile = (document: any) => {
    const hasFile = !!(document.file_path || document.file_name);
    // console.log(`[CurrentPhaseDocumentsTab] Document "${document.name}" file check:`, { file_path: document.file_path, file_name: document.file_name, file_type: document.file_type, file_size: document.file_size, hasFile });
    return hasFile;
  };

  const getFileIcon = (document: any) => {
    if (!hasUploadedFile(document)) return null;

    const fileType = document.file_type?.toLowerCase() || document.file_name?.split('.').pop()?.toLowerCase();

    // Return appropriate icon based on file type
    if (fileType?.includes('pdf')) return <File className="h-4 w-4 text-red-500" />;
    if (fileType?.includes('word') || fileType?.includes('doc')) return <File className="h-4 w-4 text-blue-500" />;
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return <File className="h-4 w-4 text-green-500" />;
    if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return <File className="h-4 w-4 text-orange-500" />;

    return <File className="h-4 w-4 text-gray-500" />;
  };

  // Removed handleViewDocument - viewing now handled in Edit Instance dialog

  const completedCount = validDocuments.filter(doc => doc.status === 'Closed').length;
  const totalCount = validDocuments.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Current Phase Documents: {currentPhase || 'No phase selected'}
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {totalCount} Documents
            </Badge>
            {completedCount > 0 && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                {completedCount} Completed
              </Badge>
            )}
          </CardTitle>
          <Button
            onClick={onSyncCompanyDocs}
            size="sm"
            disabled={isSyncing || isUpdating || isServiceUpdating}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All Company Templates'}
          </Button>
        </CardHeader>
        <CardContent>
          {!currentPhase ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No current lifecycle phase set for this product.</p>
              <p className="text-sm mt-2">Set a current lifecycle phase to see documents.</p>
            </div>
          ) : validDocuments.length > 0 ? (
            <div className="space-y-3">
              {validDocuments.map((doc) => {
                const typeInfo = getDocumentTypeInfo(doc);
                const isProcessing = processingDocuments.has(doc.id);
                const fileIcon = getFileIcon(doc);
                const hasFile = hasUploadedFile(doc);
                const isOverdue = isDocumentOverdue(doc);

                return (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{doc.name}</h5>
                        <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                        {doc.template_source_id && (
                          <Badge variant="outline" className="text-xs">
                            Template: {doc.template_source_id.slice(0, 8)}...
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
                        {isProcessing && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                            Updating...
                          </Badge>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        {doc.phase_id && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Phase ID:</span>
                            <span className="text-xs font-mono">{doc.phase_id.slice(0, 8)}...</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Reviewers:</span>
                          <DocumentReviewersList document={doc} companyId={companyId} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <DueDateBadge document={doc} />
                      <div className="flex items-center gap-3">
                        {/* Add back view button */}
                        {doc.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingDocument(doc)}
                            className="h-8 px-3"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <select
                          value={doc.status || 'Open'}
                          onChange={(e) => handleStatusChange(doc, e.target.value)}
                          disabled={isUpdating || isServiceUpdating || isProcessing}
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
                          onAssignReviewers={() => {}}
                          disabled={isUpdating || isServiceUpdating || isProcessing}
                          documentType={doc.template_source_id ? "template-instance" : "product-specific"}
                          isDefaultDocument={!!doc.template_source_id || (typeof doc.id === 'string' && doc.id.startsWith('template-'))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
              <p className="mb-4">No documents are available for the current phase: {currentPhase}</p>
              <div className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800 mb-2">Troubleshooting:</div>
                    <div className="space-y-1 text-yellow-700">
                      <div>• Check if company templates exist for this phase</div>
                      <div>• Verify the product's current phase matches company phase names</div>
                      <div>• Try the "Sync All Company Templates" button to create instances</div>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={onSyncCompanyDocs} disabled={isSyncing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync All Company Templates'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Draft Drawer */}
      <DocumentDraftDrawer
        open={!!draftDrawerDocument}
        onOpenChange={(open) => {
          if (!open) {
            setDraftDrawerDocument(null);
            handleRefreshData();
          }
        }}
        documentId={draftDrawerDocument?.id || ''}
        documentName={draftDrawerDocument?.name || ''}
        documentType={draftDrawerDocument?.document_type || 'Standard'}
        productId={productId}
        companyId={companyId}
        onDocumentSaved={() => {
          setDraftDrawerDocument(null);
          handleRefreshData();
        }}
        filePath={draftDrawerDocument?.file_path}
        fileName={draftDrawerDocument?.file_name}
      />

      {/* Assign Reviewers Dialog removed for template instances - now handled in Edit Instance dialog */}

      {/* Document Viewer Dialog - NOW WITH COMPANY ID */}
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
            // Refresh document list when status changes
            handleRefreshData();
            onDocumentStatusChange(docId, newStatus);
          }}
        />
      )}
    </div>
  );
}
