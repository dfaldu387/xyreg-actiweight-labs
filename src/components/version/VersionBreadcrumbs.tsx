
import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { GitBranch } from 'lucide-react';
import { ProductVersionHierarchy } from '@/types/project';

interface VersionBreadcrumbsProps {
  hierarchy: ProductVersionHierarchy[];
  currentVersionId: string;
  onVersionSelect?: (versionId: string) => void;
}

export function VersionBreadcrumbs({
  hierarchy,
  currentVersionId,
  onVersionSelect
}: VersionBreadcrumbsProps) {
  // Build the path from root to current version
  const buildVersionPath = (targetId: string): ProductVersionHierarchy[] => {
    const path: ProductVersionHierarchy[] = [];
    
    const findPath = (id: string): boolean => {
      const version = hierarchy.find(v => v.product_id === id);
      if (!version) return false;
      
      path.unshift(version);
      
      if (version.parent_id) {
        return findPath(version.parent_id);
      }
      
      return true;
    };
    
    findPath(targetId);
    return path;
  };

  const versionPath = buildVersionPath(currentVersionId);

  if (versionPath.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
      <GitBranch className="h-4 w-4 text-muted-foreground" />
      <Breadcrumb>
        <BreadcrumbList>
          {versionPath.map((version, index) => (
            <React.Fragment key={version.product_id}>
              <BreadcrumbItem>
                {index === versionPath.length - 1 ? (
                  <BreadcrumbPage className="flex items-center gap-2 text-primary">
                    <span>{version.product_name}</span>
                    <Badge variant="secondary">v{version.version}</Badge>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => onVersionSelect?.(version.product_id)}
                    className="cursor-pointer hover:text-primary flex items-center gap-2"
                  >
                    <span>{version.product_name}</span>
                    <Badge variant="outline">v{version.version}</Badge>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < versionPath.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
