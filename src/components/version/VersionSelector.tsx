
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, GitBranch, Plus } from 'lucide-react';
import { ProductForSelection } from '@/types/project';
import { getProductVersions } from '@/services/versionManagementService';

interface VersionSelectorProps {
  companyId: string;
  currentProductId?: string;
  rootProductId?: string;
  onVersionSelect: (productId: string) => void;
  onCreateVersion?: () => void;
  className?: string;
}

export function VersionSelector({
  companyId,
  currentProductId,
  rootProductId,
  onVersionSelect,
  onCreateVersion,
  className
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<ProductForSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentVersion = versions.find(v => v.id === currentProductId);

  useEffect(() => {
    const loadVersions = async () => {
      if (!companyId) return;

      setIsLoading(true);
      setError(null);

      try {
        const versionData = await getProductVersions(companyId, rootProductId);
        setVersions(versionData);
      } catch (err) {
        console.error('Error loading versions:', err);
        setError('Failed to load versions');
      } finally {
        setIsLoading(false);
      }
    };

    loadVersions();
  }, [companyId, rootProductId]);

  const handleVersionSelect = (productId: string) => {
    onVersionSelect(productId);
  };

  if (error) {
    return (
      <Button variant="outline" disabled className={className}>
        <GitBranch className="h-4 w-4 mr-2" />
        Error loading versions
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className} disabled={isLoading}>
          <GitBranch className="h-4 w-4 mr-2" />
          {isLoading ? (
            'Loading...'
          ) : currentVersion ? (
            <>
              v{currentVersion.version} 
              <Badge variant="secondary" className="ml-2">
                {currentVersion.status}
              </Badge>
            </>
          ) : (
            'Select Version'
          )}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Product Versions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {versions.map((version) => (
          <DropdownMenuItem
            key={version.id}
            onClick={() => handleVersionSelect(version.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{version.name}</span>
              <span className="text-xs text-muted-foreground">
                v{version.version} • {version.status}
              </span>
            </div>
            {version.id === currentProductId && (
              <Badge variant="secondary" className="text-xs">Current</Badge>
            )}
          </DropdownMenuItem>
        ))}
        
        {onCreateVersion && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateVersion}>
              <Plus className="h-4 w-4 mr-2" />
              Update Product
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
