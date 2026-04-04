import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, RefreshCw, Wrench, ArrowRightLeft } from "lucide-react";
import { useEnhancedDocumentSync } from "@/hooks/useEnhancedDocumentSync";
import { useDocumentExclusion } from "@/hooks/useDocumentExclusion";
import { useUnifiedDocumentManagement } from "@/hooks/useUnifiedDocumentManagement";
import { DocumentExclusionControl } from "./DocumentExclusionControl";
import { PhaseOverviewCard } from "./PhaseOverviewCard";
import { EnhancedUnifiedDocumentManager } from "./EnhancedUnifiedDocumentManager";
import { supabase } from "@/integrations/supabase/client";
import { getEnhancedCompanyPhaseMappings, findEnhancedPhaseByName } from "@/utils/enhancedPhaseMapping";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  status: string;
  document_type: string;
  phase_id: string;
  phase_name?: string;
  deadline?: string;
  description?: string;
}

interface UnifiedDocumentManagerProps {
  productId?: string;
  companyId: string;
  currentPhase?: string;
  onDocumentUpdate?: (document: Document) => void;
}

export function UnifiedDocumentManager({
  productId,
  companyId,
  currentPhase,
  onDocumentUpdate
}: UnifiedDocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const [currentPhaseId, setCurrentPhaseId] = useState<string | undefined>();
  const [cleanupInfo, setCleanupInfo] = useState<string>('');
  const [showUnifiedView, setShowUnifiedView] = useState(false);
  
  const { isSyncing, syncProductDocuments } = useEnhancedDocumentSync();
  const { isDocumentExcluded, refreshExclusions } = useDocumentExclusion(currentPhaseId);
  
  // Use the new unified management hook for company-level view
  const unifiedHook = useUnifiedDocumentManagement(showUnifiedView ? companyId : undefined);

  useEffect(() => {
    if (productId && companyId) {
      fetchDocuments();
    } else if (companyId) {
      fetchTemplates();
    }
  }, [productId, companyId, currentPhase]);

  const fetchDocuments = async () => {
    if (!productId) return;
    
    setIsLoading(true);
    try {
      // Get enhanced company phase mappings
      const phaseMappings = await getEnhancedCompanyPhaseMappings(companyId);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', productId)
        .eq('company_id', companyId);

      if (error) throw error;

      // Enhance documents with phase names using enhanced mapping
      const docsWithPhase = (data || []).map(doc => {
        let phase_name = 'Unknown Phase';
        
        if (doc.phase_id) {
          const phase = phaseMappings.find(p => p.id === doc.phase_id);
          if (phase) {
            phase_name = phase.name;
          }
        }

        return {
          ...doc,
          phase_name
        };
      });

      setDocuments(docsWithPhase);

      // Set current phase ID for exclusion functionality using enhanced mapping
      if (currentPhase) {
        const currentPhaseMapping = findEnhancedPhaseByName(phaseMappings, currentPhase);
        if (currentPhaseMapping) {
          setCurrentPhaseId(currentPhaseMapping.id);
        }
      }

    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data: phases, error: phasesError } = await supabase
        .from('phases')
        .select(`
          id,
          name,
          phase_assigned_documents(*)
        `)
        .eq('company_id', companyId);

      if (phasesError) throw phasesError;

      const allTemplates = (phases || []).flatMap(phase =>
        (phase.phase_assigned_documents || []).map(doc => ({
          ...doc,
          phase_name: phase.name
        }))
      );

      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncDocuments = async () => {
    if (!productId || !currentPhase) return;

    const result = await syncProductDocuments(productId, companyId, currentPhase);
    
    if (result.success) {
      if (result.details && result.details.length > 0) {
        const cleanupSummary = result.details
          .map(d => `${d.action_taken}: ${d.details}`)
          .join(', ');
        setCleanupInfo(cleanupSummary);
      }
      
      await fetchDocuments();
    }
  };

  const handleCleanupAndSync = async () => {
    if (!productId) return;
    
    toast.info('Running cleanup and sync...');
    await handleSyncDocuments();
  };

  const updateDocumentStatus = async (documentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: newStatus }
            : doc
        )
      );

      const updatedDoc = documents.find(doc => doc.id === documentId);
      if (updatedDoc && onDocumentUpdate) {
        onDocumentUpdate({ ...updatedDoc, status: newStatus });
      }

      toast.success('Document status updated');
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-blue-500';
      case 'not required': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const calculateProgress = () => {
    if (documents.length === 0) return 0;
    const completed = documents.filter(doc => doc.status === 'Completed').length;
    return Math.round((completed / documents.length) * 100);
  };

  const handleExclusionToggle = () => {
    refreshExclusions();
    fetchDocuments();
  };

  const currentPhaseDocuments = documents.filter(doc => 
    doc.phase_name === currentPhase
  );

  const documentsByPhase = documents.reduce((acc, doc) => {
    const phaseName = doc.phase_name || 'Unknown Phase';
    if (!acc[phaseName]) {
      acc[phaseName] = [];
    }
    acc[phaseName].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const excludedCount = currentPhaseDocuments.filter(doc => 
    isDocumentExcluded(doc.name)
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  // Show enhanced unified view for company-level management
  if (!productId) {
    return (
      <div className="space-y-4">
        <EnhancedUnifiedDocumentManager 
          companyId={companyId}
          showCreateButton={true}
          onDocumentCreate={() => toast.info("Document creation dialog would open here")}
        />
        
        {/* Traditional view toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Company Document Templates
                <Badge variant="outline">{templates.length} templates</Badge>
              </div>
              <Button
                onClick={() => setShowUnifiedView(!showUnifiedView)}
                variant="outline"
                size="sm"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {showUnifiedView ? 'Show Templates' : 'Show Unified View'}
              </Button>
            </CardTitle>
          </CardHeader>
          
          {!showUnifiedView && (
            <CardContent>
              <div className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium">{template.name}</h5>
                      <Badge variant="outline" className="text-xs mt-1">
                        {template.phase_name}
                      </Badge>
                    </div>
                    <Badge className={getStatusColor(template.status)}>
                      {template.document_type}
                    </Badge>
                  </div>
                ))}

                {templates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No document templates configured for this company.
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Management
            {productId && (
              <Badge variant="outline">
                {documents.length} documents
              </Badge>
            )}
            {excludedCount > 0 && (
              <Badge variant="secondary">
                {excludedCount} excluded
              </Badge>
            )}
          </div>
          
          {productId && currentPhase && (
            <div className="flex gap-2">
              {documents.length === 0 ? (
                <Button
                  onClick={handleSyncDocuments}
                  disabled={isSyncing}
                  className="bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isSyncing ? 'Creating...' : 'Create Documents'}
                </Button>
              ) : (
                <Button
                  onClick={handleSyncDocuments}
                  disabled={isSyncing}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isSyncing ? 'Syncing...' : 'Sync Templates'}
                </Button>
              )}
              <Button
                onClick={handleCleanupAndSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="bg-orange-50 border-orange-200 hover:bg-orange-100"
              >
                <Wrench className="h-4 w-4 mr-2" />
                {isSyncing ? 'Cleaning & Syncing...' : 'Cleanup & Sync'}
              </Button>
              <Button
                onClick={fetchDocuments}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardTitle>
        {cleanupInfo && (
          <div className="text-sm text-muted-foreground bg-green-50 p-2 rounded">
            Cleanup completed: {cleanupInfo}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">
              Current Phase ({currentPhaseDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="phases">
              All Phases ({Object.keys(documentsByPhase).length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Documents ({documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentPhase && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Phase: {currentPhase}</h4>
                  <span className="text-sm text-muted-foreground">
                    {calculateProgress()}% complete
                  </span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            )}

            <div className="space-y-2">
              {currentPhaseDocuments.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-medium">{doc.name}</h5>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentPhaseId && (
                      <DocumentExclusionControl
                        companyId={companyId}
                        selectedPhaseId={currentPhaseId}
                      />
                    )}
                    <select
                      value={doc.status}
                      onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Not Required">Not Required</option>
                    </select>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.document_type}
                    </Badge>
                  </div>
                </div>
              ))}

            {currentPhaseDocuments.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <h3 className="font-medium text-lg mb-2">No Documents Found</h3>
                  <p className="text-sm max-w-md mx-auto">
                    This product doesn't have any documents yet. Create documents from your company's templates to get started.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    onClick={handleSyncDocuments}
                    disabled={isSyncing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isSyncing ? 'Creating Documents...' : 'Create Documents from Templates'}
                  </Button>
                  <Button
                    onClick={handleCleanupAndSync}
                    disabled={isSyncing}
                    variant="outline"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    {isSyncing ? 'Running Cleanup...' : 'Cleanup & Create'}
                  </Button>
                </div>
                {currentPhase && (
                  <p className="text-xs text-muted-foreground">
                    Will create documents for phase: <strong>{currentPhase}</strong>
                  </p>
                )}
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(documentsByPhase).map(([phaseName, phaseDocuments]) => (
                <PhaseOverviewCard
                  key={phaseName}
                  phaseName={phaseName}
                  documents={phaseDocuments}
                  isCurrentPhase={phaseName === currentPhase}
                  onClick={() => setActiveTab('all')}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {Object.entries(documentsByPhase).map(([phaseName, phaseDocuments]) => (
              <div key={phaseName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    {phaseName}
                    {phaseName === currentPhase && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {phaseDocuments.length} documents
                  </Badge>
                </div>
                
                <div className="space-y-2 ml-4">
                  {phaseDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <h5 className="font-medium">{doc.name}</h5>
                        {doc.description && (
                          <span className="text-xs text-muted-foreground">{doc.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={doc.status}
                          onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Not Required">Not Required</option>
                        </select>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.document_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
