import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useProductDocuments } from '@/hooks/useProductDocuments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ViewerProductDocumentsProps {
  productId: string;
  productName: string;
}

export function ViewerProductDocuments({ productId, productName }: ViewerProductDocumentsProps) {
  const { documents, phases, isLoading, error } = useProductDocuments(productId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm">Loading device documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Error loading documents: {error}
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Group documents by phase and calculate completion
  const documentsByPhase = phases.map(phase => {
    const phaseDocuments = documents.filter(doc => doc.phaseId === phase.id);
    const completedDocuments = phaseDocuments.filter(doc => 
      doc.status === 'Completed' || doc.status === 'Approved'
    );
    const completionPercentage = phaseDocuments.length > 0 
      ? Math.round((completedDocuments.length / phaseDocuments.length) * 100)
      : 0;
    
    return {
      ...phase,
      documents: phaseDocuments,
      completedDocuments,
      completionPercentage
    };
  });

  return (
    <div className="space-y-4">
      {documentsByPhase.map(phase => (
        <Card key={phase.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{phase.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {phase.documents.length} documents
                </Badge>
                <Badge variant={phase.completionPercentage === 100 ? "default" : "secondary"} className="text-xs">
                  {phase.completedDocuments.length} completed
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{phase.completionPercentage}%</span>
                </div>
              </div>
            </CardTitle>
            {phase.description && (
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {phase.documents.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                No documents in this phase
              </div>
            ) : (
              <div className="space-y-2">
                {phase.documents.map(document => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(document.status)}
                      <div>
                        <div className="font-medium text-sm">{document.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Type: {document.documentType}
                          {document.dueDate && (
                            <span className="ml-2">Due: {new Date(document.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(document.status)} className="text-xs">
                      {document.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {documentsByPhase.every(phase => phase.documents.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No documents found for {productName}.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}