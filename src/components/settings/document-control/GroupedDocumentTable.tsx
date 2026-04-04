
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Trash2, RefreshCw, Edit3, Table } from "lucide-react";
import { useAutoDocumentSync } from "@/hooks/useAutoDocumentSync";
import { EditableDocumentTable } from "./EditableDocumentTable";

interface PhaseGroup {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    name: string;
    documentType: string;
    status: string;
  }>;
}

interface GroupedDocumentTableProps {
  companyId: string;
  onDocumentChange?: () => void;
}

export function GroupedDocumentTable({ companyId, onDocumentChange }: GroupedDocumentTableProps) {
  const [phaseGroups, setPhaseGroups] = useState<PhaseGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Use auto-sync hook instead of manual sync
  const { isSyncing, lastSyncTime } = useAutoDocumentSync({
    companyId,
    onSyncComplete: () => {
      loadPhaseGroups(false);
      onDocumentChange?.();
    }
  });

  useEffect(() => {
    loadPhaseGroups();
  }, [companyId]);

  const loadPhaseGroups = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      // Only show loading if it's a manual refresh
    } else {
      setIsLoading(true);
    }
    
    try {
      console.log('[GroupedDocumentTable] Loading phase groups for company:', companyId);
      
      // Load company phases with documents - FIXED: Use company_phases directly
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id, name, position')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');

      if (phasesError) {
        console.error('[GroupedDocumentTable] Error loading phases:', phasesError);
        throw phasesError;
      }

      console.log('[GroupedDocumentTable] Found phases:', companyPhases?.length || 0);

      const groups: PhaseGroup[] = [];

      for (const phase of companyPhases || []) {
        console.log(`[GroupedDocumentTable] Loading documents for phase: ${phase.name}`);
        
        // Get documents for this phase from phase_assigned_documents
        const { data: documents, error: docsError } = await supabase
          .from('phase_assigned_documents')
          .select('id, name, document_type, status')
          .eq('phase_id', phase.id);

        if (docsError) {
          console.error(`[GroupedDocumentTable] Error loading documents for phase ${phase.name}:`, docsError);
          continue;
        }

        console.log(`[GroupedDocumentTable] Found ${documents?.length || 0} documents for phase: ${phase.name}`);

        groups.push({
          id: phase.id,
          name: phase.name,
          documents: (documents || []).map(doc => ({
            id: doc.id,
            name: doc.name,
            documentType: doc.document_type || 'Standard',
            status: doc.status || 'Not Started'
          }))
        });
      }

      console.log('[GroupedDocumentTable] Total groups created:', groups.length);
      console.log('[GroupedDocumentTable] Total documents across all phases:', groups.reduce((sum, g) => sum + g.documents.length, 0));
      
      setPhaseGroups(groups);
    } catch (error) {
      console.error('[GroupedDocumentTable] Error loading phase groups:', error);
      toast.error('Failed to load phase groups');
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = async (phaseId: string, documentName: string) => {
    try {
      console.log(`[GroupedDocumentTable] Adding document "${documentName}" to phase:`, phaseId);
      
      const { error } = await supabase
        .from('phase_assigned_documents')
        .insert({
          phase_id: phaseId,
          name: documentName,
          document_type: 'Standard',
          status: 'Not Started',
          document_scope: 'company_template'
        });

      if (error) throw error;

      toast.success('Document added successfully');
      // Auto-sync will handle the refresh
    } catch (error) {
      console.error('[GroupedDocumentTable] Error adding document:', error);
      toast.error('Failed to add document');
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      console.log(`[GroupedDocumentTable] Deleting document:`, documentId);
      
      const { error } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document deleted successfully');
      // Auto-sync will handle the refresh
    } catch (error) {
      console.error('[GroupedDocumentTable] Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const filteredGroups = phaseGroups.map(group => ({
    ...group,
    documents: group.documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.documents.length > 0 || searchTerm === "");

  const totalDocuments = phaseGroups.reduce((sum, group) => sum + group.documents.length, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading phase documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show editable table view
  if (viewMode === 'table') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setViewMode('grouped')}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Switch to Grouped View
          </Button>
        </div>
        <EditableDocumentTable companyId={companyId} onDocumentChange={onDocumentChange} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {isSyncing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Auto-syncing...
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => setViewMode('table')}
          className="flex items-center gap-2"
        >
          <Table className="h-4 w-4" />
          Switch to Table View
        </Button>
        <Badge variant="secondary" className="text-sm">
          {totalDocuments} total documents
        </Badge>
        {lastSyncTime && (
          <Badge variant="outline" className="text-xs">
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      {phaseGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center p-6">
            <p className="text-muted-foreground">No phases found for this company.</p>
            <p className="text-sm text-muted-foreground mt-2">Set up company phases first, then import documents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{group.name}</span>
                  <Badge variant="secondary">{group.documents.length} documents</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{document.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {document.documentType} • {document.status}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteDocument(document.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg">
                    <Input
                      placeholder="Enter document name..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            addDocument(group.id, input.value.trim());
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
