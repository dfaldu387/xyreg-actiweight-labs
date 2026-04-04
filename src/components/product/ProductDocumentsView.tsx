
import React, { useEffect } from 'react';
import { useOptimizedProductDocuments } from '@/hooks/useOptimizedProductDocuments';
import { useCompanyDocumentInheritance } from '@/hooks/useCompanyDocumentInheritance';
import { useEnhancedDocumentSync } from '@/hooks/useEnhancedDocumentSync';
import { useCompanySync } from '@/hooks/useCompanySync';
import { PhaseRepairDashboard } from '@/components/phase/PhaseRepairDashboard';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Wrench, RefreshCw, Zap, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DocumentFileActions } from '@/components/product/documents/DocumentFileActions';
import { DocumentTemplateFileService } from '@/services/documentTemplateFileService';
import { toast } from 'sonner';

interface ProductDocumentsViewProps {
  productId: string;
  companyId: string;
  currentPhase?: string;
  onDocumentUpdate?: (document: any) => void;
  onRepairComplete?: () => void;
}

export function ProductDocumentsView({
  productId,
  companyId,
  currentPhase,
  onDocumentUpdate,
  onRepairComplete
}: ProductDocumentsViewProps) {
  const {
    documents,
    phases,
    isLoading,
    error,
    updateDocumentStatus,
    refreshDocuments
  } = useOptimizedProductDocuments(productId, companyId);
  
  const { isSyncing, syncProductDocuments } = useEnhancedDocumentSync();
  const { 
    inheritCompanyDocuments, 
    manualSync, 
    isInheriting, 
    lastInheritance 
  } = useCompanyDocumentInheritance(productId, companyId, currentPhase);

  // Company sync hook for real-time sync status
  const {
    syncStatus,
    syncProduct: syncWithCompany,
    refreshSyncStatus
  } = useCompanySync(productId, companyId);

  // Auto-inherit documents when component mounts if no documents exist
  useEffect(() => {
    if (documents.length === 0 && !isLoading && !isInheriting) {
      inheritCompanyDocuments();
    }
  }, [documents.length, isLoading, isInheriting, inheritCompanyDocuments]);

  const handleSyncDocuments = async () => {
    try {
      await syncProductDocuments(productId, companyId, currentPhase);
      await refreshDocuments();
      await refreshSyncStatus();
      toast.success('Documents synced successfully');
    } catch (error) {
      console.error('Error syncing documents:', error);
      toast.error('Failed to sync documents');
    }
  };

  const handleCompanySync = async () => {
    try {
      await syncWithCompany();
      await refreshDocuments();
      toast.success('Product synchronized with company settings');
    } catch (error) {
      console.error('Error syncing with company:', error);
      toast.error('Failed to sync with company settings');
    }
  };

  const handleInheritDocuments = async () => {
    try {
      const result = await manualSync();
      if (result.success) {
        await refreshDocuments();
        await refreshSyncStatus();
        toast.success(`Inherited ${result.inherited} documents successfully`);
      } else {
        toast.error(result.error || 'Failed to inherit documents');
      }
    } catch (error) {
      console.error('Error inheriting documents:', error);
      toast.error('Failed to inherit documents');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading documents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading documents: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PhaseRepairDashboard 
        companyId={companyId}
        onRepairComplete={onRepairComplete}
      />
      
      {/* Sync Status Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <SyncStatusIndicator
            productId={productId}
            companyId={companyId}
            onSyncComplete={refreshDocuments}
            showFullDetails={false}
          />
        </div>
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Quick Actions</h4>
                  <p className="text-xs text-muted-foreground">Company sync controls</p>
                </div>
                <Button
                  onClick={handleCompanySync}
                  variant="outline"
                  size="sm"
                  disabled={isSyncing || isInheriting}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Sync Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Product Documents</h3>
              <p className="text-sm text-muted-foreground">
                {documents.length} documents across {phases.length} phases
              </p>
            </div>
            <div className="flex gap-2">
              {documents.length === 0 ? (
                <Button
                  onClick={handleInheritDocuments}
                  disabled={isInheriting}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isInheriting ? 'Inheriting...' : 'Inherit Company Documents'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleInheritDocuments}
                    disabled={isInheriting}
                    variant="outline"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isInheriting ? 'Inheriting...' : 'Sync Company Templates'}
                  </Button>
                  <Button
                    onClick={handleSyncDocuments}
                    disabled={isSyncing}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isSyncing ? 'Syncing...' : 'Enhanced Sync'}
                  </Button>
                </>
              )}
              <Button
                onClick={refreshDocuments}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <h3 className="font-medium text-lg mb-2">No Documents Found</h3>
                <p className="text-sm max-w-md mx-auto">
                  This product doesn't have any documents yet. Create documents from your company's templates to get started.
                </p>
              </div>
              <Button
                onClick={handleInheritDocuments}
                disabled={isInheriting}
                className="bg-primary hover:bg-primary/90"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isInheriting ? 'Inheriting Documents...' : 'Inherit Documents from Company Templates'}
              </Button>
              {currentPhase && (
                <p className="text-xs text-muted-foreground">
                  Will create documents for phase: <strong>{currentPhase}</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {phases.map((phase) => {
                const phaseDocuments = documents.filter(doc => doc.phaseId === phase.id);
                if (phaseDocuments.length === 0) return null;
                
                return (
                  <div key={phase.id} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {phase.name} ({phaseDocuments.length} documents)
                    </h4>
                    <div className="grid gap-2">
                      {phaseDocuments.map((doc) => (
                        <Card key={doc.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{doc.name}</h5>
                              <p className="text-xs text-muted-foreground">
                                {doc.documentType} • {doc.isTemplate ? 'Template CI' : 'Product Document'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Show file actions for any document with attached files */}
                              {DocumentTemplateFileService.hasAttachedFile({
                                file_path: doc.filePath,
                                file_name: doc.fileName
                              }) && (
                                <DocumentFileActions
                                  document={{
                                    ...doc,
                                    file_path: doc.filePath,
                                    file_name: doc.fileName,
                                    file_size: doc.fileSize,
                                    file_type: doc.fileType,
                                    public_url: doc.publicUrl
                                  }}
                                  companyId={companyId}
                                  onFileUpdated={refreshDocuments}
                                />
                              )}
                              <Badge 
                                variant={doc.status === 'Completed' ? 'default' : 'secondary'}
                              >
                                {doc.status}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newStatus = doc.status === 'Completed' ? 'In Progress' : 'Completed';
                                  updateDocumentStatus(doc.id, newStatus, '');
                                  onDocumentUpdate?.(doc);
                                }}
                              >
                                {doc.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
