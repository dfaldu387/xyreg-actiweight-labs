import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trash2,
  ArrowRight,
  StopCircle,
  PlayCircle,
  Square,
  AlertCircle,
  Link,
} from 'lucide-react';
import { toast } from 'sonner';
import DocumentDependencyService, {
  DocumentDependency,
  DocumentDependencyType
} from '@/services/documentDependencyService';

interface Document {
  id: string;
  name: string;
  phase_id?: string;
}

interface DocumentDependencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  documents: Document[];
  onDependenciesChange?: () => void;
}

export function DocumentDependencyDialog({
  open,
  onOpenChange,
  productId,
  documents,
  onDependenciesChange
}: DocumentDependencyDialogProps) {
  const [dependencies, setDependencies] = useState<DocumentDependency[]>([]);
  const [loading, setLoading] = useState(false);

  // Load dependencies when dialog opens
  useEffect(() => {
    if (open && productId) {
      loadDependencies();
    }
  }, [open, productId]);

  const loadDependencies = async () => {
    setLoading(true);
    try {
      const result = await DocumentDependencyService.getDocumentDependencies(productId);
      // Enrich with document names
      const enriched = result.map(dep => ({
        ...dep,
        source_document_name: getDocumentById(String(dep.source).replace('doc_', ''))?.name || 'Unknown',
        target_document_name: getDocumentById(String(dep.target).replace('doc_', ''))?.name || 'Unknown',
      }));
      setDependencies(enriched);
    } catch (error) {
      console.error('Error loading dependencies:', error);
      toast.error('Failed to load dependencies');
      setDependencies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDependency = async (linkId: string | number) => {
    try {
      await DocumentDependencyService.deleteDocumentDependency(productId, linkId);
      toast.success('Dependency deleted successfully');

      // Remove from local state
      setDependencies(prev => prev.filter(dep => dep.id !== linkId));

      // Notify parent
      onDependenciesChange?.();
    } catch (error) {
      console.error('Error deleting dependency:', error);
      toast.error('Failed to delete dependency');
    }
  };

  const getDocumentById = (id: string) => {
    return documents.find(d => d.id === id);
  };

  const getDependencyIcon = (type: DocumentDependencyType) => {
    switch (type) {
      case 'e2s': return <StopCircle className="h-4 w-4" />;
      case 's2s': return <PlayCircle className="h-4 w-4" />;
      case 'e2e': return <Square className="h-4 w-4" />;
      case 's2e': return <ArrowRight className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const getDependencyColor = (type: DocumentDependencyType) => {
    switch (type) {
      case 'e2s': return 'bg-blue-100 text-blue-800';
      case 's2s': return 'bg-green-100 text-green-800';
      case 'e2e': return 'bg-purple-100 text-purple-800';
      case 's2e': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Document Dependencies
          </DialogTitle>
          <DialogDescription>
            View and delete dependencies between documents. Create dependencies through the Gantt chart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dependencies List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Dependencies</h3>
              <Badge variant="secondary">{dependencies.length} dependencies</Badge>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading dependencies...
              </div>
            ) : dependencies.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No document dependencies configured yet. Create dependencies through the Gantt chart by connecting documents.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {dependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-sm font-medium">{dep.source_document_name}</div>
                      <div className="flex items-center gap-1">
                        {getDependencyIcon(dep.type as DocumentDependencyType)}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">{dep.target_document_name}</div>
                      <Badge className={getDependencyColor(dep.type as DocumentDependencyType)}>
                        {DocumentDependencyService.getShortDependencyLabel(dep.type as DocumentDependencyType)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDependency(dep.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
