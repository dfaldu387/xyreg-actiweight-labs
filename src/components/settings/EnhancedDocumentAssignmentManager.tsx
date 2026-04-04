import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, Building2, Upload, Sparkles } from 'lucide-react';
import { useDocumentAssignmentPhases } from '@/hooks/useDocumentAssignmentPhases';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SmartAppendCsvImport } from './SmartAppendCsvImport';
import { ManualDocumentCreationDialog } from './ManualDocumentCreationDialog';
import { PhaseDropZones } from './document-control/PhaseDropZones';
import { DocumentItem } from '@/types/client';
import { DocumentTechApplicability } from '@/types/documentTypes';

interface PhaseData {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    name: string;
    document_type: string;
    status: string;
    tech_applicability?: string; // Make optional to match DocumentAssignmentPhase
    created_at?: string; // Make optional to match DocumentAssignmentPhase
  }>;
}

interface EnhancedDocumentAssignmentManagerProps {
  companyId: string;
}

export function EnhancedDocumentAssignmentManager({ 
  companyId
}: EnhancedDocumentAssignmentManagerProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [manualCreationDialogOpen, setManualCreationDialogOpen] = useState(false);
  const { phases, isLoading, error, refreshPhases } = useDocumentAssignmentPhases(companyId);

  // Transform phases data for PhaseDropZones component
  const { documentsByPhase, phaseNames } = useMemo(() => {
    const docsByPhase: Record<string, DocumentItem[]> = {};
    const names: string[] = [];

    phases.forEach(phase => {
      names.push(phase.name);
      docsByPhase[phase.name] = phase.documents.map(doc => {
        // Ensure techApplicability is a valid DocumentTechApplicability value
        const validTechApplicability: DocumentTechApplicability = 
          (doc.tech_applicability && 
           ["All device types", "Software devices", "Hardware devices", "Combination devices", "Implantable devices"].includes(doc.tech_applicability)
          ) ? doc.tech_applicability as DocumentTechApplicability : "All device types";

        return {
          id: doc.id,
          name: doc.name,
          type: doc.document_type || 'Standard',
          techApplicability: validTechApplicability,
          description: '', // Default empty description since it's not available in the source data
          status: doc.status || 'Not Started',
          phases: [phase.name], // Current phase assignment
          created_at: doc.created_at || new Date().toISOString(),
          reviewers: [] // Add required empty reviewers array
        };
      });
    });

    return { documentsByPhase: docsByPhase, phaseNames: names };
  }, [phases]);

  const handleRemoveDocument = (document: DocumentItem, phaseName: string) => {
    // This will be handled by PhaseDropZones internally
    // We just need to refresh after the operation completes
    setTimeout(() => {
      refreshPhases();
    }, 500);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <LoadingSpinner className="mr-2" />
          Loading document assignments...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>
              Error loading document assignments: {error}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPhases}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Assignment with Smart Import
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage document assignments and import new documents via CSV or create manually
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManualCreationDialogOpen(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import & Edit from CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPhases}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Company Context */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          Showing document assignments for selected company. 
          Phase names are synchronized in real-time with your phase templates.
        </AlertDescription>
      </Alert>

      {/* Phase Documents with Removal Functionality */}
      {phases.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Phases</h3>
            <p className="text-muted-foreground mb-4">
              No active phases found. Please activate phases in the Phase Management section.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setManualCreationDialogOpen(true)}
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import from CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Phase Document Assignments</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click the X button next to any document to remove it from that specific phase
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <PhaseDropZones
              documentsByPhase={documentsByPhase}
              phases={phaseNames}
              onRemoveDocument={handleRemoveDocument}
              isRightPanelOpen={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {phases.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Document Assignment Summary</p>
                <p className="text-sm text-muted-foreground">
                  {phases.length} active phases with {phases.reduce((sum, phase) => sum + phase.documents.length, 0)} total document assignments
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {phases.length} Phases Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Append CSV Import Dialog */}
      <SmartAppendCsvImport
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        companyId={companyId}
        existingPhases={phases}
        onImportComplete={refreshPhases}
      />

      {/* Manual Document Creation Dialog */}
      <ManualDocumentCreationDialog
        open={manualCreationDialogOpen}
        onOpenChange={setManualCreationDialogOpen}
        companyId={companyId}
        onDocumentsCreated={refreshPhases}
      />
    </div>
  );
}
