
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { supabase } from "@/integrations/supabase/client";

interface DocumentExclusionControlProps {
  companyId: string;
  selectedPhaseId?: string;
}

export function DocumentExclusionControl({ companyId, selectedPhaseId }: DocumentExclusionControlProps) {
  const [phases, setPhases] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [excludedDocs, setExcludedDocs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadPhaseDocuments();
  }, [companyId, selectedPhaseId]);

  const loadPhaseDocuments = async () => {
    try {
      setLoading(true);
      
      // Get company phases from database
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      setPhases(phasesData.activePhases);

      if (selectedPhaseId || phasesData.activePhases.length > 0) {
        const phaseId = selectedPhaseId || phasesData.activePhases[0]?.id;
        
        // Get phase documents from database
        const phaseDocuments = await DatabasePhaseService.getPhaseDocuments(phaseId);
        setDocuments(phaseDocuments);

        // Load exclusion status for each document
        const { data: excludedData } = await supabase
          .from('excluded_documents')
          .select('document_name')
          .eq('phase_id', phaseId);

        const excluded = new Set<string>();
        if (excludedData) {
          excludedData.forEach(doc => excluded.add(doc.document_name));
        }
        setExcludedDocs(excluded);
      }
    } catch (error) {
      console.error('Error loading phase documents:', error);
      toast.error('Failed to load phase documents');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExclusion = async (docName: string) => {
    if (!selectedPhaseId && phases.length === 0) {
      toast.error('No phase selected');
      return;
    }

    const phaseId = selectedPhaseId || phases[0]?.id;
    const currentlyExcluded = excludedDocs.has(docName);

    try {
      setUpdating(docName);
      
      if (currentlyExcluded) {
        // Remove from exclusions
        await supabase
          .from('excluded_documents')
          .delete()
          .eq('phase_id', phaseId)
          .eq('document_name', docName);
      } else {
        // Add to exclusions
        await supabase
          .from('excluded_documents')
          .insert({
            phase_id: phaseId,
            document_name: docName
          });
      }

      setExcludedDocs(prev => {
        const newSet = new Set(prev);
        if (currentlyExcluded) {
          newSet.delete(docName);
        } else {
          newSet.add(docName);
        }
        return newSet;
      });
      
      toast.success(
        currentlyExcluded 
          ? `Included "${docName}" in phase documents`
          : `Excluded "${docName}" from phase documents`
      );
    } catch (error) {
      console.error('Error toggling document exclusion:', error);
      toast.error('Failed to update document exclusion');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner className="mr-2" />
          Loading phase documents...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Exclusion Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 ? (
          <p className="text-muted-foreground">No documents found for selected phase.</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.name}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div className="flex-1">
                <h4 className="font-medium">{doc.name}</h4>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{doc.type}</Badge>
                  {excludedDocs.has(doc.name) && (
                    <Badge variant="destructive">Excluded</Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant={excludedDocs.has(doc.name) ? "default" : "destructive"}
                size="sm"
                onClick={() => handleToggleExclusion(doc.name)}
                disabled={updating === doc.name}
              >
                {updating === doc.name ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : null}
                {excludedDocs.has(doc.name) ? "Include" : "Exclude"}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
