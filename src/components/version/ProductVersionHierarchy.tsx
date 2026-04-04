
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, GitBranch, Eye, ArrowRight } from 'lucide-react';
import { ProductVersionHierarchy as VersionHierarchyType } from '@/types/project';
import { formatDistanceToNow } from 'date-fns';

interface ProductVersionHierarchyProps {
  hierarchy: VersionHierarchyType[];
  currentVersionId?: string;
  onVersionSelect?: (versionId: string) => void;
  onViewVersion?: (versionId: string) => void;
}

export function ProductVersionHierarchy({
  hierarchy,
  currentVersionId,
  onVersionSelect,
  onViewVersion
}: ProductVersionHierarchyProps) {
  const renderVersionNode = (version: VersionHierarchyType, isLast: boolean = false) => {
    const isCurrentVersion = version.product_id === currentVersionId;
    const hasChildren = hierarchy.some(v => v.parent_id === version.product_id);
    
    return (
      <div key={version.product_id} className="relative">
        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          {/* Level indicator */}
          <div className="flex items-center">
            {Array.from({ length: version.level }).map((_, index) => (
              <div key={index} className="w-4 h-px bg-border mr-2" />
            ))}
            {version.level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mr-2" />}
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Version info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{version.product_name}</span>
              <Badge variant={isCurrentVersion ? "default" : "outline"}>
                v{version.version}
              </Badge>
              {isCurrentVersion && (
                <Badge variant="secondary">Current</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onViewVersion && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewVersion(version.product_id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
            {onVersionSelect && !isCurrentVersion && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVersionSelect(version.product_id)}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Switch
              </Button>
            )}
          </div>
        </div>

        {/* Child versions */}
        {hasChildren && (
          <div className="ml-6 mt-2 space-y-2">
            {hierarchy
              .filter(v => v.parent_id === version.product_id)
              .map((childVersion, index, children) => 
                renderVersionNode(childVersion, index === children.length - 1)
              )}
          </div>
        )}
      </div>
    );
  };

  const rootVersions = hierarchy.filter(v => v.level === 0);

  if (!hierarchy.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No version history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Version Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rootVersions.map((version, index) => 
          renderVersionNode(version, index === rootVersions.length - 1)
        )}
      </CardContent>
    </Card>
  );
}
