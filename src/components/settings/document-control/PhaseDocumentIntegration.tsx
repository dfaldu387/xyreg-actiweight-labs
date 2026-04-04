
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { EnhancedPhaseService } from "@/services/enhancedPhaseService";

interface PhaseDocumentIntegrationProps {
  companyId: string;
  onDocumentUpdate?: () => void;
}

export function PhaseDocumentIntegration({ companyId, onDocumentUpdate }: PhaseDocumentIntegrationProps) {
  const [phases, setPhases] = useState<any[]>([]);
  const [documentMatrix, setDocumentMatrix] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadPhaseDocumentMatrix();
  }, [companyId]);

  const loadPhaseDocumentMatrix = async () => {
    try {
      setLoading(true);
      
      // Get company phases from database
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      setPhases(phasesData.activePhases);

      // Build document matrix from database
      const matrix: Record<string, any[]> = {};
      
      for (const phase of phasesData.activePhases) {
        try {
          const phaseDocuments = await DatabasePhaseService.getPhaseDocuments(phase.id);
          matrix[phase.name] = phaseDocuments;
        } catch (error) {
          console.error(`Error loading documents for phase ${phase.name}:`, error);
          matrix[phase.name] = [];
        }
      }
      
      setDocumentMatrix(matrix);
    } catch (error) {
      console.error('Error loading phase document matrix:', error);
      toast.error('Failed to load phase document matrix');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMatrix = async () => {
    try {
      setSyncing(true);
      
      // Ensure company has standardized phases
      await DatabasePhaseService.ensureStandardizedPhases(companyId);
      
      // Reload the matrix
      await loadPhaseDocumentMatrix();
      
      toast.success('Phase document matrix synchronized successfully');
      
      if (onDocumentUpdate) {
        onDocumentUpdate();
      }
    } catch (error) {
      console.error('Error syncing phase document matrix:', error);
      toast.error('Failed to sync phase document matrix');
    } finally {
      setSyncing(false);
    }
  };

  const getTotalDocuments = () => {
    return Object.values(documentMatrix).reduce((total, docs) => total + docs.length, 0);
  };

  const getUniqueDocuments = () => {
    const allDocs = Object.values(documentMatrix).flat();
    const uniqueNames = new Set(allDocs.map(doc => doc.name));
    return uniqueNames.size;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner className="mr-2" />
          Loading phase document integration...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Phase Document Integration
          <Button
            onClick={handleSyncMatrix}
            disabled={syncing}
            variant="outline"
            size="sm"
          >
            {syncing ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Syncing...
              </>
            ) : (
              'Sync Matrix'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded">
          <div className="text-center">
            <div className="text-2xl font-bold">{phases.length}</div>
            <div className="text-sm text-muted-foreground">Active Phases</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getTotalDocuments()}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getUniqueDocuments()}</div>
            <div className="text-sm text-muted-foreground">Unique Documents</div>
          </div>
        </div>

        <div className="space-y-3">
          {phases.map((phase) => (
            <div key={phase.id} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{phase.name}</h4>
                <Badge variant="outline">
                  {documentMatrix[phase.name]?.length || 0} docs
                </Badge>
              </div>
              
              {documentMatrix[phase.name]?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {documentMatrix[phase.name].slice(0, 5).map((doc, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {doc.name}
                    </Badge>
                  ))}
                  {documentMatrix[phase.name].length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{documentMatrix[phase.name].length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
