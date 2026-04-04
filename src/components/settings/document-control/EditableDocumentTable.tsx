
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Trash2, RefreshCw, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { useAutoDocumentSync } from "@/hooks/useAutoDocumentSync";

interface DocumentRow {
  id: string;
  name: string;
  documentType: string;
  status: string;
  phaseId: string;
  phaseName: string;
  isNew?: boolean;
  isModified?: boolean;
}

interface EditableDocumentTableProps {
  companyId: string;
  onDocumentChange?: () => void;
}

type SortColumn = 'name' | 'documentType' | 'status' | 'phaseName';
type SortDirection = 'asc' | 'desc';

export function EditableDocumentTable({ companyId, onDocumentChange }: EditableDocumentTableProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isSaving, setIsSaving] = useState(false);
  const [availablePhases, setAvailablePhases] = useState<Array<{id: string, name: string}>>([]);

  const { isSyncing, lastSyncTime } = useAutoDocumentSync({
    companyId,
    onSyncComplete: () => {
      loadDocuments(false);
      onDocumentChange?.();
    }
  });

  React.useEffect(() => {
    loadDocuments();
    loadAvailablePhases();
  }, [companyId]);

  const loadAvailablePhases = async () => {
    try {
      const { data: phases, error } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');

      if (error) throw error;
      setAvailablePhases(phases || []);
    } catch (error) {
      console.error('Error loading phases:', error);
    }
  };

  const loadDocuments = async (showRefreshIndicator = true) => {
    if (showRefreshIndicator) {
      setIsLoading(true);
    }
    
    try {
      console.log('[EditableDocumentTable] Loading documents for company:', companyId);
      
      const { data: phaseDocuments, error } = await supabase
        .from('phase_assigned_documents')
        .select(`
          id,
          name,
          document_type,
          status,
          phase_id,
          company_phases!inner(id, name, company_id)
        `)
        .eq('company_phases.company_id', companyId);

      if (error) {
        console.error('[EditableDocumentTable] Error loading documents:', error);
        throw error;
      }

      const formattedDocuments: DocumentRow[] = (phaseDocuments || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        documentType: doc.document_type || 'Standard',
        status: doc.status || 'Not Started',
        phaseId: doc.phase_id,
        phaseName: (doc.company_phases as any).name,
        isNew: false,
        isModified: false
      }));

      console.log('[EditableDocumentTable] Loaded documents:', formattedDocuments.length);
      setDocuments(formattedDocuments);
    } catch (error) {
      console.error('[EditableDocumentTable] Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.phaseName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, searchTerm, sortColumn, sortDirection]);

  const updateDocument = (id: string, field: keyof DocumentRow, value: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          [field]: value,
          isModified: !doc.isNew ? true : doc.isModified
        };
      }
      return doc;
    }));
  };

  const duplicateDocument = (sourceDoc: DocumentRow) => {
    const newDoc: DocumentRow = {
      id: `new-${Date.now()}-${Math.random()}`,
      name: `${sourceDoc.name} (Copy)`,
      documentType: sourceDoc.documentType,
      status: sourceDoc.status,
      phaseId: sourceDoc.phaseId,
      phaseName: sourceDoc.phaseName,
      isNew: true,
      isModified: false
    };
    
    setDocuments(prev => [...prev, newDoc]);
    toast.success('Document duplicated');
  };

  const addNewDocument = () => {
    const firstPhaseId = availablePhases.length > 0 ? availablePhases[0].id : '';
    const firstPhaseName = availablePhases.length > 0 ? availablePhases[0].name : '';
    
    const newDoc: DocumentRow = {
      id: `new-${Date.now()}-${Math.random()}`,
      name: 'New Document',
      documentType: 'Standard',
      status: 'Not Started',
      phaseId: firstPhaseId,
      phaseName: firstPhaseName,
      isNew: true,
      isModified: false
    };
    
    setDocuments(prev => [...prev, newDoc]);
  };

  const deleteDocument = async (doc: DocumentRow) => {
    if (doc.isNew) {
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast.success('Document removed');
    } else {
      try {
        const { error } = await supabase
          .from('phase_assigned_documents')
          .delete()
          .eq('id', doc.id);

        if (error) throw error;

        setDocuments(prev => prev.filter(d => d.id !== doc.id));
        toast.success('Document deleted');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const newDocuments = documents.filter(doc => doc.isNew);
      const modifiedDocuments = documents.filter(doc => doc.isModified && !doc.isNew);

      for (const doc of newDocuments) {
        const { error } = await supabase
          .from('phase_assigned_documents')
          .insert({
            phase_id: doc.phaseId,
            name: doc.name,
            document_type: doc.documentType,
            status: doc.status,
            document_scope: 'company_template'
          });

        if (error) throw error;
      }

      for (const doc of modifiedDocuments) {
        const { error } = await supabase
          .from('phase_assigned_documents')
          .update({
            name: doc.name,
            document_type: doc.documentType,
            status: doc.status,
            phase_id: doc.phaseId
          })
          .eq('id', doc.id);

        if (error) throw error;
      }

      toast.success(`Saved ${newDocuments.length + modifiedDocuments.length} changes`);
      await loadDocuments(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const hasChanges = documents.some(doc => doc.isNew || doc.isModified);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
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
        <Badge variant="secondary" className="text-sm">
          {documents.length} documents
        </Badge>
        {lastSyncTime && (
          <Badge variant="outline" className="text-xs">
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </Badge>
        )}
        <Button onClick={addNewDocument} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
        {hasChanges && (
          <Button 
            onClick={saveChanges} 
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-medium flex items-center gap-2"
                    >
                      Document Name
                      {getSortIcon('name')}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button
                      variant="ghost"
                      size="sm" 
                      onClick={() => handleSort('documentType')}
                      className="h-auto p-0 font-medium flex items-center gap-2"
                    >
                      Type
                      {getSortIcon('documentType')}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-medium flex items-center gap-2"
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </th>
                  <th className="text-left p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('phaseName')}
                      className="h-auto p-0 font-medium flex items-center gap-2"
                    >
                      Phase
                      {getSortIcon('phaseName')}
                    </Button>
                  </th>
                  <th className="text-left p-2 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredDocuments.map((doc) => (
                  <tr key={doc.id} className={`border-b ${doc.isNew ? 'bg-green-50' : doc.isModified ? 'bg-yellow-50' : ''}`}>
                    <td className="p-2">
                      <Input
                        value={doc.name}
                        onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="p-2">
                      <Select
                        value={doc.documentType}
                        onValueChange={(value) => updateDocument(doc.id, 'documentType', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Regulatory">Regulatory</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Clinical">Clinical</SelectItem>
                          <SelectItem value="Quality">Quality</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select
                        value={doc.status}
                        onValueChange={(value) => updateDocument(doc.id, 'status', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select
                        value={doc.phaseId}
                        onValueChange={(value) => {
                          const selectedPhase = availablePhases.find(p => p.id === value);
                          updateDocument(doc.id, 'phaseId', value);
                          if (selectedPhase) {
                            updateDocument(doc.id, 'phaseName', selectedPhase.name);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePhases.map(phase => (
                            <SelectItem key={phase.id} value={phase.id}>
                              {phase.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateDocument(doc)}
                          title="Duplicate document"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDocument(doc)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Delete document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedAndFilteredDocuments.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                No documents found matching your search criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
