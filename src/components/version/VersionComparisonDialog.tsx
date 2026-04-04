
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitCompare, ArrowRight } from 'lucide-react';
import { ProductForSelection } from '@/types/project';
import { getProductVersions } from '@/services/versionManagementService';

interface VersionComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  rootProductId?: string;
  currentVersionId?: string;
}

export function VersionComparisonDialog({
  open,
  onOpenChange,
  companyId,
  rootProductId,
  currentVersionId
}: VersionComparisonDialogProps) {
  const [versions, setVersions] = useState<ProductForSelection[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<[string?, string?]>([currentVersionId, undefined]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && companyId) {
      loadVersions();
    }
  }, [open, companyId, rootProductId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const versionData = await getProductVersions(companyId, rootProductId);
      setVersions(versionData);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (versionId: string, position: 0 | 1) => {
    const newSelection = [...selectedVersions] as [string?, string?];
    newSelection[position] = versionId;
    setSelectedVersions(newSelection);
  };

  const getVersionDetails = (versionId?: string) => {
    return versions.find(v => v.id === versionId);
  };

  const canCompare = selectedVersions[0] && selectedVersions[1] && selectedVersions[0] !== selectedVersions[1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Product Versions
          </DialogTitle>
          <DialogDescription>
            Select two versions to compare their features, documents, and changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Version Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Version A</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      selectedVersions[0] === version.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleVersionSelect(version.id, 0)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{version.name}</span>
                      <Badge variant="outline">v{version.version}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{version.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Version B</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      selectedVersions[1] === version.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => handleVersionSelect(version.id, 1)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{version.name}</span>
                      <Badge variant="outline">v{version.version}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{version.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Comparison Preview */}
          {canCompare && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Comparison Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <div className="font-medium">{getVersionDetails(selectedVersions[0])?.name}</div>
                    <Badge variant="outline">v{getVersionDetails(selectedVersions[0])?.version}</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-center">
                    <div className="font-medium">{getVersionDetails(selectedVersions[1])?.name}</div>
                    <Badge variant="outline">v{getVersionDetails(selectedVersions[1])?.version}</Badge>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Ready to compare these versions
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canCompare}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare Versions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
