
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, Building2 } from 'lucide-react';
import { useDocumentAssignmentPhases } from '@/hooks/useDocumentAssignmentPhases';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentAssignmentManagerProps {
  companyId: string;
  companyName?: string;
}

export function DocumentAssignmentManager({ companyId, companyName }: DocumentAssignmentManagerProps) {
  const { phases, isLoading, error, refreshPhases } = useDocumentAssignmentPhases(companyId);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-blue-500';
      case 'not started': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-700';
      case 'in progress': return 'text-blue-700';
      case 'not started': return 'text-gray-700';
      default: return 'text-yellow-700';
    }
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
                Document Assignment
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View and manage document assignments for each active phase
              </p>
            </div>
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
        </CardHeader>
      </Card>

      {/* Company Context */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          Showing document assignments for <strong>{companyName || 'selected company'}</strong>. 
          Phase names are synchronized in real-time with your phase templates.
        </AlertDescription>
      </Alert>

      {/* Phase Documents */}
      <div className="space-y-4">
        {phases.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Phases</h3>
              <p className="text-muted-foreground">
                No active phases found. Please activate phases in the Phase Management section.
              </p>
            </CardContent>
          </Card>
        ) : (
          phases.map((phase) => (
            <Card key={phase.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{phase.name}</CardTitle>
                    {phase.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {phase.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Position {phase.position + 1}
                    </Badge>
                    <Badge variant="secondary">
                      {phase.documents.length} Documents
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {phase.documents.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No documents assigned to this phase</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {phase.documents.map((document) => (
                      <div key={document.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{document.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {document.document_type}
                            </Badge>
                            {document.tech_applicability && (
                              <Badge variant="secondary" className="text-xs">
                                {document.tech_applicability}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`text-xs ${getStatusColor(document.status)} ${getStatusText(document.status)}`}
                          >
                            {document.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
    </div>
  );
}
