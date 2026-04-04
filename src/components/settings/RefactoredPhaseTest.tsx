
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRefactoredPhases, usePhaseDocuments } from '@/hooks/useRefactoredPhases';
import { RefactoredPhaseCleanupDialog } from './RefactoredPhaseCleanupDialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

interface RefactoredPhaseTestProps {
  companyId: string;
  companyName: string;
}

export function RefactoredPhaseTest({ companyId, companyName }: RefactoredPhaseTestProps) {
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  
  const { 
    phases, 
    loading: phasesLoading, 
    error: phasesError, 
    refreshPhases 
  } = useRefactoredPhases(companyId);

  const { 
    documents, 
    loading: documentsLoading, 
    error: documentsError,
    refreshDocuments 
  } = usePhaseDocuments(selectedPhaseId || undefined);

  const handleCleanupComplete = () => {
    refreshPhases();
    if (selectedPhaseId) {
      refreshDocuments();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Refactored Phase System Test
          </CardTitle>
          <CardDescription>
            Testing the new refactored phase management schema for {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setShowCleanupDialog(true)}
              variant="destructive"
              size="sm"
            >
              Open Cleanup Dialog
            </Button>
            <Button
              onClick={refreshPhases}
              variant="outline"
              size="sm"
              disabled={phasesLoading}
            >
              {phasesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh Phases'}
            </Button>
          </div>

          {phasesError && (
            <div className="text-red-600 text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Error loading phases: {phasesError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg mb-2">Company Phases ({phases.length})</h3>
              {phasesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading phases...
                </div>
              ) : phases.length > 0 ? (
                <div className="space-y-2">
                  {phases.map((phase) => (
                    <div
                      key={phase.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPhaseId === phase.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPhaseId(phase.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{phase.name}</div>
                          <div className="text-sm text-gray-600">
                            Position: {phase.position} | Created: {new Date(phase.created_at).toLocaleDateString()}
                          </div>
                          {phase.description && (
                            <div className="text-sm text-gray-500 mt-1">{phase.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={phase.is_active ? "default" : "secondary"}>
                            {phase.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {selectedPhaseId === phase.id && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No phases found</div>
              )}
            </div>

            {selectedPhaseId && (
              <div>
                <h3 className="font-medium text-lg mb-2">Phase Documents</h3>
                {documentsError && (
                  <div className="text-red-600 text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Error loading documents: {documentsError}
                  </div>
                )}
                {documentsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading documents...
                  </div>
                ) : documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-2 border rounded bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{doc.name}</div>
                            <div className="text-xs text-gray-600">
                              Type: {doc.document_type} | Tech: {doc.tech_applicability}
                            </div>
                          </div>
                          <Badge 
                            variant={
                              doc.status === 'Completed' ? 'default' :
                              doc.status === 'In Progress' ? 'secondary' :
                              doc.status === 'Not Required' ? 'outline' : 'destructive'
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No documents found for this phase</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <RefactoredPhaseCleanupDialog
        open={showCleanupDialog}
        onOpenChange={setShowCleanupDialog}
        companyId={companyId}
        onCleanupComplete={handleCleanupComplete}
      />
    </div>
  );
}
