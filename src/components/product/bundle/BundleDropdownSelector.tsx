import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Package, Check } from 'lucide-react';

interface Bundle {
  id: string;
  bundle_name: string;
  description?: string;
  members: Array<{
    id: string;
    is_primary: boolean;
  }>;
}

interface BundleDropdownSelectorProps {
  bundles: Bundle[];
  selectedBundleId: string | null;
  onSelectBundle: (bundleId: string) => void;
  disabled?: boolean;
}

export function BundleDropdownSelector({ 
  bundles, 
  selectedBundleId, 
  onSelectBundle,
  disabled = false
}: BundleDropdownSelectorProps) {
  const selectedBundle = bundles.find(b => b.id === selectedBundleId);

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium whitespace-nowrap">Select Bundle:</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between min-w-[300px] bg-background" disabled={disabled}>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {selectedBundle?.bundle_name || 'Select a bundle...'}
              </span>
              {selectedBundle && (
                <Badge variant="secondary" className="text-xs">
                  {selectedBundle.members.length} device{selectedBundle.members.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[400px] bg-background z-50">
          {bundles.map((bundle) => {
            const isSelected = bundle.id === selectedBundleId;
            const isPrimary = bundle.members.some(m => m.is_primary);
            
            return (
              <DropdownMenuItem
                key={bundle.id}
                onClick={() => { if (!disabled) onSelectBundle(bundle.id); }}
                className="cursor-pointer"
                disabled={disabled}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bundle.bundle_name}</span>
                      {isPrimary && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {bundle.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {bundle.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {bundle.members.length} product{bundle.members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
