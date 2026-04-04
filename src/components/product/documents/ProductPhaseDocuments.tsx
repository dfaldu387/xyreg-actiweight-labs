
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductPhaseDocumentsProps {
  productId: string;
  companyId: string;
}

interface PhaseDocument {
  id: string;
  name: string;
  status: string;
  phaseName: string;
  phaseId: string;
  documentType: string;
  dueDate?: string;
}

export function ProductPhaseDocuments({ productId, companyId }: ProductPhaseDocumentsProps) {
  const [documents, setDocuments] = useState<PhaseDocument[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadPhaseDocuments();
  }, [productId, companyId]);

  const loadPhaseDocuments = async () => {
    setIsLoading(true);
    try {
      // Load company phases - FIXED: Use company_phases
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name, description)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        throw phasesError;
      }

      const phasesList = (companyPhases || []).map(cp => ({
        id: cp.company_phases.id,
        name: cp.company_phases.name,
        description: cp.company_phases.description,
        position: cp.position
      }));

      setPhases(phasesList);

      // Create phase name lookup
      const phaseNameMap = new Map();
      phasesList.forEach(phase => {
        phaseNameMap.set(phase.id, phase.name);
      });

      // Load product documents
      const { data: productDocuments, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', productId);

      if (docsError) {
        throw docsError;
      }

      // Transform documents
      const transformedDocs: PhaseDocument[] = (productDocuments || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.status || 'Not Started',
        phaseId: doc.phase_id || '',
        phaseName: phaseNameMap.get(doc.phase_id) || 'Unknown Phase',
        documentType: doc.document_type || 'Standard',
        dueDate: doc.due_date
      }));

      setDocuments(transformedDocs);

    } catch (error) {
      console.error('Error loading phase documents:', error);
      toast.error('Failed to load phase documents');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocumentStatus = async (documentId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId ? { ...doc, status } : doc
        )
      );

      toast.success('Document status updated');
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500 text-white';
      case 'in progress': return 'bg-blue-500 text-white';
      case 'not started': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  // Group documents by phase
  const documentsByPhase = phases.map(phase => ({
    ...phase,
    documents: documents.filter(doc => doc.phaseId === phase.id)
  }));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {documentsByPhase.map((phase) => (
        <Card key={phase.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {phase.name}
              <Badge variant="outline" className="text-xs">
                {phase.documents.length} Documents
              </Badge>
            </CardTitle>
            <Button 
              onClick={loadPhaseDocuments} 
              size="sm" 
              disabled={isUpdating}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {phase.documents.length > 0 ? (
              <div className="space-y-3">
                {phase.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{doc.name}</h5>
                        <Badge variant="secondary" className="text-xs">
                          {doc.documentType}
                        </Badge>
                      </div>
                      {doc.dueDate && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(doc.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={doc.status}
                        onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                        disabled={isUpdating}
                        className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
                <p className="mb-4">No documents are available for this phase.</p>
                <div className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800 mb-2">Troubleshooting:</div>
                      <div className="space-y-1 text-yellow-700">
                        <div>• Check if company templates exist for this phase</div>
                        <div>• Verify the product's phases match company phase names</div>
                        <div>• Try refreshing to sync latest templates</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
