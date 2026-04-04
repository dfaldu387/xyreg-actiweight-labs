import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, RefreshCw, ArrowRightLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useUnifiedDocumentManagement, UnifiedDocument } from "@/hooks/useUnifiedDocumentManagement";
import { EnhancedDocumentPhaseDisplay } from "./EnhancedDocumentPhaseDisplay";
import { convertToCleanPhases } from "@/utils/phaseNumbering";
import { toast } from "sonner";

interface EnhancedUnifiedDocumentManagerProps {
  companyId: string;
  showCreateButton?: boolean;
  onDocumentCreate?: () => void;
}

export function EnhancedUnifiedDocumentManager({
  companyId,
  showCreateButton = false,
  onDocumentCreate
}: EnhancedUnifiedDocumentManagerProps) {
  const [activeTab, setActiveTab] = useState('enhanced-view');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const {
    isLoading,
    documents,
    syncStatus,
    syncAllDocuments,
    refreshDocuments
  } = useUnifiedDocumentManagement(companyId);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await syncAllDocuments();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    await refreshDocuments();
    toast.success("Document data refreshed");
  };

  // Calculate statistics
  const syncedDocuments = documents.filter(doc => doc.is_synced);
  const phaseOnlyDocuments = documents.filter(doc => doc.source === 'phase_assigned');
  const templateOnlyDocuments = documents.filter(doc => doc.source === 'company_template');
  const bothSourceDocuments = documents.filter(doc => doc.source === 'both');

  const syncProgress = documents.length > 0 
    ? Math.round((syncedDocuments.length / documents.length) * 100) 
    : 0;

  // Convert documents to the format expected by EnhancedDocumentPhaseDisplay
  const enhancedDocuments = documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    status: doc.status,
    document_type: doc.document_type,
    phase_id: doc.phase_id,
    phase_name: doc.phase_name,
    uploaded_at: doc.updated_at,
    file_name: doc.name,
    company_name: undefined,
    product_name: undefined
  }));

  // Create phases array from documents
  const phasesFromDocuments = documents
    .filter(doc => doc.phase_id && doc.phase_name)
    .reduce((acc, doc) => {
      if (!acc.find(p => p.id === doc.phase_id)) {
        acc.push({
          id: doc.phase_id!,
          name: doc.phase_name!,
          position: 0 // Will be sorted by name for now
        });
      }
      return acc;
    }, [] as Array<{id: string; name: string; position: number}>)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((phase, index) => ({ ...phase, position: index }));

  const getSyncStatusBadge = (doc: UnifiedDocument) => {
    switch (doc.source) {
      case 'both':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Synced</Badge>;
      case 'phase_assigned':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><AlertCircle className="h-3 w-3 mr-1" />Phase Only</Badge>;
      case 'company_template':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><FileText className="h-3 w-3 mr-1" />Template Only</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading documents...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Document Synchronization
            <Badge variant="outline">{documents.length} total</Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDebug(!showDebug)}
              variant="outline"
              size="sm"
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleSyncAll}
              disabled={isSyncing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync All'}
            </Button>
            {showCreateButton && onDocumentCreate && (
              <Button onClick={onDocumentCreate} size="sm">
                Create Document
              </Button>
            )}
          </div>
        </CardTitle>
        
        {showDebug && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
            <div><strong>Company ID:</strong> {companyId}</div>
            <div><strong>Total Documents:</strong> {documents.length}</div>
            <div><strong>Phase Only:</strong> {phaseOnlyDocuments.length}</div>
            <div><strong>Template Only:</strong> {templateOnlyDocuments.length}</div>
            <div><strong>Both Sources:</strong> {bothSourceDocuments.length}</div>
            <div className="mt-2">
              <strong>Raw Documents:</strong>
              <pre className="mt-1 text-xs overflow-auto max-h-32">
                {JSON.stringify(documents, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
            <p className="text-muted-foreground mb-4">
              No documents are currently configured for this company.
            </p>
            <p className="text-sm text-muted-foreground">
              Company: {companyId}
            </p>
            {showCreateButton && onDocumentCreate && (
              <Button onClick={onDocumentCreate} className="mt-4">
                <FileText className="h-4 w-4 mr-2" />
                Create First Document
              </Button>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="enhanced-view">Enhanced View</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="synced">
                Synced ({bothSourceDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="phase-only">
                Phase Only ({phaseOnlyDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="template-only">
                Template Only ({templateOnlyDocuments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced-view">
              <EnhancedDocumentPhaseDisplay
                documents={enhancedDocuments}
                phases={phasesFromDocuments}
                companyName={companyId}
                onDocumentClick={(doc) => {
                  toast.info(`Clicked document: ${doc.name}`);
                }}
                onUploadClick={(phaseId) => {
                  toast.info(`Upload for phase: ${phaseId}`);
                }}
                showCompanyInfo={false}
              />
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              {/* Sync Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Sync Progress</span>
                        <span className="text-sm text-muted-foreground">{syncProgress}%</span>
                      </div>
                      <Progress value={syncProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {syncedDocuments.length} of {documents.length} documents synchronized
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {syncStatus && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Sync Status Details</span>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Phase Documents:</span>
                            <span className="font-medium">{syncStatus.phaseDocuments}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Template Documents:</span>
                            <span className="font-medium">{syncStatus.templateDocuments}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Synced Documents:</span>
                            <span className="font-medium text-green-600">{syncStatus.syncedDocuments}</span>
                          </div>
                          {syncStatus.unsyncedDocuments.length > 0 && (
                            <div className="pt-1 border-t">
                              <span className="text-orange-600">
                                {syncStatus.unsyncedDocuments.length} unsynced
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{bothSourceDocuments.length}</div>
                  <div className="text-sm text-green-600">Fully Synced</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">{phaseOnlyDocuments.length}</div>
                  <div className="text-sm text-orange-600">Phase Only</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{templateOnlyDocuments.length}</div>
                  <div className="text-sm text-blue-600">Template Only</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="synced" className="space-y-2">
              {bothSourceDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No fully synced documents found. Use "Sync All" to synchronize phase documents with templates.
                </div>
              ) : (
                bothSourceDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex-1">
                      <h5 className="font-medium">{doc.name}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                        {doc.phase_name && (
                          <Badge variant="secondary" className="text-xs">{doc.phase_name}</Badge>
                        )}
                      </div>
                    </div>
                    {getSyncStatusBadge(doc)}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="phase-only" className="space-y-2">
              {phaseOnlyDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No phase-only documents found.
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      These documents exist in phases but haven't been synced to company templates yet.
                    </p>
                  </div>
                  {phaseOnlyDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex-1">
                        <h5 className="font-medium">{doc.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                          {doc.phase_name && (
                            <Badge variant="secondary" className="text-xs">{doc.phase_name}</Badge>
                          )}
                        </div>
                      </div>
                      {getSyncStatusBadge(doc)}
                    </div>
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="template-only" className="space-y-2">
              {templateOnlyDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No template-only documents found.
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <FileText className="h-4 w-4 inline mr-1" />
                      These documents exist as company templates but aren't assigned to specific phases.
                    </p>
                  </div>
                  {templateOnlyDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                      <div className="flex-1">
                        <h5 className="font-medium">{doc.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                          <Badge variant="outline" className="text-xs">{doc.tech_applicability}</Badge>
                        </div>
                      </div>
                      {getSyncStatusBadge(doc)}
                    </div>
                  ))}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
